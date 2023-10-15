/* istanbul ignore file */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable('sep_search_log'))) {
        await knex.schema.createTable('sep_search_log', (table: Knex.CreateTableBuilder): void => {
            table.increments('id').notNullable();
            table.string('login', 255).notNullable();
            table.binary('guid', 16).notNullable();
            table.binary('ip', 16).notNullable();
            table.integer('dt').notNullable();
            table.string('misc').notNullable();
            table.index(['login']);
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('sep_search_log');
}
