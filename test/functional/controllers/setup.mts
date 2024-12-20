import type { RequestListener } from 'node:http';
import { configureApp, createApp } from '../../../src/server.mjs';
import { container } from '../../../src/lib/container.mjs';
import { mockDate, unmockDate } from '../../helpers/dateproxy.mjs';

export let app: RequestListener;

export async function setUpSuite(): Promise<unknown> {
    await container.dispose();
    mockDate();

    const application = createApp();
    configureApp(application);
    app = application as RequestListener;

    return container.resolve('db').migrate.latest();
}

export function tearDownSuite(): Promise<unknown> {
    unmockDate();
    return container.dispose();
}

export function setUp(): Promise<unknown> {
    return container.resolve('db').seed.run();
}
