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
  { value: 1, icon: Angry, color: '#ef4444', label: 'Very Bad' },
  { value: 2, icon: Frown, color: '#f97316', label: 'Bad' },
  { value: 3, icon: Meh, color: '#eab308', label: 'Neutral' },
  { value: 4, icon: Smile, color: '#84cc16', label: 'Good' },
  { value: 5, icon: Laugh, color: '#10b981', label: 'Very Good' },
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
    <section className="overflow-hidden border-t-4 border-black bg-white px-6 py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="relative order-2 mx-auto w-full max-w-lg lg:order-1">
          <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--landing-neo-green)]/20 blur-3xl" />
          <div className="landing-neo-shadow relative z-10 flex flex-col gap-6 rounded-2xl border-[3px] border-black bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              <h3 className="text-xs font-black uppercase tracking-[0.15em] text-gray-500">Your Story This Month</h3>
            </div>
            <p className="text-lg font-bold leading-relaxed text-gray-900">
              You logged <span className="text-[var(--landing-neo-green)]">53</span> completions this month. Narrowing focus could improve carryover next month.
            </p>
            <p className="text-lg font-bold italic leading-relaxed text-gray-900">
              You&apos;re up <span className="text-[var(--landing-neo-green)]">21%</span> versus last month, a clear positive shift in execution.
            </p>
            <p className="text-lg font-bold italic leading-relaxed text-gray-900">
              <span className="text-[var(--landing-neo-green)]">Journaling</span> was your anchor this month with <span className="text-[var(--landing-neo-green)]">7</span> completions.
            </p>
          </div>
        </div>

        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <div className="landing-neo-shadow mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black bg-[var(--landing-neo-green)] text-black">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="font-serif text-5xl font-black uppercase leading-[0.9] tracking-tight md:text-7xl">
            Get Your <br /><span className="text-[var(--landing-neo-green)]">Weekly & Yearly</span> Story
          </h2>
          <p className="max-w-lg text-xl font-medium leading-relaxed text-gray-600">
            Don&apos;t just track numbers. Get personalized insights that tell the story of your progress, highlight your anchors, and guide your focus for the next cycle.
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {['Actionable feedback', 'Identify your anchor habits', 'Course-correct before you slip'].map((item) => (
              <li key={item} className="flex items-center gap-4 text-lg font-bold">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[3px] border-black bg-white">
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
    <div className="flex h-full flex-col rounded-[20px] bg-white p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">{monthName} {year}</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold text-white">{percentDone}% DONE</span>
            <span className="text-xs font-bold text-gray-500">{logs} logs</span>
          </div>
          <p className="mt-1.5 text-xs font-medium text-gray-600">{completedText}</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-700 transition-colors hover:bg-gray-50">
          OPEN <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-7 gap-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="mb-2 text-center text-[10px] font-black text-gray-400">{d}</div>
        ))}
        {visibleDays.map((day, i) => {
          if (!day) {
            return <div key={i} className="aspect-square" />;
          }

          if (day.active) {
            let bgColor = 'bg-[#86efac]';
            if (day.active.percent === 100) bgColor = 'bg-[#14532d] text-white';
            else if (day.active.percent >= 80) bgColor = 'bg-[#16a34a] text-white';
            else if (day.active.percent >= 50) bgColor = 'bg-[#4ade80] text-black';
            else bgColor = 'bg-[#bbf7d0] text-black';

            return (
              <div key={i} className={`aspect-square cursor-pointer rounded-xl border border-transparent shadow-sm transition-transform hover:scale-105 ${bgColor} flex flex-col items-center justify-center`}>
                <span className="mb-0.5 text-[9px] font-bold leading-none opacity-80">{day.dayNum}</span>
                <span className="text-[10px] font-black leading-none">{day.active.percent}%</span>
              </div>
            );
          }

          return (
            <div key={i} className="relative flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-gray-100 transition-colors hover:bg-gray-50">
              <span className="absolute left-1.5 top-1.5 text-[9px] font-bold text-gray-400">{day.dayNum}</span>
              <div className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-200" />
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 text-[11px] font-bold text-gray-500">
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
    <section className="overflow-hidden border-t-4 border-black bg-[#fafaf9] px-6 py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="landing-neo-shadow mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black bg-[var(--landing-neo-pink)] text-white">
            <Zap className="h-8 w-8 fill-black text-black" />
          </div>
          <h2 className="font-serif text-5xl font-black uppercase leading-[0.9] tracking-tight md:text-7xl">
            Your Year <br /><span className="text-[var(--landing-neo-blue)]">In Review</span>
          </h2>
          <p className="max-w-lg text-xl font-medium leading-relaxed text-gray-600">
            Building habits isn&apos;t just about today. It&apos;s about the long game. Watch your consistency grow month over month with beautiful, shareable retro grids.
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {[
              { label: 'Spot long-term patterns', color: 'var(--landing-neo-green)' },
              { label: 'Celebrate your best months', color: 'var(--landing-neo-yellow)' },
              { label: 'Share your progress with friends', color: 'var(--landing-neo-pink)' },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-4 text-lg font-bold">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[3px] border-black" style={{ backgroundColor: item.color }}>
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
              className="landing-neo-shadow absolute inset-0 z-10 rounded-[24px] border-[3px] border-black bg-white"
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
        <div className="landing-scrollbar flex flex-1 flex-col items-center overflow-y-auto p-5">
          <div className="relative mb-6 mt-2 h-28 w-28 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#9cb4a4] transition-all duration-500 ease-out"
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
                  <span className={`text-sm font-bold transition-colors duration-300 ${habit.done ? 'text-gray-400 line-through decoration-2' : 'text-gray-700'}`}>
                    {habit.name}
                  </span>
                  {habit.count && (
                    <span className="rounded border border-gray-200 bg-gray-100 px-1 text-[10px] font-bold text-gray-500">
                      {habit.count}
                    </span>
                  )}
                </div>
                <div className={`flex h-5 w-5 items-center justify-center rounded-[3px] border-2 border-black transition-colors duration-300 ${habit.done ? 'bg-black text-white' : 'bg-white'}`}>
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
        <div className="flex flex-1 flex-col bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-3">
            <div className="rounded border border-gray-300 px-2 py-1 text-[10px] font-bold text-gray-600">
              {tasks.length} TASKS
            </div>
            <div className="flex cursor-pointer items-center gap-1 rounded border border-black px-2 py-1 text-[10px] font-bold hover:bg-gray-100">
              <Plus className="h-3 w-3" /> ADD
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            {isAddingTask && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 shrink-0 rounded-[3px] border-2 border-gray-300" />
                <div className="flex-1 border-b-2 border-black pb-1">
                  <span className="text-sm font-bold">{taskInput}</span>
                  <span className="ml-1 inline-block h-4 w-1.5 animate-pulse align-middle bg-black" />
                </div>
              </div>
            )}
            {tasks.map((task) => (
              <div key={task.text} className="flex items-center gap-3">
                <div className={`flex h-5 w-5 items-center justify-center rounded-[3px] border-2 border-black transition-colors duration-300 ${task.done ? 'bg-black text-white' : 'bg-white'}`}>
                  {task.done && <Check className="h-3 w-3 stroke-[4]" />}
                </div>
                <span className={`text-sm font-bold transition-colors duration-300 ${task.done ? 'text-gray-400 line-through decoration-2' : 'text-gray-700'}`}>
                  {task.text}
                </span>
              </div>
            ))}
            {!isAddingTask && tasks.length === 0 && (
              <div className="flex flex-1 items-center justify-center">
                <span className="text-sm font-medium italic text-gray-400">No Tasks Today</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col bg-white p-5">
        <div className="mb-6 shrink-0 text-center">
          <span className="text-[11px] font-black tracking-widest text-gray-700">MOOD</span>
          <div className="mt-3 flex justify-center gap-4">
            {LANDING_MOODS.map((item, i) => {
              const Icon = item.icon;
              return (
              <div key={item.value} className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${i === mood ? 'scale-110 border-2 border-black bg-[#9cb4a4] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'opacity-60'}`}>
                <Icon
                  size={20}
                  strokeWidth={i === mood ? 2.8 : 2}
                  className="text-black"
                  fill={i === mood ? item.color : 'none'}
                />
              </div>
            );})}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex shrink-0 items-center justify-between">
            <span className="text-[11px] font-black tracking-widest text-gray-700">NOTES</span>
            <button className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-[10px] font-bold text-gray-600 transition-colors hover:bg-gray-100">
              <Save className="h-3 w-3" /> SAVE
            </button>
          </div>
          <div className="relative flex-1 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium leading-relaxed text-gray-800 shadow-inner">
            {journalText}
            {journalText.length > 0 && journalText.length < 'Had a great day! Got so much done.'.length && (
              <span className="ml-1 inline-block h-4 w-1.5 animate-pulse align-middle bg-black" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pointer-events-none z-10 mx-auto h-[600px] w-full max-w-[320px] [perspective:1000px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="landing-neo-shadow flex h-full w-full flex-col overflow-hidden rounded-2xl border-[4px] border-black bg-white"
        >
          <div className="shrink-0 border-b-[4px] border-black bg-[#9cb4a4] p-5 text-center text-white">
            <h2 className="text-3xl font-black uppercase tracking-wide drop-shadow-sm">Sunday</h2>
            <p className="mt-1 text-sm font-bold opacity-90">Mar 8, 2026</p>
          </div>

          {renderContent()}

          <div className="grid shrink-0 grid-cols-3 border-t-[4px] border-black bg-white">
            <div className={`flex flex-col items-center justify-center border-r-[4px] border-black p-3 transition-colors ${activeTab === 'habits' ? 'bg-gray-100' : ''}`}>
              <span className="mb-1 text-[10px] font-black tracking-wider text-gray-500">HABITS</span>
              <span className="text-sm font-bold text-black">{completedHabits}/{totalHabits}</span>
            </div>
            <div className={`flex flex-col items-center justify-center border-r-[4px] border-black p-3 transition-colors ${activeTab === 'tasks' ? 'bg-gray-100' : ''}`}>
              <span className="mb-1 text-[10px] font-black tracking-wider text-gray-500">TASKS</span>
              <span className="text-sm font-bold text-black">{tasks.length > 0 ? tasks.length : '+'}</span>
            </div>
            <div className={`flex flex-col items-center justify-center p-3 transition-colors ${activeTab === 'journal' ? 'bg-gray-100' : ''}`}>
              <span className="mb-1 text-[10px] font-black tracking-wider text-gray-500">JOURNAL</span>
              <div className="flex items-center justify-center">
                <selectedMood.icon size={16} strokeWidth={2.8} className="text-black" fill={selectedMood.color} />
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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | null>(null);

  useEffect(() => {
    let active = true;

    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && session) {
        navigate('/app', { replace: true });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) {
        navigate('/app', { replace: true });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      className="min-h-screen overflow-hidden bg-[var(--landing-neo-bg)] font-sans text-black"
      style={{
        ['--landing-neo-green' as string]: theme.primary,
        ['--landing-neo-pink' as string]: theme.secondary,
        ['--landing-neo-blue' as string]: mixHex(theme.primary, theme.secondary, 0.65),
        ['--landing-neo-yellow' as string]: mixHex(theme.primary, theme.secondary, 0.4),
        ['--landing-neo-orange' as string]: mixHex(theme.primary, theme.secondary, 0.8),
        ['--landing-neo-bg' as string]: mixHex('#fcfbf7', theme.secondary, 0.12),
      }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 p-6">
        <div className="flex items-center">
          <span className="text-3xl font-black uppercase tracking-tighter md:text-4xl">
            <span className="text-[#404040]">HABI</span>
            <span className="text-[#c59b97]">CARD</span>
          </span>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setAuthModalMode('signin')}
            className="inline-flex items-center justify-center rounded-full border-[3px] border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setAuthModalMode('signup')}
            className="landing-neo-shadow-sm inline-flex items-center justify-center rounded-full border-[3px] border-black bg-[var(--landing-neo-yellow)] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
            className="landing-neo-shadow-sm rounded-full border-[3px] border-black bg-[var(--landing-neo-yellow)] px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-black transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <main className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-20 pt-8 md:pb-24 md:pt-14 lg:grid-cols-2 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="z-10 flex flex-col gap-8"
        >
          <div className="landing-neo-shadow-sm inline-flex w-fit items-center gap-2 rounded-full border-[3px] border-black bg-[var(--landing-neo-green)] px-4 py-2 text-sm font-bold uppercase tracking-wider text-white">
            <Flame className="h-4 w-4" />
            <span>The #1 Habit Tracker</span>
          </div>

          <h1 className="font-serif text-5xl font-black leading-[0.92] tracking-tighter md:text-7xl">
            BUILD <span className="text-[var(--landing-neo-pink)]">HABITS</span><br />
            THAT <span className="text-[var(--landing-neo-blue)]">STICK.</span>
          </h1>

          <p className="max-w-lg text-lg font-medium leading-relaxed md:text-xl">
            Stop breaking your streaks. HabiCard turns your daily goals into visual, satisfying cards that you actually want to complete.
          </p>

          <div className="mt-4 flex flex-col flex-wrap gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => setAuthModalMode('signup')}
              className="landing-neo-shadow inline-flex items-center justify-center gap-3 rounded-xl border-[3px] border-black bg-[var(--landing-neo-yellow)] px-8 py-4 text-xl font-black text-black transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Start for Free <ArrowRight className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm font-bold">
            <div className="flex -space-x-3">
              {[
                'var(--landing-neo-pink)',
                'var(--landing-neo-blue)',
                'var(--landing-neo-green)',
                'var(--landing-neo-yellow)',
              ].map((color, i) => (
                <div key={i} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-[3px] border-black" style={{ backgroundColor: color }}>
                  <img
                    src={`https://i.pravatar.cc/100?img=${i + 11}`}
                    alt="User"
                    className="h-full w-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
            <p>Join <span className="text-[var(--landing-neo-orange)] text-lg">900+</span> habit builders</p>
          </div>
        </motion.div>

        <div className="relative flex h-[450px] w-full items-center justify-center [perspective:1000px]">
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

      <section id="features" className="border-y-4 border-black bg-black py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
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
                  <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border-[3px] border-black text-black ${feature.rotate}`} style={{ backgroundColor: feature.color }}>
                    <Icon className="h-10 w-10" />
                  </div>
                  <h3 className="font-serif text-3xl font-bold">{feature.title}</h3>
                  <p className="text-lg font-medium text-gray-300">{feature.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <YearInReview />
      <StorySection />

      <section className="relative overflow-hidden bg-[var(--landing-neo-pink)] px-6 py-32">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center overflow-hidden opacity-10">
          <h2 className="font-serif text-[15vw] font-black leading-none whitespace-nowrap">HABICARD HABICARD</h2>
          <h2 className="font-serif -ml-32 text-[15vw] font-black leading-none whitespace-nowrap">HABICARD HABICARD</h2>
        </div>

        <div className="landing-neo-shadow relative z-10 mx-auto max-w-4xl rounded-3xl border-[3px] border-black bg-white p-12 text-center md:p-20">
          <h2 className="mb-6 font-serif text-5xl font-black md:text-7xl">Ready to level up?</h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl font-medium md:text-2xl">
            Join 900+ users who have transformed their daily routines with HabiCard.
          </p>
          <button
            type="button"
            onClick={() => setAuthModalMode('signup')}
            className="inline-flex items-center justify-center gap-3 rounded-xl border-[3px] border-black bg-black px-10 py-5 text-2xl font-black text-white transition-all hover:-translate-y-1 hover:bg-[var(--landing-neo-yellow)] hover:text-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            Get HabiCard Now <ArrowRight className="h-8 w-8" />
          </button>
        </div>
      </section>

      <footer className="border-t-4 border-black bg-white px-6 py-8 text-center font-bold">
        <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-stone-500">
          Copyright © 2026 HabiCard. All rights reserved.
        </p>
      </footer>

      <AnimatePresence>
        {authModalMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
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
                className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
