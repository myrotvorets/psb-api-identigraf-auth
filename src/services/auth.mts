import { Model, type QueryBuilder, type Transaction } from 'objection';
import type { User, UserInterface } from '../models/user.mjs';
import { UserService } from './user.mjs';
import { today } from '../utils/index.mjs';

export class AuthService {
    public constructor(private readonly defaultCredits: number) {}

    public login(uid: string, login: string): Promise<User> {
        console.info(`Logging ing ${login} (${uid})`);
        return Model.transaction(async (trx) => {
            const user = await UserService.getUserByLogin(login, trx, true);
            if (!user) {
                return this.createNewUser(uid, login, trx);
            }

            user.uid = uid;
            return this.updateUser(user, trx);
        });
    }

    public async getRemainingCredits(login: string): Promise<number> {
        const user = await UserService.getUserByLogin(login);
        if (!user) {
            return this.defaultCredits;
        }

        const thisDay = today();
        const lastseen = user.lastseen;

        let credits: number;
        if (lastseen !== thisDay) {
            credits = user.whitelisted ? user.whitelisted : this.defaultCredits;
        } else {
            credits = user.credits;
        }

        console.info(`Credits for ${login}: (${credits})`);
        return credits;
    }

    private createNewUser(uid: string, login: string, trx: Transaction): QueryBuilder<User, User> {
        console.info(`Creating new user ${login} (${uid})`);
        const user: Partial<UserInterface> = {
            uid,
            login,
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

        console.info(`Updating user ${user.login}`);
        return UserService.saveUser(user, trx);
    }

    private static hasCredits({ lastseen, credits, whitelisted }: User, thisDay: number): boolean {
        return lastseen !== thisDay || credits > 0 || whitelisted > 0;
    }
}
