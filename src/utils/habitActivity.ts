import { DailyNote, Habit } from '../types';

export const toDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Parse a date string (YYYY-MM-DD or ISO timestamp) as a local-timezone midnight
// so that '2024-06-10' becomes June 10 in the user's timezone, not June 9.
const parseDateStringLocal = (dateStr: string): Date => {
    const ymd = dateStr.split('T')[0].split('-').map(Number);
    return new Date(ymd[0], ymd[1] - 1, ymd[2]);
};

export const isHabitActiveOnDate = (habit: Habit, date: Date) => {
    const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let activeFrom: Date | null = null;
    if (habit.createdAt) {
        const started = parseDateStringLocal(habit.createdAt);
        if (!Number.isNaN(started.getTime())) {
            activeFrom = started;
        }
    }

    let activeUntil: Date | null = null;
    if (habit.archivedAt) {
        const archived = parseDateStringLocal(habit.archivedAt);
        if (!Number.isNaN(archived.getTime())) {
            // Archive day is still active; days after are not.
            activeUntil = archived;
        }
    }

    if (activeFrom && targetDay < activeFrom) return false;
    if (activeUntil && targetDay > activeUntil) return false;
    return true;
};

export const getInactiveHabitsForDate = (notes: DailyNote, dateKey: string) => {
    const dayData = notes[dateKey];
    if (!dayData || Array.isArray(dayData)) return [];
    return Array.isArray(dayData.inactiveHabits) ? dayData.inactiveHabits : [];
};

export const isHabitManuallyInactive = (notes: DailyNote, dateKey: string, habitId: string) => {
    return getInactiveHabitsForDate(notes, dateKey).includes(habitId);
};
