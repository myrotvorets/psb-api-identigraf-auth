import type { User } from '../models/user.mjs';
import type { AuthServiceInterface } from './authserviceinterface.mjs';
import { today } from '../utils/index.mjs';
import { ModelService } from './modelservice.mjs';

interface AuthServiceOptions {
    modelService: ModelService;
    defaultCredits: number;
}

export class AuthService implements AuthServiceInterface {
    private readonly defaultCredits: number;
    private readonly modelService: ModelService;

    public constructor({ defaultCredits, modelService }: AuthServiceOptions) {
        this.defaultCredits = defaultCredits;
        this.modelService = modelService;
    }

    public async login(uid: string, login: string): Promise<User | undefined> {
        const thisDay = today();
        return this.modelService.transaction(async (_trx, models) => {
            const user = await models.user.getByLogin(login);
            if (!user) {
                return models.user.save({
                    uid,
                    login,
                    admin: 0,
                    whitelisted: 0,
                    credits: this.defaultCredits,
                    lastseen: thisDay,
                    comment: '',
                });
            }

            const { lastseen } = user;

            user.uid = uid;
            if (AuthService.hasCredits(user, thisDay)) {
                if (lastseen !== thisDay) {
                    user.lastseen = thisDay;
                    user.credits = this.defaultCredits;
                }

                if (user.whitelisted) {
                    user.credits = user.whitelisted;
                }
            }

            return models.user.save(user);
        });
    }

    public async getRemainingCredits(login: string): Promise<number> {
        const user = await this.modelService.user.getByLogin(login);
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

        return credits;
    }

    private static hasCredits({ lastseen, credits, whitelisted }: User, thisDay: number): boolean {
        return lastseen !== thisDay || credits > 0 || whitelisted > 0;
    }
}
