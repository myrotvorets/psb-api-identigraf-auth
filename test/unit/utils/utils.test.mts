import { expect } from 'chai';
import { today, tomorrow } from '../../../src/utils/index.mjs';
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
});
