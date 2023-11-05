import type { Logger } from '@myrotvorets/otel-utils';
import { TrackService, type TrackServiceOptions } from './trackservice.mjs';
import type { User } from '../models/user.mjs';

interface VerboseTrackServiceOptions extends TrackServiceOptions {
    logger: Logger;
}

export class VerboseTrackService extends TrackService {
    readonly #logger: Logger;

    public constructor(options: VerboseTrackServiceOptions) {
        super(options);
        this.#logger = options.logger;
    }

    protected override adjustCredits(user: User): [data: Partial<User>, credits: number, whitelisted: boolean] {
        this.#logger.debug(
            `Adjusting credits for user "${user.login}": whitelisted=${user.whitelisted}, credits=${user.credits}, lastseen=${user.lastseen}`,
        );

        const [data, credits, wl] = super.adjustCredits(user);

        this.#logger.debug(
            `Adjusted credits for user "${user.login}": data=${JSON.stringify(data)}, credits=${credits}, wl=${wl}`,
        );

        return [data, credits, wl];
    }
}
