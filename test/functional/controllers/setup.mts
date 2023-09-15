import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import knexpkg, { type Knex } from 'knex';
import { Model } from 'objection';
import { configureApp } from '../../../src/server.mjs';
import { mockDate, unmockDate } from '../../helpers/dateproxy.mjs';

export let app: Express;
let db: Knex;

export async function setUpSuite(): Promise<void> {
    mockDate();

    db = knexpkg({
        client: 'better-sqlite3',
        connection: {
            filename: ':memory:',
        },
        useNullAsDefault: true,
    });

    Model.knex(db);

    app = express();
    await configureApp(app);

    await db.migrate.latest({
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
