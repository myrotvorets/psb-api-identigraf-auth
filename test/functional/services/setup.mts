import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import knexpkg, { type Knex } from 'knex';
import { Model } from 'objection';
import { mockDate, unmockDate } from '../../helpers/dateproxy.mjs';

export let db: Knex;

export function setUpSuite(): Promise<unknown> {
    mockDate();

    db = knexpkg({
        client: 'sqlite3',
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
