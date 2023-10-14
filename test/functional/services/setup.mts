import knexpkg from 'knex';
import { Model } from 'objection';
import { buildKnexConfig } from '../../../src/knexfile.mjs';
import { mockDate, unmockDate } from '../../helpers/dateproxy.mjs';

// eslint-disable-next-line import/no-named-as-default-member
const { knex } = knexpkg;

export let db: knexpkg.Knex;

export async function setUpSuite(): Promise<unknown> {
    mockDate();

    db = knex(buildKnexConfig());
    Model.knex(db);

    return db.migrate.latest();
}

export function tearDownSuite(): Promise<unknown> {
    unmockDate();
    return db.destroy();
}

export function setUp(): Promise<unknown> {
    return db.seed.run();
}
