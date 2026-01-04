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

export const buildAnnualStory = (annualStats: any, monthsElapsed: number = 12): StoryResult => {
    const sections: StorySection[] = [];
    const focused = annualStats.topHabits?.[0];

    if (!focused) return { focused: null, sections: [], highlights: {} };

    const adjustedRate = (annualStats.totalCompletions / (annualStats.totalPossible * (monthsElapsed / 12))) * 100;

    // 1. Momentum Section
    const momentumMsg = annualStats.momentum === "ascending"
        ? "You've been building serious momentum lately, finishing the year stronger than you started."
        : annualStats.momentum === "descending"
            ? "Your recent rhythm softened toward the end of the year. That's often a signal for recalibration—not failure."
            : "Your consistency has remained remarkably stable throughout the transitions of the year.";

    sections.push({
        type: 'momentum',
        text: `This year, your identity centered around [[${focused.name.toUpperCase()}]]. ${momentumMsg}`,
        priority: annualStats.storyVariant === 'momentum' ? 1 : 2
    });

    // 2. Rhythm Section
    const rhythmMsg = annualStats.weekendRate > annualStats.weekdayRate * 1.2
        ? "You find your best rhythm on the weekends—that's when your identity truly shines."
        : annualStats.weekdayRate > annualStats.weekendRate * 1.2
            ? "You are a weekday warrior, but the weekends tend to be a 'blind spot' for your habits."
            : "You maintain a consistent rhythm throughout the entire week, from Monday to Sunday.";

    sections.push({
        type: 'rhythm',
        text: rhythmMsg,
        priority: annualStats.storyVariant === 'identity' ? 1 : 3
    });

    // 3. Consistency Block
    const consistencyRate = monthsElapsed > 0 ? adjustedRate : annualStats.consistencyRate;
    const consistencyText = consistencyRate > 70
        ? `You've shown up on [[${annualStats.activeDays}]] days so far this year — enough to form real identity momentum.`
        : consistencyRate > 40
            ? "You have the spark. With slightly more rhythm, this could become automatic."
            : "You're laying foundations. Early consistency matters more than volume.";

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
            text: "You experimented broadly this year. That curiosity is a strength — narrowing focus may unlock consistency.",
            priority: 0
        });
    }

    if (annualStats.fadingHabit) {
        sections.push({
            type: 'fading',
            text: `Your consistency with [[${annualStats.fadingHabit.name.toUpperCase()}]] has dropped significantly recently. If this was intentional, that’s clarity. If not, a small restart could bring it back into focus.`,
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
            text: `You haven't logged [[${neglected.name.toUpperCase()}]] for [[${daysSince(neglected.lastCompletedDate)}]] days. When it makes sense, a small revisit is enough.`,
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

export const buildWeeklyStory = (weekProgress: any, weeklyStats: any[], habits: Habit[], daysElapsed: number = 7): StoryResult => {
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
    if (rate >= 90) intro = `You're operating at an elite level with [[${completedCount}]] actions so far this week. Your habits aren't just actions; they are your identity.`;
    else if (rate >= 70) intro = `Strong consistency with [[${completedCount}]] completions. You're showing up for yourself, and the momentum is visible.`;
    else if (rate >= 40) intro = `A week of balance ([[${completedCount}]] completions). Some foundations held firm, others were tested. Re-centering is part of the process.`;
    else intro = `A low-velocity week with [[${completedCount}]] completions. These are often periods of rest or resistance—either way, they are data for a better next week.`;

    sections.push({
        type: 'consistency',
        text: intro,
        priority: 1
    });

    // 2. Habit Highlights
    if (topHabit && topHabit.completed >= Math.max(1, Math.floor(daysElapsed * 0.6))) {
        sections.push({
            type: 'momentum',
            text: `Your identity was strongest in [[${topHabit.name.toUpperCase()}]] this week, with [[${topHabit.completed}/${daysElapsed}]] days completed so far.`,
            priority: 2
        });
    }

    if (lowHabit && daysElapsed >= 3) {
        sections.push({
            type: 'neglected',
            text: `You haven't logged [[${lowHabit.name.toUpperCase()}]] yet this week. A small 2-minute version of it tomorrow could restart the rhythm.`,
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
                text: "You finished the week stronger than you started. That's 'recovery capacity' in action.",
                priority: 3
            });
        } else if (midWeekStrength > endWeekStrength + 5) {
            sections.push({
                type: 'rhythm',
                text: "You had a powerful start, but the weekend brought some friction. Identifying that 'Friday fade' is the first step to mastering it.",
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

export const buildMonthlyStory = (monthProgress: any, topHabits: any[], monthDelta: number, daysElapsed: number = 30): StoryResult => {
    const sections: StorySection[] = [];
    const completedCount = monthProgress.completed;
    const habitsCount = topHabits.length || 1; // Fallback to avoid div by zero

    // Pro-rated rate
    const totalPossibleSoFar = habitsCount * daysElapsed;
    const rate = totalPossibleSoFar > 0 ? (completedCount / totalPossibleSoFar) * 100 : monthProgress.percentage;

    // 1. Monthly Reflection
    let intro = "";
    if (rate >= 80) intro = `A month of exceptional focus ([[${completedCount}]] completions so far). You've successfully integrated these habits into your lifestyle.`;
    else if (rate >= 60) intro = `Solid progress this month. With [[${completedCount}]] total completions, you've established a strong baseline of consistency.`;
    else if (rate >= 30) intro = `A month of exploration. [[${completedCount}]] completions shows effort, but there's room to tighten your rhythm for next month.`;
    else intro = `A low-momentum month. Use the [[${completedCount}]] completions you did manage as architectural data for a more sustainable next month.`;

    sections.push({
        type: 'consistency',
        text: intro,
        priority: 1
    });

    // 2. Momentum / Delta
    if (Math.abs(monthDelta) > 5) {
        const momentumText = monthDelta > 0
            ? `You've seen a [[${monthDelta.toFixed(0)}%]] growth since last month—that's significant identity shifting in action.`
            : `Your rhythm cooled by [[${Math.abs(monthDelta).toFixed(0)}%]] this month. This is often a sign of life-balance adjusting; use it to recalibrate.`;

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
            text: `You were most dedicated to [[${topHabit.name.toUpperCase()}]] this month, showing up [[${topHabit.stats.completed}]] times. That is your current anchor.`,
            priority: 3
        });
    }

    return {
        focused: topHabit,
        sections: sections.sort((a, b) => a.priority - b.priority),
        highlights: {}
    };
};
