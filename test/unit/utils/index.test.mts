import { after, before, describe, it } from 'mocha';
import { equal } from 'node:assert/strict';
import { today, tomorrow } from '../../../src/utils/index.mjs';
import { mockDate, unmockDate } from '../../helpers/dateproxy.mjs';

describe('Utils', () => {
    before(mockDate);
    after(unmockDate);

    describe('today', () => {
        it("should return todays's date as YYYYMMDD", () => {
            equal(today(), 20201230);
        });
    });

    describe('tomorrow', () => {
        it("should return tomorrow's date as UTC timestamp", () => {
            const expected = 1609372800;
            equal(tomorrow(), expected);
            equal(new Date(expected * 1000).toISOString(), '2020-12-31T00:00:00.000Z');
        });
    });
});
