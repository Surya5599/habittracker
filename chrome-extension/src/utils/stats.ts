import { Habit, HabitCompletion } from '../types';

export const getHabitMonthStats = (
    habitId: string,
    completions: HabitCompletion,
    monthIdx: number,
    year: number
) => {
    const today = new Date();
    const dInM = new Date(year, monthIdx + 1, 0).getDate();
    const isPastDate = (y: number, m: number, d: number) => {
        const target = new Date(y, m, d);
        return target < today;
    };

    let completed = 0;
    let missed = 0;

    for (let day = 1; day <= dInM; day++) {
        const dateKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isDone = completions[habitId]?.[dateKey] || false;

        if (isDone) {
            completed++;
        } else if (isPastDate(year, monthIdx, day)) {
            missed++;
        }
    }

    return { completed, missed, totalDays: dInM };
};

export const isCompleted = (
    habitId: string,
    day: number,
    completions: HabitCompletion,
    monthIdx: number,
    year: number
) => {
    const dateKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return completions[habitId]?.[dateKey] || false;
};
