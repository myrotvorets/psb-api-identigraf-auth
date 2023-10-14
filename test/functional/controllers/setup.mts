import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

    return container.resolve('db').migrate.latest({
        directory: join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'migrations'),
        loadExtensions: ['.mts'],
    });
}

export function tearDownSuite(): Promise<unknown> {
    unmockDate();
    return container.resolve('db').destroy();
}

export function setUp(): Promise<unknown> {
    return container.resolve('db').seed.run({
        directory: join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'seeds'),
        loadExtensions: ['.mts'],
    });
}
