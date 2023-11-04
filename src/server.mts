import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, json } from 'express';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { createServer, getTracer, recordErrorToSpan } from '@myrotvorets/otel-utils';

import { initializeContainer, scopedContainerMiddleware } from './lib/container.mjs';
import { initAsyncMetrics } from './lib/metrics.mjs';
import { requestDurationMiddleware } from './middleware/duration.mjs';
import { loggerMiddleware } from './middleware/logger.mjs';

import { authController } from './controllers/auth.mjs';
import { monitoringController } from './controllers/monitoring.mjs';
import { trackController } from './controllers/track.mjs';
import { userController } from './controllers/user.mjs';

export function configureApp(app: Express): ReturnType<typeof initializeContainer> {
    return getTracer().startActiveSpan('configureApp', (span): ReturnType<typeof initializeContainer> => {
        try {
            const container = initializeContainer();
            const env = container.resolve('environment');
            const base = dirname(fileURLToPath(import.meta.url));
            const db = container.resolve('db');

            app.use(requestDurationMiddleware, scopedContainerMiddleware, loggerMiddleware, json());
            app.use('/monitoring', monitoringController(db));

            app.use(
                installOpenApiValidator(join(base, 'specs', 'identigraf-auth-private.yaml'), env.NODE_ENV),
                authController(),
                trackController(),
                userController(),
                notFoundMiddleware,
                errorMiddleware,
            );

            initAsyncMetrics(container.cradle);
            return container;
        } /* c8 ignore start */ catch (e) {
            recordErrorToSpan(e, span);
            throw e;
        } /* c8 ignore stop */ finally {
            span.end();
        }
    });
}

export function createApp(): Express {
    const app = express();
    app.set('strict routing', true);
    app.set('case sensitive routing', true);
    app.set('x-powered-by', false);
    app.set('trust proxy', true);
    return app;
}

/* c8 ignore start */
export async function run(): Promise<void> {
    const app = createApp();
    const container = configureApp(app);
    const server = await createServer(app);
    server.on('close', () => {
        container.dispose().catch((e) => console.error(e));
    });
}
/* c8 ignore stop */
