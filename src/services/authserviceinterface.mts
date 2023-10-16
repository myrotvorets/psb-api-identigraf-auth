import type { User } from '../models/user.mjs';

export interface AuthServiceInterface {
    login(uid: string, login: string): Promise<User | undefined>;
    getRemainingCredits(login: string): Promise<number>;
}
