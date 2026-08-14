import { buildJournalPage, findJournalStartKey } from '../src/utils/journalPage';
import { toDateKey, todayKey, BACKLOG_KEY } from '../src/utils/dateKeys';

const dayOffset = (n) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d;
};

const habit = (over = {}) => ({ id: 'h1', name: 'Run', color: '#f00', ...over });

// completions are keyed habitId -> 'YYYY-MM-DD' -> truthy
const completed = (id, date) => ({ [id]: { [toDateKey(date)]: true } });

describe('buildJournalPage', () => {
    const today = dayOffset(0);

    it('includes daily habits that were due, with their done state', () => {
        const page = buildJournalPage({
            date: today,
            habits: [habit()],
            completions: completed('h1', today),
            notes: {},
        });
        expect(page.habits).toHaveLength(1);
        expect(page.habits[0]).toMatchObject({ id: 'h1', name: 'Run', done: true });
        expect(page.habitsDone).toBe(1);
        expect(page.habitsTotal).toBe(1);
    });

    it('excludes habits marked inactive for that day', () => {
        const page = buildJournalPage({
            date: today,
            habits: [habit()],
            completions: {},
            notes: {},
            isHabitInactive: () => true,
        });
        expect(page.habits).toHaveLength(0);
    });

    it('excludes habits not due on this weekday', () => {
        const otherDay = (today.getDay() + 3) % 7;
        const page = buildJournalPage({
            date: today,
            habits: [habit({ frequency: [otherDay] })],
            completions: {},
            notes: {},
        });
        expect(page.habits).toHaveLength(0);
    });

    it('shows a flexible habit only on days it was actually completed', () => {
        const flexible = habit({ weeklyTarget: 3 });
        const missed = buildJournalPage({
            date: today, habits: [flexible], completions: {}, notes: {},
        });
        expect(missed.habits).toHaveLength(0);

        const hit = buildJournalPage({
            date: today, habits: [flexible], completions: completed('h1', today), notes: {},
        });
        expect(hit.habits).toHaveLength(1);
        expect(hit.habits[0].flexible).toBe(true);
    });

    it('excludes habits created after the page date', () => {
        const page = buildJournalPage({
            date: dayOffset(-5),
            habits: [habit({ createdAt: today.toISOString() })],
            completions: {},
            notes: {},
        });
        expect(page.habits).toHaveLength(0);
    });

    it('averages the moods its entries set', () => {
        const page = buildJournalPage({
            date: today,
            habits: [],
            completions: {},
            notes: {
                [todayKey()]: {
                    journal: [
                        { id: '1', text: 'first', mood: 2 },
                        { id: '2', text: 'second', mood: 5 },
                        { id: '3', text: 'third' },
                    ],
                },
            },
        });
        // 2 and 5 average to 3.5, rounded to 4. The third entry sets no mood and so
        // does not drag the average down.
        expect(page.mood).toBe(4);
        expect(page.entries).toHaveLength(3);
    });

    it('migrates a legacy string journal into one entry', () => {
        const page = buildJournalPage({
            date: today,
            habits: [],
            completions: {},
            notes: { [todayKey()]: { journal: 'legacy text', mood: 3 } },
        });
        expect(page.entries).toHaveLength(1);
        expect(page.entries[0].text).toBe('legacy text');
        expect(page.mood).toBe(3);
    });

    it('drops whitespace-only entries', () => {
        const page = buildJournalPage({
            date: today,
            habits: [],
            completions: {},
            notes: { [todayKey()]: { journal: [{ id: '1', text: '   ' }] } },
        });
        expect(page.entries).toEqual([]);
        expect(page.isBlank).toBe(true);
    });

    it('numbers the folio from the journal start date', () => {
        const start = toDateKey(dayOffset(-10));
        const page = buildJournalPage({
            date: today, habits: [], completions: {}, notes: {}, startKey: start,
        });
        expect(page.dayNumber).toBe(11);
    });

    it('has no folio number for pages before day one', () => {
        const page = buildJournalPage({
            date: dayOffset(-20),
            habits: [], completions: {}, notes: {},
            startKey: toDateKey(dayOffset(-10)),
        });
        expect(page.dayNumber).toBeNull();
    });

    it('marks an empty day blank but still returns a page', () => {
        const page = buildJournalPage({ date: dayOffset(-3), habits: [], completions: {}, notes: {} });
        expect(page.isBlank).toBe(true);
        expect(page.dateKey).toBe(toDateKey(dayOffset(-3)));
    });
});

describe('findJournalStartKey', () => {
    it('takes the earliest date across notes and completions', () => {
        expect(findJournalStartKey(
            { '2026-03-04': {}, '2026-01-09': {} },
            { h1: { '2025-12-25': true } },
        )).toBe('2025-12-25');
    });

    it('ignores the backlog key and any non-date keys', () => {
        expect(findJournalStartKey({ [BACKLOG_KEY]: {}, nonsense: {}, '2026-02-02': {} }, {}))
            .toBe('2026-02-02');
    });

    it('returns null when there is nothing yet', () => {
        expect(findJournalStartKey({}, {})).toBeNull();
    });
});

describe('journal page extras', () => {
    const today = dayOffset(0);
    const page = (dayData) => buildJournalPage({
        date: today, habits: [], completions: {}, notes: { [todayKey()]: dayData },
    });

    it('grades the day from habit completion', () => {
        const grade = (done, total) => buildJournalPage({
            date: today,
            habits: Array.from({ length: total }, (_, i) => habit({ id: `h${i}` })),
            completions: Object.fromEntries(
                Array.from({ length: done }, (_, i) => [`h${i}`, { [todayKey()]: true }]),
            ),
            notes: {},
        });
        expect(grade(9, 10).verdict).toBe('great');
        expect(grade(9, 10).completionPct).toBe(90);
        expect(grade(7, 10).verdict).toBe('good');
        expect(grade(4, 10).verdict).toBe('steady');
        expect(grade(1, 10).verdict).toBe('slow');
        expect(grade(0, 10).verdict).toBe('blank');
    });

    it('calls a day with nothing due a rest day, not a failure', () => {
        const rest = buildJournalPage({ date: today, habits: [], completions: {}, notes: {} });
        expect(rest.completionPct).toBeNull();
        expect(rest.verdict).toBe('rest');
    });
});

describe('page mood', () => {
    const today = dayOffset(0);
    const page = (journal) => buildJournalPage({
        date: today, habits: [], completions: {}, notes: { [todayKey()]: { journal } },
    });

    it('averages the moods across the day, not just the last one', () => {
        const p = page([
            { id: '1', text: 'rough morning', mood: 1 },
            { id: '2', text: 'better by evening', mood: 5 },
        ]);
        expect(p.mood).toBe(3);
        expect(p.moodSamples).toBe(2);
    });

    it('reports one sample when a single entry carries the mood', () => {
        const p = page([{ id: '1', text: 'fine', mood: 4 }]);
        expect(p.mood).toBe(4);
        expect(p.moodSamples).toBe(1);
    });

    it('has no mood once the entries carrying one are gone', () => {
        const p = page([{ id: '1', text: 'no mood set' }]);
        expect(p.mood).toBeNull();
        expect(p.moodSamples).toBe(0);
    });
});

describe('mood agrees with the Today card', () => {
    // Today derives its mood from dayData.journal directly; the page must use the same
    // set or the same day reads differently on the two screens.
    const { dayMood } = require('../src/utils/mood');
    const today = dayOffset(0);

    const bothSides = (journal) => {
        const page = buildJournalPage({
            date: today, habits: [], completions: {}, notes: { [todayKey()]: { journal } },
        });
        // Mirror of DailyCard: Array.isArray(finalDayData.journal) ? ... : []
        const todayCard = dayMood(Array.isArray(journal) ? journal : [], undefined);
        return [page.mood, todayCard ?? null];
    };

    it('counts a mood saved with no text, which the Today card also counts', () => {
        const [review, todayCard] = bothSides([
            { id: '1', text: 'wrote something', mood: 5 },
            { id: '2', text: '', mood: 1 },
        ]);
        expect(review).toBe(todayCard);
        expect(review).toBe(3);
    });

    it('agrees on a plain day of written entries', () => {
        const [review, todayCard] = bothSides([
            { id: '1', text: 'a', mood: 2 },
            { id: '2', text: 'b', mood: 4 },
        ]);
        expect(review).toBe(todayCard);
    });

    it('agrees when nothing carries a mood', () => {
        const [review, todayCard] = bothSides([{ id: '1', text: 'a' }]);
        expect(review).toBe(todayCard);
        expect(review).toBeNull();
    });

    it('still lists only entries with text, even when a mood-only one counts', () => {
        const page = buildJournalPage({
            date: today,
            habits: [],
            completions: {},
            notes: { [todayKey()]: { journal: [
                { id: '1', text: 'written', mood: 4 },
                { id: '2', text: '   ', mood: 2 },
            ] } },
        });
        expect(page.entries).toHaveLength(1);
        expect(page.moodSamples).toBe(2);
        expect(page.mood).toBe(3);
    });
});
