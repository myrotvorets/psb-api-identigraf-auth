import type { User } from '../models/user.mjs';

export interface AuthServiceInterface {
    login(uid: string, login: string): Promise<User>;
    getRemainingCredits(login: string): Promise<number>;
}
