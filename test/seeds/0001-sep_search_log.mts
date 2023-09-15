import type { Knex } from 'knex';
import { LogEntry } from '../../src/models/logentry.mjs';

export async function seed(knex: Knex): Promise<void> {
    await knex(LogEntry.tableName).del();
}
