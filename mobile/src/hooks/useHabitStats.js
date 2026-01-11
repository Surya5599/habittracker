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
                if (habit.weeklyTarget) return; // SKIP flexible habits for daily counts
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

            habits.forEach(h => {
                const createdDate = h.createdAt ? new Date(h.createdAt) : null;
                if (createdDate) createdDate.setHours(0, 0, 0, 0);

                if (!h.weeklyTarget) {
                    if (createdDate && d < createdDate) return;
                    if (!h.frequency || h.frequency.includes(dayIdx)) {
                        totalPossible++;
                    }
                }
            });
        }

        // Add flexible targets to totalPossible
        habits.filter(h => h.weeklyTarget).forEach(h => {
            totalPossible += h.weeklyTarget;
        });

        // Calculate completed: Daily stats (capped by frequency) + Flexible stats (capped by target)
        const completed = habits.reduce((acc, h) => {
            let hCompletedInWeek = 0;
            for (let i = 0; i < 7; i++) {
                const d = new Date(weekStartDate);
                d.setDate(weekStartDate.getDate() + i);
                if (isCompleted(h.id, d.getDate(), completions, d.getMonth(), d.getFullYear())) {
                    hCompletedInWeek++;
                }
            }
            if (h.weeklyTarget) return acc + Math.min(hCompletedInWeek, h.weeklyTarget);
            return acc + hCompletedInWeek;
        }, 0);

        const habitPerformance = habits.map(h => {
            let hCompleted = 0;
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
        let completed = 0;
        habits.forEach(habit => {
            let hTotalDone = 0;
            const createdDate = habit.createdAt ? new Date(habit.createdAt) : null;
            if (createdDate) createdDate.setHours(0, 0, 0, 0);

            monthDates.forEach(day => {
                const date = new Date(currentYear, currentMonthIndex, day);

                // Track actual possible days in this month after creation
                if (createdDate && date < createdDate) return;

                if (!habit.weeklyTarget) {
                    if (!habit.frequency || habit.frequency.includes(date.getDay())) {
                        totalPossible++;
                    }
                } else {
                    // Flexible habits special handling - totalPossible is added separately 
                    // below, but we calculate it here based on weeks present in month
                }

                if (isCompleted(habit.id, day, completions, currentMonthIndex, currentYear)) hTotalDone++;
            });

            if (habit.weeklyTarget) {
                // Flexible habit possible/completed
                const daysAfterCreation = monthDates.filter(day => {
                    const date = new Date(currentYear, currentMonthIndex, day);
                    return !createdDate || date >= createdDate;
                }).length;

                const monthlyCap = Math.round(habit.weeklyTarget * (daysAfterCreation / 7));
                totalPossible += monthlyCap;
                completed += Math.min(hTotalDone, monthlyCap);
            } else {
                completed += hTotalDone;
            }
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
