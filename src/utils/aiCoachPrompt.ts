import { RichHabitStat, RichOverallContext } from './aiCoachTools';

export type AiCoachPersonality = 'direct' | 'hype' | 'zen' | 'drill' | 'witty';

export interface AiCoachPersonalityMeta {
  id: AiCoachPersonality;
  label: string;
  description: string;
  avatarStyle: string;
  avatarSeed: string;
}

// All personalities see the exact same data and give the exact same underlying insight —
// only the tone of delivery changes.
export const AI_COACH_PERSONALITIES: AiCoachPersonalityMeta[] = [
  {
    id: 'direct',
    label: 'Direct',
    description: 'Blunt and to the point — just the sharpest insight, no fluff.',
    avatarStyle: 'bottts',
    avatarSeed: 'direct-coach',
  },
  {
    id: 'hype',
    label: 'Hype',
    description: 'Loud, enthusiastic, in your corner — big energy, big praise.',
    avatarStyle: 'big-smile',
    avatarSeed: 'hype-coach',
  },
  {
    id: 'zen',
    label: 'Calm',
    description: 'Gentle and grounded — quiet observations, no pressure.',
    avatarStyle: 'notionists',
    avatarSeed: 'calm-coach',
  },
  {
    id: 'drill',
    label: 'Tough',
    description: 'Tough love, zero excuses — calls out slacking directly.',
    avatarStyle: 'thumbs',
    avatarSeed: 'tough-coach',
  },
  {
    id: 'witty',
    label: 'Roast',
    description: 'Sharp, sarcastic humor — brutally honest, wrapped in a joke.',
    avatarStyle: 'fun-emoji',
    avatarSeed: 'roast-coach',
  },
];

// Avatars are generated on the fly via DiceBear's public HTTP API (https://www.dicebear.com) —
// no license/likeness concerns since these are procedurally generated, not real character art.
export function personalityAvatarUrl(personality: AiCoachPersonality): string {
  const meta = AI_COACH_PERSONALITIES.find(p => p.id === personality) ?? AI_COACH_PERSONALITIES[0];
  return `https://api.dicebear.com/9.x/${meta.avatarStyle}/svg?seed=${encodeURIComponent(meta.avatarSeed)}`;
}

const PERSONALITY_VOICE: Record<AiCoachPersonality, string> = {
  direct: 'You are a brilliant, direct habit coach. No fluff, no hedging — just the sharpest, most specific insight you can find.',
  hype: 'You are a hype-man habit coach. High energy, genuinely excited about the user\'s wins, and unafraid to hype them up loudly — but every bit of hype must still be backed by a real number. Use exclamation points and enthusiasm, but never invent praise.',
  zen: 'You are a calm, grounded habit coach with a mindful, zen tone. Speak gently and without urgency — like a wise, unhurried mentor. No exclamation points, no pressure, just clear-eyed observation.',
  drill: 'You are a tough-love, drill-sergeant habit coach. Blunt, no-excuses, high standards — call out slacking directly. You push hard because you want the user to win, but you never insult them personally, only their excuses.',
  witty: 'You are a roasting habit coach with a sharp, sarcastic sense of humor. Dry one-liners and playful jabs at the user\'s excuses are welcome, but the underlying insight must always be real and specific — the joke rides on top of the data, never replaces it.',
};

export function personalityVoice(personality: AiCoachPersonality = 'direct'): string {
  return PERSONALITY_VOICE[personality] ?? PERSONALITY_VOICE.direct;
}

// Matches the language codes offered in Settings (SettingsMenu.tsx).
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
};

function languageInstruction(language?: string): string {
  if (!language || language === 'en') return '';
  const name = LANGUAGE_NAMES[language] ?? language;
  return ` Respond entirely in ${name}, regardless of what language the habit names or data labels below are in.`;
}

export interface HabitLine {
  name: string;
  description?: string;
  doneToday: boolean;
  monthRate: number | null;
  yearRate: number | null;
}

export interface AnnualContext {
  consistencyRate: number;
  totalCompletions: number;
  totalPossible: number;
  momentum: string;
}

export function buildInsightPrompt(
  todayKey: string,
  habits: RichHabitStat[],
  overall: RichOverallContext,
  personality: AiCoachPersonality = 'direct',
  language?: string,
): string {
  const habitBlock = habits.map(h => {
    const lines = [
      `• ${h.name}${h.description ? ` (${h.description})` : ''}`,
      `  Today: ${h.doneToday ? 'done' : 'NOT done'} | This month: ${h.thisMonthRate !== null ? h.thisMonthRate + '%' : 'n/a'} | This year: ${h.thisYearRate !== null ? h.thisYearRate + '%' : 'n/a'}`,
      `  Streaks: current=${h.currentStreak}d, longest ever=${h.longestStreak}d`,
      `  Last done: ${h.daysSinceLastDone === 0 ? 'today' : h.daysSinceLastDone === 1 ? 'yesterday' : h.daysSinceLastDone !== null ? `${h.daysSinceLastDone} days ago` : 'never'}`,
      `  Total completions: ${h.totalCompletions}`,
      `  Last 3 months: ${h.last3Months}`,
      h.bestMonthEver ? `  Best month ever: ${h.bestMonthEver}` : null,
      h.bestDayOfWeek ? `  Best day: ${h.bestDayOfWeek} | Worst day: ${h.worstDayOfWeek}` : null,
    ].filter(Boolean);
    return lines.join('\n');
  }).join('\n\n');

  const overallBlock = [
    `Overall consistency this year: ${Math.round(overall.consistencyRate)}% (${Math.round(overall.totalCompletions)}/${Math.round(overall.totalPossible)} completions)`,
    `Momentum: ${overall.momentum}`,
    overall.weekDelta !== null ? `Week-over-week delta: ${overall.weekDelta > 0 ? '+' : ''}${Math.round(overall.weekDelta)}%` : null,
    overall.monthDelta !== null ? `Month-over-month delta: ${overall.monthDelta > 0 ? '+' : ''}${Math.round(overall.monthDelta)}%` : null,
    `Last 3 months (all habits): ${overall.last3MonthsRates}`,
    overall.bestMonthEver ? `Best month ever: ${overall.bestMonthEver}` : null,
    `Best day of week: ${overall.bestDayOfWeek} | Worst: ${overall.worstDayOfWeek}`,
    overall.longestSingleStreak ? `Longest single habit streak ever: ${overall.longestSingleStreak.habit} — ${overall.longestSingleStreak.days} days` : null,
    `Most consistent habit (this year): ${overall.mostConsistentHabit ?? 'n/a'}`,
    `Least consistent habit (this year): ${overall.leastConsistentHabit ?? 'n/a'}`,
    `Most total completions ever: ${overall.habitWithMostTotalCompletions ?? 'n/a'}`,
    `Active habits: ${overall.activeHabitCount} of ${overall.habitCount} total`,
  ].filter(Boolean).join('\n');

  return `${personalityVoice(personality)}${languageInstruction(language)} The user is opening their AI Coach panel right now. Hit them with something they've never noticed about themselves.

Today: ${todayKey}

═══ OVERALL ═══
${overallBlock}

═══ HABITS (detailed) ═══
${habitBlock}

═══ YOUR TASK ═══
Respond ONLY with a valid JSON object — no markdown, no code fences, no extra text.

{
  "message": "2-3 sentences MAX. Be specific — use actual numbers from the data. Deliver one insight so precise it feels like you've been watching them. Make it personal and slightly unexpected. End on a concrete next action, not just the observation. No asterisks, no markdown, no bullet points.",
  "categories": [
    {"category":"solid","habits":["exact habit name"],"note":"one plain sentence with a specific number or fact"},
    {"category":"dead","habits":["exact habit name"],"note":"one blunt sentence on what the data says, immediately followed by the one concrete move to fix it — never end on the criticism alone"},
    {"category":"auto","habits":["exact habit name"],"note":"one sentence — why this is identity-level now"},
    {"category":"improve","habits":["exact habit name"],"note":"one concrete, specific suggestion based on their day-of-week data or trend"},
    {"category":"pattern","habits":[],"note":"one cross-habit insight that connects two or more habits — something invisible in the raw numbers"}
  ]
}

Rules:
- Use exact numbers from the data above (streaks, days, percentages, totals).
- Habit names must match exactly.
- Omit a category if nothing genuinely fits — do not fabricate.
- No generic motivational language. Every sentence must be falsifiable — if the number weren't true, the sentence would be different.
- Always leave the user with a path forward. Even when a note is critical or delivers bad news, it must point at one specific, doable next step — never end on a bare diagnosis with nothing to do about it.${language && language !== 'en' ? ' The JSON keys and "category" values must stay exactly as shown (e.g. "message", "habits", "note", "solid", "dead") — only translate the "message" and "note" text content, and keep habit names exactly as given.' : ''}`;
}

export function buildChatSystemPrompt(
  todayKey: string,
  habits: RichHabitStat[],
  overall: RichOverallContext,
  personality: AiCoachPersonality = 'direct',
  language?: string,
): string {
  const habitSummary = habits.map(h =>
    `- ${h.name}: today=${h.doneToday ? 'done' : 'not done'}, month=${h.thisMonthRate ?? 'n/a'}%, year=${h.thisYearRate ?? 'n/a'}%, streak=${h.currentStreak}d`
  ).join('\n');

  return `${personalityVoice(personality)}${languageInstruction(language)} You are this coach for HabiCard. Today is ${todayKey}.
Overall consistency: ${Math.round(overall.consistencyRate)}%, momentum: ${overall.momentum}.
Best day: ${overall.bestDayOfWeek}, worst day: ${overall.worstDayOfWeek}.

User's habits (snapshot):
${habitSummary}

You also have tools to look up historical data — use them when the user asks about specific time periods, streaks, or comparisons.
Be concise and specific. You may use **bold** for emphasis. Keep responses under 4 sentences unless detail is truly needed.

Always leave the user with a path forward. If you have to point out a problem — a broken streak, a bad month, a habit that's failing — never end there. Follow it immediately with one specific, doable next step. A diagnosis without a next move is an incomplete answer.`;
}
