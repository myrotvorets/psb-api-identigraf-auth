import { type Express } from 'express';
import { configureApp, createApp } from '../../../src/server.mjs';
import { container } from '../../../src/lib/container.mjs';
import { mockDate, unmockDate } from '../../helpers/dateproxy.mjs';

export let app: Express;

export async function setUpSuite(): Promise<unknown> {
    await container.dispose();
    mockDate();

    app = createApp();
    await configureApp(app);

    return container.resolve('db').migrate.latest();
}

export function tearDownSuite(): Promise<unknown> {
    unmockDate();
    return container.dispose();
}

export function setUp(): Promise<unknown> {
    return container.resolve('db').seed.run();
}
