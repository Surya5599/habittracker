import { useMemo } from 'react';
import { Habit, HabitCompletion, DailyNote } from '../types';
import { MONTHS } from '../constants';
import { isCompleted, getHabitMonthStats } from '../utils/stats';
import { isHabitActiveOnDate, isHabitManuallyInactive, toDateKey } from '../utils/habitActivity';

export const useHabitStats = (
    habits: Habit[],
    completions: HabitCompletion,
    notes: DailyNote,
    currentMonthIndex: number,
    currentYear: number,
    daysInMonth: number,
    monthDates: number[],
    weekOffset: number = 0,
    startOfWeek: 'monday' | 'sunday' = 'monday'
) => {
    const isHabitInactiveOnDate = (habit: Habit, date: Date) => {
        const dateKey = toDateKey(date);
        return !isHabitActiveOnDate(habit, date) || isHabitManuallyInactive(notes, dateKey, habit.id);
    };

    const isHabitDueOnDate = (habit: Habit, date: Date) => {
        if (isHabitInactiveOnDate(habit, date)) return false;
        return !habit.frequency || habit.frequency.includes(date.getDay());
    };

    const getStartDate = (date: Date, offset: number = 0) => {
        const day = date.getDay();
        let diff = date.getDate() - day;
        if (startOfWeek === 'monday') {
            diff += (day === 0 ? -6 : 1);
        }
        diff += (offset * 7);
        return new Date(date.getFullYear(), date.getMonth(), diff);
    };

    const buildWeeklyStatsForOffset = (offset: number) => {
        const today = new Date();
        const startDate = getStartDate(today, offset);
        const usedCount: Record<string, number> = {};

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const d = date.getDate();
            const m = date.getMonth();
            const y = date.getFullYear();

            let count = 0;
            habits.forEach(habit => {
                if (isHabitInactiveOnDate(habit, date)) return;
                if (isCompleted(habit.id, d, completions, m, y)) {
                    if (habit.weeklyTarget) {
                        const current = usedCount[habit.id] || 0;
                        if (current < habit.weeklyTarget) {
                            count++;
                            usedCount[habit.id] = current + 1;
                        }
                    } else {
                        count++;
                    }
                }
            });

            return {
                day: d,
                displayDay: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count
            };
        });
    };

    const buildWeekProgressForOffset = (offset: number) => {
        const today = new Date();
        const startDate = getStartDate(today, offset);
        // Only count days up to and including today — future days don't contribute to the denominator
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        let totalPossible = habits.reduce((acc, h) => {
            if (h.weeklyTarget) {
                let possible = 0;
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(startDate.getDate() + i);
                    if (d > endOfToday) break;
                    if (!isHabitInactiveOnDate(h, d)) possible += h.weeklyTarget / 7;
                }
                return acc + possible;
            }
            let count = 0;
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                if (d > endOfToday) break;
                if (isHabitDueOnDate(h, d)) count++;
            }
            return acc + count;
        }, 0);

        let completed = 0;
        habits.forEach(h => {
            let actualCount = 0;
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                if (isHabitInactiveOnDate(h, date)) continue;
                if (isCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear())) {
                    actualCount++;
                }
            }
            completed += h.weeklyTarget ? Math.min(actualCount, h.weeklyTarget) : actualCount;
        });

        const normalizedTotal = Math.max(0, Math.round(totalPossible));
        const normalizedCompleted = Math.max(0, Math.round(completed));

        return {
            total: normalizedTotal,
            completed: normalizedCompleted,
            remaining: Math.max(0, normalizedTotal - normalizedCompleted),
            percentage: normalizedTotal > 0 ? (normalizedCompleted / normalizedTotal) * 100 : 0
        };
    };

    const buildDailyStatsForMonth = (targetMonthIndex: number, targetYear: number) => {
        const targetDaysInMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
        const targetMonthDates = Array.from({ length: targetDaysInMonth }, (_, index) => index + 1);

        return targetMonthDates.map(day => {
            let count = 0;
            let totalDue = 0;
            const targetDate = new Date(targetYear, targetMonthIndex, day);

            habits.forEach(habit => {
                if (habit.weeklyTarget) return;

                const isDue = isHabitDueOnDate(habit, targetDate);
                if (isDue) {
                    totalDue++;
                    if (isCompleted(habit.id, day, completions, targetMonthIndex, targetYear)) {
                        count++;
                    }
                }
            });

            return { day, count, totalDue };
        });
    };

    const buildAnnualComparison = (targetYear: number) => {
        let totalCompleted = 0;
        let totalPossible = 0;

        const monthlySummaries = MONTHS.map((month, monthIndex) => {
            const daysInTargetMonth = new Date(targetYear, monthIndex + 1, 0).getDate();
            let completed = 0;
            let total = 0;

            habits.forEach(habit => {
                if (habit.weeklyTarget) {
                    let monthlyPossible = 0;
                    let actualCount = 0;

                    for (let day = 1; day <= daysInTargetMonth; day++) {
                        const date = new Date(targetYear, monthIndex, day);
                        if (isHabitInactiveOnDate(habit, date)) continue;
                        monthlyPossible += habit.weeklyTarget / 7;
                        if (isCompleted(habit.id, day, completions, monthIndex, targetYear)) {
                            actualCount++;
                        }
                    }

                    total += monthlyPossible;
                    completed += Math.min(actualCount, monthlyPossible);
                } else {
                    for (let day = 1; day <= daysInTargetMonth; day++) {
                        const date = new Date(targetYear, monthIndex, day);
                        if (isHabitDueOnDate(habit, date)) {
                            total++;
                            if (isCompleted(habit.id, day, completions, monthIndex, targetYear)) {
                                completed++;
                            }
                        }
                    }
                }
            });

            totalCompleted += completed;
            totalPossible += total;

            return {
                month,
                completed: Math.round(completed),
                total: Math.round(total),
                rate: total > 0 ? (completed / total) * 100 : 0
            };
        });

        return {
            monthlySummaries,
            percentage: totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0
        };
    };

    const weeklyStats = useMemo(() => {
        return buildWeeklyStatsForOffset(weekOffset);
    }, [habits, completions, notes, weekOffset, startOfWeek]);

    const previousWeeklyStats = useMemo(() => {
        return buildWeeklyStatsForOffset(weekOffset - 1);
    }, [habits, completions, notes, weekOffset, startOfWeek]);

    const weekProgress = useMemo(() => {
        const today = new Date();
        const startDate = getStartDate(today, weekOffset);
        const progress = buildWeekProgressForOffset(weekOffset);

        // Per-habit performance for the week (for display)
        const habitPerformance = habits.map(h => {
            let hCompletedActual = 0;
            const weekStartDate = getStartDate(today, weekOffset);

            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStartDate);
                date.setDate(weekStartDate.getDate() + i);
                if (isHabitInactiveOnDate(h, date)) continue;
                if (isCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear())) {
                    hCompletedActual++;
                }
            }
            // For performance display, we might want to show actual or capped? 
            // Usually we show capped in the bar, but actual in the list?
            // User said "ignore it if the user still marks it", so we cap.
            const displayCount = h.weeklyTarget ? Math.min(hCompletedActual, h.weeklyTarget) : hCompletedActual;
            return { name: h.name, completed: displayCount };
        }).sort((a, b) => b.completed - a.completed);

        return {
            ...progress,
            habitPerformance
        };
    }, [habits, completions, notes, weeklyStats, weekOffset, startOfWeek]);

    const dailyStats = useMemo(() => {
        return buildDailyStatsForMonth(currentMonthIndex, currentYear);
    }, [completions, notes, currentMonthIndex, currentYear, habits, monthDates]);

    const previousDailyStats = useMemo(() => {
        const prevMonthIdx = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
        const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
        return buildDailyStatsForMonth(prevMonthIdx, prevYear);
    }, [completions, notes, currentMonthIndex, currentYear, habits]);

    const monthProgress = useMemo(() => {
        let totalPossible = 0;
        habits.forEach(habit => {
            if (habit.weeklyTarget) {
                monthDates.forEach(day => {
                    const date = new Date(currentYear, currentMonthIndex, day);
                    if (!isHabitInactiveOnDate(habit, date)) {
                        totalPossible += habit.weeklyTarget / 7;
                    }
                });
            } else {
                monthDates.forEach(day => {
                    const date = new Date(currentYear, currentMonthIndex, day);
                    if (isHabitDueOnDate(habit, date)) {
                        totalPossible += 1;
                    }
                });
            }
        });
        totalPossible = Math.round(totalPossible);
        let completed = 0;
        habits.forEach(habit => {
            let actualCount = 0;
            monthDates.forEach(day => {
                const date = new Date(currentYear, currentMonthIndex, day);
                if (isHabitInactiveOnDate(habit, date)) return;
                if (isCompleted(habit.id, day, completions, currentMonthIndex, currentYear)) {
                    actualCount++;
                }
            });
            if (habit.weeklyTarget) {
                // Monthly cap for flexible habits (approximate)
                const activeDays = monthDates.filter(day => {
                    const date = new Date(currentYear, currentMonthIndex, day);
                    return !isHabitInactiveOnDate(habit, date);
                }).length;
                const monthlyCap = (habit.weeklyTarget / 7) * activeDays;
                completed += Math.min(actualCount, monthlyCap);
            } else {
                completed += actualCount;
            }
        });
        return {
            total: totalPossible,
            completed: Math.round(completed),
            remaining: Math.max(0, Math.round(totalPossible - completed)),
            percentage: totalPossible > 0 ? (completed / totalPossible) * 100 : 0
        };
    }, [completions, notes, currentMonthIndex, currentYear, habits, daysInMonth, monthDates]);

    const topHabitsThisMonth = useMemo(() => {
        return habits
            .map(h => {
                const stats = getHabitMonthStats(
                    h.id,
                    completions,
                    currentMonthIndex,
                    currentYear,
                    h.frequency,
                    (dateKey) => {
                        const [y, m, d] = dateKey.split('-').map(Number);
                        const date = new Date(y, m - 1, d);
                        return isHabitInactiveOnDate(h, date);
                    }
                );
                return {
                    ...h,
                    stats,
                    percentage: stats.totalDays > 0 ? (stats.completed / stats.totalDays) * 100 : 0
                };
            })
            .sort((a, b) => b.stats.completed - a.stats.completed || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
            .slice(0, 10);
    }, [habits, completions, notes, currentMonthIndex, currentYear]);

    const annualStats = useMemo(() => {
        let totalCompletions = 0;
        let totalPossible = 0;
        let maxStreak = 0;
        let currentStreak = 0;

        const today = new Date();
        const currentYearToday = today.getFullYear();
        const currentMonthToday = today.getMonth();
        const currentDateToday = today.getDate();

        let proRatedTotalPossible = 0;

        const monthlySummariesRaw = MONTHS.map((_, mIdx) => {
            const dInM = new Date(currentYear, mIdx + 1, 0).getDate();
            let mCompleted = 0;
            let mPossible = 0;
            let mProRatedPossible = 0;

            habits.forEach(h => {
                if (h.weeklyTarget) {
                    // Pro-rated monthly possible for flexible habits
                    let monthlyPossible = 0;
                    for (let d = 1; d <= dInM; d++) {
                        const date = new Date(currentYear, mIdx, d);
                        if (!isHabitInactiveOnDate(h, date)) monthlyPossible += h.weeklyTarget / 7;
                    }
                    mPossible += monthlyPossible;

                    let hMonthActual = 0;
                    for (let d = 1; d <= dInM; d++) {
                        const date = new Date(currentYear, mIdx, d);
                        if (isHabitInactiveOnDate(h, date)) continue;
                        const isFuture = currentYear > currentYearToday ||
                            (currentYear === currentYearToday && (mIdx > currentMonthToday || (mIdx === currentMonthToday && d > currentDateToday)));

                        const done = isCompleted(h.id, d, completions, mIdx, currentYear);
                        if (done) hMonthActual++;

                        // Pro-rated possible for the current/past period
                        if (!isFuture || done) {
                            mProRatedPossible += (h.weeklyTarget / 7);
                        }
                    }
                    mCompleted += Math.min(hMonthActual, monthlyPossible);
                } else {
                    for (let d = 1; d <= dInM; d++) {
                        const date = new Date(currentYear, mIdx, d);
                        const isDue = isHabitDueOnDate(h, date);

                        if (isDue) {
                            const isFuture = currentYear > currentYearToday ||
                                (currentYear === currentYearToday && (mIdx > currentMonthToday || (mIdx === currentMonthToday && d > currentDateToday)));

                            // Always count completion if it exists
                            const done = isCompleted(h.id, d, completions, mIdx, currentYear);

                            mPossible++;
                            if (done) mCompleted++;

                            if (!isFuture || done) {
                                mProRatedPossible++;
                            }
                        }
                    }
                }
            });
            mPossible = Math.round(mPossible);
            mProRatedPossible = Math.round(mProRatedPossible);
            totalCompletions += mCompleted;
            totalPossible += mPossible;
            proRatedTotalPossible += mProRatedPossible;

            return {
                month: MONTHS[mIdx],
                completed: mCompleted,
                total: mPossible,
                rate: mPossible > 0 ? (mCompleted / mPossible) * 100 : 0,
                proRatedRate: mProRatedPossible > 0 ? (mCompleted / mProRatedPossible) * 100 : 0,
                isFutureMonth: currentYear > currentYearToday || (currentYear === currentYearToday && mIdx > currentMonthToday),
                isCurrentMonth: currentYear === currentYearToday && mIdx === currentMonthToday
            };
        });

        const maxMonthlyRate = Math.max(...monthlySummariesRaw.map(m => m.rate));

        const monthlySummaries = monthlySummariesRaw.map((m, idx) => {
            const prev = idx > 0 ? monthlySummariesRaw[idx - 1] : null;

            // Calculate delta based on pro-rated rates for current month, or full rates for past months.
            // Future months always have 0 delta.
            let delta = 0;
            if (prev && !m.isFutureMonth) {
                const currentMonthRate = m.isCurrentMonth ? m.proRatedRate : m.rate;
                delta = currentMonthRate - prev.rate;
            }

            let signal = "";

            if (m.rate > 0 && m.rate === maxMonthlyRate) signal = "Best focus month";
            else if (prev && delta < -15 && !m.isFutureMonth && !m.isCurrentMonth && m.total > 0) signal = "Burnout dip";
            else if (prev && delta > 15 && prev.rate < 40 && !m.isFutureMonth) signal = "Rebound month";

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
                    const date = new Date(currentYear, idx, d);
                    if (isHabitInactiveOnDate(h, date)) continue;
                    if (isCompleted(h.id, d, completions, idx, currentYear)) hCompleted++;
                }
                return { name: h.name, rate: hCompleted / dInM };
            }).sort((a, b) => b.rate - a.rate);

            const topHabit = mHabitStats[0] || null;

            const days: { habitsCompleted: number; mood?: number; totalPossible: number }[] = [];

            for (let d = 1; d <= dInM; d++) {
                let dailyCompletedCount = 0;
                let dailyPossibleCount = 0;
                const dateKey = `${currentYear}-${String(idx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dayDate = new Date(currentYear, idx, d);
                const dayIdx = dayDate.getDay();

                habits.forEach(h => {
                    if (h.weeklyTarget) return;
                    const isDue = isHabitDueOnDate(h, dayDate);
                    if (isDue) dailyPossibleCount++;
                    if (isDue && isCompleted(h.id, d, completions, idx, currentYear)) dailyCompletedCount++;
                });

                const dayNote = notes[dateKey];
                const mood = dayNote?.mood;

                days.push({
                    habitsCompleted: dailyCompletedCount,
                    totalPossible: dailyPossibleCount,
                    mood
                });

                if (dailyCompletedCount > 0) {
                    activeDays++;
                    currentMStreak++;
                    maxMStreak = Math.max(maxMStreak, currentMStreak);
                } else {
                    currentMStreak = 0;
                }

                if (dailyPossibleCount > 0 && dailyCompletedCount === dailyPossibleCount) {
                    perfectDays++;
                }

                weekCompleted += dailyCompletedCount;
                weekPossible += dailyPossibleCount;

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
                perfectDays,
                days
            };
        });

        // const today = new Date(); // Removed to fix redeclaration error
        const currentM = today.getMonth();
        const currentD = today.getDate();

        for (let m = 0; m < 12; m++) {
            if (m > currentM && currentYear === today.getFullYear()) break;
            const dInM = new Date(currentYear, m + 1, 0).getDate();
            for (let d = 1; d <= dInM; d++) {
                if (m === currentM && d > currentD && currentYear === today.getFullYear()) break;
                const anyCompleted = habits.some(h => {
                    const date = new Date(currentYear, m, d);
                    if (isHabitInactiveOnDate(h, date)) return false;
                    return isCompleted(h.id, d, completions, m, currentYear);
                });
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
        let loggedDaysCount = 0;
        let trackableDaysCount = 0;

        for (let m = 0; m < 12; m++) {
            if (currentYear === currentYearToday && m > currentMonthToday) break;
            const dInM = new Date(currentYear, m + 1, 0).getDate();
            for (let d = 1; d <= dInM; d++) {
                if (currentYear === currentYearToday && m === currentMonthToday && d > currentDateToday) break;
                const date = new Date(currentYear, m, d);
                const hasTrackableHabit = habits.some((habit) => !isHabitInactiveOnDate(habit, date));
                if (!hasTrackableHabit) continue;

                trackableDaysCount++;
                const anyCompleted = habits.some((habit) => {
                    if (isHabitInactiveOnDate(habit, date)) return false;
                    return isCompleted(habit.id, d, completions, m, currentYear);
                });

                if (anyCompleted) loggedDaysCount++;
            }
        }

        const habitPerformance = habits.map(h => {
            let hCompleted = 0;
            let hPossible = 0;
            const mCompletions: number[] = new Array(12).fill(0);
            let hMaxStreak = 0;
            let hCurrentStreak = 0;
            let hBestStreakStart: string | null = null;
            let hBestStreakEnd: string | null = null;
            let hCurrentStreakStart: string | null = null;

            MONTHS.forEach((_, mIdx) => {
                const dInM = new Date(currentYear, mIdx + 1, 0).getDate();
                for (let d = 1; d <= dInM; d++) {
                    const date = new Date(currentYear, mIdx, d);
                    const isDue = isHabitDueOnDate(h, date);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                    const isFuture = currentYear > currentYearToday ||
                        (currentYear === currentYearToday && (mIdx > currentMonthToday || (mIdx === currentMonthToday && d > currentDateToday)));

                    const done = !isHabitInactiveOnDate(h, date) && isCompleted(h.id, d, completions, mIdx, currentYear);

                    if (done) {
                        const dateStr = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        if (hCurrentStreak === 0) hCurrentStreakStart = dateStr;
                        hCompleted++;
                        mCompletions[mIdx]++;
                        hCurrentStreak++;
                        hMaxStreak = Math.max(hMaxStreak, hCurrentStreak);
                        if (hCurrentStreak >= hMaxStreak) { hBestStreakStart = hCurrentStreakStart; hBestStreakEnd = dateStr; }
                        if (isWeekend) weekendCompletions++;
                        else weekdayCompletions++;
                    } else if (!isFuture && isDue) {
                        hCurrentStreak = 0;
                        hCurrentStreakStart = null;
                    }

                    if (!isFuture || done) {
                        if (!h.weeklyTarget) {
                            if (isDue) {
                                hPossible++;
                                if (isWeekend) weekendPossible++;
                                else weekdayPossible++;
                            }
                        } else if (!isHabitInactiveOnDate(h, date)) {
                            // Flexible habits: (target/7) per day
                            hPossible += h.weeklyTarget / 7;
                            if (isWeekend) weekendPossible += h.weeklyTarget / 7;
                            else weekdayPossible += h.weeklyTarget / 7;
                        }
                    }
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
                maxStreak: hMaxStreak,
                currentStreak: hCurrentStreak,
                streakStart: hBestStreakStart,
                streakEnd: hBestStreakEnd,
            };
        }).sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

        const activeHabitsInYear = habitPerformance.filter(h => h.total > 0);
        const loggedHabitsCount = activeHabitsInYear.filter(h => h.completed > 0).length;
        const mostLoggedHabit = [...activeHabitsInYear]
            .sort((a, b) => b.completed - a.completed || b.rate - a.rate || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))[0] || null;
        const weakestHabit = [...activeHabitsInYear]
            .filter(h => h.total > 0)
            .sort((a, b) => a.rate - b.rate || a.completed - b.completed || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))[0] || null;

        const strongestMonth = [...monthlySummaries].sort((a, b) => b.rate - a.rate)[0];
        const consistencyRate = proRatedTotalPossible > 0 ? (totalCompletions / proRatedTotalPossible) * 100 : 0;
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

        const streakMilestones = [...habitPerformance]
            .filter(h => h.maxStreak >= 7 && h.streakStart)
            .sort((a, b) => b.maxStreak - a.maxStreak)
            .slice(0, 3)
            .map(h => ({ name: h.name, length: h.maxStreak, startDate: h.streakStart, endDate: h.streakEnd }));

        return {
            totalCompletions,
            totalPossible,
            monthlySummaries,
            topHabits: habitPerformance.slice(0, 6),
            allTopHabits: habitPerformance,
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
            storyVariant,
            loggedDaysCount,
            trackableDaysCount,
            loggedHabitsCount,
            totalHabitsInYear: activeHabitsInYear.length,
            mostLoggedHabit,
            weakestHabit,
            streakMilestones,
        };
    }, [completions, notes, habits, currentYear]);

    const prevWeekProgress = useMemo(() => {
        return buildWeekProgressForOffset(weekOffset - 1);
    }, [habits, completions, notes, weekOffset, startOfWeek]);

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
                    let diff = date.getDate() - day;
                    if (startOfWeek === 'monday') {
                        diff += (day === 0 ? -6 : 1);
                    }

                    const startOfWeekDate = new Date(date.getFullYear(), date.getMonth(), diff);
                    const key = `${startOfWeekDate.getFullYear()}-${(startOfWeekDate.getMonth() + 1).toString().padStart(2, '0')}-${startOfWeekDate.getDate().toString().padStart(2, '0')}`;

                    weekCounts[key] = (weekCounts[key] || 0) + 1;
                }
            });
        });

        const best = Object.entries(weekCounts).map(([key, count]) => {
            const totalPossible = habits.length * 7;
            const rate = totalPossible > 0 ? (count / totalPossible) * 100 : 0;
            const [y, m, d] = key.split('-').map(Number);
            const startOfWeekDate = new Date(y, m - 1, d);
            const endOfWeekDate = new Date(startOfWeekDate);
            endOfWeekDate.setDate(startOfWeekDate.getDate() + 6);

            const startYear = startOfWeekDate.getFullYear();
            const endYear = endOfWeekDate.getFullYear();

            let dateRangeStr = '';

            if (startYear === endYear) {
                const fromStr = startOfWeekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const toStr = endOfWeekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dateRangeStr = `${fromStr} - ${toStr}, ${startYear}`;
            } else {
                const fromStr = startOfWeekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const toStr = endOfWeekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    }, [habits, completions, startOfWeek]);

    const weekDelta = weekProgress.percentage - prevWeekProgress.percentage;

    const prevMonthProgress = useMemo(() => {
        const prevMonthIdx = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
        const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
        const dInPrevM = new Date(prevYear, prevMonthIdx + 1, 0).getDate();
        let totalPossible = 0;
        let completed = 0;
        habits.forEach(habit => {
            for (let d = 1; d <= dInPrevM; d++) {
                const date = new Date(prevYear, prevMonthIdx, d);
                if (isHabitDueOnDate(habit, date)) totalPossible++;
                if (isHabitInactiveOnDate(habit, date)) continue;
                if (isCompleted(habit.id, d, completions, prevMonthIdx, prevYear)) completed++;
            }
        });
        return {
            percentage: totalPossible > 0 ? (completed / totalPossible) * 100 : 0
        };
    }, [habits, completions, notes, currentMonthIndex, currentYear]);

    const monthDelta = monthProgress.percentage - prevMonthProgress.percentage;

    const previousAnnualComparison = useMemo(() => {
        return buildAnnualComparison(currentYear - 1);
    }, [habits, completions, notes, currentYear]);

    const annualDelta = annualStats.consistencyRate - previousAnnualComparison.percentage;

    return {
        dailyStats,
        previousDailyStats,
        weeklyStats,
        previousWeeklyStats,
        weekProgress,
        prevWeekProgress,
        weekDelta,
        allTimeBestWeek,
        monthProgress,
        monthDelta,
        topHabitsThisMonth,
        annualStats,
        previousAnnualMonthlySummaries: previousAnnualComparison.monthlySummaries,
        annualDelta
    };
};

// Helper function needed because utility might not have been imported correctly in the hook context if not careful
