import { Request, RequestHandler, Response, Router } from 'express';
import asyncWrapper from '@myrotvorets/express-async-middleware-wrapper';
import TrackService from '../services/track';
import { environment } from '../lib/environment';

type DefaultParams = Record<string, string>;

interface TrackRequestBody {
    type: 'search' | 'compare';
    phone: string;
    ips: string[];
    dt: number;
    guid: string;
}

function trackHandler(trackService: TrackService): RequestHandler {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return async (req: Request<DefaultParams, unknown, TrackRequestBody>, res: Response): Promise<void> => {
        const { type, phone, ips, dt, guid } = req.body;
        const [credits, whitelisted] = await trackService.trackUpload(type, phone, ips, guid, dt);
        res.json({
            success: true,
            response: {
                credits: credits === -Infinity ? -1 : credits,
                whitelisted,
            },
        });
    };
}

export default function (): Router {
    const env = environment();
    const router = Router();
    const service = new TrackService(env.DEFAULT_CREDITS);

    router.post('/track', asyncWrapper(trackHandler(service)));
    return router;
}
