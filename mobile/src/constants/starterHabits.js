// Suggestions for the first screen of onboarding.
//
// The point isn't to be comprehensive — it's to remove the blank-page problem. Picking
// from a list is far easier than inventing a habit under pressure, and every one of
// these creates a real habit, so onboarding ends with a populated app rather than an
// empty one.
//
// `colorIndex` spreads picks across the palette so a new user's habits don't all come
// out the same colour. Names are i18n keys with an English fallback.

export const STARTER_HABIT_COLORS = [
    '#8da18d', '#8db1d1', '#b28d6c', '#b1a1d1',
    '#d4a89f', '#a8c9b8', '#c9b88f', '#a88fa8',
];

export const STARTER_HABITS = [
    { key: 'move', emoji: '🏃', fallback: 'Move my body', frequency: undefined },
    { key: 'read', emoji: '📖', fallback: 'Read', frequency: undefined },
    { key: 'meditate', emoji: '🧘', fallback: 'Meditate', frequency: undefined },
    { key: 'water', emoji: '💧', fallback: 'Drink water', frequency: undefined },
    { key: 'sleep', emoji: '🌙', fallback: 'Sleep by 11', frequency: undefined },
    { key: 'journal', emoji: '✍️', fallback: 'Write something', frequency: undefined },
    { key: 'outside', emoji: '🌤', fallback: 'Get outside', frequency: undefined },
    { key: 'noPhone', emoji: '📵', fallback: 'No phone in bed', frequency: undefined },
    // Weekday-shaped by default, because these are the ones people actually scope
    // to a working week — and a habit that isn't due doesn't count against you.
    { key: 'deepWork', emoji: '🎯', fallback: 'Deep work block', frequency: [1, 2, 3, 4, 5] },
    { key: 'tidy', emoji: '🧹', fallback: 'Tidy for 10 min', frequency: [1, 2, 3, 4, 5] },
];

export const CADENCES = [
    { key: 'daily', frequency: undefined, weeklyTarget: null, fallback: 'Every day' },
    { key: 'weekdays', frequency: [1, 2, 3, 4, 5], weeklyTarget: null, fallback: 'Weekdays' },
    { key: 'threeTimes', frequency: undefined, weeklyTarget: 3, fallback: '3× a week' },
];

export const cadenceKeyFor = (habit) => {
    if (habit.weeklyTarget) return 'threeTimes';
    if (Array.isArray(habit.frequency) && habit.frequency.length === 5) return 'weekdays';
    return 'daily';
};
