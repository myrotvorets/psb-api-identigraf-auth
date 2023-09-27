/* c8 ignore start */
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable('sep_users'))) {
        await knex.schema.createTable('sep_users', (table: Knex.CreateTableBuilder): void => {
            table.increments('id').notNullable();
            table.string('uid', 255).notNullable();
            table.string('phone', 32).notNullable();
            table.integer('admin').notNullable();
            table.integer('whitelisted').notNullable();
            table.integer('credits').notNullable();
            table.integer('lastseen').notNullable();
            table.string('comment').notNullable();
            table.unique(['phone']);
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error(`Refusing to run this in ${process.env.NODE_ENV} environment`);
    }

    await knex.schema.dropTableIfExists('sep_users');
}
/* c8 ignore stop */
