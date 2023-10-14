import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, json } from 'express';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { createServer, getTracer, recordErrorToSpan } from '@myrotvorets/otel-utils';

import { initializeContainer, scopedContainerMiddleware } from './lib/container.mjs';
import { requestDurationMiddleware } from './middleware/duration.mjs';
import { loggerMiddleware } from './middleware/logger.mjs';

import { authController } from './controllers/auth.mjs';
import { monitoringController } from './controllers/monitoring.mjs';
import { trackController } from './controllers/track.mjs';

export function configureApp(app: Express): Promise<ReturnType<typeof initializeContainer>> {
    return getTracer().startActiveSpan(
        'configureApp',
        async (span): Promise<ReturnType<typeof initializeContainer>> => {
            try {
                const container = initializeContainer();
                const env = container.resolve('environment');
                const base = dirname(fileURLToPath(import.meta.url));
                const db = container.resolve('db');

                app.use(requestDurationMiddleware, scopedContainerMiddleware, loggerMiddleware, json());
                app.use('/monitoring', monitoringController(db));

                await installOpenApiValidator(join(base, 'specs', 'identigraf-auth-internal.yaml'), app, env.NODE_ENV);

                app.use(authController(), trackController(), notFoundMiddleware, errorMiddleware);

                return container;
            } /* c8 ignore start */ catch (e) {
                recordErrorToSpan(e, span);
                throw e;
            } /* c8 ignore stop */ finally {
                span.end();
            }
        },
    );
}

export function createApp(): Express {
    const app = express();
    app.set('strict routing', true);
    app.set('case sensitive routing', true);
    app.set('x-powered-by', false);
    app.set('trust proxy', true);
    return app;
}

export async function run(): Promise<void> {
    const app = createApp();
    const container = await configureApp(app);
    const env = container.resolve('environment');

    const server = await createServer(app);
    server.once('close', () => {
        container
            .resolve('db')
            .destroy()
            .catch((e) => console.error(e));
    });

    server.listen(env.PORT);
}
/* c8 ignore stop */
