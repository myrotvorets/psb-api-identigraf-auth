import knexpkg from 'knex';
import { mockDate, unmockDate } from '../../helpers/dateproxy.mjs';
import { container, initializeContainer } from '../../../src/lib/container.mjs';

export let db: knexpkg.Knex;

export async function setUpSuite(): Promise<unknown> {
    mockDate();

    await container.dispose();
    initializeContainer();
    db = container.resolve('db');
    return db.migrate.latest();
}

export function tearDownSuite(): Promise<unknown> {
    unmockDate();
    return db.destroy();
}

export function setUp(): Promise<unknown> {
    return db.seed.run();
}
