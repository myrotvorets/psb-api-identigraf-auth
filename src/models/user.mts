import type { Knex } from 'knex';

export interface User {
    id: number;
    uid: string;
    login: string;
    admin: number;
    whitelisted: number;
    credits: number;
    lastseen: number;
    comment: string;
}

interface ModelOptions {
    db: Knex<User, User[]> | Knex.Transaction<User, User[]>;
}

export class UserModel {
    public static readonly tableName = 'sep_users';

    private readonly db: ModelOptions['db'];

    public constructor({ db }: ModelOptions) {
        this.db = db;
    }

    public getByLogin(login: string): Promise<User | undefined> {
        const builder = this.db(UserModel.tableName).where('login', login).first();
        return this.db.isTransaction ? builder.forUpdate() : builder;
    }

    public async save(user: Partial<User>): Promise<User | undefined> {
        const { id, ...fields } = user;
        let userID;

        if (id) {
            await this.db(UserModel.tableName).update(fields).where('id', id);
            userID = id;
        } else {
            [userID] = await this.db(UserModel.tableName).insert(fields);
        }

        return this.db(UserModel.tableName).where('id', userID).first();
    }
}

declare module 'knex/types/tables.js' {
    interface Tables {
        [UserModel.tableName]: User;
    }
}
