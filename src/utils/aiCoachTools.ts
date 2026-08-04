import { Habit, HabitCompletion } from '../types';

// ── Gemini function declarations ──────────────────────────────────────────────

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

// ── Tool execution ────────────────────────────────────────────────────────────

export function executeTool(
  name: string,
  args: Record<string, any>,
  habits: Habit[],
  completions: HabitCompletion,
): unknown {
  switch (name) {
    case 'get_habit_stats':       return getHabitStats(args as any, habits, completions);
    case 'get_streaks':           return getStreaks(args as any, habits, completions);
    case 'get_monthly_breakdown': return getMonthlyBreakdown(args as any, habits, completions);
    case 'get_habit_list':        return getHabitList(habits);
    default: return { error: `Unknown tool: ${name}` };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function filterHabits(habits: Habit[], habitName?: string): Habit[] {
  if (!habitName) return habits;
  const q = habitName.toLowerCase();
  return habits.filter(h => h.name.toLowerCase().includes(q));
}

function dateKeysForPeriod(year?: number, month?: number): (key: string) => boolean {
  if (!year) return () => true;
  const prefix = month
    ? `${year}-${String(month).padStart(2, '0')}`
    : `${year}-`;
  return (key: string) => key.startsWith(prefix);
}

function completionsForHabit(
  habit: Habit,
  completions: HabitCompletion,
  inPeriod: (key: string) => boolean,
): { completed: number; dates: string[] } {
  const entries = completions[habit.id] ?? {};
  const dates = Object.keys(entries).filter(k => entries[k] && inPeriod(k));
  return { completed: dates.length, dates };
}

// ── Tool implementations ──────────────────────────────────────────────────────

function getHabitStats(
  args: { year?: number; month?: number; habit_name?: string; top_n?: number; sort?: string },
  habits: Habit[],
  completions: HabitCompletion,
) {
  const inPeriod = dateKeysForPeriod(args.year, args.month);
  const targets = filterHabits(habits, args.habit_name);

  const results = targets.map(h => {
    const { completed, dates } = completionsForHabit(h, completions, inPeriod);
    // Estimate possible days: unique days in period where habit exists
    const possibleDays = args.year
      ? estimatePossibleDays(h, args.year, args.month)
      : Object.keys(completions[h.id] ?? {}).length || completed;
    const rate = possibleDays > 0 ? Math.round((completed / possibleDays) * 100) : 0;
    return { habit: h.name, completed, possible: possibleDays, rate, firstDate: dates[0] ?? null, lastDate: dates[dates.length - 1] ?? null };
  });

  const sorted = results.sort((a, b) =>
    (args.sort === 'worst' ? a.rate - b.rate : b.rate - a.rate)
  );
  const topN = args.top_n ? sorted.slice(0, args.top_n) : sorted;

  return {
    period: args.month ? `${args.year}-${args.month}` : args.year ? `${args.year}` : 'all time',
    habits: topN,
  };
}

function estimatePossibleDays(habit: Habit, year: number, month?: number): number {
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
}

function getStreaks(
  args: { habit_name?: string },
  habits: Habit[],
  completions: HabitCompletion,
) {
  const targets = filterHabits(habits, args.habit_name);

  const results = targets.map(h => {
    const dates = Object.keys(completions[h.id] ?? {})
      .filter(k => completions[h.id][k])
      .sort();

    if (dates.length === 0) return { habit: h.name, currentStreak: 0, longestStreak: 0, lastCompleted: null };

    let longest = 1, current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const cur = new Date(dates[i]);
      const diff = (cur.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    // Check if streak is still active (last date is today or yesterday)
    const last = new Date(dates[dates.length - 1]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSinceLast = Math.floor((today.getTime() - last.getTime()) / 86400000);
    const activeStreak = daysSinceLast <= 1 ? current : 0;

    return {
      habit: h.name,
      currentStreak: activeStreak,
      longestStreak: longest,
      lastCompleted: dates[dates.length - 1],
    };
  });

  return { habits: results.sort((a, b) => b.longestStreak - a.longestStreak) };
}

function getMonthlyBreakdown(
  args: { year: number; habit_name?: string },
  habits: Habit[],
  completions: HabitCompletion,
) {
  const targets = filterHabits(habits, args.habit_name);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (targets.length === 0) return { error: 'No matching habits found.' };

  const breakdown = MONTHS.map((monthName, mIdx) => {
    const month = mIdx + 1;
    const inPeriod = dateKeysForPeriod(args.year, month);

    let totalCompleted = 0, totalPossible = 0;
    targets.forEach(h => {
      const { completed } = completionsForHabit(h, completions, inPeriod);
      const possible = estimatePossibleDays(h, args.year, month);
      totalCompleted += completed;
      totalPossible += possible;
    });

    const rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : null;
    return { month: monthName, completed: totalCompleted, possible: totalPossible, rate };
  });

  return {
    year: args.year,
    scope: targets.length === 1 ? targets[0].name : 'all habits',
    months: breakdown,
    best: [...breakdown].filter(m => m.rate !== null).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))[0]?.month ?? null,
    worst: [...breakdown].filter(m => m.rate !== null).sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0))[0]?.month ?? null,
  };
}

function getHabitList(habits: Habit[]) {
  return {
    habits: habits.map(h => ({
      name: h.name,
      description: h.description ?? null,
      status: h.archivedAt ? 'archived' : 'active',
      createdAt: h.createdAt ?? null,
      frequency: h.frequency ? `${h.frequency.length} days/week` : 'daily',
    })),
  };
}

// ── Rich context for the insight prompt ──────────────────────────────────────

const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export interface RichHabitStat {
  name: string;
  description?: string;
  doneToday: boolean;
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  daysSinceLastDone: number | null;
  thisMonthRate: number | null;
  thisYearRate: number | null;
  bestMonthEver: string | null;       // e.g. "Mar 2025 (91%)"
  worstMonthEver: string | null;
  last3Months: string;                // e.g. "Apr 72% → May 58% → Jun 12%"
  bestDayOfWeek: string | null;       // e.g. "Tuesday (88%)"
  worstDayOfWeek: string | null;
}

export interface RichOverallContext {
  consistencyRate: number;
  totalCompletions: number;
  totalPossible: number;
  momentum: string;
  weekDelta: number | null;
  monthDelta: number | null;
  bestDayOfWeek: string | null;
  worstDayOfWeek: string | null;
  bestMonthEver: string | null;
  last3MonthsRates: string;           // e.g. "Apr 55% → May 48% → Jun 9%"
  habitCount: number;
  activeHabitCount: number;
  longestSingleStreak: { habit: string; days: number } | null;
  mostConsistentHabit: string | null;
  leastConsistentHabit: string | null;
  habitWithMostTotalCompletions: string | null;
}

function computeStreaks(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };
  const sorted = [...dates].sort();
  let longest = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
    if (diff === 1) { run++; longest = Math.max(longest, run); }
    else run = 1;
  }
  const last = new Date(sorted[sorted.length - 1]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today.getTime() - last.getTime()) / 86400000);
  // Re-compute current streak from end
  let current = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
    if (diff === 1) current++;
    else break;
  }
  return { current: daysSince <= 1 ? current : 0, longest };
}

function dowStats(dates: string[], habits: Habit[], habit: Habit): { best: string | null; worst: string | null } {
  const counts: number[] = new Array(7).fill(0);
  const opportunities: number[] = new Array(7).fill(0);
  dates.forEach(d => { counts[new Date(d).getDay()]++; });
  // Count how many times each DOW appeared since habit creation
  const start = habit.createdAt ? new Date(habit.createdAt) : new Date('2020-01-01');
  const end = new Date();
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (!habit.frequency || habit.frequency.includes(dow)) opportunities[dow]++;
    cur.setDate(cur.getDate() + 1);
  }
  const rates = counts.map((c, i) => opportunities[i] > 0 ? Math.round((c / opportunities[i]) * 100) : null);
  const valid = rates.map((r, i) => ({ dow: i, rate: r })).filter(x => x.rate !== null) as { dow: number; rate: number }[];
  if (valid.length === 0) return { best: null, worst: null };
  const best = valid.reduce((a, b) => b.rate > a.rate ? b : a);
  const worst = valid.reduce((a, b) => b.rate < a.rate ? b : a);
  return {
    best: `${DOW[best.dow]} (${best.rate}%)`,
    worst: `${DOW[worst.dow]} (${worst.rate}%)`,
  };
}

function monthRate(dates: string[], habit: Habit, year: number, month: number): number | null {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const completed = dates.filter(d => d.startsWith(prefix)).length;
  const possible = estimatePossibleDays(habit, year, month);
  return possible > 0 ? Math.round((completed / possible) * 100) : null;
}

export function computeRichContext(
  habits: Habit[],
  completions: HabitCompletion,
  annualStats: any,
  weekDelta: number | null,
  monthDelta: number | null,
): { habits: RichHabitStat[]; overall: RichOverallContext } {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth() + 1;

  // Last 3 calendar months (including current)
  const last3: { year: number; month: number; label: string }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(thisYear, thisMonth - 1 - i, 1);
    last3.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_NAMES[d.getMonth()] });
  }

  const habitStats: RichHabitStat[] = habits.map(h => {
    const entries = completions[h.id] ?? {};
    const dates = Object.keys(entries).filter(k => entries[k]).sort();
    const { current, longest } = computeStreaks(dates);
    const last = dates[dates.length - 1] ?? null;
    const daysSinceLast = last
      ? Math.floor((today.getTime() - new Date(last).getTime()) / 86400000)
      : null;

    // Best and worst month ever
    const monthGroups: Record<string, number[]> = {};
    dates.forEach(d => { const key = d.slice(0, 7); (monthGroups[key] ??= []).push(1); });
    const monthRates = Object.keys(monthGroups).map(key => {
      const [y, m] = key.split('-').map(Number);
      const possible = estimatePossibleDays(h, y, m);
      const rate = possible > 0 ? Math.round((monthGroups[key].length / possible) * 100) : 0;
      return { key, label: `${MONTH_NAMES[m - 1]} ${y}`, rate };
    }).filter(x => x.rate > 0);

    const bestMonth = monthRates.length > 0
      ? monthRates.reduce((a, b) => b.rate > a.rate ? b : a)
      : null;
    const worstMonth = monthRates.length > 0
      ? monthRates.reduce((a, b) => b.rate < a.rate ? b : a)
      : null;

    // Last 3 months trend
    const l3 = last3.map(({ year, month, label }) => {
      const r = monthRate(dates, h, year, month);
      return r !== null ? `${label} ${r}%` : `${label} —`;
    }).join(' → ');

    // Day-of-week bias
    const { best: bestDow, worst: worstDow } = dowStats(dates, habits, h);

    // This year / this month rates
    const yearDates = dates.filter(d => d.startsWith(`${thisYear}-`));
    const possibleYear = estimatePossibleDays(h, thisYear);
    const thisYearRate = possibleYear > 0 ? Math.round((yearDates.length / possibleYear) * 100) : null;
    const thisMonthRate = monthRate(dates, h, thisYear, thisMonth);

    return {
      name: h.name,
      description: h.description,
      doneToday: entries[`${thisYear}-${String(thisMonth).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`] === true,
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

  // Overall day-of-week
  const allDates = Object.values(completions).flatMap(h => Object.keys(h).filter(k => h[k]));
  const dowCounts: number[] = new Array(7).fill(0);
  const dowOpps: number[] = new Array(7).fill(0);
  allDates.forEach(d => dowCounts[new Date(d).getDay()]++);
  const startEver = new Date('2020-01-01'); const cur2 = new Date(startEver);
  while (cur2 <= today) { dowOpps[cur2.getDay()] += habits.length; cur2.setDate(cur2.getDate() + 1); }
  const dowRates = dowCounts.map((c, i) => dowOpps[i] > 0 ? Math.round((c / dowOpps[i]) * 100) : 0);
  const bestDowIdx = dowRates.indexOf(Math.max(...dowRates));
  const worstDowIdx = dowRates.indexOf(Math.min(...dowRates));

  // Best month ever overall
  const overallMonthGroups: Record<string, number> = {};
  allDates.forEach(d => { const key = d.slice(0, 7); overallMonthGroups[key] = (overallMonthGroups[key] ?? 0) + 1; });
  const overallMonthRates = Object.keys(overallMonthGroups).map(key => {
    const [y, m] = key.split('-').map(Number);
    const possible = habits.reduce((sum, h) => sum + estimatePossibleDays(h, y, m), 0);
    const rate = possible > 0 ? Math.round((overallMonthGroups[key] / possible) * 100) : 0;
    return { key, label: `${MONTH_NAMES[m - 1]} ${y}`, rate };
  });
  const bestOverallMonth = overallMonthRates.length > 0
    ? overallMonthRates.reduce((a, b) => b.rate > a.rate ? b : a)
    : null;

  // Last 3 months overall
  const l3Overall = last3.map(({ year, month, label }) => {
    let completed = 0, possible = 0;
    habits.forEach(h => {
      const dates2 = Object.keys(completions[h.id] ?? {}).filter(k => completions[h.id][k]);
      completed += dates2.filter(d => d.startsWith(`${year}-${String(month).padStart(2, '0')}`)).length;
      possible += estimatePossibleDays(h, year, month);
    });
    return possible > 0 ? `${label} ${Math.round((completed / possible) * 100)}%` : `${label} —`;
  }).join(' → ');

  // Longest single streak overall
  const allStreaks = habitStats.map(h => ({ habit: h.name, days: h.longestStreak })).filter(x => x.days > 0);
  const longestSingle = allStreaks.length > 0
    ? allStreaks.reduce((a, b) => b.days > a.days ? b : a)
    : null;

  const sorted = [...habitStats].filter(h => h.thisYearRate !== null).sort((a, b) => (b.thisYearRate ?? 0) - (a.thisYearRate ?? 0));

  return {
    habits: habitStats,
    overall: {
      consistencyRate: annualStats.consistencyRate ?? 0,
      totalCompletions: annualStats.totalCompletions ?? 0,
      totalPossible: annualStats.totalPossible ?? 0,
      momentum: annualStats.momentum ?? 'unknown',
      weekDelta,
      monthDelta,
      bestDayOfWeek: `${DOW[bestDowIdx]} (${dowRates[bestDowIdx]}%)`,
      worstDayOfWeek: `${DOW[worstDowIdx]} (${dowRates[worstDowIdx]}%)`,
      bestMonthEver: bestOverallMonth ? `${bestOverallMonth.label} (${bestOverallMonth.rate}%)` : null,
      last3MonthsRates: l3Overall,
      habitCount: habits.length,
      activeHabitCount: habits.filter(h => !h.archivedAt).length,
      longestSingleStreak: longestSingle,
      mostConsistentHabit: sorted[0]?.name ?? null,
      leastConsistentHabit: sorted[sorted.length - 1]?.name ?? null,
      habitWithMostTotalCompletions: habitStats.sort((a, b) => b.totalCompletions - a.totalCompletions)[0]?.name ?? null,
    },
  };
}
