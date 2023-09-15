/* c8 ignore start */
import { EventEmitter } from 'node:events';
import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';
import { KnexInstrumentation } from '@myrotvorets/opentelemetry-plugin-knex';

if (+(process.env.ENABLE_TRACING || 0)) {
    EventEmitter.defaultMaxListeners += 5;
}

export function configure(): void {
    if (+(process.env.ENABLE_TRACING || 0)) {
        const configurator = new OpenTelemetryConfigurator({
            serviceName: 'psb-api-identigraf-auth',
            instrumentations: [new KnexInstrumentation()],
        });

        configurator.start();
    }
}
/* c8 ignore end */
