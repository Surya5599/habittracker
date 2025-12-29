import { useMemo } from 'react';
import { Habit, HabitCompletion } from '../types';
import { MONTHS } from '../constants';
import { isCompleted } from '../utils/stats';

export const useHabitStats = (
    habits: Habit[],
    completions: HabitCompletion,
    currentMonthIndex: number,
    currentYear: number,
    daysInMonth: number,
    monthDates: number[],
    weekOffset: number = 0
) => {
    const weeklyStats = useMemo(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
        const monday = new Date(today.getFullYear(), today.getMonth(), diff);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
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
        const totalPossible = habits.length * 7;
        const completed = weeklyStats.reduce((acc, curr) => acc + curr.count, 0);
        return {
            total: totalPossible,
            completed,
            remaining: Math.max(0, totalPossible - completed),
            percentage: totalPossible > 0 ? (completed / totalPossible) * 100 : 0
        };
    }, [habits.length, weeklyStats]);
    const dailyStats = useMemo(() => {
        return monthDates.map(day => {
            let count = 0;
            habits.forEach(habit => {
                if (isCompleted(habit.id, day, completions, currentMonthIndex, currentYear)) count++;
            });
            return { day, count };
        });
    }, [completions, currentMonthIndex, currentYear, habits, monthDates]);

    const monthProgress = useMemo(() => {
        const totalPossible = habits.length * daysInMonth;
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

    const topHabitsThisMonth = useMemo(() => {
        return habits
            .map(h => {
                const stats = getHabitMonthStats(h.id, completions, currentMonthIndex, currentYear);
                return {
                    ...h,
                    stats,
                    percentage: stats.totalDays > 0 ? (stats.completed / stats.totalDays) * 100 : 0
                };
            })
            .sort((a, b) => b.stats.completed - a.stats.completed || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
            .slice(0, 10);
    }, [habits, completions, currentMonthIndex, currentYear]);

    const annualStats = useMemo(() => {
        let totalCompletions = 0;
        let totalPossible = 0;
        let maxStreak = 0;
        let currentStreak = 0;

        const monthlySummariesRaw = MONTHS.map((_, mIdx) => {
            const dInM = new Date(currentYear, mIdx + 1, 0).getDate();
            let mCompleted = 0;
            habits.forEach(h => {
                for (let d = 1; d <= dInM; d++) {
                    if (isCompleted(h.id, d, completions, mIdx, currentYear)) mCompleted++;
                }
            });
            totalCompletions += mCompleted;
            totalPossible += habits.length * dInM;
            return {
                month: MONTHS[mIdx],
                completed: mCompleted,
                total: habits.length * dInM,
                rate: habits.length * dInM > 0 ? (mCompleted / (habits.length * dInM)) * 100 : 0
            };
        });

        const maxMonthlyRate = Math.max(...monthlySummariesRaw.map(m => m.rate));

        const monthlySummaries = monthlySummariesRaw.map((m, idx) => {
            const prev = idx > 0 ? monthlySummariesRaw[idx - 1] : null;
            const delta = prev ? m.rate - prev.rate : 0;
            let signal = "";

            if (m.rate > 0 && m.rate === maxMonthlyRate) signal = "Best focus month";
            else if (prev && delta < -15) signal = "Burnout dip";
            else if (prev && delta > 15 && prev.rate < 40) signal = "Rebound month";

            // Enhanced stats for monthly cards
            const dInM = new Date(currentYear, idx + 1, 0).getDate();
            let activeDays = 0;
            let currentMStreak = 0;
            let maxMStreak = 0;

            // Weekly rates
            const weeklyRates: number[] = [];
            let weekCompleted = 0;
            let weekPossible = 0;

            // Monthly habit performace to find top habit of the month
            const mHabitStats = habits.map(h => {
                let hCompleted = 0;
                for (let d = 1; d <= dInM; d++) {
                    if (isCompleted(h.id, d, completions, idx, currentYear)) hCompleted++;
                }
                return { name: h.name, rate: hCompleted / dInM };
            }).sort((a, b) => b.rate - a.rate);

            const topHabit = mHabitStats[0] || null;

            for (let d = 1; d <= dInM; d++) {
                const anyCompleted = habits.some(h => isCompleted(h.id, d, completions, idx, currentYear));
                if (anyCompleted) {
                    activeDays++;
                    currentMStreak++;
                    maxMStreak = Math.max(maxMStreak, currentMStreak);
                } else {
                    currentMStreak = 0;
                }

                habits.forEach(h => {
                    if (isCompleted(h.id, d, completions, idx, currentYear)) weekCompleted++;
                    weekPossible++;
                });

                // Calculate weekly rate every 7 days or at end of month
                if (d % 7 === 0 || d === dInM) {
                    weeklyRates.push(weekPossible > 0 ? (weekCompleted / weekPossible) * 100 : 0);
                    weekCompleted = 0;
                    weekPossible = 0;
                }
            }

            return {
                ...m,
                delta,
                signal,
                topHabit: topHabit && topHabit.rate > 0 ? topHabit : null,
                consistency: (activeDays / dInM) * 100,
                maxStreak: maxMStreak,
                weeklyRates
            };
        });

        for (let m = 0; m < 12; m++) {
            const dInM = new Date(currentYear, m + 1, 0).getDate();
            for (let d = 1; d <= dInM; d++) {
                const anyCompleted = habits.some(h => isCompleted(h.id, d, completions, m, currentYear));
                if (anyCompleted) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            }
        }

        const habitPerformance = habits.map(h => {
            let hCompleted = 0;
            let hPossible = 0;
            const mCompletions: number[] = new Array(12).fill(0);

            MONTHS.forEach((_, mIdx) => {
                const dInM = new Date(currentYear, mIdx + 1, 0).getDate();
                for (let d = 1; d <= dInM; d++) {
                    if (isCompleted(h.id, d, completions, mIdx, currentYear)) {
                        hCompleted++;
                        mCompletions[mIdx]++;
                    }
                }
                hPossible += dInM;
            });

            const q1 = mCompletions.slice(0, 3).reduce((a, b) => a + b, 0);
            const q4 = mCompletions.slice(9, 12).reduce((a, b) => a + b, 0);

            let badge = "Active Habit";
            if (hCompleted > 0) {
                if (hCompleted / hPossible > 0.85) badge = "Most Consistent";
                else if (hCompleted >= hPossible * 0.5) badge = "Identity Driver";
                else if (q4 > q1 * 1.5 && q4 > 5) badge = "Highest Growth";
                else if (hCompleted > 15) badge = "Most Attempted";
            }

            return {
                id: h.id, name: h.name, completed: hCompleted, total: hPossible, rate: hPossible > 0 ? (hCompleted / hPossible) * 100 : 0, badge,
                startRate: hPossible > 0 ? (q1 / (hPossible / 4)) * 100 : 0,
                endRate: hPossible > 0 ? (q4 / (hPossible / 4)) * 100 : 0
            };
        }).sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

        const strongestMonth = [...monthlySummaries].sort((a, b) => b.rate - a.rate)[0];
        const consistencyRate = totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0;

        return { totalCompletions, totalPossible, monthlySummaries, topHabits: habitPerformance.slice(0, 6), maxStreak, strongestMonth, consistencyRate };
    }, [completions, habits, currentYear]);

    return {
        dailyStats,
        weeklyStats,
        weekProgress,
        monthProgress,
        topHabitsThisMonth,
        annualStats
    };
};

// Helper function needed because utility might not have been imported correctly in the hook context if not careful
function getHabitMonthStats(habitId: string, completions: HabitCompletion, monthIdx: number, year: number) {
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
}
