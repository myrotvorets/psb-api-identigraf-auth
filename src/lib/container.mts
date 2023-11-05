import { AwilixContainer, asClass, asFunction, asValue, createContainer } from 'awilix';
import type { NextFunction, Request, Response } from 'express';
import * as knexpkg from 'knex';
import { type Logger, type Meter, type Tracer, getLogger, getMeter, getTracer } from '@myrotvorets/otel-utils';
import { environment } from './environment.mjs';
import { buildKnexConfig } from '../knexfile.mjs';
import type { AuthServiceInterface, TrackServiceInterface, UserServiceInterface } from '../services/index.mjs';
import { AuthService } from '../services/authservice.mjs';
import { ModelService } from '../services/modelservice.mjs';
import { UserService } from '../services/userservice.mjs';
import { VerboseTrackService } from '../services/verbosetrackservice.mjs';

export interface Container {
    environment: ReturnType<typeof environment>;
    logger: Logger;
    meter: Meter;
    tracer: Tracer;
    defaultCredits: number;
    db: knexpkg.Knex;
    authService: AuthServiceInterface;
    trackService: TrackServiceInterface;
    userService: UserServiceInterface;
    modelService: ModelService;
}

export interface RequestContainer {
    req: Request;
}

export type LocalsWithContainer = Record<'container', AwilixContainer<RequestContainer & Container>>;

export const container = createContainer<Container>();

/* c8 ignore start */
function createLogger({ req }: Partial<RequestContainer>): Logger {
    const logger = getLogger();
    logger.clearAttributes();
    if (req) {
        if (req.ip) {
            logger.setAttribute('ip', req.ip);
        }

        logger.setAttribute('request', `${req.method} ${req.url}`);
    }

    return logger;
}
/* c8 ignore stop */

function createMeter(): Meter {
    return getMeter();
}

function createTracer(): Tracer {
    return getTracer();
}

function createDatabase(): knexpkg.Knex {
    const { knex } = knexpkg.default;
    return knex(buildKnexConfig());
}

export function initializeContainer(): typeof container {
    const env = environment(true);
    container.register({
        environment: asValue(env),
        logger: asFunction(createLogger).scoped(),
        meter: asFunction(createMeter).singleton(),
        tracer: asFunction(createTracer).singleton(),
        defaultCredits: asValue(env.DEFAULT_CREDITS),
        db: asFunction(createDatabase)
            .singleton()
            .disposer((db) => db.destroy()),
        authService: asClass(AuthService).singleton(),
        trackService: asClass(VerboseTrackService).singleton(),
        userService: asClass(UserService).singleton(),
        modelService: asClass(ModelService).singleton(),
    });

    container.register('req', asValue(undefined));
    return container;
}

export function scopedContainerMiddleware(
    req: Request,
    res: Response<unknown, LocalsWithContainer>,
    next: NextFunction,
): void {
    res.locals.container = container.createScope<RequestContainer>();
    res.locals.container.register({
        req: asValue(req),
    });

    res.on('close', () => {
        void res.locals.container.dispose();
    });

    next();
}
