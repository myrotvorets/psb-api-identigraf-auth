import type { User, UserModel } from '../models/user.mjs';
import type { ModelService, UserServiceInterface } from './index.mjs';

interface UserServiceOptions {
    modelService: ModelService;
}

export class UserService implements UserServiceInterface {
    private readonly userModel: UserModel;

    public constructor({ modelService }: UserServiceOptions) {
        this.userModel = modelService.user;
    }

    public getUserByLogin(login: string): Promise<User | undefined> {
        return this.userModel.getByLogin(login);
    }

    public saveUser(user: Partial<User>): Promise<User | undefined> {
        return this.userModel.save(user);
    }
}
