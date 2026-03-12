import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Flame, Trophy, Award, Star } from 'lucide-react-native';
import tw from 'twrnc';

const toDateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getStartOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isHabitActiveOnDate = (habit, date) => {
  const day = getStartOfDay(date);
  if (habit?.createdAt) {
    const created = getStartOfDay(habit.createdAt);
    if (day < created) return false;
  }
  if (habit?.archivedAt) {
    const archived = getStartOfDay(habit.archivedAt);
    if (day > archived) return false;
  }
  return true;
};

const isHabitDueOnDate = (habit, date) => {
  if (!isHabitActiveOnDate(habit, date)) return false;
  if (!habit.frequency || habit.frequency.length === 0) return true;
  return habit.frequency.includes(date.getDay());
};

const isDailyHabitDueOnDate = (habit, date) => {
  if (habit?.weeklyTarget) return false;
  return isHabitDueOnDate(habit, date);
};

const isCompletedOnDate = (habitId, date, completions) => {
  const key = toDateKey(date);
  return !!completions?.[habitId]?.[key];
};

const buildDateRange = (habits, completions) => {
  const today = getStartOfDay(new Date());
  let earliest = today;

  habits.forEach((habit) => {
    if (habit?.createdAt) {
      const created = getStartOfDay(habit.createdAt);
      if (created < earliest) earliest = created;
    }
  });

  Object.values(completions || {}).forEach((habitCompletions) => {
    Object.keys(habitCompletions || {}).forEach((dateKey) => {
      const d = new Date(dateKey);
      if (!Number.isNaN(d.getTime())) {
        const day = getStartOfDay(d);
        if (day < earliest) earliest = day;
      }
    });
  });

  const days = [];
  const cursor = new Date(earliest);
  while (cursor <= today) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

const clampPercent = (n) => Math.max(0, Math.min(100, Math.round(n)));

const TIER_STYLES = {
  core: { badgeBg: '#dcefff', badgeText: '#154c79', label: 'Core' },
  rare: { badgeBg: '#e6ddff', badgeText: '#4b2a7b', label: 'Rare' },
  elite: { badgeBg: '#ffe7c2', badgeText: '#8a4b00', label: 'Elite' },
  legend: { badgeBg: '#ffd4dc', badgeText: '#8d1832', label: 'Legend' }
};

const BadgeMedal = ({ badge, theme, isDark }) => {
  const tier = TIER_STYLES[badge.tier] || TIER_STYLES.core;
  return (
    <View style={tw`w-[32%] mb-5 items-center`}>
      <View style={[tw`w-[92px] h-[92px] rounded-full items-center justify-center`, badge.unlocked ? {} : { opacity: 0.75 }]}>
        <View
          style={[
            tw`absolute inset-0 rounded-full`,
            badge.unlocked
              ? { backgroundColor: theme.primary, borderWidth: 2, borderColor: theme.secondary }
              : { backgroundColor: isDark ? '#57534e' : '#a8a29e', borderWidth: 2, borderColor: isDark ? '#78716c' : '#d6d3d1' }
          ]}
        />
        <View style={[tw`absolute inset-[6px] rounded-full`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderWidth: 1, borderColor: isDark ? '#334155' : '#cbd5e1' }]} />
        <View style={[tw`absolute inset-[18px] rounded-full items-center justify-center`, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderWidth: 1, borderColor: isDark ? '#475569' : '#e2e8f0' }]}>
          {badge.unlocked ? (
            <Award size={20} color={theme.secondary} />
          ) : (
            <Star size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
          )}
        </View>
        <View style={[tw`absolute -bottom-2 px-2 py-0.5 rounded-full`, { backgroundColor: badge.unlocked ? tier.badgeBg : (isDark ? '#374151' : '#e5e7eb') }]}>
          <Text style={[tw`text-[8px] font-black uppercase tracking-widest`, { color: badge.unlocked ? tier.badgeText : (isDark ? '#9ca3af' : '#6b7280') }]}>{tier.label}</Text>
        </View>
      </View>

      <Text style={[tw`mt-4 text-[12px] font-black text-center`, { color: badge.unlocked ? (isDark ? '#f3f4f6' : '#111827') : (isDark ? '#9ca3af' : '#6b7280') }]}>
        {badge.title}
      </Text>
      <Text style={[tw`mt-1 text-[9px] font-bold text-center`, { color: isDark ? '#6b7280' : '#9ca3af' }]}>{badge.progressLabel}</Text>
      <View style={[tw`mt-2 h-1.5 w-[92px] rounded-full overflow-hidden`, { backgroundColor: isDark ? '#1f2937' : '#e5e7eb' }]}>
        <View style={{ height: '100%', width: `${badge.progress}%`, backgroundColor: badge.unlocked ? theme.secondary : (isDark ? '#6b7280' : '#9ca3af') }} />
      </View>
    </View>
  );
};

const StreakCard = ({ item, theme, isDark }) => (
  <View style={[tw`mb-3 rounded-2xl border-2 p-4`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#2a2a2a' : '#e5e7eb' }]}>
    <View style={tw`flex-row items-center justify-between`}>
      <View style={tw`flex-1 pr-3`}>
        <Text style={[tw`text-sm font-black`, { color: isDark ? '#f3f4f6' : '#111827' }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[tw`text-[10px] font-black uppercase mt-1`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{item.badge}</Text>
      </View>
      <View style={[tw`px-2 py-1 rounded-lg flex-row items-center`, { backgroundColor: isDark ? '#1f2937' : '#fff7ed' }]}>
        <Flame size={14} color={theme.primary} fill={theme.primary} />
        <Text style={[tw`ml-1 text-base font-black`, { color: theme.primary }]}>{item.currentStreak}</Text>
      </View>
    </View>

    <View style={tw`mt-3 flex-row justify-between`}>
      <Text style={[tw`text-[10px] font-black uppercase`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Best {item.maxStreak}d</Text>
      <Text style={[tw`text-[10px] font-black uppercase`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{item.completed} completions</Text>
    </View>

    <View style={[tw`h-2 rounded-full mt-2 overflow-hidden`, { backgroundColor: isDark ? '#1f2937' : '#e5e7eb' }]}>
      <View
        style={{
          height: '100%',
          width: `${Math.min(100, item.maxStreak > 0 ? (item.currentStreak / item.maxStreak) * 100 : 0)}%`,
          backgroundColor: theme.primary
        }}
      />
    </View>
  </View>
);

export const BadgesStreaksView = ({ habits, completions, theme, colorMode = 'light' }) => {
  const [tab, setTab] = useState('streaks');
  const isDark = colorMode === 'dark';

  const streakData = useMemo(() => {
    const days = buildDateRange(habits, completions);
    const today = getStartOfDay(new Date());

    const perHabit = habits.map((habit) => {
      let currentStreak = 0;
      let maxStreak = 0;
      let rolling = 0;
      let completed = 0;

      days.forEach((d) => {
        if (!isHabitDueOnDate(habit, d)) return;
        const done = isCompletedOnDate(habit.id, d, completions);
        if (done) {
          completed += 1;
          rolling += 1;
          maxStreak = Math.max(maxStreak, rolling);
        } else {
          rolling = 0;
        }
      });

      const cursor = new Date(today);
      while (cursor >= days[0]) {
        if (isHabitDueOnDate(habit, cursor)) {
          if (isCompletedOnDate(habit.id, cursor, completions)) {
            currentStreak += 1;
          } else {
            break;
          }
        }
        cursor.setDate(cursor.getDate() - 1);
      }

      let badge = 'Active Habit';
      if (maxStreak >= 100) badge = 'Legendary';
      else if (maxStreak >= 30) badge = 'Most Consistent';
      else if (currentStreak >= 14) badge = 'Identity Driver';
      else if (completed >= 20) badge = 'Most Attempted';

      return {
        id: habit.id,
        name: habit.name || 'Untitled',
        currentStreak,
        maxStreak,
        completed,
        badge
      };
    }).sort((a, b) => (b.currentStreak - a.currentStreak) || (b.maxStreak - a.maxStreak) || (b.completed - a.completed));

    const globalCurrentStreak = (() => {
      let streak = 0;
      const cursor = new Date(today);
      while (cursor >= days[0]) {
        const dueHabits = habits.filter((h) => isHabitDueOnDate(h, cursor));
        if (dueHabits.length === 0) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        const completedCount = dueHabits.filter((h) => isCompletedOnDate(h.id, cursor, completions)).length;
        if (completedCount > 0) {
          streak += 1;
        } else {
          break;
        }
        cursor.setDate(cursor.getDate() - 1);
      }
      return streak;
    })();

    let globalMaxStreak = 0;
    {
      let running = 0;
      days.forEach((d) => {
        const dueHabits = habits.filter((h) => isHabitDueOnDate(h, d));
        if (dueHabits.length === 0) return;
        const completedCount = dueHabits.filter((h) => isCompletedOnDate(h.id, d, completions)).length;
        if (completedCount > 0) {
          running += 1;
          globalMaxStreak = Math.max(globalMaxStreak, running);
        } else {
          running = 0;
        }
      });
    }

    const totalDueDays = days.reduce((sum, d) => {
      const dueHabits = habits.filter((h) => isHabitDueOnDate(h, d));
      return sum + dueHabits.length;
    }, 0);

    const totalDoneDays = days.reduce((sum, d) => {
      const dueHabits = habits.filter((h) => isHabitDueOnDate(h, d));
      return sum + dueHabits.filter((h) => isCompletedOnDate(h.id, d, completions)).length;
    }, 0);

    const consistencyRate = totalDueDays > 0 ? (totalDoneDays / totalDueDays) * 100 : 0;
    const eliteHabits = perHabit.filter((h) => {
      const due = days.filter((d) => isHabitDueOnDate(habits.find((x) => x.id === h.id), d)).length;
      return due > 0 && (h.completed / due) >= 0.8;
    }).length;
    const precisionHabits = perHabit.filter((h) => {
      const due = days.filter((d) => isHabitDueOnDate(habits.find((x) => x.id === h.id), d)).length;
      return due > 0 && h.completed >= 10 && (h.completed / due) >= 0.95;
    }).length;

    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    yearStart.setHours(0, 0, 0, 0);
    const yearEnd = getStartOfDay(now);
    const yearDates = [];
    const yearCursor = new Date(yearStart);
    while (yearCursor <= yearEnd) {
      yearDates.push(new Date(yearCursor));
      yearCursor.setDate(yearCursor.getDate() + 1);
    }

    const monthSummaries = Array.from({ length: now.getMonth() + 1 }, (_, monthIdx) => {
      const daysInMonth = new Date(now.getFullYear(), monthIdx + 1, 0).getDate();
      let totalPossible = 0;
      let totalCompleted = 0;
      let perfectDays = 0;
      let activeDays = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(now.getFullYear(), monthIdx, day);
        if (d > yearEnd) break;
        const dueHabits = habits.filter((h) => isDailyHabitDueOnDate(h, d));
        const doneCount = dueHabits.filter((h) => isCompletedOnDate(h.id, d, completions)).length;
        if (dueHabits.length > 0 && doneCount === dueHabits.length) perfectDays += 1;
        if (doneCount > 0) activeDays += 1;
        totalPossible += dueHabits.length;
        totalCompleted += doneCount;
      }

      const rate = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;
      return {
        monthIdx,
        total: totalPossible,
        completed: totalCompleted,
        rate,
        perfectDays,
        activeDays
      };
    });

    const perfectDays = monthSummaries.reduce((sum, m) => sum + m.perfectDays, 0);
    const completedMonths = monthSummaries;
    const loggedMonths = completedMonths.filter((m) => m.completed > 0).length;
    const perfectMonths = completedMonths.filter((m) => m.total > 0 && m.rate >= 99.5).length;
    const months80 = completedMonths.filter((m) => m.total > 0 && m.rate >= 80).length;
    const months90 = completedMonths.filter((m) => m.total > 0 && m.rate >= 90).length;
    const strongestMonthRate = completedMonths.reduce((max, m) => Math.max(max, m.rate || 0), 0);

    const weekBuckets = {};
    yearDates.forEach((d) => {
      const weekRef = new Date(d);
      const day = weekRef.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      weekRef.setDate(weekRef.getDate() + mondayOffset);
      weekRef.setHours(0, 0, 0, 0);
      const weekKey = toDateKey(weekRef);
      if (!weekBuckets[weekKey]) {
        weekBuckets[weekKey] = { total: 0, completed: 0 };
      }
      const dueHabits = habits.filter((h) => isDailyHabitDueOnDate(h, d));
      const doneCount = dueHabits.filter((h) => isCompletedOnDate(h.id, d, completions)).length;
      weekBuckets[weekKey].total += dueHabits.length;
      weekBuckets[weekKey].completed += doneCount;
    });
    const perfectWeeks = Object.values(weekBuckets).filter((w) => w.total > 0 && w.completed === w.total).length;

    const totalHabitsLogged = habits.filter((h) =>
      yearDates.some((d) => isCompletedOnDate(h.id, d, completions))
    ).length;

    const loggedDays = yearDates.filter((d) => {
      const dueHabits = habits.filter((h) => isDailyHabitDueOnDate(h, d));
      const doneCount = dueHabits.filter((h) => isCompletedOnDate(h.id, d, completions)).length;
      return doneCount > 0;
    }).length;
    const trackableDays = yearDates.filter((d) => habits.some((h) => isDailyHabitDueOnDate(h, d))).length;
    const activeDays = loggedDays;
    const yearConsistencyRate = (() => {
      const yearlyPossible = yearDates.reduce((sum, d) => sum + habits.filter((h) => isDailyHabitDueOnDate(h, d)).length, 0);
      const yearlyCompleted = yearDates.reduce((sum, d) => {
        const dueHabits = habits.filter((h) => isDailyHabitDueOnDate(h, d));
        return sum + dueHabits.filter((h) => isCompletedOnDate(h.id, d, completions)).length;
      }, 0);
      return yearlyPossible > 0 ? (yearlyCompleted / yearlyPossible) * 100 : 0;
    })();

    const badges = [
      {
        id: 'first-perfect-day',
        title: 'Perfect Day',
        description: 'Complete every habit due on one day.',
        unlocked: perfectDays >= 1,
        progress: clampPercent((perfectDays / 1) * 100),
        progressLabel: `${Math.min(perfectDays, 1)} / 1 day`,
        tier: 'core'
      },
      {
        id: 'ten-perfect-days',
        title: 'Clean Sheet',
        description: 'Log 10 perfect days in a year.',
        unlocked: perfectDays >= 10,
        progress: clampPercent((perfectDays / 10) * 100),
        progressLabel: `${Math.min(perfectDays, 10)} / 10 days`,
        tier: 'rare'
      },
      {
        id: 'perfect-week',
        title: 'Perfect Week',
        description: 'Finish a full week at 100%.',
        unlocked: perfectWeeks >= 1,
        progress: clampPercent((perfectWeeks / 1) * 100),
        progressLabel: `${Math.min(perfectWeeks, 1)} / 1 week`,
        tier: 'rare'
      },
      {
        id: 'perfect-month',
        title: 'Perfect Month',
        description: 'Close a month without a miss.',
        unlocked: perfectMonths >= 1,
        progress: clampPercent((perfectMonths / 1) * 100),
        progressLabel: `${Math.min(perfectMonths, 1)} / 1 month`,
        tier: 'elite'
      },
      {
        id: 'perfect-year',
        title: 'Perfect Year',
        description: 'Hold 100% yearly consistency.',
        unlocked: yearConsistencyRate >= 99.5 && trackableDays >= 300,
        progress: clampPercent(yearConsistencyRate),
        progressLabel: `${Math.round(Math.min(yearConsistencyRate, 100))} / 100%`,
        tier: 'legend'
      },
      {
        id: 'log-80-days',
        title: '80% of the Year',
        description: 'Show up on 80% of trackable days.',
        unlocked: trackableDays > 0 && (loggedDays / trackableDays) >= 0.8,
        progress: clampPercent(trackableDays > 0 ? (loggedDays / (trackableDays * 0.8)) * 100 : 0),
        progressLabel: `${loggedDays} / ${Math.max(1, Math.ceil(trackableDays * 0.8))} days`,
        tier: 'elite'
      },
      {
        id: 'century-club',
        title: 'Century Club',
        description: 'Log 100 active days in a year.',
        unlocked: activeDays >= 100,
        progress: clampPercent((activeDays / 100) * 100),
        progressLabel: `${Math.min(activeDays, 100)} / 100 days`,
        tier: 'core'
      },
      {
        id: 'double-century',
        title: 'Double Century',
        description: 'Log 200 active days in a year.',
        unlocked: activeDays >= 200,
        progress: clampPercent((activeDays / 200) * 100),
        progressLabel: `${Math.min(activeDays, 200)} / 200 days`,
        tier: 'rare'
      },
      {
        id: 'month-machine',
        title: 'Month Machine',
        description: 'Finish 6 months at 80%+.',
        unlocked: months80 >= 6,
        progress: clampPercent((months80 / 6) * 100),
        progressLabel: `${Math.min(months80, 6)} / 6 months`,
        tier: 'rare'
      },
      {
        id: 'golden-calendar',
        title: 'Golden Calendar',
        description: 'Finish 12 months at 90%+.',
        unlocked: months90 >= 12,
        progress: clampPercent((months90 / 12) * 100),
        progressLabel: `${Math.min(months90, 12)} / 12 months`,
        tier: 'legend'
      },
      {
        id: 'thirty',
        title: '30 Day Run',
        description: 'Reach a 30 day streak.',
        unlocked: globalMaxStreak >= 30,
        progress: clampPercent((globalMaxStreak / 30) * 100),
        progressLabel: `${Math.min(globalMaxStreak, 30)} / 30 days`,
        tier: 'core'
      },
      {
        id: 'hundred',
        title: '100 Day Run',
        description: 'Reach a 100 day streak.',
        unlocked: globalMaxStreak >= 100,
        progress: clampPercent((globalMaxStreak / 100) * 100),
        progressLabel: `${Math.min(globalMaxStreak, 100)} / 100 days`,
        tier: 'elite'
      },
      {
        id: 'year',
        title: '365 Day Run',
        description: 'Hold a full year streak.',
        unlocked: globalMaxStreak >= 365,
        progress: clampPercent((globalMaxStreak / 365) * 100),
        progressLabel: `${Math.min(globalMaxStreak, 365)} / 365 days`,
        tier: 'legend'
      },
      {
        id: 'hot-start',
        title: 'Hot Start',
        description: 'Build a live streak of 14 days.',
        unlocked: globalCurrentStreak >= 14,
        progress: clampPercent((globalCurrentStreak / 14) * 100),
        progressLabel: `${Math.min(globalCurrentStreak, 14)} / 14 days`,
        tier: 'core'
      },
      {
        id: 'habit-squad',
        title: 'Habit Squad',
        description: 'Keep 3 habits above 80% completion.',
        unlocked: eliteHabits >= 3,
        progress: clampPercent((eliteHabits / 3) * 100),
        progressLabel: `${Math.min(eliteHabits, 3)} / 3 habits`,
        tier: 'rare'
      },
      {
        id: 'precision',
        title: 'Precision Stack',
        description: 'Keep 2 habits above 95% completion.',
        unlocked: precisionHabits >= 2,
        progress: clampPercent((precisionHabits / 2) * 100),
        progressLabel: `${Math.min(precisionHabits, 2)} / 2 habits`,
        tier: 'elite'
      },
      {
        id: 'full-roster',
        title: 'Full Roster',
        description: 'Log activity on 10 different habits.',
        unlocked: totalHabitsLogged >= 10,
        progress: clampPercent((totalHabitsLogged / 10) * 100),
        progressLabel: `${Math.min(totalHabitsLogged, 10)} / 10 habits`,
        tier: 'rare'
      },
      {
        id: 'peak-month',
        title: 'Peak Month',
        description: 'Hit 95% in your best month.',
        unlocked: strongestMonthRate >= 95,
        progress: clampPercent((strongestMonthRate / 95) * 100),
        progressLabel: `${Math.round(Math.min(strongestMonthRate, 95))} / 95%`,
        tier: 'elite'
      },
      {
        id: 'all-season',
        title: 'All Season',
        description: 'Log something in every completed month.',
        unlocked: completedMonths.length > 0 && loggedMonths === completedMonths.length,
        progress: clampPercent(completedMonths.length > 0 ? (loggedMonths / completedMonths.length) * 100 : 0),
        progressLabel: `${loggedMonths} / ${completedMonths.length || 1} months`,
        tier: 'rare'
      },
      {
        id: 'eighty',
        title: '80% Year',
        description: 'Stay above 80% consistency.',
        unlocked: yearConsistencyRate >= 80,
        progress: clampPercent((yearConsistencyRate / 80) * 100),
        progressLabel: `${Math.round(Math.min(yearConsistencyRate, 80))} / 80%`,
        tier: 'elite'
      },
      {
        id: 'ninety',
        title: '90% Year',
        description: 'Stay above 90% consistency.',
        unlocked: yearConsistencyRate >= 90,
        progress: clampPercent((yearConsistencyRate / 90) * 100),
        progressLabel: `${Math.round(Math.min(yearConsistencyRate, 90))} / 90%`,
        tier: 'legend'
      }
    ];

    return {
      perHabit,
      globalCurrentStreak,
      globalMaxStreak,
      badges,
      unlockedBadgeCount: badges.filter((b) => b.unlocked).length
    };
  }, [habits, completions]);

  return (
    <View style={[tw`flex-1`, { backgroundColor: isDark ? '#000000' : '#f5f5f4' }]}>
      <ScrollView style={tw`flex-1 p-4`} contentContainerStyle={tw`pb-32`} showsVerticalScrollIndicator={false}>
        <View style={tw`flex-row justify-between mb-4`}>
          <View style={[tw`flex-1 mr-2 p-4 rounded-2xl border-2`, { backgroundColor: isDark ? '#0b0b0b' : '#fff7ed', borderColor: isDark ? '#2a2a2a' : '#fed7aa' }]}>
            <Text style={[tw`text-[10px] font-black uppercase`, { color: isDark ? '#9ca3af' : '#c2410c' }]}>Current</Text>
            <View style={tw`flex-row items-center mt-1`}>
              <Flame size={16} color={theme.primary} fill={theme.primary} />
              <Text style={[tw`ml-1 text-2xl font-black`, { color: theme.primary }]}>{streakData.globalCurrentStreak}</Text>
            </View>
          </View>
          <View style={[tw`flex-1 mx-1 p-4 rounded-2xl border-2`, { backgroundColor: isDark ? '#0b0b0b' : '#fffbeb', borderColor: isDark ? '#2a2a2a' : '#fde68a' }]}>
            <Text style={[tw`text-[10px] font-black uppercase`, { color: isDark ? '#9ca3af' : '#a16207' }]}>Best Ever</Text>
            <View style={tw`flex-row items-center mt-1`}>
              <Trophy size={16} color={theme.primary} />
              <Text style={[tw`ml-1 text-2xl font-black`, { color: theme.primary }]}>{streakData.globalMaxStreak}</Text>
            </View>
          </View>
          <View style={[tw`flex-1 ml-2 p-4 rounded-2xl border-2`, { backgroundColor: isDark ? '#0b0b0b' : '#f5f3ff', borderColor: isDark ? '#2a2a2a' : '#ddd6fe' }]}>
            <Text style={[tw`text-[10px] font-black uppercase`, { color: isDark ? '#9ca3af' : '#6d28d9' }]}>Badges</Text>
            <View style={tw`flex-row items-center mt-1`}>
              <Award size={16} color={theme.primary} />
              <Text style={[tw`ml-1 text-2xl font-black`, { color: theme.primary }]}>{streakData.unlockedBadgeCount}</Text>
            </View>
          </View>
        </View>

        <View style={[tw`flex-row p-1 rounded-xl border-2 mb-4`, { backgroundColor: isDark ? '#111111' : '#f3f4f6', borderColor: isDark ? '#2a2a2a' : '#d1d5db' }]}>
          <TouchableOpacity
            onPress={() => setTab('streaks')}
            style={[tw`flex-1 py-2 rounded-lg items-center`, tab === 'streaks' && { backgroundColor: theme.primary }]}
          >
            <Text style={[tw`text-xs font-black uppercase`, { color: tab === 'streaks' ? '#fff' : (isDark ? '#d1d5db' : '#6b7280') }]}>Streaks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('badges')}
            style={[tw`flex-1 py-2 rounded-lg items-center`, tab === 'badges' && { backgroundColor: theme.primary }]}
          >
            <Text style={[tw`text-xs font-black uppercase`, { color: tab === 'badges' ? '#fff' : (isDark ? '#d1d5db' : '#6b7280') }]}>Badges</Text>
          </TouchableOpacity>
        </View>

        {tab === 'streaks' ? (
          <View>
            {streakData.perHabit.map((item) => (
              <StreakCard key={item.id} item={item} theme={theme} isDark={isDark} />
            ))}
          </View>
        ) : (
          <View style={[tw`rounded-[24px] border-2 p-4`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#2a2a2a' : '#e5e7eb' }]} >
            <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-4`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Badges {streakData.unlockedBadgeCount}/{streakData.badges.length}
            </Text>
            <View style={tw`flex-row flex-wrap justify-between`}>
            {streakData.badges.map((badge) => (
              <BadgeMedal key={badge.id} badge={badge} theme={theme} isDark={isDark} />
            ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
