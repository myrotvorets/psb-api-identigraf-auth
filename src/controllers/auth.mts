import { type NextFunction, type Request, type Response, Router } from 'express';
import { asyncWrapperMiddleware } from '@myrotvorets/express-async-middleware-wrapper';
import type { ErrorResponse } from '@myrotvorets/express-microservice-middlewares';
import { today, tomorrow } from '../utils/index.mjs';
import type { User } from '../models/user.mjs';
import type { LocalsWithContainer } from '../lib/container.mjs';

interface LoginRequestBody {
    uid: string;
    phone: string;
}

interface LoginResponseBody {
    success: true;
    user: {
        phone: string;
        admin: number;
        whitelisted: number;
        credits: number;
    };
}

interface CheckPhoneRequestBody {
    phone: string;
}

interface CheckPhoneResponseBody {
    success: true;
    user: {
        phone: string;
        admin: number;
        whitelisted: number;
        credits: number;
    } | null;
}

function sendUserDetails(res: Response<LoginResponseBody> | Response<CheckPhoneResponseBody>, user: User): void {
    res.json({
        success: true,
        user: {
            phone: user.login,
            admin: user.admin,
            whitelisted: user.whitelisted,
            credits: user.credits,
        },
    });
}

async function loginHandler(
    req: Request<never, LoginResponseBody, LoginRequestBody>,
    res: Response<LoginResponseBody, LocalsWithContainer>,
    next: NextFunction,
): Promise<void> {
    const { uid, phone } = req.body;
    const authService = res.locals.container.resolve('authService');
    const user = await authService.login(uid, phone);
    if (user) {
        sendUserDetails(res, user);
    } else {
        next({
            success: false,
            status: 500,
            code: 'INTERNAL_ERROR',
            message: 'Failed to log in user',
        } as ErrorResponse);
    }
}

async function checkPhoneHandler(
    req: Request<never, CheckPhoneResponseBody, CheckPhoneRequestBody>,
    res: Response<CheckPhoneResponseBody, LocalsWithContainer>,
    next: NextFunction,
): Promise<void> {
    const { phone } = req.body;
    const userService = res.locals.container.resolve('userService');
    const user = await userService.getUserByLogin(phone);

    if (user) {
        if (!user.whitelisted && user.lastseen === today() && user.credits <= 0) {
            next({
                success: false,
                status: 419,
                code: 'OUT_OF_CREDITS',
                message: 'You have run out of credits',
                additionalHeaders: {
                    'X-RateLimit-Limit': `${res.locals.container.resolve('defaultCredits')}`,
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': `${tomorrow()}`,
                },
            } as ErrorResponse);
        } else {
            sendUserDetails(res, user);
        }
    } else {
        res.json({
            success: true,
            user: null,
        });
    }
}

interface GetCreditsParams {
    phone: string;
}

interface GetCreditsResponse {
    success: true;
    credits: number;
}

async function getCreditsHandler(
    req: Request<GetCreditsParams>,
    res: Response<GetCreditsResponse, LocalsWithContainer>,
): Promise<void> {
    let { phone } = req.params;
    const authService = res.locals.container.resolve('authService');

    // Compatibility
    if (phone.startsWith('380')) {
        phone = `+${phone}`;
    }

    const credits = await authService.getRemainingCredits(`${phone}`);
    res.send({
        success: true,
        credits,
    });
}

export function authController(): Router {
    const router = Router();
    router.post('/session', asyncWrapperMiddleware(loginHandler));
    router.post('/checkphone', asyncWrapperMiddleware(checkPhoneHandler));
    router.get('/credits/:phone', asyncWrapperMiddleware(getCreditsHandler));
    return router;
}
