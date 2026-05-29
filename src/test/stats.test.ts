import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getHabitMonthStats, isCompleted } from '../utils/stats';
import type { HabitCompletion } from '../types';

// We freeze time to January 2024, day 15, so "past" means days 1-14 of Jan 2024
// and "future" means days 16-31.
const FIXED_TODAY = new Date(2024, 0, 15); // 2024-01-15

beforeEach(() => {
    vi.setSystemTime(FIXED_TODAY);
});

afterEach(() => {
    vi.useRealTimers();
});

// Jan 2024: all 31 days, Mon 1 .. Wed 31
// Day-of-week layout: Mon=1,Tue=2,Wed=3,Thu=4,Fri=5,Sat=6,Sun=0
// Jan 1 = Monday (day 1)

describe('isCompleted', () => {
    const completions: HabitCompletion = {
        h1: {
            '2024-01-15': true,
            '2024-01-10': true,
        },
    };

    it('returns true for a completed date', () => {
        expect(isCompleted('h1', 15, completions, 0, 2024)).toBe(true);
    });

    it('returns false for an incomplete date', () => {
        expect(isCompleted('h1', 5, completions, 0, 2024)).toBe(false);
    });

    it('returns false for unknown habit', () => {
        expect(isCompleted('unknown', 15, completions, 0, 2024)).toBe(false);
    });

    it('pads single-digit month and day', () => {
        // February 5 → 2024-02-05
        const c: HabitCompletion = { h1: { '2024-02-05': true } };
        expect(isCompleted('h1', 5, c, 1, 2024)).toBe(true);
    });
});

describe('getHabitMonthStats — no frequency filter', () => {
    it('counts completed days correctly', () => {
        // Days 1-14 are past, day 15 is today; mark 3 of those as done
        const completions: HabitCompletion = {
            h1: { '2024-01-05': true, '2024-01-10': true, '2024-01-15': true },
        };
        const { completed } = getHabitMonthStats('h1', completions, 0, 2024);
        expect(completed).toBe(3);
    });

    it('counts missed past days (not completed, strictly before today)', () => {
        const completions: HabitCompletion = { h1: {} };
        const { missed } = getHabitMonthStats('h1', completions, 0, 2024);
        // Days 1-14 are strictly past → 14 missed
        expect(missed).toBe(14);
    });

    it('does not count today or future days as missed', () => {
        const completions: HabitCompletion = { h1: {} };
        const { missed } = getHabitMonthStats('h1', completions, 0, 2024);
        expect(missed).toBe(14); // only days 1-14
    });

    it('counts all 31 Jan days as totalDays when no frequency filter', () => {
        const completions: HabitCompletion = { h1: {} };
        const { totalDays } = getHabitMonthStats('h1', completions, 0, 2024);
        expect(totalDays).toBe(31);
    });

    it('returns zero missed when all past days are completed', () => {
        const completions: HabitCompletion = {
            h1: Object.fromEntries(
                Array.from({ length: 14 }, (_, i) => [`2024-01-${String(i + 1).padStart(2, '0')}`, true])
            ),
        };
        const { missed } = getHabitMonthStats('h1', completions, 0, 2024);
        expect(missed).toBe(0);
    });
});

describe('getHabitMonthStats — with frequency filter', () => {
    // Weekdays only: Mon(1) Tue(2) Wed(3) Thu(4) Fri(5)
    const weekdays = [1, 2, 3, 4, 5];

    it('totalDays only counts due weekdays in January', () => {
        const completions: HabitCompletion = { h1: {} };
        // Jan 2024: 23 weekdays (verified externally)
        const { totalDays } = getHabitMonthStats('h1', completions, 0, 2024, weekdays);
        expect(totalDays).toBe(23);
    });

    it('skips weekends when computing missed', () => {
        const completions: HabitCompletion = { h1: {} };
        // Past weekdays before Jan 15 (Mon): Jan 1-14 → Mon-Sun × 2 weeks = 10 weekdays
        const { missed } = getHabitMonthStats('h1', completions, 0, 2024, weekdays);
        expect(missed).toBe(10);
    });
});

describe('getHabitMonthStats — isInactive callback', () => {
    it('skips inactive days from completed and missed counts', () => {
        const completions: HabitCompletion = { h1: { '2024-01-05': true } };
        // Mark Jan 5 and Jan 3 as inactive
        const isInactive = (key: string) => key === '2024-01-05' || key === '2024-01-03';
        const { completed, missed } = getHabitMonthStats('h1', completions, 0, 2024, undefined, isInactive);
        // Jan 5 completed but inactive → not counted; Jan 3 past+inactive → not missed
        expect(completed).toBe(0);
        // 14 past days - 2 inactive = 12 missed
        expect(missed).toBe(12);
    });
});

describe('getHabitMonthStats — a past month (all days are past)', () => {
    it('correctly counts all days as missed when nothing completed', () => {
        // December 2023 — all days are before our frozen today (2024-01-15)
        const completions: HabitCompletion = { h1: {} };
        const { missed, totalDays } = getHabitMonthStats('h1', completions, 11, 2023);
        expect(totalDays).toBe(31);
        expect(missed).toBe(31);
    });

    it('subtracts completed days from missed', () => {
        const completions: HabitCompletion = {
            h1: { '2023-12-01': true, '2023-12-15': true, '2023-12-31': true },
        };
        const { completed, missed } = getHabitMonthStats('h1', completions, 11, 2023);
        expect(completed).toBe(3);
        expect(missed).toBe(28);
    });
});
