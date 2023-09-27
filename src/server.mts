import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, json } from 'express';
import * as knexpkg from 'knex';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { createServer } from '@myrotvorets/create-server';
import morgan from 'morgan';
import { Model } from 'objection';

import { buildKnexConfig } from './knexfile.mjs';
import { environment } from './lib/environment.mjs';

import { authController } from './controllers/auth.mjs';
import { monitoringController } from './controllers/monitoring.mjs';
import { trackController } from './controllers/track.mjs';

// See https://github.com/knex/knex/issues/5358#issuecomment-1279979120
const { knex } = knexpkg.default;

export async function configureApp(app: Express): Promise<void> {
    const env = environment();

    app.use(json());

    await installOpenApiValidator(
        join(dirname(fileURLToPath(import.meta.url)), 'specs', 'identigraf-auth-internal.yaml'),
        app,
        env.NODE_ENV,
    );

    app.use(authController());
    app.use(trackController());
    app.use(notFoundMiddleware);
    app.use(errorMiddleware);
}

/* c8 ignore start */
export function setupApp(): Express {
    const app = express();
    app.set('strict routing', true);
    app.set('x-powered-by', false);

    app.use(
        morgan(
            '[PSBAPI-identigraf-decoder] :req[X-Request-ID]\t:method\t:url\t:status :res[content-length]\t:date[iso]\t:response-time\t:total-time',
        ),
    );

    return app;
}

function setupKnex(): knexpkg.Knex {
    const db = knex(buildKnexConfig());
    Model.knex(db);
    return db;
}

export async function run(): Promise<void> {
    const [env, app, db] = [environment(), setupApp(), setupKnex()];

    app.use('/monitoring', monitoringController(db));

    await configureApp(app);

    const server = await createServer(app);
    server.once('close', () => {
        db.destroy().catch((e) => console.error(e));
    });
    server.listen(env.PORT);
}
/* c8 ignore stop */
