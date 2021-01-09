import { inet_pton } from 'inet_xtoy';
import TrackService from '../../../src/services/track';
import LogEntry, { LogEntryInterface } from '../../../src/models/logentry';
import User, { UserInterface } from '../../../src/models/user';
import { db } from './setup';

describe('TrackService', () => {
    it('should not log anything if user does not exists', () => {
        const svc = new TrackService(5);
        return expect(
            svc.trackUpload(
                'search',
                '+380001234567',
                ['127.0.0.1'],
                '00000000-0000-0000-0000-000000000000',
                Date.now(),
            ),
        )
            .resolves.toEqual([-Infinity, false])
            .then(() => expect(db.from(LogEntry.tableName).count({ count: '*' })).resolves.toEqual([{ count: 0 }]));
    });

    describe('whitelisted users', () => {
        it('should return [-1, true] for whitelisted users with no credits', () => {
            const svc = new TrackService(5);
            return expect(
                svc.trackUpload(
                    'search',
                    '+380000000005',
                    ['127.0.0.1'],
                    '00000000-0000-0000-0000-000000000000',
                    Date.now(),
                ),
            ).resolves.toEqual([-1, true]);
        });

        it('should decrease the number of credits for users having credits', () => {
            const svc = new TrackService(5);
            return expect(
                svc.trackUpload(
                    'search',
                    '+380000000002',
                    ['127.0.0.1'],
                    '00000000-0000-0000-0000-000000000000',
                    Date.now(),
                ),
            ).resolves.toEqual([9, true]);
        });
    });

    describe('normal users', () => {
        it('should return the default number of credits minus one for users not seen today', () => {
            const credits = 5;
            const svc = new TrackService(credits);
            return expect(
                svc.trackUpload(
                    'compare',
                    '+380000000003',
                    ['127.0.0.1'],
                    '00000000-0000-0000-0000-000000000000',
                    Date.now(),
                ),
            ).resolves.toEqual([credits - 1, false]);
        });

        it('should decrease the number of credits by one for users seen today', () => {
            const svc = new TrackService(5);
            return expect(
                svc.trackUpload(
                    'compare',
                    '+380000000001',
                    ['127.0.0.1'],
                    '00000000-0000-0000-0000-000000000000',
                    Date.now(),
                ),
            ).resolves.toEqual([3, false]);
        });

        it('should not let credits be less than 0 for users seen today', () => {
            const svc = new TrackService(5);
            return expect(
                svc.trackUpload(
                    'compare',
                    '+380000000004',
                    ['127.0.0.1'],
                    '00000000-0000-0000-0000-000000000000',
                    Date.now(),
                ),
            )
                .resolves.toEqual([-1, false])
                .then(() =>
                    expect(
                        db
                            .from<UserInterface>(User.tableName)
                            .select('credits')
                            .where('phone', '+380000000004')
                            .first(),
                    ).resolves.toEqual({ credits: 0 }),
                );
        });
    });

    it('should decrease the number of credits on successful track', () => {
        const svc = new TrackService(5);
        return expect(
            svc.trackUpload(
                'search',
                '+380000000001',
                ['127.0.0.1'],
                '00000000-0000-0000-0000-000000000000',
                Date.now(),
            ),
        )
            .resolves.toEqual([3, false])
            .then(() => expect(db.from(LogEntry.tableName).count({ count: '*' })).resolves.toEqual([{ count: 1 }]))
            .then(() =>
                expect(
                    db.from<UserInterface>(User.tableName).select('credits').where('phone', '+380000000001').first(),
                ).resolves.toEqual({ credits: 3 }),
            );
    });

    it('should log all IP addresses', () => {
        const svc = new TrackService(5);
        return expect(
            svc.trackUpload(
                'search',
                '+380000000002',
                ['127.0.0.1', '192.168.1.1', '10.0.0.1'],
                '00000000-0000-0000-0000-000000000000',
                Date.now(),
            ),
        )
            .resolves.toEqual([9, true])
            .then(() => expect(db.from(LogEntry.tableName).count({ count: '*' })).resolves.toEqual([{ count: 3 }]))
            .then(() =>
                expect(
                    db.from<UserInterface>(User.tableName).select('credits').where('phone', '+380000000002').first(),
                ).resolves.toEqual({ credits: 9 }),
            )
            .then(() =>
                expect(
                    db.from<LogEntryInterface>(LogEntry.tableName).select('phone', 'ip').orderBy('id'),
                ).resolves.toEqual([
                    { phone: '+380000000002', ip: inet_pton('127.0.0.1') },
                    { phone: '+380000000002', ip: inet_pton('192.168.1.1') },
                    { phone: '+380000000002', ip: inet_pton('10.0.0.1') },
                ]),
            );
    });
});
