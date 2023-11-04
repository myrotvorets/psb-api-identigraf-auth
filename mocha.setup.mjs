import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

register('ts-node/esm', pathToFileURL('./'));

use(chaiAsPromised);

const env = { ...process.env };
process.env = {
    NODE_ENV: 'test',
    OTEL_SDK_DISABLED: 'true',
    KNEX_DRIVER: 'better-sqlite3',
    KNEX_DATABASE: ':memory:',
    DEFAULT_CREDITS: '5',
};

/** @type {import('mocha').RootHookObject} */
export const mochaHooks = {
    afterAll() {
        process.env = { ...env };
    },
};
