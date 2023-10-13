/* c8 ignore start */
import { OpenTelemetryConfigurator, getExpressInstrumentations } from '@myrotvorets/opentelemetry-configurator';
import { KnexInstrumentation } from '@myrotvorets/opentelemetry-plugin-knex';

export function configure(): void {
    const configurator = new OpenTelemetryConfigurator({
        serviceName: 'psb-api-identigraf-auth',
        instrumentations: [...getExpressInstrumentations(), new KnexInstrumentation()],
    });

    configurator.start();
}
/* c8 ignore stop */
