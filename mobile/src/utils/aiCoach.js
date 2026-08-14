// Mobile port of the web AI Coach (src/utils/aiCoachPrompt.ts + aiCoachTools.ts).
// Prompts, tool declarations and the rich-context math are kept byte-for-byte
// equivalent to the web app so both platforms produce the same kind of insight.
// Deviation from web: no DiceBear avatars (no network image fetch on mobile) —
// each personality carries an emoji + color instead.

import { parseDateStringLocal } from './dateKeys';

export const AI_DAILY_LIMIT = 5;

export const AI_COACH_PERSONALITIES = [
    {
        id: 'direct',
        label: 'Direct',
        description: 'Blunt and to the point — just the sharpest insight, no fluff.',
        emoji: '🤖',
        color: '#3b82f6',
    },
    {
        id: 'hype',
        label: 'Hype',
        description: 'Loud, enthusiastic, in your corner — big energy, big praise.',
        emoji: '🎉',
        color: '#f59e0b',
    },
    {
        id: 'zen',
        label: 'Calm',
        description: 'Gentle and grounded — quiet observations, no pressure.',
        emoji: '🧘',
        color: '#10b981',
    },
    {
        id: 'drill',
        label: 'Tough',
        description: 'Tough love, zero excuses — calls out slacking directly.',
        emoji: '💪',
        color: '#ef4444',
    },
    {
        id: 'witty',
        label: 'Roast',
        description: 'Sharp, sarcastic humor — brutally honest, wrapped in a joke.',
        emoji: '🔥',
        color: '#a855f7',
    },
];

export const AI_SUGGESTED_QUESTIONS = [
    "What's a pattern in my habits I probably haven't noticed?",
    'Why do I keep falling off the same habits?',
    'If I could only fix one thing this week, what should it be?',
    "What's actually working for me right now, and why?",
    'Am I close to burning out on any of these, or slacking?',
];

export const personalityMeta = (personality) =>
    AI_COACH_PERSONALITIES.find(p => p.id === personality) || AI_COACH_PERSONALITIES[0];

const PERSONALITY_VOICE = {
    direct: 'You are a brilliant, direct habit coach. No fluff, no hedging — just the sharpest, most specific insight you can find.',
    hype: 'You are a hype-man habit coach. High energy, genuinely excited about the user\'s wins, and unafraid to hype them up loudly — but every bit of hype must still be backed by a real number. Use exclamation points and enthusiasm, but never invent praise.',
    zen: 'You are a calm, grounded habit coach with a mindful, zen tone. Speak gently and without urgency — like a wise, unhurried mentor. No exclamation points, no pressure, just clear-eyed observation.',
    drill: 'You are a tough-love, drill-sergeant habit coach. Blunt, no-excuses, high standards — call out slacking directly. You push hard because you want the user to win, but you never insult them personally, only their excuses.',
    witty: 'You are a roasting habit coach with a sharp, sarcastic sense of humor. Dry one-liners and playful jabs at the user\'s excuses are welcome, but the underlying insight must always be real and specific — the joke rides on top of the data, never replaces it.',
};

export const personalityVoice = (personality = 'direct') =>
    PERSONALITY_VOICE[personality] || PERSONALITY_VOICE.direct;

// Matches the languages offered in mobile Settings.
const LANGUAGE_NAMES = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
};

const languageInstruction = (language) => {
    if (!language || language === 'en') return '';
    const name = LANGUAGE_NAMES[language] || language;
    return ` Respond entirely in ${name}, regardless of what language the habit names or data labels below are in.`;
};

// ── Gemini function declarations ─────────────────────────────────────────────

export const GEMINI_TOOLS = [
    {
        functionDeclarations: [
            {
                name: 'get_habit_stats',
                description: 'Get completion rate and count for habits over a specific period. Use this for questions about performance in a year, month, or date range.',
                parameters: {
                    type: 'object',
                    properties: {
                        year: { type: 'number', description: 'Year (e.g. 2024, 2025). Omit for all time.' },
                        month: { type: 'number', description: 'Month 1-12. Requires year.' },
                        habit_name: { type: 'string', description: 'Filter to a specific habit by name (partial, case-insensitive). Omit for all habits.' },
                        top_n: { type: 'number', description: 'Return only the top N habits by completion rate (default: all).' },
                        sort: { type: 'string', enum: ['best', 'worst'], description: 'Sort order. Default: best.' },
                    },
                },
            },
            {
                name: 'get_streaks',
                description: 'Get current streak and longest-ever streak for one or all habits.',
                parameters: {
                    type: 'object',
                    properties: {
                        habit_name: { type: 'string', description: 'Filter to a specific habit (partial, case-insensitive). Omit for all habits.' },
                    },
                },
            },
            {
                name: 'get_monthly_breakdown',
                description: 'Get month-by-month completion rates for a habit or overall, for a given year.',
                parameters: {
                    type: 'object',
                    properties: {
                        year: { type: 'number', description: 'Year to break down (e.g. 2025).' },
                        habit_name: { type: 'string', description: 'Specific habit name (partial, case-insensitive). Omit for overall.' },
                    },
                    required: ['year'],
                },
            },
            {
                name: 'get_habit_list',
                description: 'List all habits the user has, with their creation date and current status (active/archived).',
                parameters: { type: 'object', properties: {} },
            },
        ],
    },
];

// ── Shared helpers ───────────────────────────────────────────────────────────

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const filterHabits = (habits, habitName) => {
    if (!habitName) return habits;
    const q = habitName.toLowerCase();
    return habits.filter(h => (h.name || '').toLowerCase().includes(q));
};

const dateKeysForPeriod = (year, month) => {
    if (!year) return () => true;
    const prefix = month ? `${year}-${String(month).padStart(2, '0')}` : `${year}-`;
    return (key) => key.startsWith(prefix);
};

const completionsForHabit = (habit, completions, inPeriod) => {
    const entries = completions[habit.id] || {};
    const dates = Object.keys(entries).filter(k => entries[k] && inPeriod(k));
    return { completed: dates.length, dates };
};

// Days the habit could have been done in the period, respecting its weekday
// frequency. Deliberately identical to the web implementation, including the
// quirk that a month window counts the whole calendar month (not just days so
// far) — so the same user sees the same percentages on web and mobile.
export const estimatePossibleDays = (habit, year, month) => {
    const start = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const end = month
        ? new Date(year, month, 0)
        : new Date(Math.min(new Date(year, 11, 31).getTime(), Date.now()));

    if (start > new Date()) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
        const dow = cur.getDay();
        const isActive = !habit.frequency || habit.frequency.includes(dow);
        if (isActive) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
};

// ── Tool execution ───────────────────────────────────────────────────────────

const getHabitStats = (args, habits, completions) => {
    const inPeriod = dateKeysForPeriod(args.year, args.month);
    const targets = filterHabits(habits, args.habit_name);

    const results = targets.map(h => {
        const { completed, dates } = completionsForHabit(h, completions, inPeriod);
        const possibleDays = args.year
            ? estimatePossibleDays(h, args.year, args.month)
            : Object.keys(completions[h.id] || {}).length || completed;
        const rate = possibleDays > 0 ? Math.round((completed / possibleDays) * 100) : 0;
        return {
            habit: h.name,
            completed,
            possible: possibleDays,
            rate,
            firstDate: dates[0] || null,
            lastDate: dates[dates.length - 1] || null,
        };
    });

    const sorted = results.sort((a, b) => (args.sort === 'worst' ? a.rate - b.rate : b.rate - a.rate));
    const topN = args.top_n ? sorted.slice(0, args.top_n) : sorted;

    return {
        period: args.month ? `${args.year}-${args.month}` : args.year ? `${args.year}` : 'all time',
        habits: topN,
    };
};

const getStreaks = (args, habits, completions) => {
    const targets = filterHabits(habits, args.habit_name);

    const results = targets.map(h => {
        const entries = completions[h.id] || {};
        const dates = Object.keys(entries).filter(k => entries[k]).sort();

        if (dates.length === 0) return { habit: h.name, currentStreak: 0, longestStreak: 0, lastCompleted: null };

        const { current, longest } = computeStreaks(dates);
        return {
            habit: h.name,
            currentStreak: current,
            longestStreak: longest,
            lastCompleted: dates[dates.length - 1],
        };
    });

    return { habits: results.sort((a, b) => b.longestStreak - a.longestStreak) };
};

const getMonthlyBreakdown = (args, habits, completions) => {
    const targets = filterHabits(habits, args.habit_name);
    if (targets.length === 0) return { error: 'No matching habits found.' };

    const breakdown = MONTH_NAMES.map((monthName, mIdx) => {
        const month = mIdx + 1;
        const inPeriod = dateKeysForPeriod(args.year, month);

        let totalCompleted = 0;
        let totalPossible = 0;
        targets.forEach(h => {
            const { completed } = completionsForHabit(h, completions, inPeriod);
            totalPossible += estimatePossibleDays(h, args.year, month);
            totalCompleted += completed;
        });

        const rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : null;
        return { month: monthName, completed: totalCompleted, possible: totalPossible, rate };
    });

    const rated = breakdown.filter(m => m.rate !== null);
    return {
        year: args.year,
        scope: targets.length === 1 ? targets[0].name : 'all habits',
        months: breakdown,
        best: [...rated].sort((a, b) => (b.rate || 0) - (a.rate || 0))[0]?.month || null,
        worst: [...rated].sort((a, b) => (a.rate || 0) - (b.rate || 0))[0]?.month || null,
    };
};

const getHabitList = (habits) => ({
    habits: habits.map(h => ({
        name: h.name,
        description: h.description || null,
        status: h.archivedAt ? 'archived' : 'active',
        createdAt: h.createdAt || null,
        frequency: h.frequency ? `${h.frequency.length} days/week` : 'daily',
    })),
});

export const executeTool = (name, args, habits, completions) => {
    switch (name) {
        case 'get_habit_stats': return getHabitStats(args || {}, habits, completions);
        case 'get_streaks': return getStreaks(args || {}, habits, completions);
        case 'get_monthly_breakdown': return getMonthlyBreakdown(args || {}, habits, completions);
        case 'get_habit_list': return getHabitList(habits);
        default: return { error: `Unknown tool: ${name}` };
    }
};

// ── Rich context ─────────────────────────────────────────────────────────────

export function computeStreaks(dates) {
    if (!dates || dates.length === 0) return { current: 0, longest: 0 };
    const sorted = [...dates].sort();
    let longest = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
        if (diff === 1) { run++; longest = Math.max(longest, run); }
        else run = 1;
    }
    const last = new Date(sorted[sorted.length - 1]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysSince = Math.floor((today.getTime() - last.getTime()) / 86400000);

    let current = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
        const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
        if (diff === 1) current++;
        else break;
    }
    return { current: daysSince <= 1 ? current : 0, longest };
}

const dowStats = (dates, habit) => {
    const counts = new Array(7).fill(0);
    const opportunities = new Array(7).fill(0);
    dates.forEach(d => { counts[new Date(d).getDay()]++; });

    const start = parseDateStringLocal(habit.createdAt) || new Date(2020, 0, 1);
    const end = new Date();
    const cur = new Date(start);
    while (cur <= end) {
        const dow = cur.getDay();
        if (!habit.frequency || habit.frequency.includes(dow)) opportunities[dow]++;
        cur.setDate(cur.getDate() + 1);
    }

    const rates = counts.map((c, i) => (opportunities[i] > 0 ? Math.round((c / opportunities[i]) * 100) : null));
    const valid = rates.map((r, i) => ({ dow: i, rate: r })).filter(x => x.rate !== null);
    if (valid.length === 0) return { best: null, worst: null };
    const best = valid.reduce((a, b) => (b.rate > a.rate ? b : a));
    const worst = valid.reduce((a, b) => (b.rate < a.rate ? b : a));
    return { best: `${DOW[best.dow]} (${best.rate}%)`, worst: `${DOW[worst.dow]} (${worst.rate}%)` };
};

const monthRate = (dates, habit, year, month) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const completed = dates.filter(d => d.startsWith(prefix)).length;
    const possible = estimatePossibleDays(habit, year, month);
    return possible > 0 ? Math.round((completed / possible) * 100) : null;
};

// Mobile equivalent of the web app's `annualStats` fields the coach prompt uses
// (web: src/hooks/useHabitStats.ts). Same momentum thresholds.
export const computeAnnualContext = (habits, completions) => {
    const year = new Date().getFullYear();
    let totalCompletions = 0;
    let totalPossible = 0;

    const monthlyRates = [];
    for (let month = 1; month <= 12; month++) {
        let monthCompleted = 0;
        let monthPossible = 0;
        habits.forEach(h => {
            const entries = completions[h.id] || {};
            const prefix = `${year}-${String(month).padStart(2, '0')}`;
            monthCompleted += Object.keys(entries).filter(k => entries[k] && k.startsWith(prefix)).length;
            monthPossible += estimatePossibleDays(h, year, month);
        });
        totalCompletions += monthCompleted;
        totalPossible += monthPossible;
        if (monthPossible > 0) {
            monthlyRates.push({ month, rate: (monthCompleted / monthPossible) * 100 });
        }
    }

    const consistencyRate = totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0;
    const activeMonths = monthlyRates.filter(m => m.rate > 0);
    const recentRate = activeMonths.length >= 2
        ? (activeMonths[activeMonths.length - 1].rate + activeMonths[activeMonths.length - 2].rate) / 2
        : activeMonths.length === 1 ? activeMonths[0].rate : 0;
    const momentum = recentRate > consistencyRate * 1.1
        ? 'ascending'
        : recentRate < consistencyRate * 0.8 ? 'descending' : 'stable';

    return { consistencyRate, totalCompletions, totalPossible, momentum };
};

// Completion-rate change over the trailing 7 / 30 days vs the 7 / 30 before it,
// standing in for the web app's weekDelta / monthDelta.
export const computeDeltas = (habits, completions) => {
    const rateForWindow = (startOffset, endOffset) => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let completed = 0;
        let possible = 0;
        for (let i = startOffset; i > endOffset; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            habits.forEach(h => {
                if (h.weeklyTarget) return;
                const created = parseDateStringLocal(h.createdAt);
                if (created && d < created) return;
                if (h.frequency && !h.frequency.includes(d.getDay())) return;
                possible++;
                if (completions[h.id]?.[key]) completed++;
            });
        }
        return possible > 0 ? (completed / possible) * 100 : null;
    };

    const thisWeek = rateForWindow(6, -1);
    const lastWeek = rateForWindow(13, 6);
    const thisMonth = rateForWindow(29, -1);
    const lastMonth = rateForWindow(59, 29);

    return {
        weekDelta: thisWeek !== null && lastWeek !== null ? thisWeek - lastWeek : null,
        monthDelta: thisMonth !== null && lastMonth !== null ? thisMonth - lastMonth : null,
    };
};

export const computeRichContext = (habits, completions, annualStats, weekDelta, monthDelta) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth() + 1;

    const last3 = [];
    for (let i = 2; i >= 0; i--) {
        const d = new Date(thisYear, thisMonth - 1 - i, 1);
        last3.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_NAMES[d.getMonth()] });
    }

    const habitStats = habits.map(h => {
        const entries = completions[h.id] || {};
        const dates = Object.keys(entries).filter(k => entries[k]).sort();
        const { current, longest } = computeStreaks(dates);
        const last = dates[dates.length - 1] || null;
        const daysSinceLast = last
            ? Math.floor((today.getTime() - new Date(last).getTime()) / 86400000)
            : null;

        const monthGroups = {};
        dates.forEach(d => {
            const key = d.slice(0, 7);
            if (!monthGroups[key]) monthGroups[key] = 0;
            monthGroups[key]++;
        });
        const monthRates = Object.keys(monthGroups).map(key => {
            const [y, m] = key.split('-').map(Number);
            const possible = estimatePossibleDays(h, y, m);
            const rate = possible > 0 ? Math.round((monthGroups[key] / possible) * 100) : 0;
            return { key, label: `${MONTH_NAMES[m - 1]} ${y}`, rate };
        }).filter(x => x.rate > 0);

        const bestMonth = monthRates.length > 0 ? monthRates.reduce((a, b) => (b.rate > a.rate ? b : a)) : null;
        const worstMonth = monthRates.length > 0 ? monthRates.reduce((a, b) => (b.rate < a.rate ? b : a)) : null;

        const l3 = last3.map(({ year, month, label }) => {
            const r = monthRate(dates, h, year, month);
            return r !== null ? `${label} ${r}%` : `${label} —`;
        }).join(' → ');

        const { best: bestDow, worst: worstDow } = dowStats(dates, h);

        const yearDates = dates.filter(d => d.startsWith(`${thisYear}-`));
        const possibleYear = estimatePossibleDays(h, thisYear);
        const thisYearRate = possibleYear > 0 ? Math.round((yearDates.length / possibleYear) * 100) : null;
        const thisMonthRate = monthRate(dates, h, thisYear, thisMonth);
        const todayKey = `${thisYear}-${String(thisMonth).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        return {
            name: h.name,
            description: h.description,
            doneToday: entries[todayKey] === true,
            totalCompletions: dates.length,
            currentStreak: current,
            longestStreak: longest,
            daysSinceLastDone: daysSinceLast,
            thisMonthRate,
            thisYearRate,
            bestMonthEver: bestMonth ? `${bestMonth.label} (${bestMonth.rate}%)` : null,
            worstMonthEver: worstMonth ? `${worstMonth.label} (${worstMonth.rate}%)` : null,
            last3Months: l3,
            bestDayOfWeek: bestDow,
            worstDayOfWeek: worstDow,
        };
    });

    const allDates = Object.values(completions).flatMap(h => Object.keys(h).filter(k => h[k]));
    const dowCounts = new Array(7).fill(0);
    const dowOpps = new Array(7).fill(0);
    allDates.forEach(d => dowCounts[new Date(d).getDay()]++);
    const cursor = new Date('2020-01-01');
    while (cursor <= today) { dowOpps[cursor.getDay()] += habits.length; cursor.setDate(cursor.getDate() + 1); }
    const dowRates = dowCounts.map((c, i) => (dowOpps[i] > 0 ? Math.round((c / dowOpps[i]) * 100) : 0));
    const bestDowIdx = dowRates.indexOf(Math.max(...dowRates));
    const worstDowIdx = dowRates.indexOf(Math.min(...dowRates));

    const overallMonthGroups = {};
    allDates.forEach(d => {
        const key = d.slice(0, 7);
        overallMonthGroups[key] = (overallMonthGroups[key] || 0) + 1;
    });
    const overallMonthRates = Object.keys(overallMonthGroups).map(key => {
        const [y, m] = key.split('-').map(Number);
        const possible = habits.reduce((sum, h) => sum + estimatePossibleDays(h, y, m), 0);
        const rate = possible > 0 ? Math.round((overallMonthGroups[key] / possible) * 100) : 0;
        return { key, label: `${MONTH_NAMES[m - 1]} ${y}`, rate };
    });
    const bestOverallMonth = overallMonthRates.length > 0
        ? overallMonthRates.reduce((a, b) => (b.rate > a.rate ? b : a))
        : null;

    const l3Overall = last3.map(({ year, month, label }) => {
        let completed = 0;
        let possible = 0;
        habits.forEach(h => {
            const entries = completions[h.id] || {};
            const dates2 = Object.keys(entries).filter(k => entries[k]);
            completed += dates2.filter(d => d.startsWith(`${year}-${String(month).padStart(2, '0')}`)).length;
            possible += estimatePossibleDays(h, year, month);
        });
        return possible > 0 ? `${label} ${Math.round((completed / possible) * 100)}%` : `${label} —`;
    }).join(' → ');

    const allStreaks = habitStats.map(h => ({ habit: h.name, days: h.longestStreak })).filter(x => x.days > 0);
    const longestSingle = allStreaks.length > 0 ? allStreaks.reduce((a, b) => (b.days > a.days ? b : a)) : null;

    const sorted = [...habitStats]
        .filter(h => h.thisYearRate !== null)
        .sort((a, b) => (b.thisYearRate || 0) - (a.thisYearRate || 0));
    const byTotal = [...habitStats].sort((a, b) => b.totalCompletions - a.totalCompletions);

    return {
        habits: habitStats,
        overall: {
            consistencyRate: annualStats?.consistencyRate || 0,
            totalCompletions: annualStats?.totalCompletions || 0,
            totalPossible: annualStats?.totalPossible || 0,
            momentum: annualStats?.momentum || 'unknown',
            weekDelta: weekDelta === undefined ? null : weekDelta,
            monthDelta: monthDelta === undefined ? null : monthDelta,
            bestDayOfWeek: `${DOW[bestDowIdx]} (${dowRates[bestDowIdx]}%)`,
            worstDayOfWeek: `${DOW[worstDowIdx]} (${dowRates[worstDowIdx]}%)`,
            bestMonthEver: bestOverallMonth ? `${bestOverallMonth.label} (${bestOverallMonth.rate}%)` : null,
            last3MonthsRates: l3Overall,
            habitCount: habits.length,
            activeHabitCount: habits.filter(h => !h.archivedAt).length,
            longestSingleStreak: longestSingle,
            mostConsistentHabit: sorted[0]?.name || null,
            leastConsistentHabit: sorted[sorted.length - 1]?.name || null,
            habitWithMostTotalCompletions: byTotal[0]?.name || null,
        },
    };
};

// ── Prompts ──────────────────────────────────────────────────────────────────

export const buildInsightPrompt = (todayKey, habits, overall, personality = 'direct', language) => {
    const habitBlock = habits.map(h => {
        const lines = [
            `• ${h.name}${h.description ? ` (${h.description})` : ''}`,
            `  Today: ${h.doneToday ? 'done' : 'NOT done'} | This month: ${h.thisMonthRate !== null ? h.thisMonthRate + '%' : 'n/a'} | This year: ${h.thisYearRate !== null ? h.thisYearRate + '%' : 'n/a'}`,
            `  Streaks: current=${h.currentStreak}d, longest ever=${h.longestStreak}d`,
            `  Last done: ${h.daysSinceLastDone === 0 ? 'today' : h.daysSinceLastDone === 1 ? 'yesterday' : h.daysSinceLastDone !== null ? `${h.daysSinceLastDone} days ago` : 'never'}`,
            `  Total completions: ${h.totalCompletions}`,
            `  Last 3 months: ${h.last3Months}`,
            h.bestMonthEver ? `  Best month ever: ${h.bestMonthEver}` : null,
            h.bestDayOfWeek ? `  Best day: ${h.bestDayOfWeek} | Worst day: ${h.worstDayOfWeek}` : null,
        ].filter(Boolean);
        return lines.join('\n');
    }).join('\n\n');

    const overallBlock = [
        `Overall consistency this year: ${Math.round(overall.consistencyRate)}% (${Math.round(overall.totalCompletions)}/${Math.round(overall.totalPossible)} completions)`,
        `Momentum: ${overall.momentum}`,
        overall.weekDelta !== null ? `Week-over-week delta: ${overall.weekDelta > 0 ? '+' : ''}${Math.round(overall.weekDelta)}%` : null,
        overall.monthDelta !== null ? `Month-over-month delta: ${overall.monthDelta > 0 ? '+' : ''}${Math.round(overall.monthDelta)}%` : null,
        `Last 3 months (all habits): ${overall.last3MonthsRates}`,
        overall.bestMonthEver ? `Best month ever: ${overall.bestMonthEver}` : null,
        `Best day of week: ${overall.bestDayOfWeek} | Worst: ${overall.worstDayOfWeek}`,
        overall.longestSingleStreak ? `Longest single habit streak ever: ${overall.longestSingleStreak.habit} — ${overall.longestSingleStreak.days} days` : null,
        `Most consistent habit (this year): ${overall.mostConsistentHabit || 'n/a'}`,
        `Least consistent habit (this year): ${overall.leastConsistentHabit || 'n/a'}`,
        `Most total completions ever: ${overall.habitWithMostTotalCompletions || 'n/a'}`,
        `Active habits: ${overall.activeHabitCount} of ${overall.habitCount} total`,
    ].filter(Boolean).join('\n');

    return `${personalityVoice(personality)}${languageInstruction(language)} The user is opening their AI Coach panel right now. Hit them with something they've never noticed about themselves.

Today: ${todayKey}

═══ OVERALL ═══
${overallBlock}

═══ HABITS (detailed) ═══
${habitBlock}

═══ YOUR TASK ═══
Respond ONLY with a valid JSON object — no markdown, no code fences, no extra text.

{
  "message": "2-3 sentences MAX. Be specific — use actual numbers from the data. Deliver one insight so precise it feels like you've been watching them. Make it personal and slightly unexpected. End on a concrete next action, not just the observation. No asterisks, no markdown, no bullet points.",
  "categories": [
    {"category":"solid","habits":["exact habit name"],"note":"one plain sentence with a specific number or fact"},
    {"category":"dead","habits":["exact habit name"],"note":"one blunt sentence on what the data says, immediately followed by the one concrete move to fix it — never end on the criticism alone"},
    {"category":"auto","habits":["exact habit name"],"note":"one sentence — why this is identity-level now"},
    {"category":"improve","habits":["exact habit name"],"note":"one concrete, specific suggestion based on their day-of-week data or trend"},
    {"category":"pattern","habits":[],"note":"one cross-habit insight that connects two or more habits — something invisible in the raw numbers"}
  ]
}

Rules:
- Use exact numbers from the data above (streaks, days, percentages, totals).
- Habit names must match exactly.
- Omit a category if nothing genuinely fits — do not fabricate.
- No generic motivational language. Every sentence must be falsifiable — if the number weren't true, the sentence would be different.
- Always leave the user with a path forward. Even when a note is critical or delivers bad news, it must point at one specific, doable next step — never end on a bare diagnosis with nothing to do about it.${language && language !== 'en' ? ' The JSON keys and "category" values must stay exactly as shown (e.g. "message", "habits", "note", "solid", "dead") — only translate the "message" and "note" text content, and keep habit names exactly as given.' : ''}`;
};

export const buildChatSystemPrompt = (todayKey, habits, overall, personality = 'direct', language) => {
    const habitSummary = habits.map(h =>
        `- ${h.name}: today=${h.doneToday ? 'done' : 'not done'}, month=${h.thisMonthRate !== null ? h.thisMonthRate : 'n/a'}%, year=${h.thisYearRate !== null ? h.thisYearRate : 'n/a'}%, streak=${h.currentStreak}d`
    ).join('\n');

    return `${personalityVoice(personality)}${languageInstruction(language)} You are this coach for HabiCard. Today is ${todayKey}.
Overall consistency: ${Math.round(overall.consistencyRate)}%, momentum: ${overall.momentum}.
Best day: ${overall.bestDayOfWeek}, worst day: ${overall.worstDayOfWeek}.

User's habits (snapshot):
${habitSummary}

You also have tools to look up historical data — use them when the user asks about specific time periods, streaks, or comparisons.
Be concise and specific. You may use **bold** for emphasis. Keep responses under 4 sentences unless detail is truly needed.

Always leave the user with a path forward. If you have to point out a problem — a broken streak, a bad month, a habit that's failing — never end there. Follow it immediately with one specific, doable next step. A diagnosis without a next move is an incomplete answer.`;
};
