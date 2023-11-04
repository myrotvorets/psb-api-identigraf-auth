import type { Knex } from 'knex';
import { escapeLike } from '../utils/index.mjs';

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

export interface SearchParams {
    login: string;
    comment: string;
    order: string;
    dir: string;
    offset: number;
    count: number;
}

export class UserModel {
    public static readonly tableName = 'sep_users';

    private readonly db: ModelOptions['db'];

    public constructor({ db }: ModelOptions) {
        this.db = db;
    }

    public getById(id: number): Promise<User | undefined> {
        return this.db(UserModel.tableName).where('id', id).first();
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

    public async search(params: SearchParams): Promise<[User[], number]> {
        const { login, comment, order, dir, offset, count } = params;
        let countQuery = this.db(UserModel.tableName);
        let userQuery = this.db(UserModel.tableName);

        if (login) {
            const v = escapeLike(login);
            userQuery = userQuery.where('login', 'like', `%${v}%`);
            countQuery = countQuery.where('login', 'like', `%${v}%`);
        }

        if (comment) {
            const v = escapeLike(comment);
            userQuery = userQuery.where('comment', 'like', `%${v}%`);
            countQuery = countQuery.where('comment', 'like', `%${v}%`);
        }

        const total = await countQuery.count({ count: 'id' }).first();
        const cnt = Number(total?.count);

        if (cnt && offset < cnt) {
            if (order && dir) {
                userQuery = userQuery.orderBy(order, dir);
            }

            const users = await userQuery.offset(offset).limit(count);
            return [users, cnt];
        }

        return [[], cnt];
    }
}

declare module 'knex/types/tables.js' {
    interface Tables {
        [UserModel.tableName]: User;
    }
}
