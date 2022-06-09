import express, { Express } from 'express';
import path from 'path';
import knex from 'knex';
import { Model } from 'objection';
import { configureApp } from '../../../src/server';

export let app: Express;

const db = knex({
    client: 'sqlite3',
    connection: {
        filename: ':memory:',
    },
    useNullAsDefault: true,
});

Model.knex(db);

async function buildApp(): Promise<Express> {
    const application = express();
    await configureApp(application);
    return application;
}

const fakeTime = new Date(Date.UTC(2020, 11, 30, 0, 0, 0, 0));

beforeAll(() => jest.useFakeTimers().setSystemTime(fakeTime));
beforeAll(() => buildApp().then((application) => (app = application)));
beforeAll(() =>
    db.migrate.latest({
        directory: path.join(__dirname, '..', '..', 'migrations'),
    }),
);

afterAll(() => db.destroy());
afterAll(() => jest.useRealTimers());

beforeEach(() =>
    db.seed.run({
        directory: path.join(__dirname, '..', '..', 'seeds'),
    }),
);
