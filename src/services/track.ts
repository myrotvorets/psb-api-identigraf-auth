import { inet_pton } from 'inet_xtoy';
import { Model, TransactionOrKnex } from 'objection';
import LogEntry, { LogEntryInterface } from '../models/logentry';
import User, { UserInterface } from '../models/user';
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

        await Model.transaction(async (trx) => {
            const user = await UserService.getUserByPhone(phone, trx, true);

            if (user !== undefined) {
                let data: Partial<UserInterface>;
                [data, credits, wl] = this.adjustCredits(user);

                await UserService.saveUser(data, trx);

                const uniqueIPs = new Set<string>(ips);
                let promise: Promise<void>;
                if (what === 'search') {
                    promise = TrackService.trackSearch(trx, phone, guid, uniqueIPs, dt);
                } /* istanbul ignore else */ else if (what === 'compare') {
                    promise = TrackService.trackCompare(trx, phone, guid, uniqueIPs, dt);
                } else {
                    promise = Promise.resolve();
                }

                await promise;
            }
        });

        return [credits, wl];
    }

    private adjustCredits(user: User): [data: Partial<UserInterface>, credits: number, whitelisted: boolean] {
        let credits;
        let wl = false;
        const thisDay = today();
        const data: Partial<UserInterface> = {
            id: user.id,
        };

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

        return [data, credits, wl];
    }

    private static async trackSearch(
        db: TransactionOrKnex,
        phone: string,
        guid: string,
        ips: Iterable<string>,
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
