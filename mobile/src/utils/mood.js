// The day's mood, derived from its journal entries.
//
// This used to be "whichever entry most recently set one", computed inline in four
// separate places. Two problems with that: a day where you wrote something rough in
// the morning and something good at night reported only the good one, and because
// each caller derived it separately they could disagree. Deleting an entry didn't
// recompute at all, so a day could keep the mood of an entry that no longer existed.
//
// Now it's the average, rounded to the nearest MOODS value, in one place.

const MIN = 1;
const MAX = 5;

const moodValues = (entries) => (Array.isArray(entries) ? entries : [])
    .map(entry => entry?.mood)
    .filter(mood => Number.isFinite(mood) && mood >= MIN && mood <= MAX);

// undefined rather than null: it is written straight back into the note, and
// `undefined` is what "no mood" has always looked like there.
export const averageMood = (entries) => {
    const values = moodValues(entries);
    if (values.length === 0) return undefined;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.min(MAX, Math.max(MIN, Math.round(mean)));
};

// How many entries actually contributed, so a card can say "average of 3" rather
// than implying a single reading.
export const moodSampleCount = (entries) => moodValues(entries).length;

// Day mood for display: the entries decide it, falling back to any legacy day-level
// value for notes written before entries carried their own mood.
export const dayMood = (entries, legacyMood) => {
    const average = averageMood(entries);
    if (average !== undefined) return average;
    return Number.isFinite(legacyMood) ? legacyMood : undefined;
};
