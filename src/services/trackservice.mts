import { inet_pton } from 'inet_xtoy';
import type { LogEntryModel, User } from '../models/index.mjs';
import type { ModelService } from './modelservice.mjs';
import type { TrackServiceInterface } from './trackserviceinterface.mjs';
import { today } from '../utils/index.mjs';

interface TrackServiceOptions {
    modelService: ModelService;
    defaultCredits: number;
}

export class TrackService implements TrackServiceInterface {
    private readonly defaultCredits;
    private readonly modelService: ModelService;

    public constructor({ defaultCredits, modelService }: TrackServiceOptions) {
        this.defaultCredits = defaultCredits;
        this.modelService = modelService;
    }

    public async trackUpload(
        what: string,
        login: string,
        ips: string[],
        guid: string,
        dt: number,
    ): Promise<[number, boolean]> {
        let credits = -Infinity;
        let wl = false;

        return this.modelService.transaction(async (_trx, models) => {
            const user = await models.user.getByLogin(login);
            if (user !== undefined) {
                let data: Partial<User>;
                [data, credits, wl] = this.adjustCredits(user);

                await models.user.save(data);

                const uniqueIPs = new Set<string>(ips);
                if (what === 'search') {
                    await this.trackSearch(models.logEntry, login, guid, uniqueIPs, dt);
                }
            }

            return [credits, wl];
        });
    }

    private adjustCredits(user: User): [data: Partial<User>, credits: number, whitelisted: boolean] {
        let credits;
        let wl = false;
        const thisDay = today();
        const data: Partial<User> = {
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

    private async trackSearch(
        logEntryModel: LogEntryModel,
        login: string,
        guid: string,
        ips: Iterable<string>,
        dt: number,
    ): Promise<void> {
        for (const ip of ips) {
            // eslint-disable-next-line no-await-in-loop
            await logEntryModel.insert({
                login,
                guid: Buffer.from(guid.replace(/[^0-9a-fA-F]/gu, ''), 'hex'),
                ip: inet_pton(ip),
                dt,
                misc: '',
            });
        }
    }
}
