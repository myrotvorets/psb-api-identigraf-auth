/* istanbul ignore file */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable('sep_search_log'))) {
        await knex.schema.createTable('sep_search_log', (table: Knex.CreateTableBuilder): void => {
            table.increments('id').notNullable();
            table.string('phone', 32).notNullable();
            table.binary('guid', 16).notNullable();
            table.binary('ip', 16).notNullable();
            table.integer('dt').notNullable();
            table.string('misc').notNullable();
            table.index(['phone']);
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    if (process.env['NODE_ENV'] !== 'test') {
        throw new Error(`Refusing to run this in ${process.env['NODE_ENV']} environment`);
    }

    await knex.schema.dropTableIfExists('sep_search_log');
}
