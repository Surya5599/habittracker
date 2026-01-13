import { Habit } from '../types';

export interface StorySection {
    type: 'momentum' | 'rhythm' | 'fading' | 'neglected' | 'consistency' | 'experimental';
    text: string;
    priority: number;
}

export interface StoryResult {
    focused: any;
    sections: StorySection[];
    highlights: {
        promise?: any;
        streak?: any;
    };
}

const daysSince = (dateString: string): number => {
    const lastDate = new Date(dateString);
    const today = new Date();
    return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
};

export const buildAnnualStory = (annualStats: any, t: any, monthsElapsed: number = 12): StoryResult => {
    const sections: StorySection[] = [];
    const focused = annualStats.topHabits?.[0];

    if (!focused) return { focused: null, sections: [], highlights: {} };

    // Use the consistency rate directly since annualStats.totalPossible is now pro-rated in the hook
    const adjustedRate = annualStats.consistencyRate || (annualStats.totalCompletions / annualStats.totalPossible) * 100;

    // 1. Momentum Section
    const momentumMsg = annualStats.momentum === "ascending"
        ? t('story.annual.momentum.ascending')
        : annualStats.momentum === "descending"
            ? t('story.annual.momentum.descending')
            : t('story.annual.momentum.stable');

    sections.push({
        type: 'momentum',
        text: t('story.annual.momentum.main', { habitName: focused.name.toUpperCase(), momentumMsg }),
        priority: annualStats.storyVariant === 'momentum' ? 1 : 2
    });

    // 2. Rhythm Section
    const rhythmMsg = annualStats.weekendRate > annualStats.weekdayRate * 1.2
        ? t('story.annual.rhythm.weekend')
        : annualStats.weekdayRate > annualStats.weekendRate * 1.2
            ? t('story.annual.rhythm.weekday')
            : t('story.annual.rhythm.consistent');

    sections.push({
        type: 'rhythm',
        text: rhythmMsg,
        priority: annualStats.storyVariant === 'identity' ? 1 : 3
    });

    // 3. Consistency Block
    const consistencyRate = monthsElapsed > 0 ? adjustedRate : annualStats.consistencyRate;
    const consistencyText = consistencyRate > 70
        ? t('story.annual.consistency.high', { activeDays: annualStats.activeDays })
        : consistencyRate > 40
            ? t('story.annual.consistency.medium')
            : t('story.annual.consistency.low');

    sections.push({
        type: 'consistency',
        text: consistencyText,
        priority: annualStats.storyVariant === 'reflection' ? 1 : 4
    });

    // ... rest (experimental, fading, neglected) remain largely the same but could use adjustedRate if needed
    // 4. Experimental / Low Focus State
    if (annualStats.activeHabitsCount > 7 && consistencyRate < 45) {
        sections.push({
            type: 'experimental',
            text: t('story.annual.experimental'),
            priority: 0
        });
    }

    if (annualStats.fadingHabit) {
        sections.push({
            type: 'fading',
            text: t('story.annual.fading', { habitName: annualStats.fadingHabit.name.toUpperCase() }),
            priority: 5
        });
    }

    const neglected = [...annualStats.topHabits]
        .filter(h =>
            h.completed >= 5 &&
            h.lastCompletedDate &&
            h.id !== focused.id &&
            daysSince(h.lastCompletedDate) >= 14
        )
        .sort((a, b) => new Date(a.lastCompletedDate!).getTime() - new Date(b.lastCompletedDate!).getTime())[0];

    if (neglected) {
        sections.push({
            type: 'neglected',
            text: t('story.annual.neglected', { habitName: neglected.name.toUpperCase(), days: daysSince(neglected.lastCompletedDate) }),
            priority: 6
        });
    }

    const growth = annualStats.topHabits.find((h: any) => h.badge === "Highest Growth");
    const promise = growth || annualStats.topHabits.find((h: any) => h.badge === "Identity Driver") || annualStats.topHabits[1];

    return {
        focused,
        sections: sections.sort((a, b) => a.priority - b.priority),
        highlights: {
            promise,
            streak: annualStats.longestHabitStreak
        }
    };
};

export const buildWeeklyStory = (weekProgress: any, weeklyStats: any[], habits: Habit[], t: any, daysElapsed: number = 7): StoryResult => {
    const sections: StorySection[] = [];
    const completedCount = weekProgress.completed;
    const habitsCount = habits.length;

    // Pro-rated rate
    const totalPossibleSoFar = habitsCount * daysElapsed;
    const rate = totalPossibleSoFar > 0 ? (completedCount / totalPossibleSoFar) * 100 : 0;

    // 0. Identity Driver
    const topHabit = weekProgress.habitPerformance?.[0];
    const lowHabit = [...(weekProgress.habitPerformance || [])].reverse().find(h => h.completed === 0);

    // 1. Initial Reflection
    let intro = "";
    if (rate >= 90) intro = t('story.weekly.intro.elite', { count: completedCount });
    else if (rate >= 70) intro = t('story.weekly.intro.strong', { count: completedCount });
    else if (rate >= 40) intro = t('story.weekly.intro.balanced', { count: completedCount });
    else intro = t('story.weekly.intro.low', { count: completedCount });

    sections.push({
        type: 'consistency',
        text: intro,
        priority: 1
    });

    // 2. Habit Highlights
    if (topHabit && topHabit.completed >= Math.max(1, Math.floor(daysElapsed * 0.6))) {
        sections.push({
            type: 'momentum',
            text: t('story.weekly.momentum.highlight', { habitName: topHabit.name.toUpperCase(), count: topHabit.completed, total: daysElapsed }),
            priority: 2
        });
    }

    if (lowHabit && daysElapsed >= 3) {
        sections.push({
            type: 'neglected',
            text: t('story.weekly.neglected', { habitName: lowHabit.name.toUpperCase() }),
            priority: 4
        });
    }

    // 3. Growth vs Resistance (Only relevant if more than 4 days have passed)
    if (daysElapsed >= 5) {
        const midWeekStrength = weeklyStats.slice(0, 4).reduce((acc, curr) => acc + curr.count, 0);
        const endWeekStrength = weeklyStats.slice(4).reduce((acc, curr) => acc + curr.count, 0);

        if (endWeekStrength > midWeekStrength && rate > 30) {
            sections.push({
                type: 'momentum',
                text: t('story.weekly.growth.recovery'),
                priority: 3
            });
        } else if (midWeekStrength > endWeekStrength + 5) {
            sections.push({
                type: 'rhythm',
                text: t('story.weekly.growth.friction'),
                priority: 3
            });
        }
    }

    return {
        focused: topHabit,
        sections: sections.sort((a, b) => a.priority - b.priority),
        highlights: {}
    };
};

export const buildMonthlyStory = (monthProgress: any, topHabits: any[], monthDelta: number, t: any, daysElapsed: number = 30): StoryResult => {
    const sections: StorySection[] = [];
    const completedCount = monthProgress.completed;
    const habitsCount = topHabits.length || 1; // Fallback to avoid div by zero

    // Pro-rated rate
    const totalPossibleSoFar = habitsCount * daysElapsed;
    const rate = totalPossibleSoFar > 0 ? (completedCount / totalPossibleSoFar) * 100 : monthProgress.percentage;

    // 1. Monthly Reflection
    let intro = "";
    if (rate >= 80) intro = t('story.monthly.intro.exceptional', { count: completedCount });
    else if (rate >= 60) intro = t('story.monthly.intro.solid', { count: completedCount });
    else if (rate >= 30) intro = t('story.monthly.intro.exploration', { count: completedCount });
    else intro = t('story.monthly.intro.low', { count: completedCount });

    sections.push({
        type: 'consistency',
        text: intro,
        priority: 1
    });

    // 2. Momentum / Delta
    if (Math.abs(monthDelta) > 5) {
        const momentumText = monthDelta > 0
            ? t('story.monthly.momentum.growth', { delta: monthDelta.toFixed(0) })
            : t('story.monthly.momentum.cooling', { delta: Math.abs(monthDelta).toFixed(0) });

        sections.push({
            type: 'momentum',
            text: momentumText,
            priority: 2
        });
    }

    // 3. Top Habit Highlight
    const topHabit = topHabits?.[0];
    if (topHabit && topHabit.percentage > 50) {
        sections.push({
            type: 'rhythm',
            text: t('story.monthly.rhythm.anchor', { habitName: topHabit.name.toUpperCase(), count: topHabit.stats.completed }),
            priority: 3
        });
    }

    return {
        focused: topHabit,
        sections: sections.sort((a, b) => a.priority - b.priority),
        highlights: {}
    };
};
