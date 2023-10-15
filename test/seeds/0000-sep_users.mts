import type { Knex } from 'knex';
import { User, type UserInterface } from '../../src/models/user.mjs';

const today = 20201230;

const seedData: UserInterface[] = [
    // Normal user, last seen today
    {
        id: 1,
        uid: 'uid1',
        login: '+380000000001',
        admin: 0,
        whitelisted: 0,
        credits: 4,
        lastseen: today,
        comment: '',
    },
    // Whitelisted user, last seen today
    {
        id: 2,
        uid: 'uid2',
        login: '+380000000002',
        admin: 0,
        whitelisted: 10,
        credits: 10,
        lastseen: today,
        comment: '',
    },
    // Normal user, last seen long ago
    {
        id: 3,
        uid: 'uid3',
        login: '+380000000003',
        admin: 0,
        whitelisted: 0,
        credits: 1,
        lastseen: 20000101,
        comment: '',
    },
    // Normal user, no credits, last seen today
    {
        id: 4,
        uid: 'uid4',
        login: '+380000000004',
        admin: 0,
        whitelisted: 0,
        credits: 0,
        lastseen: today,
        comment: '',
    },
    // Whitelisted user, no credits, last seen today
    {
        id: 5,
        uid: 'uid5',
        login: '+380000000005',
        admin: 0,
        whitelisted: 20,
        credits: 0,
        lastseen: today,
        comment: '',
    },
    // Whitelisted user, with credits, last seen long ago
    {
        id: 6,
        uid: 'uid6',
        login: '+380000000006',
        admin: 0,
        whitelisted: 20,
        credits: 2,
        lastseen: 20000101,
        comment: '',
    },
];

export async function seed(knex: Knex): Promise<void> {
    await knex(User.tableName).del();
    await knex(User.tableName).insert(seedData);
}
