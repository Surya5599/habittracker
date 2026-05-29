import { describe, it, expect } from 'vitest';
import {
    toDateKey,
    isHabitActiveOnDate,
    getInactiveHabitsForDate,
    isHabitManuallyInactive,
} from '../utils/habitActivity';
import type { DailyNote, Habit } from '../types';

// Minimal habit factory
const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
    id: 'h1',
    name: 'Test',
    type: 'daily',
    color: '#000',
    goal: 80,
    ...overrides,
});

describe('toDateKey', () => {
    it('pads month and day with leading zeros', () => {
        expect(toDateKey(new Date(2024, 0, 5))).toBe('2024-01-05');
    });

    it('handles December (month 11)', () => {
        expect(toDateKey(new Date(2024, 11, 31))).toBe('2024-12-31');
    });

    it('formats a mid-year date correctly', () => {
        expect(toDateKey(new Date(2025, 5, 28))).toBe('2025-06-28');
    });
});

describe('isHabitActiveOnDate', () => {
    it('returns true when no createdAt or archivedAt', () => {
        const habit = makeHabit();
        expect(isHabitActiveOnDate(habit, new Date(2024, 5, 15))).toBe(true);
    });

    it('returns false before createdAt date', () => {
        const habit = makeHabit({ createdAt: '2024-06-10' });
        expect(isHabitActiveOnDate(habit, new Date(2024, 5, 9))).toBe(false);
    });

    it('returns true on createdAt date itself', () => {
        const habit = makeHabit({ createdAt: '2024-06-10' });
        expect(isHabitActiveOnDate(habit, new Date(2024, 5, 10))).toBe(true);
    });

    it('returns true after createdAt date', () => {
        const habit = makeHabit({ createdAt: '2024-06-10' });
        expect(isHabitActiveOnDate(habit, new Date(2024, 5, 20))).toBe(true);
    });

    it('returns false after archivedAt date', () => {
        const habit = makeHabit({ archivedAt: '2024-06-15' });
        expect(isHabitActiveOnDate(habit, new Date(2024, 5, 16))).toBe(false);
    });

    it('returns true on archivedAt date (archive day is still active)', () => {
        const habit = makeHabit({ archivedAt: '2024-06-15' });
        expect(isHabitActiveOnDate(habit, new Date(2024, 5, 15))).toBe(true);
    });

    it('returns false before createdAt even with no archivedAt', () => {
        const habit = makeHabit({ createdAt: '2024-12-01' });
        expect(isHabitActiveOnDate(habit, new Date(2024, 5, 1))).toBe(false);
    });

    it('returns false when date is outside both bounds', () => {
        const habit = makeHabit({ createdAt: '2024-06-01', archivedAt: '2024-06-30' });
        expect(isHabitActiveOnDate(habit, new Date(2024, 6, 1))).toBe(false);
        expect(isHabitActiveOnDate(habit, new Date(2024, 4, 31))).toBe(false);
    });
});

describe('getInactiveHabitsForDate', () => {
    it('returns empty array when no notes for date', () => {
        const notes: DailyNote = {};
        expect(getInactiveHabitsForDate(notes, '2024-06-15')).toEqual([]);
    });

    it('returns empty array when dayData has no inactiveHabits', () => {
        const notes: DailyNote = { '2024-06-15': { tasks: [] } };
        expect(getInactiveHabitsForDate(notes, '2024-06-15')).toEqual([]);
    });

    it('returns the inactiveHabits array when present', () => {
        const notes: DailyNote = {
            '2024-06-15': { tasks: [], inactiveHabits: ['h1', 'h2'] },
        };
        expect(getInactiveHabitsForDate(notes, '2024-06-15')).toEqual(['h1', 'h2']);
    });

    it('returns empty array when dayData is an array (legacy format guard)', () => {
        // The function guards against Array.isArray(dayData)
        const notes = { '2024-06-15': [] as unknown as DailyNote['string'] };
        expect(getInactiveHabitsForDate(notes as DailyNote, '2024-06-15')).toEqual([]);
    });
});

describe('isHabitManuallyInactive', () => {
    const notes: DailyNote = {
        '2024-06-15': { tasks: [], inactiveHabits: ['h1', 'h3'] },
    };

    it('returns true when habit is in the inactiveHabits list', () => {
        expect(isHabitManuallyInactive(notes, '2024-06-15', 'h1')).toBe(true);
    });

    it('returns false when habit is not in the list', () => {
        expect(isHabitManuallyInactive(notes, '2024-06-15', 'h2')).toBe(false);
    });

    it('returns false when no notes for date', () => {
        expect(isHabitManuallyInactive(notes, '2024-06-16', 'h1')).toBe(false);
    });
});
