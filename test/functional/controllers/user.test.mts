import request from 'supertest';
import { expect } from 'chai';
import { app, setUp, setUpSuite, tearDownSuite } from './setup.mjs';

describe('UserController', function () {
    before(setUpSuite);

    after(tearDownSuite);

    beforeEach(setUp);

    describe('getUserById', function () {
        describe('Error handling', function () {
            it('should fail the request with invalid ID', function () {
                return request(app)
                    .get('/users/0')
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });

            it('should return 404 for non-existing users', function () {
                return request(app).get('/users/1000').expect(404).expect({
                    success: false,
                    status: 404,
                    code: 'USER_NOT_FOUND',
                    message: 'User 1000 not found',
                });
            });
        });

        describe('Normal operation', function () {
            it('should return the requested user', function () {
                return request(app)
                    .get('/users/3')
                    .expect(200)
                    .expect({
                        success: true,
                        user: {
                            id: 3,
                            uid: 'uid3',
                            login: '+380000000003',
                            admin: 0,
                            whitelisted: 0,
                            credits: 1,
                            lastseen: 20000101,
                            comment: '',
                        },
                    });
            });
        });
    });

    describe('saveUser', function () {
        describe('Error handling', function () {
            it('should fail the request without body', function () {
                return request(app)
                    .put('/users/1')
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });

            it('should fail non-JSON requests', function () {
                return request(app)
                    .put('/users/1')
                    .set('Content-Type', 'text/plain')
                    .send('{ "login": "+380000000000", "admin": false, "whitelisted": 0, "credits": 0, comment: "" }')
                    .expect(415);
            });

            it('should fail the request with invalid ID', function () {
                return request(app)
                    .put('/users/0')
                    .set('Content-Type', 'application/json')
                    .send({ login: '+380000000000', admin: false, whitelisted: 0, credits: 0, comment: '' })
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });

            it('should return 404 for non-existing users', function () {
                return request(app)
                    .put('/users/1000')
                    .set('Content-Type', 'application/json')
                    .send({ login: '+380000000000', admin: false, whitelisted: 0, credits: 0, comment: '' })
                    .expect(404)
                    .expect({
                        success: false,
                        status: 404,
                        code: 'USER_NOT_FOUND',
                        message: 'User 1000 not found',
                    });
            });
        });

        describe('Normal operation', function () {
            it('should update the user', function () {
                return request(app)
                    .put('/users/3')
                    .set('Content-Type', 'application/json')
                    .send({ login: '+380000000003', admin: false, whitelisted: 0, credits: 10, comment: '' })
                    .expect(200)
                    .expect({
                        success: true,
                        user: {
                            id: 3,
                            uid: 'uid3',
                            login: '+380000000003',
                            admin: 0,
                            whitelisted: 0,
                            credits: 10,
                            lastseen: 20000101,
                            comment: '',
                        },
                    });
            });
        });
    });

    describe('patchUser', function () {
        describe('Error handling', function () {
            it('should fail the request without body', function () {
                return request(app)
                    .patch('/users/1')
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .expect(/"code":"BAD_PATCH"/u); // Empty body will be converted into {} and pass the validaiton
            });

            it('should fail non-JSON requests', function () {
                return request(app)
                    .patch('/users/1')
                    .set('Content-Type', 'text/plain')
                    .send('{ "credits": 0 }')
                    .expect(415);
            });

            it('should fail the request with invalid ID', function () {
                return request(app)
                    .patch('/users/0')
                    .set('Content-Type', 'application/json')
                    .send({ comment: '' })
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });

            it('should return 404 for non-existing users', function () {
                return request(app)
                    .patch('/users/1000')
                    .set('Content-Type', 'application/json')
                    .send({ comment: '' })
                    .expect(404)
                    .expect({
                        success: false,
                        status: 404,
                        code: 'USER_NOT_FOUND',
                        message: 'User 1000 not found',
                    });
            });
        });

        describe('Normal operation', function () {
            it('should update the user', function () {
                return request(app)
                    .patch('/users/3')
                    .set('Content-Type', 'application/json')
                    .send({ credits: 10, admin: true })
                    .expect(200)
                    .expect({
                        success: true,
                        user: {
                            id: 3,
                            uid: 'uid3',
                            login: '+380000000003',
                            admin: 1,
                            whitelisted: 0,
                            credits: 10,
                            lastseen: 20000101,
                            comment: '',
                        },
                    });
            });
        });
    });

    describe('search', function () {
        describe('Normal operation', function () {
            it('should work', function () {
                return request(app)
                    .get('/users')
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.have.property('success', true);
                        expect(res.body).to.have.property('total', 6);
                        expect(res.body).to.have.property('users').with.lengthOf(6);
                        const users = (res.body as { users: { id: number }[] }).users.map((user) => user.id);
                        expect(users).to.deep.equal([1, 2, 3, 4, 5, 6]);
                    });
            });
        });
    });
});
