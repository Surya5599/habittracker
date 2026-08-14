import { toDateKey, todayKey, parseDateKey, parseDateStringLocal, BACKLOG_KEY } from './dateKeys';
import { isCompleted as checkCompleted } from './stats';
import { dayMood, moodSampleCount } from './mood';

// One page of the journal, as data.
//
// This deliberately returns plain values rather than anything React-shaped: the
// on-screen page and the eventual print/PDF renderer both consume this, so the two
// can never drift about what a "page" contains. Keep it free of styling decisions.


// The day's headline. Bands rather than a raw number, because "Great day" is what the
// page leads with and a percentage alone doesn't tell you how to feel about it.
// null when nothing was due — a rest day isn't a failed day.
export const verdictFor = (pct) => {
    if (pct === null || pct === undefined) return 'rest';
    if (pct >= 90) return 'great';
    if (pct >= 70) return 'good';
    if (pct >= 40) return 'steady';
    if (pct > 0) return 'slow';
    return 'blank';
};

const startOfDay = (d) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const habitStartedBy = (habit, date) => {
    if (!habit?.createdAt) return true;
    const created = parseDateStringLocal(habit.createdAt);
    if (!created) return true;
    return startOfDay(date) >= created;
};

export const buildJournalPage = ({
    date,
    habits = [],
    completions = {},
    notes = {},
    isHabitInactive,
    // Day 1 of the journal — the folio counts up from here.
    startKey = null,
}) => {
    const dateKey = toDateKey(date);
    const dayData = notes?.[dateKey] || {};
    const isToday = dateKey === todayKey();

    const inactive = (habitId) => !!(isHabitInactive && isHabitInactive(habitId, dateKey));
    const done = (habit) => checkCompleted(
        habit.id, date.getDate(), completions, date.getMonth(), date.getFullYear(),
    );

    // Daily habits that were due, plus flexible ones only when actually completed —
    // a "3 times a week" habit isn't owed on any particular day.
    const dueHabits = habits.filter(h =>
        habitStartedBy(h, date) && !h.weeklyTarget && !inactive(h.id)
        && (!h.frequency || h.frequency.includes(date.getDay()))
    );
    const flexibleDone = habits.filter(h =>
        habitStartedBy(h, date) && h.weeklyTarget && done(h)
    );
    const pageHabits = [...dueHabits, ...flexibleDone].map(h => ({
        id: h.id,
        name: h.name || '',
        color: h.color,
        done: done(h),
        flexible: !!h.weeklyTarget,
    }));

    const tasks = (Array.isArray(dayData.tasks) ? dayData.tasks : []).map(task => ({
        id: task.id,
        text: task.text || '',
        completed: !!task.completed,
    }));

    const rawEntries = Array.isArray(dayData.journal)
        ? dayData.journal
        : (dayData.journal ? [{ id: 'legacy', text: dayData.journal, mood: dayData.mood }] : []);
    const entries = rawEntries
        .filter(e => (e.text || '').trim())
        .map(e => ({ id: e.id, text: e.text, mood: e.mood, createdAt: e.createdAt }));

    // Mood is averaged over *every* entry, not just the ones with text. Saving a mood
    // with no words is allowed (DailyCard's add accepts a mood alone), and those
    // entries count on the Today card — computing the average over the text-only
    // subset here made the two screens disagree about the same day.
    const mood = dayMood(rawEntries, dayData.mood) ?? null;
    const moodSamples = moodSampleCount(rawEntries);

    let dayNumber = null;
    if (startKey) {
        const diff = Math.round((startOfDay(date) - startOfDay(parseDateKey(startKey))) / 86400000);
        if (diff >= 0) dayNumber = diff + 1;
    }

    const habitsDone = pageHabits.filter(h => h.done).length;
    const tasksDone = tasks.filter(task => task.completed).length;

    const completionPct = pageHabits.length > 0
        ? Math.round((habitsDone / pageHabits.length) * 100)
        : null;

    return {
        completionPct,
        verdict: verdictFor(completionPct),
        date,
        dateKey,
        isToday,
        dayNumber,
        mood,
        moodSamples,
        habits: pageHabits,
        habitsDone,
        habitsTotal: pageHabits.length,
        tasks,
        tasksDone,
        tasksTotal: tasks.length,
        entries,
        // A page with nothing on it still gets printed — skipping it would misrepresent
        // the passage of time — but it renders as a blank page.
        isBlank: pageHabits.length === 0 && tasks.length === 0 && entries.length === 0,
    };
};

// Earliest date the journal has anything for, so the folio can count from day 1.
export const findJournalStartKey = (notes = {}, completions = {}) => {
    let earliest = null;
    const consider = (key) => {
        if (!key || key === BACKLOG_KEY || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        if (!earliest || key < earliest) earliest = key;
    };
    Object.keys(notes || {}).forEach(consider);
    Object.values(completions || {}).forEach((byDate) => {
        if (byDate && typeof byDate === 'object') Object.keys(byDate).forEach(consider);
    });
    return earliest;
};
