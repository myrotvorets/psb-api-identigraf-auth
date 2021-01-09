import { Model, QueryBuilder, Transaction } from 'objection';
import User, { UserInterface } from '../models/user';
import UserService from './user';
import { today } from '../utils';

export default class AuthService {
    public constructor(private readonly defaultCredits: number) {}

    public login(uid: string, phone: string): Promise<User> {
        return Model.transaction(async (trx) => {
            const user = await UserService.getUserByPhone(phone, trx, true);
            if (!user) {
                return this.createNewUser(uid, phone, trx);
            }

            user.uid = uid;
            return this.updateUser(user, trx);
        });
    }

    public async getRemainingCredits(phone: string): Promise<number> {
        const user = await UserService.getUserByPhone(phone);
        if (!user) {
            return this.defaultCredits;
        }

        const thisDay = today();
        const lastseen = user.lastseen;

        if (lastseen !== thisDay) {
            return user.whitelisted ? user.whitelisted : this.defaultCredits;
        }

        return user.credits;
    }

    private createNewUser(uid: string, phone: string, trx: Transaction): QueryBuilder<User, User> {
        const user: Partial<UserInterface> = {
            uid,
            phone,
            admin: 0,
            whitelisted: 0,
            credits: this.defaultCredits,
            lastseen: today(),
            comment: '',
        };

        return UserService.saveUser(user, trx);
    }

    private updateUser(user: User, trx: Transaction): Promise<User> | QueryBuilder<User, User> {
        const thisDay = today();
        const lastseen = user.lastseen;

        if (AuthService.hasCredits(user, thisDay)) {
            if (lastseen !== thisDay) {
                user.lastseen = thisDay;
                user.credits = this.defaultCredits;
            }

            if (user.whitelisted) {
                user.credits = user.whitelisted;
            }
        }

        return UserService.saveUser(user, trx);
    }

    private static hasCredits({ lastseen, credits, whitelisted }: User, thisDay: number): boolean {
        return lastseen !== thisDay || credits > 0 || whitelisted > 0;
    }
}
