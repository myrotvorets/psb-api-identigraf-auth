import type { QueryBuilder, TransactionOrKnex } from 'objection';
import { User, type UserInterface } from '../models/user.mjs';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserService {
    public static getUserByLogin(
        login: string,
        trx?: TransactionOrKnex,
        forUpdate = false,
    ): QueryBuilder<User, User | undefined> {
        let qb = User.query(trx).findOne('login', login);
        if (forUpdate) {
            qb = qb.forUpdate();
        }

        return qb;
    }

    public static saveUser(user: Partial<UserInterface>, trx?: TransactionOrKnex): QueryBuilder<User, User> {
        if (user.id) {
            const { id, ...fields } = user;
            return User.fromJson({ id }).$query(trx).patchAndFetch(fields);
        }

        return User.query(trx).insert(user);
    }
}
