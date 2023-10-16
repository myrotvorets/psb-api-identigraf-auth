import type { User } from '../models/user.mjs';

export interface UserServiceInterface {
    getUserByLogin(login: string): Promise<User | undefined>;
    saveUser(user: Partial<User>): Promise<User | undefined>;
}
