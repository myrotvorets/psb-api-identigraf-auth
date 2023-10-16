import type { Knex } from 'knex';
import { LogEntryModel } from '../../src/models/logentry.mjs';

export async function seed(knex: Knex): Promise<void> {
    await knex(LogEntryModel.tableName).del();
}
