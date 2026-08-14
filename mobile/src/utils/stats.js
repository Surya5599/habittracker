import { parseDateStringLocal } from './dateKeys';

export const getHabitMonthStats = (
    habitId,
    completions,
    monthIdx,
    year,
    frequency,
    createdAt
) => {
    const today = new Date();
    const dInM = new Date(year, monthIdx + 1, 0).getDate();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Local-midnight, so a plain 'YYYY-MM-DD' createdAt doesn't land on the previous
    // day for users west of UTC.
    const createdDate = parseDateStringLocal(createdAt);

    const isPastDate = (y, m, d) => {
        const target = new Date(y, m, d);
        return target < todayStart;
    };

    let totalDueDays = 0;
    let completed = 0;
    let missed = 0;

    for (let day = 1; day <= dInM; day++) {
        const date = new Date(year, monthIdx, day);

        // Skip if date is before creation
        if (createdDate && date < createdDate) {
            continue;
        }

        if (frequency) {
            if (!frequency.includes(date.getDay())) {
                continue;
            }
        }

        totalDueDays++;

        const dateKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isDone = completions[habitId]?.[dateKey] || false;

        if (isDone) {
            completed++;
        } else if (isPastDate(year, monthIdx, day)) {
            missed++;
        }
    }

    return { completed, missed, totalDays: totalDueDays };
};

export const isCompleted = (
    habitId,
    day,
    completions,
    monthIdx,
    year
) => {
    const dateKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return completions[habitId]?.[dateKey] || false;
};
