import { expect } from 'chai';
import { escapeLike, today, tomorrow } from '../../../src/utils/index.mjs';
import { mockDate, unmockDate } from '../../helpers/dateproxy.mjs';

describe('Utils', function () {
    before(mockDate);
    after(unmockDate);

    describe('today', function () {
        it("should return todays's date as YYYYMMDD", function () {
            expect(today()).to.equal(20201230);
        });
    });

    describe('tomorrow', function () {
        it("should return tomorrow's date as UTC timestamp", function () {
            const expected = 1609372800;
            expect(tomorrow()).to.equal(expected);
            expect(new Date(expected * 1000).toISOString()).to.equal('2020-12-31T00:00:00.000Z');
        });
    });

    describe('escapeLike', function () {
        it('should escape strings for LIKE condition', function () {
            const input = '10_000%';
            const expected = '10\\_000\\%';
            expect(escapeLike(input)).to.equal(expected);
        });
    });
});
