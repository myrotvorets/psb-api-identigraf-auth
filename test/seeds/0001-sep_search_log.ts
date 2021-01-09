import knex from 'knex';
import LogEntry from '../../src/models/logentry';

export async function seed(knex: knex): Promise<void> {
    await knex(LogEntry.tableName).del();
}
