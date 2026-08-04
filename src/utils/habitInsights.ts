import { Habit, HabitCompletion, DailyNote } from '../types';
import { isHabitActiveOnDate, isHabitManuallyInactive, toDateKey } from './habitActivity';

export interface Insight {
    id: string;
    category: 'atRisk' | 'weekday' | 'resilience' | 'timing' | 'consistency' | 'correlation';
    text: string;
}

type CompletionTimestamps = Record<string, Record<string, string>>;

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const daysAgo = (base: Date, n: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() - n);

// Ascending list of local-midnight Dates, from `daysBack` days ago up to (excluding) today —
// today is deliberately excluded since it's still in progress and shouldn't count as "missed".
const buildDateRange = (today: Date, daysBack: number): Date[] => {
    const dates: Date[] = [];
    for (let i = daysBack; i >= 1; i--) dates.push(daysAgo(today, i));
    return dates;
};

const isDueOn = (habit: Habit, date: Date, notes: DailyNote): boolean => {
    if (!isHabitActiveOnDate(habit, date)) return false;
    const dateKey = toDateKey(date);
    if (isHabitManuallyInactive(notes, dateKey, habit.id)) return false;
    if (habit.frequency && !habit.frequency.includes(date.getDay())) return false;
    return true;
};

const isDone = (habit: Habit, dateKey: string, completions: HabitCompletion) => !!completions[habit.id]?.[dateKey];

const activeHabits = (habits: Habit[]) => habits.filter(h => !h.archivedAt);

const atRiskHabits = (habits: Habit[], completions: HabitCompletion, notes: DailyNote, today: Date): Insight[] => {
    const results: { insight: Insight; rate: number }[] = [];
    for (const habit of activeHabits(habits)) {
        const dueDates = buildDateRange(today, 30).filter(d => isDueOn(habit, d, notes));
        if (dueDates.length < 5) continue;
        const doneCount = dueDates.filter(d => isDone(habit, toDateKey(d), completions)).length;
        const rate = doneCount / dueDates.length;
        if (rate >= 0.4 && rate <= 0.7) {
            results.push({
                rate,
                insight: {
                    id: `atrisk-${habit.id}`,
                    category: 'atRisk',
                    text: `"${habit.name}" is sitting at ${Math.round(rate * 100)}% completion over the last 30 days — habits in this range are the ones most likely to either lock in or fade out. A smaller version of the habit or a firmer trigger tends to help.`
                }
            });
        } else if (rate < 0.4) {
            results.push({
                rate: 1 - rate,
                insight: {
                    id: `lapsed-${habit.id}`,
                    category: 'atRisk',
                    text: `"${habit.name}" has dropped to ${Math.round(rate * 100)}% completion over the last 30 days — it might be worth redesigning it or archiving it rather than continuing to chase it.`
                }
            });
        }
    }
    return results.sort((a, b) => b.rate - a.rate).slice(0, 4).map(r => r.insight);
};

const weekdayBreakdown = (habits: Habit[], completions: HabitCompletion, notes: DailyNote, today: Date): Insight[] => {
    const results: { insight: Insight; spread: number }[] = [];
    for (const habit of activeHabits(habits).filter(h => !h.weeklyTarget)) {
        const perWeekday = Array.from({ length: 7 }, () => ({ due: 0, done: 0 }));
        for (const date of buildDateRange(today, 84)) {
            if (!isDueOn(habit, date, notes)) continue;
            const wd = date.getDay();
            perWeekday[wd].due++;
            if (isDone(habit, toDateKey(date), completions)) perWeekday[wd].done++;
        }
        const rates = perWeekday
            .map((d, wd) => ({ wd, due: d.due, rate: d.due >= 3 ? d.done / d.due : null }))
            .filter(r => r.rate !== null) as { wd: number; due: number; rate: number }[];
        if (rates.length < 2) continue;
        const best = rates.reduce((a, b) => (b.rate > a.rate ? b : a));
        const worst = rates.reduce((a, b) => (b.rate < a.rate ? b : a));
        const spread = best.rate - worst.rate;
        if (best.wd === worst.wd || spread < 0.25) continue;
        results.push({
            spread,
            insight: {
                id: `weekday-${habit.id}`,
                category: 'weekday',
                text: `You're most likely to skip "${habit.name}" on ${WEEKDAY_NAMES[worst.wd]}s (${Math.round(worst.rate * 100)}% completion) compared to ${WEEKDAY_NAMES[best.wd]}s (${Math.round(best.rate * 100)}%).`
            }
        });
    }
    return results.sort((a, b) => b.spread - a.spread).slice(0, 3).map(r => r.insight);
};

const resilienceStats = (habits: Habit[], completions: HabitCompletion, notes: DailyNote, today: Date): Insight[] => {
    const results: Insight[] = [];
    for (const habit of activeHabits(habits)) {
        const dueDates = buildDateRange(today, 120).filter(d => isDueOn(habit, d, notes));
        if (dueDates.length < 14) continue;

        let curStreak = 0, maxStreak = 0;
        let curGap = 0, maxGap = 0;
        const recoveredGaps: number[] = [];

        for (const date of dueDates) {
            if (isDone(habit, toDateKey(date), completions)) {
                maxStreak = Math.max(maxStreak, ++curStreak);
                if (curGap > 0) recoveredGaps.push(curGap);
                curGap = 0;
            } else {
                curStreak = 0;
                curGap++;
                maxGap = Math.max(maxGap, curGap);
            }
        }

        if (recoveredGaps.length === 0 || maxStreak === 0) continue;
        const avgRecovery = recoveredGaps.reduce((a, b) => a + b, 0) / recoveredGaps.length;
        results.push({
            id: `resilience-${habit.id}`,
            category: 'resilience',
            text: `Your longest streak on "${habit.name}" is ${maxStreak} day${maxStreak === 1 ? '' : 's'}, and your longest gap is ${maxGap} day${maxGap === 1 ? '' : 's'} — but historically you've bounced back within about ${Math.round(avgRecovery)} day${Math.round(avgRecovery) === 1 ? '' : 's'} of missing one.`
        });
    }
    return results.slice(0, 3);
};

const cuttingItClose = (habits: Habit[], completionTimestamps: CompletionTimestamps | undefined): Insight[] => {
    if (!completionTimestamps) return [];
    const results: { insight: Insight; rate: number }[] = [];
    for (const habit of activeHabits(habits)) {
        const stamps = completionTimestamps[habit.id];
        if (!stamps) continue;
        let late = 0, total = 0;
        for (const dateKey of Object.keys(stamps)) {
            const loggedAt = new Date(stamps[dateKey]);
            if (Number.isNaN(loggedAt.getTime())) continue;
            // Only count same-day logs — a backfilled entry's timestamp reflects when it was
            // entered, not when the habit actually happened, so it isn't a timing signal.
            if (toDateKey(loggedAt) !== dateKey) continue;
            total++;
            if (loggedAt.getHours() >= 21) late++;
        }
        if (total < 8) continue;
        const rate = late / total;
        if (rate >= 0.4) {
            results.push({
                rate,
                insight: {
                    id: `timing-${habit.id}`,
                    category: 'timing',
                    text: `You complete "${habit.name}" late in the day more often than not (${Math.round(rate * 100)}% after 9pm) — a habit like that is more fragile than it looks, since one busy evening can break the streak.`
                }
            });
        }
    }
    return results.sort((a, b) => b.rate - a.rate).slice(0, 3).map(r => r.insight);
};

const relativeConsistency = (habits: Habit[], completions: HabitCompletion, notes: DailyNote, today: Date): Insight[] => {
    const active = activeHabits(habits);
    if (active.length === 0) return [];

    const tally = (dates: Date[]) => {
        let due = 0, done = 0;
        for (const habit of active) {
            for (const date of dates) {
                if (!isDueOn(habit, date, notes)) continue;
                due++;
                if (isDone(habit, toDateKey(date), completions)) done++;
            }
        }
        return { due, done };
    };

    const recent = tally(buildDateRange(today, 30));
    const baseline = tally(buildDateRange(today, 210).slice(0, 180)); // the ~6 months before the last 30 days

    if (recent.due < 10 || baseline.due < 30) return [];

    const recentRate = recent.done / recent.due;
    const baselineRate = baseline.done / baseline.due;
    const diff = recentRate - baselineRate;
    if (Math.abs(diff) < 0.08) return [];

    return [{
        id: 'consistency-overall',
        category: 'consistency',
        text: `Overall you're at ${Math.round(recentRate * 100)}% completion this month, ${diff > 0 ? 'up' : 'down'} from your ~${Math.round(baselineRate * 100)}% average over the past several months.`
    }];
};

const crossHabitCorrelation = (habits: Habit[], completions: HabitCompletion, notes: DailyNote, today: Date): Insight[] => {
    const active = activeHabits(habits);
    const dates = buildDateRange(today, 60);
    const results: { insight: Insight; rate: number }[] = [];

    for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
            const a = active[i], b = active[j];
            let bothDue = 0, matched = 0;
            for (const date of dates) {
                if (!isDueOn(a, date, notes) || !isDueOn(b, date, notes)) continue;
                bothDue++;
                if (isDone(a, toDateKey(date), completions) === isDone(b, toDateKey(date), completions)) matched++;
            }
            if (bothDue < 14) continue;
            const rate = matched / bothDue;
            if (rate >= 0.85) {
                results.push({
                    rate,
                    insight: {
                        id: `corr-${a.id}-${b.id}`,
                        category: 'correlation',
                        text: `"${a.name}" and "${b.name}" tend to succeed or fail together — matched on ${Math.round(rate * 100)}% of the days you had both scheduled. They might be pulling the same lever.`
                    }
                });
            }
        }
    }
    return results.sort((a, b) => b.rate - a.rate).slice(0, 2).map(r => r.insight);
};

export const generateInsights = (
    habits: Habit[],
    completions: HabitCompletion,
    notes: DailyNote,
    completionTimestamps?: CompletionTimestamps
): Insight[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return [
        ...atRiskHabits(habits, completions, notes, today),
        ...relativeConsistency(habits, completions, notes, today),
        ...weekdayBreakdown(habits, completions, notes, today),
        ...resilienceStats(habits, completions, notes, today),
        ...cuttingItClose(habits, completionTimestamps),
        ...crossHabitCorrelation(habits, completions, notes, today),
    ];
};
