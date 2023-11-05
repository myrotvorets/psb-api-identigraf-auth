import { type Logger, type Tracer, recordErrorToSpan } from '@myrotvorets/otel-utils';
import { TrackService, type TrackServiceOptions } from './trackservice.mjs';
import type { User } from '../models/user.mjs';
import { uploadTrackCounter } from '../lib/metrics.mjs';
import type { TrackServiceInterface } from './trackserviceinterface.mjs';

interface VerboseTrackServiceOptions extends TrackServiceOptions {
    logger: Logger;
    tracer: Tracer;
}

export class VerboseTrackService extends TrackService {
    readonly #logger: Logger;
    readonly #tracer: Tracer;

    public constructor(options: VerboseTrackServiceOptions) {
        super(options);
        this.#logger = options.logger;
        this.#tracer = options.tracer;
    }

    public override trackUpload(
        what: string,
        login: string,
        ips: string[],
        guid: string,
        dt: number,
    ): Promise<[number, boolean]> {
        return this.#tracer.startActiveSpan(
            'trackUpload',
            async (span): ReturnType<TrackServiceInterface['trackUpload']> => {
                try {
                    this.#logger.debug(
                        `Tracking upload: what=${what}, login=${login}, ips=${ips.join(', ')}, guid=${guid}, dt=${dt}`,
                    );

                    const [credis, whitelisted] = await super.trackUpload(what, login, ips, guid, dt);
                    this.#logger.debug(
                        `Tracked upload for login=${login}, guid=${guid}; credits=${credis}, whitelisted=${whitelisted}`,
                    );

                    uploadTrackCounter.add(1, { type: what, status: 'success' });
                    return [credis, whitelisted];
                } /* c8 ignore start */ catch (err) {
                    recordErrorToSpan(err, span);
                    this.#logger.error(`Failed to track upload: ${err}`);
                    uploadTrackCounter.add(1, { type: what, status: 'failure' });
                    throw err;
                } /* c8 ignore stop */ finally {
                    span.end();
                }
            },
        );
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
