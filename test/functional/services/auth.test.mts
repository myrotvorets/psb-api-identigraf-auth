import { expect } from 'chai';
import { container } from '../../../src/lib/container.mjs';
import type { AuthServiceInterface } from '../../../src/services/index.mjs';
import { setUp, setUpSuite, tearDownSuite } from './setup.mjs';

describe('AuthService', function () {
    const credits = 5;
    let svc: AuthServiceInterface;

    before(async function () {
        await setUpSuite();
        svc = container.resolve('authService');
    });

    after(tearDownSuite);
    beforeEach(setUp);

    describe('login', function () {
        it('should create a new user automatically if the phone does not exist', async function () {
            const uid = 'new';
            const phone = '+38007654321';
            const result = await svc.login(uid, phone);
            expect(result).to.be.an('object').that.includes({
                uid,
                login: phone,
                credits,
                admin: 0,
                whitelisted: 0,
                lastseen: 20201230,
            });
        });

        it('should update the existing user', async function () {
            const uid = 'new3';
            const phone = '+380000000003';
            const result = await svc.login(uid, phone);
            expect(result).to.be.an('object').that.includes({
                uid,
                login: phone,
                credits,
                admin: 0,
                whitelisted: 0,
                lastseen: 20201230,
            });
        });

        describe('when the user has no credits', function () {
            it('should renew credits for whitelisted users', async function () {
                const uid = 'new5';
                const phone = '+380000000005';
                const result = await svc.login(uid, phone);
                expect(result).to.be.an('object').that.includes({
                    uid,
                    login: phone,
                    credits: 20,
                    admin: 0,
                    whitelisted: 20,
                    lastseen: 20201230,
                });
            });

            it('should not renew credits if a normal user without credits has already been seen today', async function () {
                const uid = 'new4';
                const phone = '+380000000004';
                const result = await svc.login(uid, phone);
                expect(result).to.be.an('object').that.includes({
                    uid,
                    login: phone,
                    credits: 0,
                    admin: 0,
                    whitelisted: 0,
                    lastseen: 20201230,
                });
            });
        });
    });

    describe('getRemainingCredits', function () {
        it('should return the default value if the phone does not exist', async function () {
            const phone = '+38007654321';
            const result = await svc.getRemainingCredits(phone);
            expect(result).to.equal(credits);
        });

        it('should return the number of remaining credits if the user has been seen today', async function () {
            const phone = '+380000000001';
            const result = await svc.getRemainingCredits(phone);
            expect(result).to.equal(4);
        });

        it('should return the number of whitelisted credits for whitelisted users not seen today', async function () {
            const phone = '+380000000006';
            const result = await svc.getRemainingCredits(phone);
            expect(result).to.equal(20);
        });

        it('should return the default number of credits for normal users not seen today', async function () {
            const phone = '+380000000003';
            const result = await svc.getRemainingCredits(phone);
            expect(result).to.equal(credits);
        });
    });
});
