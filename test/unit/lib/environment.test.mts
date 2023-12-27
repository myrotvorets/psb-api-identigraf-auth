import { deepEqual } from 'node:assert/strict';
import { type Environment, environment } from '../../../src/lib/environment.mjs';

describe('environment', function () {
    let env: typeof process.env;

    before(function () {
        env = { ...process.env };
    });

    afterEach(function () {
        process.env = { ...env };
    });

    it('should not allow extra variables', function () {
        const expected: Environment = {
            NODE_ENV: 'development',
            PORT: 3000,
            DEFAULT_CREDITS: 10,
        };

        process.env = {
            NODE_ENV: expected.NODE_ENV,
            PORT: `${expected.PORT}`,
            DEFAULT_CREDITS: `${expected.DEFAULT_CREDITS}`,
            EXTRA: 'xxx',
        };

        const actual = { ...environment(true) };

        deepEqual(actual, expected);
    });

    it('should cache the result', function () {
        const expected: Environment = {
            NODE_ENV: 'staging',
            PORT: 3030,
            DEFAULT_CREDITS: 11,
        };

        process.env = {
            NODE_ENV: expected.NODE_ENV,
            PORT: `${expected.PORT}`,
            DEFAULT_CREDITS: `${expected.DEFAULT_CREDITS}`,
        };

        let actual = { ...environment(true) };
        deepEqual(actual, expected);

        process.env = {
            NODE_ENV: `${expected.NODE_ENV}${expected.NODE_ENV}`,
            PORT: `1${expected.PORT}`,
        };

        actual = { ...environment() };
        deepEqual(actual, expected);
    });
});
