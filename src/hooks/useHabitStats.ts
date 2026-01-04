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

        // Per-habit performance for the week
        const habitPerformance = habits.map(h => {
            let hCompleted = 0;
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
            const monday = new Date(today.getFullYear(), today.getMonth(), diff);

            for (let i = 0; i < 7; i++) {
                const date = new Date(monday);
                date.setDate(monday.getDate() + i);
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
            let perfectDays = 0;

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
                let dailyCompletedCount = 0;
                habits.forEach(h => {
                    if (isCompleted(h.id, d, completions, idx, currentYear)) dailyCompletedCount++;
                });

                if (dailyCompletedCount > 0) {
                    activeDays++;
                    currentMStreak++;
                    maxMStreak = Math.max(maxMStreak, currentMStreak);
                } else {
                    currentMStreak = 0;
                }

                if (habits.length > 0 && dailyCompletedCount === habits.length) {
                    perfectDays++;
                }

                weekCompleted += dailyCompletedCount;
                weekPossible += habits.length;

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
                weeklyRates,
                perfectDays
            };
        });

        const today = new Date();
        const currentM = today.getMonth();
        const currentD = today.getDate();

        for (let m = 0; m < 12; m++) {
            if (m > currentM && currentYear === today.getFullYear()) break;
            const dInM = new Date(currentYear, m + 1, 0).getDate();
            for (let d = 1; d <= dInM; d++) {
                if (m === currentM && d > currentD && currentYear === today.getFullYear()) break;
                const anyCompleted = habits.some(h => isCompleted(h.id, d, completions, m, currentYear));
                if (anyCompleted) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            }
        }

        let weekendCompletions = 0;
        let weekendPossible = 0;
        let weekdayCompletions = 0;
        let weekdayPossible = 0;

        const habitPerformance = habits.map(h => {
            let hCompleted = 0;
            let hPossible = 0;
            const mCompletions: number[] = new Array(12).fill(0);
            let hMaxStreak = 0;
            let hCurrentStreak = 0;

            MONTHS.forEach((_, mIdx) => {
                const dInM = new Date(currentYear, mIdx + 1, 0).getDate();
                for (let d = 1; d <= dInM; d++) {
                    const date = new Date(currentYear, mIdx, d);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const done = isCompleted(h.id, d, completions, mIdx, currentYear);

                    if (done) {
                        hCompleted++;
                        mCompletions[mIdx]++;
                        hCurrentStreak++;
                        hMaxStreak = Math.max(hMaxStreak, hCurrentStreak);
                        if (isWeekend) weekendCompletions++;
                        else weekdayCompletions++;
                    } else {
                        hCurrentStreak = 0;
                    }

                    hPossible++;
                    if (isWeekend) weekendPossible++;
                    else weekdayPossible++;
                }
            });

            const q1 = mCompletions.slice(0, 3).reduce((a, b) => a + b, 0);
            const q2 = mCompletions.slice(3, 6).reduce((a, b) => a + b, 0);
            const q3 = mCompletions.slice(6, 9).reduce((a, b) => a + b, 0);
            const q4 = mCompletions.slice(9, 12).reduce((a, b) => a + b, 0);

            // Fading detection: High early (Q1+Q2), low late (Q4)
            const earlyRate = (q1 + q2) / (hPossible / 2);
            const lateRate = q4 / (hPossible / 4);
            const isFading = (q1 + q2) > 10 && lateRate < earlyRate * 0.3;

            let badge = "Active Habit";
            if (hCompleted > 0) {
                if (hCompleted / hPossible > 0.85) badge = "Most Consistent";
                else if (hCompleted >= hPossible * 0.5) badge = "Identity Driver";
                else if (q4 > q1 * 1.5 && q4 > 5) badge = "Highest Growth";
                else if (hCompleted > 15) badge = "Most Attempted";
            }

            let lastCompletedDate: string | null = null;
            const habitComps = completions[h.id] || {};
            const dates = Object.keys(habitComps).filter(d => habitComps[d]).sort();
            if (dates.length > 0) lastCompletedDate = dates[dates.length - 1];

            return {
                id: h.id, name: h.name, completed: hCompleted, total: hPossible, rate: hPossible > 0 ? (hCompleted / hPossible) * 100 : 0, badge,
                startRate: hPossible > 0 ? (q1 / (hPossible / 4)) * 100 : 0,
                endRate: hPossible > 0 ? (q4 / (hPossible / 4)) * 100 : 0,
                lastCompletedDate,
                isFading,
                maxStreak: hMaxStreak
            };
        }).sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

        const strongestMonth = [...monthlySummaries].sort((a, b) => b.rate - a.rate)[0];
        const consistencyRate = totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0;
        const activeDays = monthlySummaries.reduce((sum, m) => sum + (m.consistency * (new Date(currentYear, MONTHS.indexOf(m.month) + 1, 0).getDate()) / 100), 0);
        const activeHabitsCount = habitPerformance.filter(h => h.completed >= 5).length;

        // Momentum: Compare last 2 active months to yearly average
        const activeMonths = monthlySummaries.filter(m => m.rate > 0);
        const recentRate = activeMonths.length >= 2
            ? (activeMonths[activeMonths.length - 1].rate + activeMonths[activeMonths.length - 2].rate) / 2
            : activeMonths.length === 1 ? activeMonths[0].rate : 0;

        const momentum = recentRate > consistencyRate * 1.1 ? "ascending" : recentRate < consistencyRate * 0.8 ? "descending" : "stable";

        // Story Variant for rotation (re-seed every day)
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const storyVariant = (dayOfYear % 3 === 0) ? "identity" : (dayOfYear % 3 === 1) ? "momentum" : "reflection";

        // Calculate All-Time High Month
        const monthCounts: Record<string, number> = {};
        habits.forEach(h => {
            const hCompletions = completions[h.id] || {};
            Object.keys(hCompletions).forEach(dateKey => {
                if (hCompletions[dateKey]) {
                    const [y, m] = dateKey.split('-');
                    const key = `${y}-${m}`;
                    monthCounts[key] = (monthCounts[key] || 0) + 1;
                }
            });
        });

        const allTimeBest = Object.entries(monthCounts).map(([key, count]) => {
            const [yStr, mStr] = key.split('-');
            const year = parseInt(yStr);
            const monthIdx = parseInt(mStr) - 1;
            const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
            const totalPossible = daysInMonth * habits.length;
            return {
                key, year, monthIdx, count,
                rate: totalPossible > 0 ? (count / totalPossible) * 100 : 0
            };
        }).sort((a, b) => b.rate - a.rate)[0];

        return {
            totalCompletions,
            totalPossible,
            monthlySummaries,
            topHabits: habitPerformance.slice(0, 6),
            maxStreak,
            currentStreak,
            strongestMonth,
            consistencyRate,
            allTimeBest,
            weekendRate: weekendPossible > 0 ? (weekendCompletions / weekendPossible) * 100 : 0,
            weekdayRate: weekdayPossible > 0 ? (weekdayCompletions / weekdayPossible) * 100 : 0,
            momentum,
            fadingHabit: habitPerformance.find(h => h.isFading) || null,
            longestHabitStreak: [...habitPerformance].sort((a, b) => b.maxStreak - a.maxStreak)[0] || null,
            activeDays: Math.round(activeDays),
            activeHabitsCount,
            storyVariant
        };
    }, [completions, habits, currentYear]);

    const prevWeekProgress = useMemo(() => {
        const today = new Date();
        const day = today.getDay();
        // Shift to previous week
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) + ((weekOffset - 1) * 7);
        const monday = new Date(today.getFullYear(), today.getMonth(), diff);

        let completed = 0;
        const totalPossible = habits.length * 7;

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const d = date.getDate();
            const m = date.getMonth();
            const y = date.getFullYear();

            habits.forEach(habit => {
                if (isCompleted(habit.id, d, completions, m, y)) completed++;
            });
        }

        return {
            percentage: totalPossible > 0 ? (completed / totalPossible) * 100 : 0
        };
    }, [habits, completions, weekOffset]);

    const allTimeBestWeek = useMemo(() => {
        const weekCounts: Record<string, number> = {};

        // Iterate all habits and their completions
        habits.forEach(h => {
            const hCompletions = completions[h.id] || {};
            Object.keys(hCompletions).forEach(dateKey => {
                if (hCompletions[dateKey]) {
                    const [yStr, mStr, dStr] = dateKey.split('-');
                    const date = new Date(parseInt(yStr), parseInt(mStr) - 1, parseInt(dStr));

                    // Get ISO Week roughly or just Monday of that week
                    const day = date.getDay();
                    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(date.getFullYear(), date.getMonth(), diff);
                    const key = `${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, '0')}-${monday.getDate().toString().padStart(2, '0')}`;

                    weekCounts[key] = (weekCounts[key] || 0) + 1;
                }
            });
        });

        const best = Object.entries(weekCounts).map(([key, count]) => {
            const totalPossible = habits.length * 7;
            const rate = totalPossible > 0 ? (count / totalPossible) * 100 : 0;
            const [y, m, d] = key.split('-').map(Number);
            const monday = new Date(y, m - 1, d);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const startYear = monday.getFullYear();
            const endYear = sunday.getFullYear();

            let dateRangeStr = '';

            if (startYear === endYear) {
                const fromStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const toStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dateRangeStr = `${fromStr} - ${toStr}, ${startYear}`;
            } else {
                const fromStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const toStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                dateRangeStr = `${fromStr} - ${toStr}`;
            }

            return {
                key,
                dateRangeStr,
                year: y,
                rate
            };
        }).sort((a, b) => b.rate - a.rate)[0];

        return best || { rate: 0, dateRangeStr: '', year: 0 };
    }, [habits, completions]);

    const weekDelta = weekProgress.percentage - prevWeekProgress.percentage;

    const prevMonthProgress = useMemo(() => {
        const prevMonthIdx = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
        const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
        const dInPrevM = new Date(prevYear, prevMonthIdx + 1, 0).getDate();
        const totalPossible = habits.length * dInPrevM;
        let completed = 0;
        habits.forEach(habit => {
            for (let d = 1; d <= dInPrevM; d++) {
                if (isCompleted(habit.id, d, completions, prevMonthIdx, prevYear)) completed++;
            }
        });
        return {
            percentage: totalPossible > 0 ? (completed / totalPossible) * 100 : 0
        };
    }, [habits, completions, currentMonthIndex, currentYear]);

    const monthDelta = monthProgress.percentage - prevMonthProgress.percentage;

    return {
        dailyStats,
        weeklyStats,
        weekProgress,
        prevWeekProgress,
        weekDelta,
        allTimeBestWeek,
        monthProgress,
        monthDelta,
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
