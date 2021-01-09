import { QueryBuilder, TransactionOrKnex } from 'objection';
import User, { UserInterface } from '../models/user';

export default class UserService {
    public static getUserByPhone(
        phone: string,
        trx?: TransactionOrKnex,
        forUpdate = false,
    ): QueryBuilder<User, User | undefined> {
        let qb = User.query(trx).findOne('phone', phone);
        if (forUpdate) {
            qb = qb.forUpdate();
        }

        return qb;
    }

    public static saveUser(user: Partial<UserInterface> | User, trx?: TransactionOrKnex): QueryBuilder<User, User> {
        if (user.id) {
            const { id, ...fields } = user;
            return User.fromJson({ id }).$query(trx).patchAndFetch(fields);
        }

        return User.query(trx).insert(user);
    }
}
