import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as knexpkg from 'knex';
import { Model } from 'objection';
import { mockDate, unmockDate } from '../../helpers/dateproxy.mjs';

// See https://github.com/knex/knex/issues/5358#issuecomment-1279979120
const { knex } = knexpkg.default;

export let db: knexpkg.Knex;

export function setUpSuite(): Promise<unknown> {
    mockDate();

    db = knex({
        client: 'better-sqlite3',
        connection: {
            filename: ':memory:',
        },
        useNullAsDefault: true,
    });

    Model.knex(db);

    return db.migrate.latest({
        directory: join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'migrations'),
        loadExtensions: ['.mts'],
    });
}

export function tearDownSuite(): Promise<unknown> {
    unmockDate();
    return db.destroy();
}

export function setUp(): Promise<unknown> {
    return db.seed.run({
        directory: join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'seeds'),
        loadExtensions: ['.mts'],
    });
}
