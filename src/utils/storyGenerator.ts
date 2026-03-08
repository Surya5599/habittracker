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
    const elapsed = Math.min(Math.max(daysElapsed, 1), 7);
    const topHabit = weekProgress.habitPerformance?.[0];
    const lowHabit = [...(weekProgress.habitPerformance || [])].reverse().find((h: any) => h.completed === 0);

    const weekTotal = Number(weekProgress.total) || 0;
    const expectedSoFar = weekTotal > 0 ? weekTotal * (elapsed / 7) : 0;
    const paceRate = expectedSoFar > 0 ? (completedCount / expectedSoFar) * 100 : 0;

    let intro = '';
    if (paceRate >= 110) {
        intro = t('story.weekly.intro.elite', { count: completedCount });
    } else if (paceRate >= 85) {
        intro = t('story.weekly.intro.strong', { count: completedCount });
    } else if (paceRate >= 60) {
        intro = t('story.weekly.intro.balanced', { count: completedCount });
    } else {
        intro = t('story.weekly.intro.low', { count: completedCount });
    }

    sections.push({ type: 'consistency', text: intro, priority: 1 });

    if (topHabit && topHabit.completed > 0) {
        sections.push({
            type: 'momentum',
            text: t('story.weekly.momentum.highlight', {
                habitName: topHabit.name,
                count: topHabit.completed,
                total: elapsed
            }),
            priority: 2
        });
    }

    const observedStats = weeklyStats.slice(0, elapsed);
    if (observedStats.length >= 3) {
        const bestDay = [...observedStats].sort((a, b) => b.count - a.count)[0];
        const quietDay = [...observedStats].sort((a, b) => a.count - b.count)[0];
        const spread = (bestDay?.count || 0) - (quietDay?.count || 0);
        const firstHalf = observedStats.slice(0, Math.ceil(observedStats.length / 2)).reduce((sum, d) => sum + d.count, 0);
        const secondHalf = observedStats.slice(Math.ceil(observedStats.length / 2)).reduce((sum, d) => sum + d.count, 0);

        if (secondHalf > firstHalf + 1) {
            sections.push({
                type: 'momentum',
                text: t('story.weekly.growth.recovery'),
                priority: 3
            });
        } else if (firstHalf > secondHalf + 1 || spread >= 2) {
            sections.push({
                type: 'fading',
                text: t('story.weekly.growth.friction'),
                priority: 3
            });
        }
    }

    if (lowHabit && habitsCount > 1 && elapsed >= 3) {
        sections.push({
            type: 'neglected',
            text: t('story.weekly.neglected', { habitName: lowHabit.name }),
            priority: 4
        });
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
    const habitsCount = topHabits.length;
    const elapsed = Math.max(daysElapsed, 1);

    const monthTotal = Number(monthProgress.total) || 0;
    const expectedSoFar = monthTotal > 0 ? monthTotal * (elapsed / 30) : 0;
    const paceRate = expectedSoFar > 0 ? (completedCount / expectedSoFar) * 100 : (monthProgress.percentage || 0);

    let intro = '';
    if (paceRate >= 110) {
        intro = t('story.monthly.intro.exceptional', { count: completedCount });
    } else if (paceRate >= 85) {
        intro = t('story.monthly.intro.solid', { count: completedCount });
    } else if (paceRate >= 60) {
        intro = t('story.monthly.intro.exploration', { count: completedCount });
    } else {
        intro = t('story.monthly.intro.low', { count: completedCount });
    }

    sections.push({ type: 'consistency', text: intro, priority: 1 });

    if (Math.abs(monthDelta) >= 4) {
        const trendText = monthDelta > 0
            ? t('story.monthly.momentum.growth', { delta: monthDelta.toFixed(0) })
            : t('story.monthly.momentum.cooling', { delta: Math.abs(monthDelta).toFixed(0) });

        sections.push({
            type: monthDelta > 0 ? 'momentum' : 'fading',
            text: trendText,
            priority: 2
        });
    }

    const topHabit = topHabits?.[0];
    if (topHabit && topHabit.stats?.completed > 0) {
        sections.push({
            type: 'rhythm',
            text: t('story.monthly.rhythm.anchor', { habitName: topHabit.name, count: topHabit.stats.completed }),
            priority: 3
        });
    }

    return {
        focused: topHabit,
        sections: sections.sort((a, b) => a.priority - b.priority),
        highlights: {}
    };
};
