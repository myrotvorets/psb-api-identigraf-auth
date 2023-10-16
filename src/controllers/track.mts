import { type Request, type Response, Router } from 'express';
import { asyncWrapperMiddleware } from '@myrotvorets/express-async-middleware-wrapper';
import type { LocalsWithContainer } from '../lib/container.mjs';

interface TrackRequestBody {
    type: 'search' | 'compare';
    phone: string;
    ips: string[];
    dt: number;
    guid: string;
}

interface TrackResponseBody {
    success: true;
    response: {
        credits: number;
        whitelisted: boolean;
    };
}

async function trackHandler(
    req: Request<never, TrackResponseBody, TrackRequestBody>,
    res: Response<TrackResponseBody, LocalsWithContainer>,
): Promise<void> {
    const { type, phone, ips, dt, guid } = req.body;
    const trackService = res.locals.container.resolve('trackService');
    const [credits, whitelisted] = await trackService.trackUpload(type, phone, ips, guid, dt);
    res.json({
        success: true,
        response: {
            credits: credits === -Infinity ? -1 : credits,
            whitelisted,
        },
    });
}

export function trackController(): Router {
    const router = Router();
    router.post('/track', asyncWrapperMiddleware(trackHandler));
    return router;
}
