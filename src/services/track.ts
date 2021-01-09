import { inet_pton } from 'inet_xtoy';
import { Model, TransactionOrKnex } from 'objection';
import LogEntry, { LogEntryInterface } from '../models/logentry';
import { UserInterface } from '../models/user';
import { today } from '../utils';
import UserService from './user';

export default class TrackService {
    public constructor(private readonly defaultCredits: number) {}

    public async trackUpload(
        what: 'search' | 'compare',
        phone: string,
        ips: string[],
        guid: string,
        dt: number,
    ): Promise<[number, boolean]> {
        let credits = -Infinity;
        let wl = false;
        const thisDay = today();

        await Model.transaction(async (trx) => {
            const user = await UserService.getUserByPhone(phone, trx, true);

            const data: Partial<UserInterface> = {
                id: user?.id,
            };

            if (user !== undefined) {
                if (user.whitelisted) {
                    data.lastseen = thisDay;
                    data.credits = user.credits > 0 ? user.credits - 1 : 0;
                    credits = user.credits > 0 ? user.credits - 1 : -1;
                    wl = true;
                } else if (user.lastseen !== thisDay) {
                    data.lastseen = thisDay;
                    data.credits = this.defaultCredits - 1;
                    credits = data.credits;
                } else {
                    data.credits = user.credits > 0 ? user.credits - 1 : 0;
                    credits = user.credits > 0 ? user.credits - 1 : -1;
                }

                await UserService.saveUser(data, trx);

                let promise: Promise<void>;
                if (what === 'search') {
                    promise = TrackService.trackSearch(trx, phone, guid, ips, dt);
                } /* istanbul ignore else */ else if (what === 'compare') {
                    promise = TrackService.trackCompare(trx, phone, guid, ips, dt);
                } else {
                    promise = Promise.resolve();
                }

                await promise;
            }
        });

        return [credits, wl];
    }

    private static async trackSearch(
        db: TransactionOrKnex,
        phone: string,
        guid: string,
        ips: string[],
        dt: number,
    ): Promise<void> {
        for (const ip of ips) {
            const entry: Partial<LogEntryInterface> = {
                phone,
                guid: Buffer.from(guid.replace(/[^0-9a-fA-F]/gu, ''), 'hex'),
                ip: inet_pton(ip),
                dt,
                misc: '',
            };

            // eslint-disable-next-line no-await-in-loop
            await LogEntry.query(db).insert(entry);
        }
    }

    private static trackCompare(..._args: unknown[]): Promise<void> {
        return Promise.resolve();
    }
}
