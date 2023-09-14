import { after, before, beforeEach, describe, it } from 'mocha';
import { expect } from 'chai';
import { AuthService } from '../../../src/services/auth.mjs';
import { setUp, setUpSuite, tearDownSuite } from './setup.mjs';

describe('AuthService', () => {
    const credits = 5;
    const svc = new AuthService(credits);

    before(setUpSuite);
    after(tearDownSuite);
    beforeEach(setUp);

    describe('login', () => {
        it('should create a new user automatically if the phone does not exist', async () => {
            const uid = 'new';
            const phone = '+38007654321';
            const result = await svc.login(uid, phone);
            expect(result).to.be.an('object').that.includes({
                uid,
                phone,
                credits,
                admin: 0,
                whitelisted: 0,
                lastseen: 20201230,
            });
        });

        it('should update the existing user', async () => {
            const uid = 'new3';
            const phone = '+380000000003';
            const result = await svc.login(uid, phone);
            expect(result).to.be.an('object').that.includes({
                uid,
                phone,
                credits,
                admin: 0,
                whitelisted: 0,
                lastseen: 20201230,
            });
        });

        describe('when the user has no credits', () => {
            it('should renew credits for whitelisted users', async () => {
                const uid = 'new5';
                const phone = '+380000000005';
                const result = await svc.login(uid, phone);
                expect(result).to.be.an('object').that.includes({
                    uid,
                    phone,
                    credits: 20,
                    admin: 0,
                    whitelisted: 20,
                    lastseen: 20201230,
                });
            });

            it('should not renew credits if a normal user without credits has already been seen today', async () => {
                const uid = 'new4';
                const phone = '+380000000004';
                const result = await svc.login(uid, phone);
                expect(result).to.be.an('object').that.includes({
                    uid,
                    phone,
                    credits: 0,
                    admin: 0,
                    whitelisted: 0,
                    lastseen: 20201230,
                });
            });
        });
    });

    describe('getRemainingCredits', () => {
        it('should return the default value if the phone does not exist', async () => {
            const phone = '+38007654321';
            const result = await svc.getRemainingCredits(phone);
            expect(result).to.equal(credits);
        });

        it('should return the number of remaining credits if the user has been seen today', async () => {
            const phone = '+380000000001';
            const result = await svc.getRemainingCredits(phone);
            expect(result).to.equal(4);
        });

        it('should return the number of whitelisted credits for whitelisted users not seen today', async () => {
            const phone = '+380000000006';
            const result = await svc.getRemainingCredits(phone);
            expect(result).to.equal(20);
        });

        it('should return the default number of credits for normal users not seen today', async () => {
            const phone = '+380000000003';
            const result = await svc.getRemainingCredits(phone);
            expect(result).to.equal(credits);
        });
    });
});
