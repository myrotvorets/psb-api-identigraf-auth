/* c8 ignore start */
import { EventEmitter } from 'node:events';
import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { MySQL2Instrumentation } from '@opentelemetry/instrumentation-mysql2';
import { KnexInstrumentation } from '@myrotvorets/opentelemetry-plugin-knex';

export function configure(): void {
    if (+(process.env.ENABLE_TRACING || 0)) {
        EventEmitter.defaultMaxListeners += 5;
        const configurator = new OpenTelemetryConfigurator({
            serviceName: 'psb-api-identigraf-auth',
            instrumentations: [
                new KnexInstrumentation(),
                new HttpInstrumentation(),
                new ExpressInstrumentation(),
                new MySQL2Instrumentation(),
            ],
        });

        configurator.start();
    }
}
/* c8 ignore end */
