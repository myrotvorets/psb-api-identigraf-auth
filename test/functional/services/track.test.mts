import { expect } from 'chai';
import { inet_pton } from 'inet_xtoy';
import { container } from '../../../src/lib/container.mjs';
import { LogEntry, LogEntryModel, User, UserModel } from '../../../src/models/index.mjs';
import { db, setUp, setUpSuite, tearDownSuite } from './setup.mjs';

interface CountResult {
    count: number | string;
}

const countLogs = (): Promise<CountResult[]> => db.count({ count: '*' }).from(LogEntryModel.tableName);

const getCredits = (phone: string): Promise<Pick<User, 'credits'>> =>
    db.from(UserModel.tableName).select('credits').where('login', phone).first();

const getLogs = (): Promise<Pick<LogEntry, 'login' | 'ip'>[]> =>
    db.from(LogEntryModel.tableName).select('login', 'ip').orderBy('id');

describe('TrackService', function () {
    before(setUpSuite);

    after(tearDownSuite);

    beforeEach(setUp);

    it('should not log anything if user does not exists', async function () {
        const svc = container.resolve('trackService');
        const result = await svc.trackUpload(
            'search',
            '+380001234567',
            ['127.0.0.1'],
            '00000000-0000-0000-0000-000000000000',
            Date.now(),
        );

        expect(result).to.deep.equal([-Infinity, false]);

        const count = await countLogs();
        expect(count).to.deep.equal([{ count: 0 }]);
    });

    describe('whitelisted users', function () {
        it('should return [-1, true] for whitelisted users with no credits', async function () {
            const svc = container.resolve('trackService');
            const result = await svc.trackUpload(
                'search',
                '+380000000005',
                ['127.0.0.1'],
                '00000000-0000-0000-0000-000000000000',
                Date.now(),
            );

            expect(result).to.deep.equal([-1, true]);
        });

        it('should decrease the number of credits for users having credits', async function () {
            const svc = container.resolve('trackService');
            const result = await svc.trackUpload(
                'search',
                '+380000000002',
                ['127.0.0.1'],
                '00000000-0000-0000-0000-000000000000',
                Date.now(),
            );

            expect(result).to.deep.equal([9, true]);
        });
    });

    describe('normal users', function () {
        it('should return the default number of credits minus one for users not seen today', async function () {
            const credits = container.resolve('defaultCredits');
            const svc = container.resolve('trackService');
            const result = await svc.trackUpload(
                'compare',
                '+380000000003',
                ['127.0.0.1'],
                '00000000-0000-0000-0000-000000000000',
                Date.now(),
            );

            expect(result).to.deep.equal([credits - 1, false]);
        });

        it('should decrease the number of credits by one for users seen today', async function () {
            const svc = container.resolve('trackService');
            const result = await svc.trackUpload(
                'compare',
                '+380000000001',
                ['127.0.0.1'],
                '00000000-0000-0000-0000-000000000000',
                Date.now(),
            );

            expect(result).to.deep.equal([3, false]);
        });

        it('should not let credits be less than 0 for users seen today', async function () {
            const svc = container.resolve('trackService');
            const phone = '+380000000004';
            const result = await svc.trackUpload(
                'compare',
                phone,
                ['127.0.0.1'],
                '00000000-0000-0000-0000-000000000000',
                Date.now(),
            );

            expect(result).to.deep.equal([-1, false]);

            const credits = await getCredits(phone);
            expect(credits).to.deep.equal({ credits: 0 });
        });
    });

    it('should decrease the number of credits on successful track', async function () {
        const svc = container.resolve('trackService');
        const phone = '+380000000001';
        const result = await svc.trackUpload(
            'search',
            phone,
            ['127.0.0.1'],
            '00000000-0000-0000-0000-000000000000',
            Date.now(),
        );

        expect(result).to.deep.equal([3, false]);

        const count = await countLogs();
        expect(count).to.deep.equal([{ count: 1 }]);

        const credits = await getCredits(phone);
        expect(credits).to.deep.equal({ credits: 3 });
    });

    it('should log all IP addresses', async function () {
        const svc = container.resolve('trackService');
        const phone = '+380000000002';
        const expectedIPs = ['127.0.0.1', '192.168.1.1', '10.0.0.1'];
        const result = await svc.trackUpload(
            'search',
            phone,
            expectedIPs,
            '00000000-0000-0000-0000-000000000000',
            Date.now(),
        );

        expect(result).to.deep.equal([9, true]);

        const count = await countLogs();
        expect(count).to.deep.equal([{ count: 3 }]);

        const credits = await getCredits(phone);
        expect(credits).to.deep.equal({ credits: 9 });

        const logs = await getLogs();
        expect(logs).to.deep.equal([
            { login: phone, ip: inet_pton(expectedIPs[0]!) },
            { login: phone, ip: inet_pton(expectedIPs[1]!) },
            { login: phone, ip: inet_pton(expectedIPs[2]!) },
        ]);
    });

    it('should not log duplicate IPs', async function () {
        const svc = container.resolve('trackService');
        const phone = '+380000000002';
        const result = await svc.trackUpload(
            'search',
            phone,
            ['127.0.0.1', '127.0.0.1', '10.0.0.1'],
            '00000000-0000-0000-0000-000000000000',
            Date.now(),
        );

        expect(result).to.deep.equal([9, true]);

        const count = await countLogs();
        expect(count).to.deep.equal([{ count: 2 }]);

        const logs = await getLogs();

        expect(logs).to.deep.equal([
            { login: phone, ip: inet_pton('127.0.0.1') },
            { login: phone, ip: inet_pton('10.0.0.1') },
        ]);
    });
});
