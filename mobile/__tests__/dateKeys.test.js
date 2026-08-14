import {
    toDateKey,
    isDateKey,
    parseDateKey,
    shiftDateKey,
    dateKeyDaysAgo,
    windowStartKey,
    earliestDateKey,
    escapeLikeQuery,
    BACKLOG_KEY,
} from '../src/utils/dateKeys';

describe('dateKeys', () => {
    it('formats and parses keys symmetrically', () => {
        const date = new Date(2026, 0, 5); // Jan 5 2026
        expect(toDateKey(date)).toBe('2026-01-05');
        expect(toDateKey(parseDateKey('2026-01-05'))).toBe('2026-01-05');
    });

    it('recognises only real date keys', () => {
        expect(isDateKey('2026-08-12')).toBe(true);
        expect(isDateKey(BACKLOG_KEY)).toBe(false);
        expect(isDateKey('2026-8-12')).toBe(false);
        expect(isDateKey(undefined)).toBe(false);
    });

    it('shifts across month and year boundaries', () => {
        expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
        expect(shiftDateKey('2025-12-31', 1)).toBe('2026-01-01');
    });

    it('walks back the requested number of days', () => {
        const from = new Date(2026, 7, 12); // Aug 12 2026
        expect(dateKeyDaysAgo(0, from)).toBe('2026-08-12');
        expect(dateKeyDaysAgo(1, from)).toBe('2026-08-11');
        expect(dateKeyDaysAgo(30, from)).toBe('2026-07-13');
    });

    it('expands the window by one page span at a time', () => {
        const from = new Date(2026, 7, 12);
        // Page 1 includes today, so it spans 60 days ending today.
        expect(windowStartKey(1, 60, from)).toBe('2026-06-14');
        expect(windowStartKey(2, 60, from)).toBe('2026-04-15');
        // Successive windows must not overlap or leave a gap.
        expect(shiftDateKey(windowStartKey(1, 60, from), -1))
            .toBe(dateKeyDaysAgo(60, from));
    });

    it('finds the earliest date key and ignores the backlog key', () => {
        const notes = {
            '2026-08-01': {},
            '2025-11-30': {},
            '2026-03-15': {},
            [BACKLOG_KEY]: {},
        };
        expect(earliestDateKey(notes)).toBe('2025-11-30');
        expect(earliestDateKey({ [BACKLOG_KEY]: {} })).toBeNull();
        expect(earliestDateKey({})).toBeNull();
    });

    it('escapes SQL LIKE wildcards so a literal search stays literal', () => {
        expect(escapeLikeQuery('100% week')).toBe('100\\% week');
        expect(escapeLikeQuery('a_b')).toBe('a\\_b');
        expect(escapeLikeQuery('plain')).toBe('plain');
    });
});
