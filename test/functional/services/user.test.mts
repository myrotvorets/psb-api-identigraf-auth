import { expect } from 'chai';
import { container } from '../../../src/lib/container.mjs';
import type { UserServiceInterface } from '../../../src/services/index.mjs';
import { setUp, setUpSuite, tearDownSuite } from './setup.mjs';

describe('AuthService', function () {
    let svc: UserServiceInterface;

    before(async function () {
        await setUpSuite();
        svc = container.resolve('userService');
    });

    after(tearDownSuite);
    beforeEach(setUp);

    describe('#getUserByLogin', function () {
        it('should return user by login', function () {
            return expect(svc.getUserByLogin('+380000000001')).to.eventually.include({
                id: 1,
                uid: 'uid1',
                login: '+380000000001',
                admin: 0,
                whitelisted: 0,
                credits: 4,
                comment: '',
            });
        });

        it('should return undefined for no results', function () {
            return expect(svc.getUserByLogin('not-exists')).to.eventually.be.undefined;
        });
    });

    describe('#getUserById', function () {
        it('should return user by login', function () {
            return expect(svc.getUserById(1)).to.eventually.include({
                id: 1,
                uid: 'uid1',
                login: '+380000000001',
                admin: 0,
                whitelisted: 0,
                credits: 4,
                comment: '',
            });
        });

        it('should return undefined for no results', function () {
            return expect(svc.getUserById(0)).to.eventually.be.undefined;
        });
    });

    describe('#search', function () {
        it('should return empty result for no users', function () {
            return expect(
                svc.search({ login: 'not-exists', comment: 'comment', order: 'id', dir: 'asc', offset: 0, count: 10 }),
            ).to.eventually.deep.equal([[], 0]);
        });

        it('should return empty result for big offsets', function () {
            return expect(
                svc.search({ login: '', comment: '', order: 'id', dir: 'asc', offset: 10000, count: 10 }),
            ).to.eventually.deep.equal([[], 6]);
        });

        it('should properly order results', async function () {
            const result = await svc.search({ login: '', comment: '', order: 'id', dir: 'desc', offset: 0, count: 10 });
            const ids = result[0].map((user) => user.id);
            expect(ids).to.deep.equal([6, 5, 4, 3, 2, 1]);
        });

        it('should work without order', async function () {
            const result = await svc.search({ login: '', comment: '', order: '', dir: '', offset: 0, count: 10 });
            const ids = result[0].map((user) => user.id);
            expect(ids).to.have.members([1, 2, 3, 4, 5, 6]);
        });
    });
});
