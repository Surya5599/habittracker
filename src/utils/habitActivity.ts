import { DailyNote, Habit } from '../types';

export const toDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const isHabitActiveOnDate = (habit: Habit, date: Date) => {
    const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let activeFrom: Date | null = null;
    if (habit.createdAt) {
        const started = new Date(habit.createdAt);
        if (!Number.isNaN(started.getTime())) {
            activeFrom = new Date(started.getFullYear(), started.getMonth(), started.getDate());
        }
    }

    let activeUntil: Date | null = null;
    if (habit.archivedAt) {
        const archived = new Date(habit.archivedAt);
        if (!Number.isNaN(archived.getTime())) {
            // Archive day is still active; days after are not.
            activeUntil = new Date(archived.getFullYear(), archived.getMonth(), archived.getDate());
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
