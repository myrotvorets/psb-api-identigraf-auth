import { inet_pton } from 'inet_xtoy';
import { Model, type TransactionOrKnex } from 'objection';
import { LogEntry, type LogEntryInterface } from '../models/logentry.mjs';
import type { User, UserInterface } from '../models/user.mjs';
import { today } from '../utils/index.mjs';
import { UserService } from './user.mjs';
import { container } from '../lib/container.mjs';

export class TrackService {
    public constructor(private readonly defaultCredits: number) {}

    public async trackUpload(
        what: string,
        login: string,
        ips: string[],
        guid: string,
        dt: number,
    ): Promise<[number, boolean]> {
        let credits = -Infinity;
        let wl = false;

        await Model.transaction(async (trx) => {
            const user = await UserService.getUserByLogin(login, trx, true);

            if (user !== undefined) {
                let data: Partial<UserInterface>;
                [data, credits, wl] = this.adjustCredits(user);

                await UserService.saveUser(data, trx);

                const uniqueIPs = new Set<string>(ips);
                let promise: Promise<void>;
                if (what === 'search') {
                    promise = TrackService.trackSearch(trx, login, guid, uniqueIPs, dt);
                } else if (what === 'compare') {
                    promise = TrackService.trackCompare(trx, login, guid, uniqueIPs, dt);
                } /* c8 ignore next 2 */ else {
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
        login: string,
        guid: string,
        ips: Iterable<string>,
        dt: number,
    ): Promise<void> {
        container.resolve('logger').info(`Track search for ${login} (${guid})`);
        for (const ip of ips) {
            const entry: Partial<LogEntryInterface> = {
                login,
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
