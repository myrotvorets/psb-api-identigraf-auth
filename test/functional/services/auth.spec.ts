import AuthService from '../../../src/services/auth';
import './setup';

describe('AuthService', () => {
    const credits = 5;
    const svc = new AuthService(credits);

    describe('login', () => {
        it('should create a new user automatically if the phone does not exist', () => {
            const uid = 'new';
            const phone = '+38007654321';
            return expect(svc.login(uid, phone)).resolves.toEqual(
                expect.objectContaining({
                    uid,
                    phone,
                    credits,
                    admin: 0,
                    whitelisted: 0,
                    lastseen: 20201230,
                }),
            );
        });

        it('should update the existing user', () => {
            const uid = 'new3';
            const phone = '+380000000003';
            return expect(svc.login(uid, phone)).resolves.toEqual(
                expect.objectContaining({
                    uid,
                    phone,
                    credits,
                    admin: 0,
                    whitelisted: 0,
                    lastseen: 20201230,
                }),
            );
        });

        describe('when the user has no credits', () => {
            it('should renew credits for whitelisted users', () => {
                const uid = 'new5';
                const phone = '+380000000005';
                return expect(svc.login(uid, phone)).resolves.toEqual(
                    expect.objectContaining({
                        uid,
                        phone,
                        credits: 20,
                        admin: 0,
                        whitelisted: 20,
                        lastseen: 20201230,
                    }),
                );
            });

            it('should not renew credits if a normal user without credits has already been seen today', () => {
                const uid = 'new4';
                const phone = '+380000000004';
                return expect(svc.login(uid, phone)).resolves.toEqual(
                    expect.objectContaining({
                        uid,
                        phone,
                        credits: 0,
                        admin: 0,
                        whitelisted: 0,
                        lastseen: 20201230,
                    }),
                );
            });
        });
    });

    describe('getRemainingCredits', () => {
        it('should return the default value if the phone does not exist', () => {
            const phone = '+38007654321';
            return expect(svc.getRemainingCredits(phone)).resolves.toEqual(credits);
        });

        it('should return the number of remaining credits if the user has been seen today', () => {
            const phone = '+380000000001';
            return expect(svc.getRemainingCredits(phone)).resolves.toEqual(4);
        });

        it('should return the number of whitelisted credits for whitelisted users not seen today', () => {
            const phone = '+380000000006';
            return expect(svc.getRemainingCredits(phone)).resolves.toEqual(20);
        });

        it('should return the default number of credits for normal users not seen today', () => {
            const phone = '+380000000003';
            return expect(svc.getRemainingCredits(phone)).resolves.toEqual(credits);
        });
    });
});
