import request from 'supertest';
import { app, setUp, setUpSuite, tearDownSuite } from './setup.mjs';

describe('TrackController', function () {
    before(setUpSuite);
    after(tearDownSuite);
    beforeEach(setUp);

    describe('trackHandler', function () {
        describe('Error handling', function () {
            it('should fail the request without body', function () {
                return request(app)
                    .post('/track')
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });

            it('should fail non-JSON requests', function () {
                return request(app)
                    .post('/track')
                    .set('Content-Type', 'text/plain')
                    .send(
                        '{"type": "search", "phone": "+380123456789", "guid": "00000000-0000-0000-0000-000000000000", "ips": ["78.30.235.66"], "dt": 1593640625}',
                    )
                    .expect(415);
            });

            // eslint-disable-next-line mocha/no-setup-in-describe
            ['type', 'phone', 'guid', 'ips', 'dt'].forEach((field) => {
                it(`should fail if the required field (${field}) is missing`, function () {
                    const req: Record<string, unknown> = {
                        type: 'search',
                        phone: '+380123456789',
                        guid: '00000000-0000-0000-0000-000000000000',
                        ips: ['78.30.235.66'],
                        dt: 1593640625,
                    };

                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                    delete req[field];

                    return request(app)
                        .post('/track')
                        .set('Content-Type', 'application/json')
                        .send(req)
                        .expect(400)
                        .expect(/"code":"BAD_REQUEST"/u);
                });
            });

            it('should fail if the list of IPs is empty', function () {
                const req: Record<string, unknown> = {
                    type: 'search',
                    phone: '+380123456789',
                    guid: '00000000-0000-0000-0000-000000000000',
                    ips: [],
                    dt: 1593640625,
                };

                return request(app)
                    .post('/track')
                    .set('Content-Type', 'application/json')
                    .send(req)
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });

            // eslint-disable-next-line mocha/no-setup-in-describe
            [
                ['destroy', '+380123456789', '00000000-0000-0000-0000-000000000000', '123.45.67.89', 1593640625],
                // ['search', '380123456789', '00000000-0000-0000-0000-000000000000', '123.45.67.89', 1593640625],
                // ['search', '+290123', '00000000-0000-0000-0000-000000000000', '123.45.67.89', 1593640625],
                // ['search', '+12345678901234567', '00000000-0000-0000-0000-000000000000', '123.45.67.89', 1593640625],
                ['search', '+380123456789', 'X0000000-0000-0000-0000-000000000000', '123.45.67.89', 1593640625],
                ['search', '+380123456789', '00000000-0000-0000-0000-000000000000', '123.45.67.890', 1593640625],
                ['search', '+380123456789', '00000000-0000-0000-0000-000000000000', ':::1', 1593640625],
                ['search', '+380123456789', '00000000-0000-0000-0000-000000000000', '123.45.67.89', -1593640625],
            ].forEach(([type, phone, guid, ip, dt]) => {
                it('should fail if a parameter is invalid', function () {
                    const req: Record<string, unknown> = { type, phone, guid, ips: [ip], dt };

                    return request(app)
                        .post('/track')
                        .set('Content-Type', 'application/json')
                        .send(req)
                        .expect(400)
                        .expect(/"code":"BAD_REQUEST"/u);
                });
            });
        });

        describe('Normal operation', function () {
            it('should return 200 if everything is OK (existing user)', function () {
                const req: Record<string, unknown> = {
                    type: 'search',
                    phone: '+380000000001',
                    guid: '00000000-0000-0000-0000-000000000000',
                    ips: ['78.30.235.66'],
                    dt: 1593640625,
                };

                return request(app)
                    .post('/track')
                    .set('Content-Type', 'application/json')
                    .send(req)
                    .expect(200)
                    .expect({
                        success: true,
                        response: {
                            credits: 3,
                            whitelisted: false,
                        },
                    });
            });

            it('should return 200 if everything is OK (non-existing user)', function () {
                const req: Record<string, unknown> = {
                    type: 'search',
                    phone: '+380123456789',
                    guid: '00000000-0000-0000-0000-000000000000',
                    ips: ['78.30.235.66'],
                    dt: 1593640625,
                };

                return request(app)
                    .post('/track')
                    .set('Content-Type', 'application/json')
                    .send(req)
                    .expect(200)
                    .expect({
                        success: true,
                        response: {
                            credits: -1,
                            whitelisted: false,
                        },
                    });
            });
        });
    });
});
