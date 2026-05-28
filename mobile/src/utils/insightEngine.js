const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const isHabitDueOnDate = (habit, date, dateKey, notes) => {
    if (habit.weeklyTarget) return false;

    if (habit.createdAt) {
        const created = new Date(habit.createdAt);
        created.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        if (target < created) return false;
    }

    if (habit.archivedAt) {
        const archived = new Date(habit.archivedAt);
        archived.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        if (target > archived) return false;
    }

    const dayData = notes?.[dateKey];
    if (dayData && Array.isArray(dayData.inactiveHabits) && dayData.inactiveHabits.includes(habit.id)) {
        return false;
    }

    if (habit.frequency && !habit.frequency.includes(date.getDay())) return false;

    return true;
};

// Anchor habit: the habit whose completion most predicts other habits being done.
export const computeAnchorHabit = (habits, completions, notes) => {
    if (habits.length < 2) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push({ date: d, key: formatDateKey(d) });
    }

    const avgOtherCompletion = (anchorId, dayList) => {
        const others = habits.filter(h => h.id !== anchorId);
        if (!others.length || !dayList.length) return 0;
        let total = 0;
        let counted = 0;
        for (const { date, key } of dayList) {
            const due = others.filter(h => isHabitDueOnDate(h, date, key, notes));
            if (!due.length) continue;
            const done = due.filter(h => completions[h.id]?.[key]).length;
            total += done / due.length;
            counted++;
        }
        return counted > 0 ? total / counted : 0;
    };

    let bestResult = null;
    let bestLift = -Infinity;

    for (const habit of habits) {
        const dueDates = dates.filter(({ date, key }) => isHabitDueOnDate(habit, date, key, notes));
        const doneDates = dueDates.filter(({ key }) => completions[habit.id]?.[key]);
        const missedDates = dueDates.filter(({ key }) => !completions[habit.id]?.[key]);

        if (doneDates.length < 5 || missedDates.length < 5) continue;

        const rateWhenDone = avgOtherCompletion(habit.id, doneDates);
        const rateWhenMissed = avgOtherCompletion(habit.id, missedDates);
        const lift = rateWhenDone - rateWhenMissed;

        if (lift > bestLift) {
            bestLift = lift;
            bestResult = {
                habit,
                liftPct: Math.round(lift * 100),
                doneRatePct: Math.round(rateWhenDone * 100),
                missedRatePct: Math.round(rateWhenMissed * 100),
                daysDone: doneDates.length
            };
        }
    }

    return bestLift > 0.05 ? bestResult : null;
};

// Weakest day: the day of the week with the lowest average completion rate.
export const computeWeakestDay = (habits, completions, notes) => {
    if (!habits.length) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayCounts = Array.from({ length: 7 }, () => ({ due: 0, done: 0 }));
    const habitDayCounts = {};
    habits.forEach(h => {
        habitDayCounts[h.id] = Array.from({ length: 7 }, () => ({ due: 0, done: 0 }));
    });

    for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = formatDateKey(d);
        const dow = d.getDay();

        habits.forEach(habit => {
            if (!isHabitDueOnDate(habit, d, key, notes)) return;
            dayCounts[dow].due++;
            habitDayCounts[habit.id][dow].due++;
            if (completions[habit.id]?.[key]) {
                dayCounts[dow].done++;
                habitDayCounts[habit.id][dow].done++;
            }
        });
    }

    let weakestDow = -1;
    let lowestRate = Infinity;
    for (let dow = 0; dow < 7; dow++) {
        const { due, done } = dayCounts[dow];
        if (due < 4) continue;
        const rate = done / due;
        if (rate < lowestRate) {
            lowestRate = rate;
            weakestDow = dow;
        }
    }

    if (weakestDow === -1) return null;

    let worstHabit = null;
    let worstRate = Infinity;
    habits.forEach(habit => {
        const { due, done } = habitDayCounts[habit.id][weakestDow];
        if (due < 3) return;
        const rate = done / due;
        if (rate < worstRate) {
            worstRate = rate;
            worstHabit = habit;
        }
    });

    const dayRates = dayCounts.map(({ due, done }, i) => ({
        day: DAY_NAMES_SHORT[i],
        rate: due >= 4 ? Math.round((done / due) * 100) : null
    }));

    return {
        dayIndex: weakestDow,
        dayName: DAY_NAMES_FULL[weakestDow],
        dayShort: DAY_NAMES_SHORT[weakestDow],
        completionRatePct: Math.round(lowestRate * 100),
        worstHabit: worstHabit ? { name: worstHabit.name, ratePct: Math.round(worstRate * 100) } : null,
        dayRates
    };
};

// Streak fragility: the habit whose streaks most consistently break at the same length.
export const computeStreakFragility = (habits, completions, notes) => {
    if (!habits.length) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 119; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push({ date: d, key: formatDateKey(d) });
    }

    let mostFragile = null;
    let highestRepeat = 0;

    for (const habit of habits) {
        const breakLengths = [];
        let streak = 0;

        for (const { date, key } of dates) {
            if (!isHabitDueOnDate(habit, date, key, notes)) continue;
            if (completions[habit.id]?.[key]) {
                streak++;
            } else {
                if (streak > 0) breakLengths.push(streak);
                streak = 0;
            }
        }

        if (breakLengths.length < 3) continue;

        const counts = {};
        breakLengths.forEach(len => { counts[len] = (counts[len] || 0) + 1; });

        let modeLen = 0;
        let modeCount = 0;
        Object.entries(counts).forEach(([len, count]) => {
            if (count > modeCount || (count === modeCount && parseInt(len) < modeLen)) {
                modeCount = count;
                modeLen = parseInt(len);
            }
        });

        if (modeCount > highestRepeat && modeLen >= 2) {
            highestRepeat = modeCount;
            mostFragile = {
                habit,
                breakAtLength: modeLen,
                breakCount: modeCount,
                totalBreaks: breakLengths.length
            };
        }
    }

    return mostFragile;
};
