/* istanbul ignore file */

import { EventEmitter } from 'events';
import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';
// import { KnexPlugin } from '@myrotvorets/opentelemetry-plugin-knex';

if (+(process.env.ENABLE_TRACING || 0)) {
    EventEmitter.defaultMaxListeners += 5;
}

export async function configure(): Promise<void> {
    if (+(process.env.ENABLE_TRACING || 0)) {
        const configurator = new OpenTelemetryConfigurator({
            serviceName: 'psb-api-identigraf-auth',
            // instrumentations: [new KnexPlugin()],
        });

        await configurator.start();
    }
}
