import { after, before, beforeEach, describe, it } from 'mocha';
import request from 'supertest';
import { app, setUp, setUpSuite, tearDownSuite } from './setup.mjs';
import { environment } from '../../../src/lib/environment.mjs';

describe('AuthController', () => {
    before(setUpSuite);
    after(tearDownSuite);
    beforeEach(setUp);

    describe('checkPhoneHandler', () => {
        describe('Error handling', () => {
            it('should fail the request without body', () => {
                return request(app)
                    .post('/checkphone')
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });

            it('should fail non-JSON requests', () => {
                return request(app)
                    .post('/checkphone')
                    .set('Content-Type', 'text/plain')
                    .send('{"phone": "+380123456789"}')
                    .expect(415);
            });

            ['', '+70001234567', 380680000000, '+3809512345678', null, undefined].forEach((phone) => {
                it(`should fail bad phone numbers (${phone})`, () => {
                    return request(app)
                        .post('/checkphone')
                        .set('Content-Type', 'application/json')
                        .send({ phone })
                        .expect(400)
                        .expect(/"code":"BAD_REQUEST"/u);
                });
            });
        });

        describe('Normal operation', () => {
            it('should return 419 for users without credits', () => {
                return request(app)
                    .post('/checkphone')
                    .set('Content-Type', 'application/json')
                    .send({ phone: '+380000000004' })
                    .expect(419)
                    .expect(/"code":"OUT_OF_CREDITS"/u);
            });

            it('should return 200 for users with credits', () => {
                return request(app)
                    .post('/checkphone')
                    .set('Content-Type', 'application/json')
                    .send({ phone: '+380000000001' })
                    .expect(200)
                    .expect({
                        success: true,
                        user: {
                            phone: '+380000000001',
                            admin: 0,
                            whitelisted: 0,
                            credits: 4,
                        },
                    });
            });

            it('should set user to null for unknown users', () => {
                return request(app)
                    .post('/checkphone')
                    .set('Content-Type', 'application/json')
                    .send({ phone: '+380999999999' })
                    .expect(200)
                    .expect({ success: true, user: null });
            });
        });
    });

    describe('loginHandler', () => {
        describe('Error handling', () => {
            it('should fail the request without body', () => {
                return request(app)
                    .post('/session')
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });

            it('should fail if phone is missing', () => {
                return request(app)
                    .post('/session')
                    .set('Content-Type', 'application/json')
                    .send({ uid: 'xxx' })
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });

            it('should fail if uid is missing', () => {
                return request(app)
                    .post('/session')
                    .set('Content-Type', 'application/json')
                    .send({ phone: '+380991234567' })
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });

            it('should fail non-JSON requests', () => {
                return request(app)
                    .post('/session')
                    .set('Content-Type', 'text/plain')
                    .send('{"phone": "+380123456789", "uid": "xxx"}')
                    .expect(415);
            });

            [
                ['', 'uid'],
                ['+70001234567', 'uid'],
                [380680000000, 'uid'],
                ['+3809512345678', 'uid'],
                [null, 'uid'],
                ['+380680000000', ''],
                ['+380680000000', null],
                [
                    '+380680000000',
                    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
                ],
                ['+3809512345678', 'uid'],
            ].forEach(([phone, uid]) => {
                it(`should fail bad phone numbers / UIDs (${phone} / ${uid})`, () => {
                    return request(app)
                        .post('/session')
                        .set('Content-Type', 'application/json')
                        .send({ phone, uid })
                        .expect(400)
                        .expect(/"code":"BAD_REQUEST"/u);
                });
            });
        });

        describe('Normal operation', () => {
            it('should return 200 of everything is OK', () => {
                return request(app)
                    .post('/session')
                    .set('Content-Type', 'application/json')
                    .send({ phone: '+380000000001', uid: 'xxx' })
                    .expect(200)
                    .expect({
                        success: true,
                        user: {
                            phone: '+380000000001',
                            admin: 0,
                            whitelisted: 0,
                            credits: 4,
                        },
                    });
            });
        });
    });

    describe('getCreditsHandler', () => {
        describe('Error handling', () => {
            ['xxx', ' ', '+', '+380681234567', '+79991234567', '79991234567'].forEach((phone) => {
                it(`should fail if phone is invalid (${phone})`, () => {
                    return request(app)
                        .get(`/credits/${encodeURIComponent(phone)}`)
                        .expect(400)
                        .expect(/"code":"BAD_REQUEST"/u);
                });
            });
        });

        describe('Normal operation', () => {
            it('should return 200 if everything is OK', () => {
                return request(app)
                    .get(`/credits/${encodeURIComponent('380000000001')}`)
                    .expect(200)
                    .expect({ success: true, credits: 4 });
            });

            it('should return DEFAULT_CREDITS for new users', () => {
                const env = environment();
                return request(app)
                    .get(`/credits/${encodeURIComponent('380129999999')}`)
                    .expect(200)
                    .expect({ success: true, credits: env.DEFAULT_CREDITS });
            });
        });
    });
});
