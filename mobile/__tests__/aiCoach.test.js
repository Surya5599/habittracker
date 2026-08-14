import {
    AI_COACH_PERSONALITIES,
    AI_DAILY_LIMIT,
    GEMINI_TOOLS,
    buildChatSystemPrompt,
    buildInsightPrompt,
    computeAnnualContext,
    computeRichContext,
    computeStreaks,
    estimatePossibleDays,
    executeTool,
    personalityMeta,
} from '../src/utils/aiCoach';

const habit = (over = {}) => ({
    id: 'h1',
    name: 'Meditation',
    color: '#000',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
});

// Builds { habitId: { 'YYYY-MM-DD': true } } from a list of keys.
const completionsFor = (habitId, keys) => ({
    [habitId]: keys.reduce((acc, k) => ({ ...acc, [k]: true }), {}),
});

describe('aiCoach config', () => {
    it('keeps the web app daily limit and five personalities', () => {
        expect(AI_DAILY_LIMIT).toBe(5);
        expect(AI_COACH_PERSONALITIES.map(p => p.id))
            .toEqual(['direct', 'hype', 'zen', 'drill', 'witty']);
        AI_COACH_PERSONALITIES.forEach(p => {
            expect(p.emoji).toBeTruthy();
            expect(p.color).toMatch(/^#/);
        });
    });

    it('falls back to the direct personality for unknown ids', () => {
        expect(personalityMeta('nope').id).toBe('direct');
        expect(personalityMeta('zen').id).toBe('zen');
    });

    it('declares the four tools the chat prompt promises', () => {
        const names = GEMINI_TOOLS[0].functionDeclarations.map(d => d.name);
        expect(names).toEqual(['get_habit_stats', 'get_streaks', 'get_monthly_breakdown', 'get_habit_list']);
    });
});

describe('computeStreaks', () => {
    it('returns zeros with no completions', () => {
        expect(computeStreaks([])).toEqual({ current: 0, longest: 0 });
    });

    it('counts the longest run regardless of when it happened', () => {
        const { longest } = computeStreaks(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-10']);
        expect(longest).toBe(3);
    });

    it('reports current streak as 0 once the run is stale', () => {
        const { current } = computeStreaks(['2020-01-01', '2020-01-02']);
        expect(current).toBe(0);
    });

    it('keeps the current streak alive when it ends today', () => {
        const today = new Date();
        const key = (offset) => {
            const d = new Date(today);
            d.setDate(d.getDate() - offset);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };
        expect(computeStreaks([key(2), key(1), key(0)]).current).toBe(3);
    });
});

describe('estimatePossibleDays', () => {
    it('counts every day of a past month for a daily habit', () => {
        expect(estimatePossibleDays(habit(), 2026, 1)).toBe(31);
        expect(estimatePossibleDays(habit(), 2026, 2)).toBe(28);
    });

    it('honours weekday-restricted frequencies', () => {
        // Feb 2026 has 20 weekdays (Mon–Fri).
        const weekdaysOnly = habit({ frequency: [1, 2, 3, 4, 5] });
        expect(estimatePossibleDays(weekdaysOnly, 2026, 2)).toBe(20);
    });

    it('returns 0 for a period entirely in the future', () => {
        const futureYear = new Date().getFullYear() + 2;
        expect(estimatePossibleDays(habit(), futureYear, 1)).toBe(0);
    });
});

describe('executeTool', () => {
    const habits = [habit(), habit({ id: 'h2', name: 'Reading' })];
    const completions = {
        ...completionsFor('h1', ['2026-01-01', '2026-01-02', '2026-01-03']),
        ...completionsFor('h2', ['2026-01-01']),
    };

    it('scopes stats to the requested period', () => {
        const result = executeTool('get_habit_stats', { year: 2026, month: 1 }, habits, completions);
        expect(result.period).toBe('2026-1');
        const med = result.habits.find(h => h.habit === 'Meditation');
        expect(med.completed).toBe(3);
        expect(med.possible).toBe(31);
        expect(med.rate).toBe(10);
    });

    it('filters by partial, case-insensitive habit name', () => {
        const result = executeTool('get_habit_stats', { year: 2026, habit_name: 'read' }, habits, completions);
        expect(result.habits.map(h => h.habit)).toEqual(['Reading']);
    });

    it('sorts worst-first when asked and applies top_n', () => {
        const result = executeTool('get_habit_stats', { year: 2026, month: 1, sort: 'worst', top_n: 1 }, habits, completions);
        expect(result.habits).toHaveLength(1);
        expect(result.habits[0].habit).toBe('Reading');
    });

    it('reports streaks longest-first', () => {
        const result = executeTool('get_streaks', {}, habits, completions);
        expect(result.habits[0].habit).toBe('Meditation');
        expect(result.habits[0].longestStreak).toBe(3);
        expect(result.habits[0].currentStreak).toBe(0); // stale run
    });

    it('breaks a year into twelve months with best/worst', () => {
        const result = executeTool('get_monthly_breakdown', { year: 2026, habit_name: 'Meditation' }, habits, completions);
        expect(result.months).toHaveLength(12);
        expect(result.scope).toBe('Meditation');
        expect(result.best).toBe('Jan');
    });

    it('lists habits with status and frequency', () => {
        const result = executeTool('get_habit_list', {}, [habit({ archivedAt: '2026-05-01' })], completions);
        expect(result.habits[0]).toMatchObject({ name: 'Meditation', status: 'archived', frequency: 'daily' });
    });

    it('reports unknown tools instead of throwing', () => {
        expect(executeTool('nope', {}, habits, completions)).toEqual({ error: 'Unknown tool: nope' });
    });
});

describe('computeAnnualContext', () => {
    it('is empty-safe', () => {
        const ctx = computeAnnualContext([], {});
        expect(ctx.consistencyRate).toBe(0);
        expect(ctx.totalCompletions).toBe(0);
        expect(ctx.momentum).toBe('stable');
    });

    it('counts only completions inside the current year', () => {
        const year = new Date().getFullYear();
        const completions = completionsFor('h1', [`${year}-01-01`, `${year}-01-02`, '2019-01-01']);
        const ctx = computeAnnualContext([habit({ createdAt: `${year}-01-01` })], completions);
        expect(ctx.totalCompletions).toBe(2);
        expect(ctx.totalPossible).toBeGreaterThan(0);
    });
});

describe('prompt builders', () => {
    const habits = [habit()];
    const completions = completionsFor('h1', ['2026-01-01', '2026-01-02']);

    const context = () => {
        const annual = computeAnnualContext(habits, completions);
        return computeRichContext(habits, completions, annual, 4.2, -3.1);
    };

    it('produces rich stats per habit', () => {
        const { habits: rich, overall } = context();
        expect(rich).toHaveLength(1);
        expect(rich[0]).toMatchObject({ name: 'Meditation', totalCompletions: 2 });
        expect(rich[0].last3Months).toMatch(/→/);
        expect(overall.habitCount).toBe(1);
        expect(overall.activeHabitCount).toBe(1);
        expect(overall.weekDelta).toBeCloseTo(4.2);
        expect(overall.monthDelta).toBeCloseTo(-3.1);
    });

    it('asks for strict JSON and embeds the data blocks', () => {
        const { habits: rich, overall } = context();
        const prompt = buildInsightPrompt('2026-08-12', rich, overall, 'direct');
        expect(prompt).toContain('Respond ONLY with a valid JSON object');
        expect(prompt).toContain('Today: 2026-08-12');
        expect(prompt).toContain('Meditation');
        expect(prompt).toContain('Week-over-week delta: +4%');
        expect(prompt).not.toContain('Respond entirely in');
    });

    it('adds a language instruction and JSON-key guard for non-English', () => {
        const { habits: rich, overall } = context();
        const prompt = buildInsightPrompt('2026-08-12', rich, overall, 'zen', 'ja');
        expect(prompt).toContain('Respond entirely in Japanese');
        expect(prompt).toContain('The JSON keys and "category" values must stay exactly as shown');
    });

    it('varies only the voice between personalities', () => {
        const { habits: rich, overall } = context();
        const direct = buildInsightPrompt('2026-08-12', rich, overall, 'direct');
        const roast = buildInsightPrompt('2026-08-12', rich, overall, 'witty');
        expect(direct).not.toBe(roast);
        expect(roast).toContain('sarcastic');
        // Same data block regardless of tone.
        expect(direct.split('═══ OVERALL ═══')[1]).toBe(roast.split('═══ OVERALL ═══')[1]);
    });

    it('builds a chat system prompt with the habit snapshot and tool hint', () => {
        const { habits: rich, overall } = context();
        const prompt = buildChatSystemPrompt('2026-08-12', rich, overall, 'drill', 'es');
        expect(prompt).toContain('Today is 2026-08-12');
        expect(prompt).toContain('- Meditation:');
        expect(prompt).toContain('You also have tools to look up historical data');
        expect(prompt).toContain('Respond entirely in Spanish');
    });
});
