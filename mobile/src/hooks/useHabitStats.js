import { useMemo } from 'react';
import { MONTHS } from '../constants';
import { isCompleted, getHabitMonthStats } from '../utils/stats';

export const useHabitStats = (
    habits,
    completions,
    currentMonthIndex,
    currentYear,
    daysInMonth,
    monthDates,
    weekOffset = 0,
    weekStart = 'MON'
) => {
    const weeklyStats = useMemo(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = weekStart === 'SUN'
            ? today.getDate() - day + (weekOffset * 7)
            : today.getDate() - (day === 0 ? 6 : day - 1) + (weekOffset * 7);

        const weekStartDate = new Date(today.getFullYear(), today.getMonth(), diff);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStartDate);
            date.setDate(weekStartDate.getDate() + i);
            const d = date.getDate();
            const m = date.getMonth();
            const y = date.getFullYear();

            let count = 0;
            habits.forEach(habit => {
                if (isCompleted(habit.id, d, completions, m, y)) count++;
            });

            return {
                day: d,
                displayDay: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count
            };
        });
    }, [habits, completions, weekOffset]);

    const weekProgress = useMemo(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = weekStart === 'SUN'
            ? today.getDate() - day + (weekOffset * 7)
            : today.getDate() - (day === 0 ? 6 : day - 1) + (weekOffset * 7);
        const weekStartDate = new Date(today.getFullYear(), today.getMonth(), diff);

        let totalPossible = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStartDate);
            d.setDate(weekStartDate.getDate() + i);
            const dayIdx = d.getDay();
            totalPossible += habits.filter(h => !h.frequency || h.frequency.includes(dayIdx)).length;
        }

        const completed = weeklyStats.reduce((acc, curr) => acc + curr.count, 0);

        const habitPerformance = habits.map(h => {
            let hCompleted = 0;
            const today = new Date();
            const day = today.getDay();
            const diff = weekStart === 'SUN'
                ? today.getDate() - day + (weekOffset * 7)
                : today.getDate() - (day === 0 ? 6 : day - 1) + (weekOffset * 7);
            const weekStartDate = new Date(today.getFullYear(), today.getMonth(), diff);

            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStartDate);
                date.setDate(weekStartDate.getDate() + i);
                if (isCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear())) {
                    hCompleted++;
                }
            }
            return { name: h.name, completed: hCompleted };
        }).sort((a, b) => b.completed - a.completed);

        return {
            total: totalPossible,
            completed,
            remaining: Math.max(0, totalPossible - completed),
            percentage: totalPossible > 0 ? (completed / totalPossible) * 100 : 0,
            habitPerformance
        };
    }, [habits, completions, weeklyStats, weekOffset]);

    const monthProgress = useMemo(() => {
        let totalPossible = 0;
        habits.forEach(habit => {
            monthDates.forEach(day => {
                const date = new Date(currentYear, currentMonthIndex, day);
                if (!habit.frequency || habit.frequency.includes(date.getDay())) {
                    totalPossible++;
                }
            });
        });
        let completed = 0;
        habits.forEach(habit => {
            monthDates.forEach(day => {
                if (isCompleted(habit.id, day, completions, currentMonthIndex, currentYear)) completed++;
            });
        });
        return {
            total: totalPossible,
            completed,
            remaining: Math.max(0, totalPossible - completed),
            percentage: totalPossible > 0 ? (completed / totalPossible) * 100 : 0
        };
    }, [completions, currentMonthIndex, currentYear, habits, daysInMonth, monthDates]);

    return {
        weeklyStats,
        weekProgress,
        monthProgress
    };
};
