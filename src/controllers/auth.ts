import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import asyncWrapper from '@myrotvorets/express-async-middleware-wrapper';
import { ErrorResponse } from '@myrotvorets/express-microservice-middlewares';
import AuthService from '../services/auth';
import UserService from '../services/user';
import { today, tomorrow } from '../utils';
import { environment } from '../lib/environment';
import User from '../models/user';

type DefaultParams = Record<string, string>;

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
            phone: user.phone,
            admin: user.admin,
            whitelisted: user.whitelisted,
            credits: user.credits,
        },
    });
}

function loginHandler(authService: AuthService): RequestHandler {
    return async (
        req: Request<DefaultParams, LoginResponseBody, LoginRequestBody>,
        res: Response<LoginResponseBody>,
    ): Promise<void> => {
        const { uid, phone } = req.body;
        const user = await authService.login(uid, phone);
        sendUserDetails(res, user);
    };
}

async function checkPhoneHandler(
    req: Request<DefaultParams, CheckPhoneResponseBody, CheckPhoneRequestBody>,
    res: Response<CheckPhoneResponseBody>,
    next: NextFunction,
): Promise<void> {
    const { phone } = req.body;
    const user = await UserService.getUserByPhone(phone);
    if (user) {
        if (!user.whitelisted && user.lastseen === today() && user.credits <= 0) {
            const env = environment();
            next({
                success: false,
                status: 419,
                code: 'OUT_OF_CREDITS',
                message: 'You have run out of credits',
                additionalHeaders: {
                    'X-RateLimit-Limit': `${env.DEFAULT_CREDITS}`,
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

interface GetCreditsParams extends DefaultParams {
    phone: string;
}

interface GetCreditsResponse {
    success: true;
    credits: number;
}

function getCreditsHandler(authService: AuthService): RequestHandler<GetCreditsParams> {
    return async (req: Request<GetCreditsParams>, res: Response<GetCreditsResponse>): Promise<void> => {
        const { phone } = req.params;
        const credits = await authService.getRemainingCredits(`+${phone}`);
        res.send({
            success: true,
            credits,
        });
    };
}

export default function (): Router {
    const env = environment();
    const router = Router();
    const service = new AuthService(env.DEFAULT_CREDITS);

    router.post('/session', asyncWrapper(loginHandler(service)));
    router.post('/checkphone', asyncWrapper(checkPhoneHandler));
    router.get('/credits/:phone', asyncWrapper(getCreditsHandler(service)));
    return router;
}
