import { today, tomorrow } from '../../../src/utils/index';
const fakeTime = new Date(Date.UTC(2020, 11, 30, 0, 0, 0, 0));

beforeAll(() => jest.useFakeTimers().setSystemTime(fakeTime));
afterAll(() => jest.useRealTimers());

describe('today', () => {
    it("should return todays's date as YYYYMMDD", () => {
        expect(today()).toEqual(20201230);
    });
});

describe('tomorrow', () => {
    it("should return tomorrow's date as UTC timestamp", () => {
        const expected = 1609372800;
        expect(tomorrow()).toEqual(expected);
        expect(new Date(expected * 1000).toISOString()).toBe('2020-12-31T00:00:00.000Z');
    });
});
