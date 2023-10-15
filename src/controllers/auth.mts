import { type NextFunction, type Request, type RequestHandler, type Response, Router } from 'express';
import { asyncWrapperMiddleware } from '@myrotvorets/express-async-middleware-wrapper';
import type { ErrorResponse } from '@myrotvorets/express-microservice-middlewares';
import { AuthService } from '../services/auth.mjs';
import { UserService } from '../services/user.mjs';
import { today, tomorrow } from '../utils/index.mjs';
import { environment } from '../lib/environment.mjs';
import type { User } from '../models/user.mjs';

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
            phone: user.login,
            admin: user.admin,
            whitelisted: user.whitelisted,
            credits: user.credits,
        },
    });
}

function loginHandler(authService: AuthService): RequestHandler {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
    const user = await UserService.getUserByLogin(phone);
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
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return async (req: Request<GetCreditsParams>, res: Response<GetCreditsResponse>): Promise<void> => {
        const { phone } = req.params;
        const credits = await authService.getRemainingCredits(`+${phone}`);
        res.send({
            success: true,
            credits,
        });
    };
}

export function authController(): Router {
    const env = environment();
    const router = Router();
    const service = new AuthService(env.DEFAULT_CREDITS);

    router.post('/session', asyncWrapperMiddleware(loginHandler(service)));
    router.post('/checkphone', asyncWrapperMiddleware(checkPhoneHandler));
    router.get('/credits/:phone', asyncWrapperMiddleware(getCreditsHandler(service)));
    return router;
}
