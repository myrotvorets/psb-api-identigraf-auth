import { User, type UserInterface } from '../models/user.mjs';

export interface UserServiceInterface {
    getUserByLogin(login: string): Promise<User | undefined>;
    saveUser(user: Partial<UserInterface>): Promise<User>;
}
