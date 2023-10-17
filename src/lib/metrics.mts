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
            result.observe(+(row[0]?.count ?? NaN));
        });

    meter
        .createObservableUpDownCounter('identigraf.active_users', {
            description: 'Number of active users.',
            unit: '{count}',
            valueType: ValueType.INT,
        })
        .addCallback(async (result) => {
            const today = new Date();
            const week = today;
            const month = today;

            week.setDate(today.getDate() - 7);
            month.setDate(today.getDate() - 30);

            const todayStr = today.toISOString().slice(0, 10).replace(/-/gu, '');
            const weekStr = week.toISOString().slice(0, 10).replace(/-/gu, '');
            const monthStr = month.toISOString().slice(0, 10).replace(/-/gu, '');

            const row1 = await db(UserModel.tableName).count({ count: '*' }).where('lastseen', todayStr);
            const row2 = await db(UserModel.tableName).count({ count: '*' }).where('lastseen', '>=', weekStr);
            const row3 = await db(UserModel.tableName).count({ count: '*' }).where('lastseen', '>=', monthStr);

            const usersToday = +(row1[0]?.count ?? NaN);
            const usersWeek = +(row2[0]?.count ?? NaN);
            const usersMonth = +(row3[0]?.count ?? NaN);

            result.observe(usersToday, { period: 'today' });
            result.observe(usersWeek, { period: 'week' });
            result.observe(usersMonth, { period: 'month' });
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

    meter
        .createObservableUpDownCounter('identigraf.searches.breakdown', {
            description: 'Number of searches performed (breakdown).',
            unit: '{count}',
            valueType: ValueType.INT,
        })
        .addCallback(async (result) => {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const week = today;
            const month = today;

            week.setDate(today.getDate() - 7);
            month.setDate(today.getDate() - 30);

            const todayTimestamp = today.getTime() / 1000;
            const weekTimestamp = week.getTime() / 1000;
            const monthTimestamp = month.getTime() / 1000;

            const row1 = await db(LogEntryModel.tableName).count({ count: '*' }).where('dt', '>=', todayTimestamp);
            const row2 = await db(LogEntryModel.tableName).count({ count: '*' }).where('dt', '>=', weekTimestamp);
            const row3 = await db(LogEntryModel.tableName).count({ count: '*' }).where('dt', '>=', monthTimestamp);

            const searchesToday = +(row1[0]?.count ?? NaN);
            const searchesWeek = +(row2[0]?.count ?? NaN);
            const searchesMonth = +(row3[0]?.count ?? NaN);

            result.observe(searchesToday, { period: 'today' });
            result.observe(searchesWeek, { period: 'week' });
            result.observe(searchesMonth, { period: 'month' });
        });
}

/* c8 ignore stop */
