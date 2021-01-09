import path from 'path';
import knex from 'knex';
import { Model } from 'objection';

export const db = knex({
    client: 'sqlite3',
    connection: {
        filename: ':memory:',
    },
    useNullAsDefault: true,
});

Model.knex(db);

const fakeTime = new Date(Date.UTC(2020, 11, 30, 0, 0, 0, 0));

beforeAll(() => jest.useFakeTimers('modern').setSystemTime(fakeTime));
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
