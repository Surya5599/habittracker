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
    if (habitsCount === 0) {
        intro = 'Your week is open. Add one habit to start generating personal insights and trend patterns.';
    } else if (paceRate >= 110) {
        intro = `You completed [[${completedCount}]] actions across [[${habitsCount}]] habits, running ahead at about [[${paceRate.toFixed(0)}%]] of your expected weekly pace.`;
    } else if (paceRate >= 85) {
        intro = `You completed [[${completedCount}]] actions across [[${habitsCount}]] habits and are on a steady track at [[${paceRate.toFixed(0)}%]] of your expected pace.`;
    } else if (paceRate >= 60) {
        intro = `You logged [[${completedCount}]] actions this week. You're at [[${paceRate.toFixed(0)}%]] of pace, so one focused day can quickly lift your result.`;
    } else {
        intro = `You logged [[${completedCount}]] actions so far. This week is still recoverable: a simple minimum version of each habit can rebuild momentum fast.`;
    }

    sections.push({ type: 'consistency', text: intro, priority: 1 });

    if (topHabit && topHabit.completed > 0) {
        sections.push({
            type: 'momentum',
            text: `Strongest anchor: [[${topHabit.name}]] was completed [[${topHabit.completed}]] time${topHabit.completed === 1 ? '' : 's'} this week.`,
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

        if (spread >= 2) {
            sections.push({
                type: 'rhythm',
                text: `Rhythm insight: your strongest day was [[${bestDay.displayDay}]] (${bestDay.count}), while [[${quietDay.displayDay}]] was lighter (${quietDay.count}). Planning one short session on lighter days can smooth consistency.`,
                priority: 3
            });
        } else if (secondHalf > firstHalf + 1) {
            sections.push({
                type: 'momentum',
                text: 'Rhythm insight: you are finishing stronger than you started this week, which usually signals good recovery and adaptation.',
                priority: 3
            });
        } else if (firstHalf > secondHalf + 1) {
            sections.push({
                type: 'fading',
                text: 'Rhythm insight: your early-week energy is stronger than your late-week follow-through. A lighter Friday/Saturday version could protect momentum.',
                priority: 3
            });
        }
    }

    if (lowHabit && habitsCount > 1 && elapsed >= 3) {
        sections.push({
            type: 'neglected',
            text: `Opportunity area: [[${lowHabit.name}]] has no check-ins yet. A 5-minute starter version is enough to get it moving.`,
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
    if (habitsCount === 0) {
        intro = 'Your month is open. Add a habit to start seeing monthly trend insights and stronger pattern detection.';
    } else if (paceRate >= 110) {
        intro = `You completed [[${completedCount}]] actions this month, running ahead at about [[${paceRate.toFixed(0)}%]] of your expected pace.`;
    } else if (paceRate >= 85) {
        intro = `You completed [[${completedCount}]] actions this month and are tracking steadily at [[${paceRate.toFixed(0)}%]] of pace.`;
    } else if (paceRate >= 60) {
        intro = `You logged [[${completedCount}]] actions so far this month. You're at [[${paceRate.toFixed(0)}%]] of pace, and consistency in the next few days can close the gap.`;
    } else {
        intro = `You logged [[${completedCount}]] actions this month. A reset is still easy: return to a minimum version of each habit for the next 3 days.`;
    }

    sections.push({ type: 'consistency', text: intro, priority: 1 });

    if (Math.abs(monthDelta) >= 4) {
        const trendText = monthDelta > 0
            ? `Trend insight: you're up [[${monthDelta.toFixed(0)}%]] versus last month, showing clear month-over-month progress.`
            : `Trend insight: you're down [[${Math.abs(monthDelta).toFixed(0)}%]] versus last month. A lighter but daily baseline can stabilize the month quickly.`;

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
            text: `Strongest monthly anchor: [[${topHabit.name}]] with [[${topHabit.stats.completed}]] completions. Protecting this anchor helps the rest of your habits stay on track.`,
            priority: 3
        });
    }

    const improvementHabit = [...(topHabits || [])].reverse().find((h: any) => (h.stats?.completed || 0) === 0 || (h.percentage || 0) < 20);
    if (improvementHabit && habitsCount > 1) {
        sections.push({
            type: 'neglected',
            text: `Opportunity area: [[${improvementHabit.name}]] is currently underused. A fixed time slot twice a week can make this habit visible again.`,
            priority: 4
        });
    }

    return {
        focused: topHabit,
        sections: sections.sort((a, b) => a.priority - b.priority),
        highlights: {}
    };
};
