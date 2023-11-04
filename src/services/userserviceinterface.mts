import type { User } from '../models/user.mjs';

export interface SearchParams {
    login: string;
    comment: string;
    order: string;
    dir: string;
    offset: number;
    count: number;
}

export interface UserServiceInterface {
    getUserByLogin(login: string): Promise<User | undefined>;
    saveUser(user: Partial<User>): Promise<User | undefined>;
    search(params: SearchParams): Promise<[User[], number]>;
    getUserById(id: number): Promise<User | undefined>;
}
