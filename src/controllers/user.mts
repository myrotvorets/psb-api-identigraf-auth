import { type NextFunction, type Request, type Response, Router } from 'express';
import { ApiError, numberParamHandler } from '@myrotvorets/express-microservice-middlewares';
import { asyncWrapperMiddleware } from '@myrotvorets/express-async-middleware-wrapper';
import type { User } from '../models/user.mjs';
import type { LocalsWithContainer } from '../lib/container.mjs';
import { SearchParams } from '../services/userserviceinterface.mjs';

const userNotFound = (id: number): ApiError => new ApiError(404, 'USER_NOT_FOUND', `User ${id} not found`);

interface UserIdParams {
    id: number;
}

interface UserResponse {
    success: true;
    user: User;
}

async function getUserById(
    req: Request<UserIdParams, UserResponse, never, never>,
    res: Response<UserResponse, LocalsWithContainer>,
    next: NextFunction,
): Promise<void> {
    const service = res.locals.container.resolve('userService');
    const { id } = req.params;

    const user = await service.getUserById(id);
    if (user) {
        res.json({ success: true, user });
    } else {
        next(userNotFound(id));
    }
}

interface UserSaveRequestBody {
    login: string;
    admin: boolean;
    whitelisted: number;
    credits: number;
    comment: string;
}

async function patchUser(
    req: Request<UserIdParams, UserResponse, Partial<UserSaveRequestBody>, never>,
    res: Response<UserResponse, LocalsWithContainer>,
    next: NextFunction,
): Promise<void> {
    const service = res.locals.container.resolve('userService');
    const user: Partial<User> = {
        id: req.params.id,
    };

    if (req.body.login) {
        user.login = req.body.login;
    }

    if (req.body.admin !== undefined) {
        user.admin = req.body.admin ? 1 : 0;
    }

    if (req.body.whitelisted !== undefined) {
        user.whitelisted = req.body.whitelisted;
    }

    if (req.body.credits !== undefined) {
        user.credits = req.body.credits;
    }

    if (req.body.comment !== undefined) {
        user.comment = req.body.comment;
    }

    if (Object.keys(user).length > 1) {
        const result = await service.saveUser(user);
        if (result) {
            res.json({ success: true, user: result });
        } else {
            next(userNotFound(req.params.id));
        }
    } else {
        next(new ApiError(400, 'BAD_PATCH', 'Need at least one property to update'));
    }
}

function updateUser(
    req: Request<UserIdParams, UserResponse, UserSaveRequestBody, never>,
    res: Response<UserResponse, LocalsWithContainer>,
    next: NextFunction,
): Promise<void> {
    return patchUser(req, res, next);
}

interface SearchResponse {
    success: true;
    users: User[];
    total: number;
}

async function searchUsers(
    req: Request<never, SearchResponse, never, SearchParams>,
    res: Response<SearchResponse, LocalsWithContainer>,
): Promise<void> {
    const service = res.locals.container.resolve('userService');
    const { login, comment, order, dir, offset, count } = req.query;

    const [users, total] = await service.search({ login, comment, order, dir, offset, count });
    res.json({ success: true, users, total });
}

export function userController(): Router {
    const router = Router();

    router.param('id', numberParamHandler);

    router.get('/users', asyncWrapperMiddleware(searchUsers));
    router.get('/users/:id', asyncWrapperMiddleware(getUserById));
    router.put('/users/:id', asyncWrapperMiddleware(updateUser));
    router.patch('/users/:id', asyncWrapperMiddleware(patchUser));

    return router;
}
