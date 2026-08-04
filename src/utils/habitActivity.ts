import { DailyNote, Habit } from '../types';

export const toDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Parse a date string as a local-timezone midnight.
// Plain 'YYYY-MM-DD' strings are already an intentional local calendar day
// (e.g. a user-picked start date) and are parsed as-is. Full ISO timestamps
// carry a UTC instant, so they're parsed as a real Date first and then
// reduced to the local calendar day that instant falls on - grabbing the
// UTC date substring directly would shift the day for users east/west of UTC.
const parseDateStringLocal = (dateStr: string): Date => {
    if (dateStr.includes('T')) {
        const instant = new Date(dateStr);
        return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
    }
    const ymd = dateStr.split('-').map(Number);
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
