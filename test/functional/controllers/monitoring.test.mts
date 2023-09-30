/* eslint-disable import/no-named-as-default-member */
import { expect } from 'chai';
import express, { type Express } from 'express';
import request from 'supertest';
import * as knexpkg from 'knex';
import mockKnex from 'mock-knex';
import type { HealthChecker } from '@cloudnative/health-connect';
import { buildKnexConfig } from '../../../src/knexfile.mjs';
import { healthChecker, monitoringController } from '../../../src/controllers/monitoring.mjs';

describe('MonitoringController', function () {
    let app: Express;
    let db: knexpkg.Knex;

    before(function () {
        // See https://github.com/knex/knex/issues/5358#issuecomment-1279979120
        const { knex } = knexpkg.default;

        db = knex(buildKnexConfig({ MYSQL_DATABASE: 'fake' }));
        mockKnex.mock(db);

        app = express();
        app.disable('x-powered-by');
        app.use('/monitoring', monitoringController(db));
    });

    after(function () {
        return mockKnex.unmock(db);
    });

    beforeEach(function () {
        expect(healthChecker).not.to.be.undefined;
        (healthChecker as HealthChecker).shutdownRequested = false;
    });

    afterEach(function () {
        process.removeAllListeners('SIGTERM');
        mockKnex.getTracker().uninstall();
    });

    const checker200 = (endpoint: string): Promise<unknown> =>
        request(app).get(`/monitoring/${endpoint}`).expect('Content-Type', /json/u).expect(200);

    const checker503 = (endpoint: string): Promise<unknown> => {
        (healthChecker as HealthChecker).shutdownRequested = true;
        return request(app).get(`/monitoring/${endpoint}`).expect('Content-Type', /json/u).expect(503);
    };

    describe('Liveness Check', function () {
        it('should succeed', function () {
            return checker200('live');
        });

        it('should fail when shutdown requested', function () {
            return checker503('live');
        });
    });

    describe('Readiness Check', function () {
        it('should succeed', function () {
            return checker200('ready');
        });

        it('should fail when shutdown requested', function () {
            return checker503('ready');
        });
    });

    describe('Health Check', function () {
        it('should succeed', function () {
            return checker200('health');
        });

        it('should fail when shutdown requested', function () {
            return checker503('health');
        });
    });
});
