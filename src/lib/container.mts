import { AwilixContainer, asFunction, asValue, createContainer } from 'awilix';
import type { NextFunction, Request, Response } from 'express';
import * as knexpkg from 'knex';
import { type Logger, type Meter, getLogger, getMeter } from '@myrotvorets/otel-utils';
import { Model } from 'objection';
import { environment } from './environment.mjs';
import { buildKnexConfig } from '../knexfile.mjs';

export interface Container {
    environment: ReturnType<typeof environment>;
    logger: Logger;
    meter: Meter;
    db: knexpkg.Knex;
}

export interface RequestContainer {
    req: Request;
}

export const container = createContainer<Container>();

function createEnvironment(): ReturnType<typeof environment> {
    return environment(true);
}

function createLogger({ req }: Partial<RequestContainer>): Logger {
    const logger = getLogger();
    logger.clearAttributes();
    if (req) {
        logger.setAttribute('ip', req.ip);
        logger.setAttribute('request', `${req.method} ${req.url}`);
    }

    return logger;
}

function createMeter(): Meter {
    return getMeter();
}

function createDatabase(): knexpkg.Knex {
    const { knex } = knexpkg.default;
    const db = knex(buildKnexConfig());
    Model.knex(db);
    return db;
}

export type LocalsWithContainer = Record<'container', AwilixContainer<RequestContainer & Container>>;

export function initializeContainer(): typeof container {
    container.register({
        environment: asFunction(createEnvironment).singleton(),
        logger: asFunction(createLogger).scoped(),
        meter: asFunction(createMeter).singleton(),
        db: asFunction(createDatabase).singleton(),
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

    next();
}
