/* c8 ignore start */
import { ValueType } from '@opentelemetry/api';
import { getMeter } from '@myrotvorets/otel-utils';
import type { Container } from './container.mjs';
import { LogEntryModel, UserModel } from '../models/index.mjs';

const meter = getMeter();

export const requestDurationHistogram = meter.createHistogram('psbapi.request.duration', {
    description: 'Measures the duration of requests.',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
});

export function initAsyncMetrics({ db, meter }: Container): void {
    meter
        .createObservableUpDownCounter('identigraf.users', {
            description: 'Number of users in the database.',
            unit: '{count}',
            valueType: ValueType.INT,
        })
        .addCallback(async (result) => {
            const row = await db(UserModel.tableName).count({ count: '*' });
            if (row[0]?.count !== undefined) {
                result.observe(+row[0].count);
            } else {
                result.observe(NaN);
            }
        });

    meter
        .createObservableCounter('identigraf.searches', {
            description: 'Number of searches performed.',
            unit: '{count}',
            valueType: ValueType.INT,
        })
        .addCallback(async (result) => {
            const row = await db(LogEntryModel.tableName).count({ count: '*' });
            if (row[0]?.count !== undefined) {
                result.observe(+row[0].count);
            } else {
                result.observe(NaN);
            }
        });
}

/* c8 ignore stop */
