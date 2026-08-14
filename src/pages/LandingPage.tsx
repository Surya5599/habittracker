import { AnimatePresence, motion } from 'framer-motion';
import {
  Angry,
  ArrowRight,
  Check,
  ExternalLink,
  Flame,
  Frown,
  Laugh,
  Meh,
  Plus,
  Save,
  Smile,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { useTheme } from '../hooks/useTheme';
import { THEMES, MOOD_SCALE } from '../constants';
import { supabase } from '../supabase';

type ActiveDay = {
  day: number;
  percent: number;
};

type MonthCardProps = {
  monthName: string;
  year: string;
  percentDone: number;
  logs: string;
  completedText: string;
  daysInMonth: number;
  startDay: number;
  activeDays: ActiveDay[];
  topHabit: string;
};

type HabitItem = {
  name: string;
  done: boolean;
  count?: string;
};

type TaskItem = {
  text: string;
  done: boolean;
};

const monthsData: MonthCardProps[] = [
  {
    monthName: 'January',
    year: '2026',
    percentDone: 35,
    logs: '11/31',
    completedText: 'Getting started',
    daysInMonth: 31,
    startDay: 4,
    activeDays: [
      { day: 5, percent: 100 }, { day: 8, percent: 50 }, { day: 12, percent: 80 },
      { day: 15, percent: 100 }, { day: 22, percent: 60 }, { day: 28, percent: 100 },
    ],
    topHabit: 'Reading',
  },
  {
    monthName: 'February',
    year: '2026',
    percentDone: 68,
    logs: '19/28',
    completedText: 'Building momentum',
    daysInMonth: 28,
    startDay: 0,
    activeDays: [
      { day: 2, percent: 100 }, { day: 3, percent: 80 }, { day: 5, percent: 100 },
      { day: 8, percent: 100 }, { day: 9, percent: 100 }, { day: 12, percent: 80 },
      { day: 15, percent: 100 }, { day: 18, percent: 60 }, { day: 22, percent: 100 },
      { day: 25, percent: 100 }, { day: 26, percent: 80 },
    ],
    topHabit: 'Exercise',
  },
  {
    monthName: 'March',
    year: '2026',
    percentDone: 92,
    logs: '29/31',
    completedText: 'Best focus month',
    daysInMonth: 31,
    startDay: 0,
    activeDays: [
      { day: 1, percent: 100 }, { day: 2, percent: 100 }, { day: 3, percent: 88 },
      { day: 4, percent: 89 }, { day: 5, percent: 100 }, { day: 6, percent: 100 },
      { day: 7, percent: 100 }, { day: 8, percent: 56 }, { day: 9, percent: 67 },
      { day: 10, percent: 100 }, { day: 12, percent: 100 }, { day: 14, percent: 100 },
      { day: 15, percent: 80 }, { day: 18, percent: 100 }, { day: 20, percent: 100 },
      { day: 22, percent: 100 }, { day: 25, percent: 100 }, { day: 28, percent: 100 },
      { day: 30, percent: 100 }, { day: 31, percent: 100 },
    ],
    topHabit: 'Cold Shower',
  },
];

const defaultHabits = (): HabitItem[] => ([
  { name: 'Cold Shower', done: true },
  { name: 'No Sugar', done: true },
  { name: 'Meditation', done: true },
  { name: 'Exercise', done: false, count: '0/4' },
  { name: 'Plan Tomorrow', done: false },
  { name: 'Reading', done: true },
  { name: 'Journaling', done: true },
  { name: 'Limit Screen Time', done: false },
  { name: 'Wake up 6AM', done: false },
]);

const LANDING_MOODS = [
  { value: 1, icon: Angry, color: MOOD_SCALE[0], label: 'Very Bad' },
  { value: 2, icon: Frown, color: MOOD_SCALE[1], label: 'Bad' },
  { value: 3, icon: Meh, color: MOOD_SCALE[2], label: 'Okay' },
  { value: 4, icon: Smile, color: MOOD_SCALE[3], label: 'Good' },
  { value: 5, icon: Laugh, color: MOOD_SCALE[4], label: 'Very Good' },
] as const;

const mixHex = (colorA: string, colorB: string, weight = 0.5) => {
  const hexA = colorA.replace('#', '');
  const hexB = colorB.replace('#', '');
  const parse = (hex: string, start: number) => parseInt(hex.slice(start, start + 2), 16);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * weight);
  const r = mix(parse(hexA, 0), parse(hexB, 0));
  const g = mix(parse(hexA, 2), parse(hexB, 2));
  const b = mix(parse(hexA, 4), parse(hexB, 4));
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

const StorySection: React.FC = () => {
  return (
    <section className="overflow-hidden border-t-4 border-edge-strong bg-surface px-6 py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="relative order-2 mx-auto w-full max-w-lg lg:order-1">
          <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--landing-neo-green)]/20 blur-3xl" />
          <div className="shadow-neo relative z-10 flex flex-col gap-6 rounded-2xl border-3 border-edge-strong bg-surface p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-neo-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              <h3 className="text-xs font-black uppercase tracking-[0.15em] text-ink-muted">Your Story This Month</h3>
            </div>
            <p className="text-lg font-bold leading-relaxed text-ink-strong">
              You logged <span className="text-[var(--landing-neo-green)]">53</span> completions this month. Narrowing focus could improve carryover next month.
            </p>
            <p className="text-lg font-bold italic leading-relaxed text-ink-strong">
              You&apos;re up <span className="text-[var(--landing-neo-green)]">21%</span> versus last month, a clear positive shift in execution.
            </p>
            <p className="text-lg font-bold italic leading-relaxed text-ink-strong">
              <span className="text-[var(--landing-neo-green)]">Journaling</span> was your anchor this month with <span className="text-[var(--landing-neo-green)]">7</span> completions.
            </p>
          </div>
        </div>

        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <div className="shadow-neo mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border-3 border-edge-strong bg-[var(--landing-neo-green)] text-ink-strong">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="font-serif text-5xl font-black uppercase leading-[0.9] tracking-tight md:text-7xl">
            Get Your <br /><span className="text-[var(--landing-neo-green)]">Weekly & Yearly</span> Story
          </h2>
          <p className="max-w-lg text-xl font-medium leading-relaxed text-ink">
            Don&apos;t just track numbers. Get personalized insights that tell the story of your progress, highlight your anchors, and guide your focus for the next cycle.
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {['Actionable feedback', 'Identify your anchor habits', 'Course-correct before you slip'].map((item) => (
              <li key={item} className="flex items-center gap-4 text-lg font-bold">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-3 border-edge-strong bg-surface">
                  <Check className="h-5 w-5" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

const MonthCard: React.FC<MonthCardProps> = ({
  monthName,
  year,
  percentDone,
  logs,
  completedText,
  daysInMonth,
  startDay,
  activeDays,
  topHabit,
}) => {
  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - startDay + 1;
    if (dayNum > 0 && dayNum <= daysInMonth) {
      const active = activeDays.find((d) => d.day === dayNum);
      return { dayNum, active };
    }
    return null;
  });

  const lastDayIndex = days.map((d, i) => (d ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
  const rowsNeeded = Math.ceil((lastDayIndex + 1) / 7);
  const visibleDays = days.slice(0, rowsNeeded * 7);

  return (
    <div className="flex h-full flex-col rounded-2xl bg-surface p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-ink-muted">{monthName} {year}</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-surface-inverse px-2.5 py-1 text-[10px] font-bold text-ink-inverse">{percentDone}% DONE</span>
            <span className="text-xs font-bold text-ink-muted">{logs} logs</span>
          </div>
          <p className="mt-1.5 text-xs font-medium text-ink">{completedText}</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-full border border-edge px-3 py-1.5 text-[10px] font-bold text-ink transition-colors hover:bg-surface-muted">
          OPEN <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-7 gap-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="mb-2 text-center text-[10px] font-black text-ink-subtle">{d}</div>
        ))}
        {visibleDays.map((day, i) => {
          if (!day) {
            return <div key={i} className="aspect-square" />;
          }

          if (day.active) {
            const opacity = day.active.percent === 100 ? 1 : day.active.percent >= 80 ? 0.75 : day.active.percent >= 50 ? 0.5 : 0.25;
            const textColor = day.active.percent >= 50 ? 'white' : 'black';

            return (
              <div
                key={i}
                className="aspect-square cursor-pointer rounded-xl border border-transparent shadow-sm transition-transform hover:scale-105 flex flex-col items-center justify-center"
                style={{ backgroundColor: `color-mix(in srgb, var(--landing-neo-green) ${opacity * 100}%, white)`, color: textColor }}
              >
                <span className="mb-0.5 text-[9px] font-bold leading-none opacity-80">{day.dayNum}</span>
                <span className="text-[10px] font-black leading-none">{day.active.percent}%</span>
              </div>
            );
          }

          return (
            <div key={i} className="relative flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-edge-subtle transition-colors hover:bg-surface-muted">
              <span className="absolute left-1.5 top-1.5 text-[9px] font-bold text-ink-subtle">{day.dayNum}</span>
              <div className="mt-2 h-1.5 w-1.5 rounded-full bg-edge" />
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-edge-subtle pt-4 text-[11px] font-bold text-ink-muted">
        <span>{logs} done</span>
        <span>{topHabit}</span>
      </div>
    </div>
  );
};

const YearInReview: React.FC = () => {
  const [currentMonthIdx, setCurrentMonthIdx] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentMonthIdx((prev) => (prev + 1) % monthsData.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="overflow-hidden border-t-4 border-edge-strong bg-[#fafaf9] px-6 py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="shadow-neo mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border-3 border-edge-strong bg-[var(--landing-neo-pink)] text-ink-inverse">
            <Zap className="h-8 w-8 fill-black text-ink-strong" />
          </div>
          <h2 className="font-serif text-5xl font-black uppercase leading-[0.9] tracking-tight md:text-7xl">
            Your Year <br /><span className="text-[var(--landing-neo-blue)]">In Review</span>
          </h2>
          <p className="max-w-lg text-xl font-medium leading-relaxed text-ink">
            Building habits isn&apos;t just about today. It&apos;s about the long game. Watch your consistency grow month over month with beautiful, shareable retro grids.
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {[
              { label: 'Spot long-term patterns', color: 'var(--landing-neo-green)' },
              { label: 'Celebrate your best months', color: 'var(--landing-neo-yellow)' },
              { label: 'Share your progress with friends', color: 'var(--landing-neo-pink)' },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-4 text-lg font-bold">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-3 border-edge-strong" style={{ backgroundColor: item.color }}>
                  <Check className="h-5 w-5" />
                </div>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto h-[450px] w-full max-w-md [perspective:1000px]">
          <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--landing-neo-yellow)]/20 blur-3xl" />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMonthIdx}
              initial={{ rotateX: 90, opacity: 0, scale: 0.9 }}
              animate={{ rotateX: 0, opacity: 1, scale: 1 }}
              exit={{ rotateX: -90, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="shadow-neo absolute inset-0 z-10 rounded-2xl border-3 border-edge-strong bg-surface"
            >
              <MonthCard {...monthsData[currentMonthIdx]} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const InteractiveCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'habits' | 'tasks' | 'journal'>('habits');
  const [habits, setHabits] = useState<HabitItem[]>(defaultHabits);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [mood, setMood] = useState(2);
  const [journalText, setJournalText] = useState('');

  useEffect(() => {
    let isMounted = true;
    const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

    const runAnimation = async () => {
      while (isMounted) {
        setActiveTab('habits');
        setHabits(defaultHabits());
        setTasks([]);
        setIsAddingTask(false);
        setTaskInput('');
        setMood(2);
        setJournalText('');

        await delay(1500);
        if (!isMounted) break;

        setHabits((prev) => prev.map((h) => (h.name === 'Exercise' ? { ...h, done: true, count: '1/4' } : h)));
        await delay(800);
        if (!isMounted) break;

        setHabits((prev) => prev.map((h) => (h.name === 'Plan Tomorrow' ? { ...h, done: true } : h)));
        await delay(1500);
        if (!isMounted) break;

        setActiveTab('tasks');
        await delay(1000);
        if (!isMounted) break;

        setIsAddingTask(true);
        await delay(500);
        if (!isMounted) break;

        const taskStr = 'Buy groceries';
        for (let i = 1; i <= taskStr.length; i += 1) {
          setTaskInput(taskStr.substring(0, i));
          await delay(50);
        }
        await delay(500);
        if (!isMounted) break;

        setTasks([{ text: taskStr, done: false }]);
        setIsAddingTask(false);
        setTaskInput('');
        await delay(1000);
        if (!isMounted) break;

        setTasks([{ text: taskStr, done: true }]);
        await delay(1500);
        if (!isMounted) break;

        setActiveTab('journal');
        await delay(1000);
        if (!isMounted) break;

        setMood(4);
        await delay(800);
        if (!isMounted) break;

        const journalStr = 'Had a great day! Got so much done.';
        for (let i = 1; i <= journalStr.length; i += 1) {
          setJournalText(journalStr.substring(0, i));
          await delay(30);
        }
        await delay(3000);
        if (!isMounted) break;
      }
    };

    runAnimation();

    return () => {
      isMounted = false;
    };
  }, []);

  const completedHabits = habits.filter((h) => h.done).length;
  const totalHabits = habits.length;
  const percentage = Math.round((completedHabits / totalHabits) * 100);
  const selectedMood = LANDING_MOODS.find((item) => item.value === mood + 1) ?? LANDING_MOODS[2];

  const renderContent = () => {
    if (activeTab === 'habits') {
      return (
        <div className="landing-scrollbar flex flex-1 flex-col items-center overflow-y-auto p-6">
          <div className="relative mb-6 mt-2 h-28 w-28 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-ink-dim"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="transition-all duration-500 ease-out"
                style={{ color: 'var(--landing-neo-green)' }}
                strokeWidth="4"
                strokeDasharray={`${percentage}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-black">{percentage}%</span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4">
            {habits.map((habit) => (
              <div key={habit.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold transition-colors duration-300 ${habit.done ? 'text-ink-subtle line-through decoration-2' : 'text-ink'}`}>
                    {habit.name}
                  </span>
                  {habit.count && (
                    <span className="rounded border border-edge bg-surface-strong px-1 text-[10px] font-bold text-ink-muted">
                      {habit.count}
                    </span>
                  )}
                </div>
                <div className={`flex h-5 w-5 items-center justify-center rounded border-2 border-edge-strong transition-colors duration-300 ${habit.done ? 'bg-theme-primary text-white' : 'bg-surface'}`}>
                  {habit.done && <Check className="h-3 w-3 stroke-[4]" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'tasks') {
      return (
        <div className="flex flex-1 flex-col bg-surface">
          <div className="flex shrink-0 items-center justify-between border-b border-edge-subtle p-3">
            <div className="rounded border border-edge-muted px-2 py-1 text-[10px] font-bold text-ink">
              {tasks.length} TASKS
            </div>
            <div className="flex cursor-pointer items-center gap-1 rounded border border-edge-strong px-2 py-1 text-[10px] font-bold hover:bg-surface-strong">
              <Plus className="h-3 w-3" /> ADD
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            {isAddingTask && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 shrink-0 rounded border-2 border-edge-muted" />
                <div className="flex-1 border-b-2 border-edge-strong pb-1">
                  <span className="text-sm font-bold">{taskInput}</span>
                  <span className="ml-1 inline-block h-4 w-1.5 animate-pulse align-middle bg-surface-inverse" />
                </div>
              </div>
            )}
            {tasks.map((task) => (
              <div key={task.text} className="flex items-center gap-3">
                <div className={`flex h-5 w-5 items-center justify-center rounded border-2 border-edge-strong transition-colors duration-300 ${task.done ? 'bg-theme-primary text-white' : 'bg-surface'}`}>
                  {task.done && <Check className="h-3 w-3 stroke-[4]" />}
                </div>
                <span className={`text-sm font-bold transition-colors duration-300 ${task.done ? 'text-ink-subtle line-through decoration-2' : 'text-ink'}`}>
                  {task.text}
                </span>
              </div>
            ))}
            {!isAddingTask && tasks.length === 0 && (
              <div className="flex flex-1 items-center justify-center">
                <span className="text-sm font-medium italic text-ink-subtle">No Tasks Today</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col bg-surface p-6">
        <div className="mb-6 shrink-0 text-center">
          <span className="text-[11px] font-black tracking-widest text-ink">MOOD</span>
          <div className="mt-3 flex justify-center gap-4">
            {LANDING_MOODS.map((item, i) => {
              const Icon = item.icon;
              return (
              <div key={item.value} className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${i === mood ? 'scale-110 border-2 border-edge-strong shadow-neo-sm' : 'opacity-60'}`} style={i === mood ? { backgroundColor: 'var(--landing-neo-green)' } : {}}>
                <Icon
                  size={20}
                  strokeWidth={i === mood ? 2.8 : 2}
                  className="text-ink-strong"
                  fill={i === mood ? item.color : 'none'}
                />
              </div>
            );})}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex shrink-0 items-center justify-between">
            <span className="text-[11px] font-black tracking-widest text-ink">NOTES</span>
            <button className="flex items-center gap-1 rounded border border-edge-muted px-2 py-1 text-[10px] font-bold text-ink transition-colors hover:bg-surface-strong">
              <Save className="h-3 w-3" /> SAVE
            </button>
          </div>
          <div className="relative flex-1 rounded-xl border border-edge-subtle bg-surface-muted p-4 text-sm font-medium leading-relaxed text-ink-strong shadow-inner">
            {journalText}
            {journalText.length > 0 && journalText.length < 'Had a great day! Got so much done.'.length && (
              <span className="ml-1 inline-block h-4 w-1.5 animate-pulse align-middle bg-surface-inverse" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pointer-events-none z-10 mx-auto h-[520px] w-full max-w-[280px] [perspective:1000px] sm:h-[560px] sm:max-w-[300px] md:h-[600px] md:max-w-[320px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="shadow-neo flex h-full w-full flex-col overflow-hidden rounded-2xl border-4 border-edge-strong bg-surface md:rounded-2xl"
        >
          <div className="shrink-0 border-b-4 border-edge-strong p-4 text-center text-ink-inverse md:p-6" style={{ backgroundColor: 'var(--landing-neo-green)' }}>
            <h2 className="text-[1.7rem] font-black uppercase tracking-wide drop-shadow-sm md:text-3xl">Sunday</h2>
            <p className="mt-1 text-xs font-bold opacity-90 md:text-sm">Mar 8, 2026</p>
          </div>

          {renderContent()}

          <div className="grid shrink-0 grid-cols-3 border-t-4 border-edge-strong bg-surface">
            <div className={`flex flex-col items-center justify-center border-r-4 border-edge-strong p-2.5 transition-colors md:p-3 ${activeTab === 'habits' ? 'bg-surface-strong' : ''}`}>
              <span className="mb-1 text-[9px] font-black tracking-wider text-ink-muted md:text-[10px]">HABITS</span>
              <span className="text-xs font-bold text-ink-strong md:text-sm">{completedHabits}/{totalHabits}</span>
            </div>
            <div className={`flex flex-col items-center justify-center border-r-4 border-edge-strong p-2.5 transition-colors md:p-3 ${activeTab === 'tasks' ? 'bg-surface-strong' : ''}`}>
              <span className="mb-1 text-[9px] font-black tracking-wider text-ink-muted md:text-[10px]">TASKS</span>
              <span className="text-xs font-bold text-ink-strong md:text-sm">{tasks.length > 0 ? tasks.length : '+'}</span>
            </div>
            <div className={`flex flex-col items-center justify-center p-2.5 transition-colors md:p-3 ${activeTab === 'journal' ? 'bg-surface-strong' : ''}`}>
              <span className="mb-1 text-[9px] font-black tracking-wider text-ink-muted md:text-[10px]">JOURNAL</span>
              <div className="flex items-center justify-center">
                <selectedMood.icon size={16} strokeWidth={2.8} className="text-ink-strong" fill={selectedMood.color} />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | null>(null);

  useEffect(() => {
    let active = true;
    const source = new URLSearchParams(location.search).get('source');
    const appPath = source === 'extension' ? '/app?source=extension' : '/app';

    setMounted(true);
    // Skip the getSession() redirect when there's a PKCE code in the URL — that means
    // a password-recovery (or email-confirm) flow is in progress; PasswordRecoveryGuard
    // or AuthCallback will take over once the code is exchanged.
    const hasPkceCode = new URLSearchParams(location.search).has('code');
    if (!hasPkceCode) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (active && session) {
          navigate(appPath, { replace: true });
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Let PasswordRecoveryGuard handle recovery links — don't race it to /app.
      if (event === 'PASSWORD_RECOVERY') return;
      if (session) {
        navigate(appPath, { replace: true });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const previousMode = document.documentElement.getAttribute('data-color-mode') || 'light';
    const previousColorScheme = document.documentElement.style.colorScheme;

    document.documentElement.setAttribute('data-color-mode', 'light');
    document.documentElement.style.colorScheme = 'light';

    return () => {
      document.documentElement.setAttribute('data-color-mode', previousMode);
      document.documentElement.style.colorScheme = previousColorScheme || previousMode;
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/signin') {
      setAuthModalMode('signin');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!authModalMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAuthModalMode(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [authModalMode]);

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen overflow-hidden bg-[var(--landing-neo-bg)] font-sans text-ink-strong"
      style={{
        ['--landing-neo-green' as string]: theme.primary,
        ['--landing-neo-pink' as string]: theme.secondary,
        ['--landing-neo-blue' as string]: mixHex(theme.primary, theme.secondary, 0.65),
        ['--landing-neo-yellow' as string]: mixHex(theme.primary, theme.secondary, 0.4),
        ['--landing-neo-orange' as string]: mixHex(theme.primary, theme.secondary, 0.8),
        ['--landing-neo-bg' as string]: mixHex('#fcfbf7', theme.secondary, 0.12),
      }}
    >
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <div className="flex items-center">
          <span className="text-[1.7rem] font-black uppercase tracking-tighter sm:text-3xl md:text-4xl">
            <span className="text-[#404040]">HABI</span>
            <span className="text-[#c59b97]">CARD</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setAuthModalMode('signin')}
            className="inline-flex min-h-10 items-center justify-center rounded-full border-3 border-edge-strong bg-surface px-3 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-ink-strong transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-sm"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setAuthModalMode('signup')}
            className="shadow-neo inline-flex min-h-10 items-center justify-center rounded-full border-3 border-edge-strong bg-[var(--landing-neo-yellow)] px-3 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-ink-strong transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-sm"
          >
            Sign Up
          </button>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => setAuthModalMode('signin')}
            className="inline-flex items-center gap-2 text-lg font-bold hover:underline decoration-4 underline-offset-4"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setAuthModalMode('signup')}
            className="shadow-neo rounded-full border-3 border-edge-strong bg-[var(--landing-neo-yellow)] px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-ink-strong transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-sm"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <main className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 pb-16 pt-6 sm:px-6 md:pb-24 md:pt-14 lg:grid-cols-2 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="z-10 flex flex-col gap-6 md:gap-8"
        >
          <div className="shadow-neo inline-flex w-fit items-center gap-2 rounded-full border-3 border-edge-strong bg-[var(--landing-neo-green)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-inverse sm:px-4 sm:text-sm">
            <Flame className="h-4 w-4" />
            <span>The #1 Habit Tracker</span>
          </div>

          <h1 className="font-serif text-4xl font-black leading-[0.92] tracking-tighter sm:text-5xl md:text-7xl">
            BUILD <span className="text-[var(--landing-neo-pink)]">HABITS</span><br />
            THAT <span className="text-[var(--landing-neo-blue)]">STICK.</span>
          </h1>

          <p className="max-w-lg text-base font-medium leading-relaxed sm:text-lg md:text-xl">
            Stop breaking your streaks. HabiCard turns your daily goals into visual, satisfying cards that you actually want to complete.
          </p>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-subtle">Multiple themes — pick your own</p>
          <div className="flex flex-wrap gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.name}
                type="button"
                title={t.name}
                onClick={() => setTheme(t)}
                className={`h-5 w-5 rounded-full overflow-hidden shrink-0 transition-transform hover:scale-125 ${theme.name === t.name ? 'ring-2 ring-ring ring-offset-1 scale-125' : 'border-2 border-edge-strong/20'}`}
                style={{ background: `linear-gradient(135deg, ${t.primary} 50%, ${t.secondary} 50%)` }}
              />
            ))}
          </div>
          </div>

          <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => setAuthModalMode('signup')}
              className="shadow-neo inline-flex items-center justify-center gap-3 rounded-xl border-3 border-edge-strong bg-[var(--landing-neo-yellow)] px-6 py-4 text-lg font-black text-ink-inverse transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm sm:px-8 sm:text-xl"
            >
              Start for Free <ArrowRight className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold sm:mt-4 sm:gap-4">
            <div className="flex shrink-0 -space-x-3">
              {[
                'var(--landing-neo-pink)',
                'var(--landing-neo-blue)',
                'var(--landing-neo-green)',
                'var(--landing-neo-yellow)',
              ].map((color, i) => (
                <div key={i} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-3 border-edge-strong" style={{ backgroundColor: color }}>
                  <img
                    src={`https://i.pravatar.cc/100?img=${i + 11}`}
                    alt="User"
                    className="h-full w-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
            <p className="leading-tight">Join <span className="text-[var(--landing-neo-orange)] text-lg">1000+</span> habit builders</p>
          </div>
        </motion.div>

        <div className="relative flex h-[560px] w-full items-center justify-center px-2 [perspective:1000px] sm:h-[430px] sm:px-0 md:h-[450px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-[var(--landing-neo-pink)] opacity-30 blur-3xl"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[var(--landing-neo-blue)] opacity-30 blur-3xl"
          />
          <InteractiveCard />
        </div>
      </main>

      <section id="features" className="border-y-4 border-edge-strong bg-surface-inverse py-16 text-ink-inverse sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                icon: Zap,
                color: 'var(--landing-neo-pink)',
                title: 'Lightning Fast',
                copy: 'Log your habits in seconds. No complex menus, just tap and go.',
                rotate: 'rotate-3',
              },
              {
                icon: TrendingUp,
                color: 'var(--landing-neo-yellow)',
                title: 'Visual Progress',
                copy: 'See your streaks grow with beautiful, satisfying charts and cards.',
                rotate: '-rotate-3',
              },
              {
                icon: Target,
                color: 'var(--landing-neo-green)',
                title: 'Stay Focused',
                copy: 'Customizable goals that adapt to your lifestyle, not the other way around.',
                rotate: 'rotate-6',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex flex-col items-center gap-4 text-center">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border-3 border-edge-strong text-ink-strong ${feature.rotate}`} style={{ backgroundColor: feature.color }}>
                    <Icon className="h-10 w-10" />
                  </div>
                  <h3 className="font-serif text-3xl font-bold">{feature.title}</h3>
                  <p className="text-lg font-medium text-ink-dim">{feature.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <YearInReview />
      <StorySection />

      <section className="relative overflow-hidden bg-[var(--landing-neo-pink)] px-4 py-20 sm:px-6 sm:py-32">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center overflow-hidden opacity-10">
          <h2 className="font-serif text-[15vw] font-black leading-none whitespace-nowrap">HABICARD HABICARD</h2>
          <h2 className="font-serif -ml-32 text-[15vw] font-black leading-none whitespace-nowrap">HABICARD HABICARD</h2>
        </div>

        <div className="shadow-neo relative z-10 mx-auto max-w-4xl rounded-2xl border-3 border-edge-strong bg-surface p-8 text-center sm:p-12 md:p-20">
          <h2 className="mb-6 font-serif text-4xl font-black sm:text-5xl md:text-7xl">Ready to level up?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg font-medium sm:mb-10 sm:text-xl md:text-2xl">
            Join 1000+ users who have transformed their daily routines with HabiCard.
          </p>
          <button
            type="button"
            onClick={() => setAuthModalMode('signup')}
            className="inline-flex items-center justify-center gap-3 rounded-xl border-3 border-edge-strong bg-surface-inverse px-6 py-4 text-lg font-black text-ink-inverse transition-all hover:-translate-y-1 hover:bg-[var(--landing-neo-yellow)] hover:text-ink-strong hover:shadow-neo-lg sm:px-10 sm:py-5 sm:text-2xl"
          >
            Get HabiCard Now <ArrowRight className="h-8 w-8" />
          </button>
        </div>
      </section>

      <footer className="border-t-4 border-edge-strong bg-surface px-6 py-8 text-center font-bold">
        <div className="flex items-center justify-center gap-6 mb-3">
          <Link
            to="/privacy"
            className="text-xs font-black uppercase tracking-[0.18em] text-ink-muted hover:text-ink-strong transition-colors"
          >
            Privacy Policy
          </Link>
          <a
            href="mailto:support@habicard.com"
            className="text-xs font-black uppercase tracking-[0.18em] text-ink-muted hover:text-ink-strong transition-colors"
          >
            Support
          </a>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-ink-muted">
          Copyright © 2026 HabiCard. All rights reserved.
        </p>
      </footer>

      <AnimatePresence>
        {authModalMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4 backdrop-blur-sm"
            onClick={() => setAuthModalMode(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative w-full max-w-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setAuthModalMode(null)}
                className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border-3 border-edge-strong bg-surface text-ink-strong shadow-neo transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-sm"
                aria-label="Close authentication popup"
              >
                <X className="h-4 w-4" />
              </button>
              <AuthForm
                key={authModalMode}
                initialMode={authModalMode}
                onContinueAsGuest={() => {
                  localStorage.setItem('habit_guest_mode', 'true');
                  setAuthModalMode(null);
                  navigate('/app');
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
