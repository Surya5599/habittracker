/**
 * Seed script for test account ssurya5599@gmail.com
 *
 * Usage:
 *   node scripts/seed-test-account.mjs         # Insert habits + 90 days of history
 *   node scripts/seed-test-account.mjs --clean  # Remove all seeded data for the account
 *
 * Requires: @supabase/supabase-js (already in package.json)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ogduktbkmjfvygzhvqdr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZHVrdGJrbWpmdnlnemh2cWRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk1OTEzOCwiZXhwIjoyMDgyNTM1MTM4fQ.lRgUNMf_AxwE_YFkZVzSrKSFna_vK801Wl4Cq5CPf2U';
const TEST_EMAIL = 'ssurya5599@gmail.com';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Habit definitions ────────────────────────────────────────────────────────

const HABITS = [
  // Daily — every day
  { name: 'Morning Workout', color: '#ef4444', goal: 80, type: 'daily', frequency: null, weeklyTarget: null, completionRate: 0.75 },
  { name: 'Meditate', color: '#8b5cf6', goal: 90, type: 'daily', frequency: null, weeklyTarget: null, completionRate: 0.88 },
  { name: 'Read 20 mins', color: '#3b82f6', goal: 70, type: 'daily', frequency: null, weeklyTarget: null, completionRate: 0.65 },
  { name: 'Drink 8 glasses of water', color: '#06b6d4', goal: 85, type: 'daily', frequency: null, weeklyTarget: null, completionRate: 0.82 },
  { name: 'Journal', color: '#f59e0b', goal: 60, type: 'daily', frequency: null, weeklyTarget: null, completionRate: 0.55 },
  { name: 'No social media before noon', color: '#10b981', goal: 75, type: 'daily', frequency: null, weeklyTarget: null, completionRate: 0.70 },
  { name: 'Gratitude list', color: '#ec4899', goal: 80, type: 'daily', frequency: null, weeklyTarget: null, completionRate: 0.78 },

  // Weekdays only (Mon–Fri, indices 1–5)
  { name: 'Deep work session', color: '#f97316', goal: 85, type: 'daily', frequency: [1,2,3,4,5], weeklyTarget: null, completionRate: 0.80 },
  { name: 'Review TODO list', color: '#6366f1', goal: 90, type: 'daily', frequency: [1,2,3,4,5], weeklyTarget: null, completionRate: 0.85 },
  { name: 'Walk outside', color: '#14b8a6', goal: 70, type: 'daily', frequency: [1,2,3,4,5], weeklyTarget: null, completionRate: 0.60 },

  // Weekend only (Sat–Sun, indices 0 and 6)
  { name: 'Cook a new recipe', color: '#f43f5e', goal: 50, type: 'daily', frequency: [0,6], weeklyTarget: null, completionRate: 0.65 },
  { name: 'Family call', color: '#a855f7', goal: 75, type: 'daily', frequency: [0,6], weeklyTarget: null, completionRate: 0.80 },

  // Flexible weekly target habits
  { name: 'Gym (strength)', color: '#dc2626', goal: 75, type: 'daily', frequency: null, weeklyTarget: 3, completionRate: 0.72 },
  { name: 'Run / Cardio', color: '#ea580c', goal: 70, type: 'daily', frequency: null, weeklyTarget: 4, completionRate: 0.68 },
  { name: 'Cold shower', color: '#0ea5e9', goal: 60, type: 'daily', frequency: null, weeklyTarget: 5, completionRate: 0.58 },
];

// ─── Journal entries ──────────────────────────────────────────────────────────

const JOURNALS = [
  `Woke up early and got my workout in before 7am. Feel unstoppable when I start the day like this. Meditation afterward was surprisingly deep — sat for 20 minutes without my mind wandering too much. Going to try to keep this streak going.`,
  `Rough day. Slept through my alarm and the whole morning felt off. Skipped the gym, barely drank any water. But I did manage to meditate in the evening which helped reset. Tomorrow is a new day.`,
  `Really productive deep work block today — 3 hours straight on the project with no interruptions. Turned my phone off and it made such a difference. Reading before bed: finished two chapters. Feeling good.`,
  `Had a long video call with my family tonight. Mom looked great. Little brother is starting a new job next month. These calls always leave me feeling grounded and grateful. Didn't hit all my habits but it was worth it.`,
  `Cold shower at day 12 in a row. Honestly it's getting easier. The first 10 seconds still shock me but after that I feel amazing. Going to try to hit 30 days.`,
  `Tried making Thai green curry from scratch. The paste took forever but it came out incredible. Probably the best thing I've cooked this year. Definitely making this again for guests.`,
  `Meditation streak at 14 days. Something is shifting — I feel calmer in situations that used to stress me out. Hard to explain but I feel more like an observer of my thoughts than someone controlled by them.`,
  `Walked 8km today. Put on a podcast and just went. The city looks completely different at a walking pace. Found a little bookshop I didn't know existed — bought two books. Best unexpected detour.`,
  `Morning was great. Afternoon slump hit hard around 3pm — too much coffee probably. Deep work session was only 90 mins instead of 3 hours. Need to sort out my sleep schedule, going to bed too late.`,
  `Gratitude list today: good health, a warm apartment, interesting work, the fact that coffee exists. Small things. But writing them down makes them feel bigger.`,
  `Finally hit 80% on my reading habit this month. Twenty minutes before bed has become something I genuinely look forward to. Currently reading about systems thinking — it's changing how I see everything.`,
  `Skipped the gym again. Three days in a row now. Body feels sluggish. Going to lay out my gym clothes tonight so there's no excuse tomorrow morning. Accountability to myself.`,
  `Great run this morning. 6km, personal best pace. The playlist made a real difference. Cold shower right after — felt like a superhero by 8am. Why don't I do this every day?`,
  `Journaling consistently is starting to show. Reading back entries from two months ago I can see patterns I didn't notice at the time. This is worth doing just for that.`,
  `Low mood today. Nothing specific happened, just one of those grey days where motivation is hard to find. Sat with it instead of fighting it. Did my habits anyway, even if mechanically. Showed up.`,
  `Big insight during meditation: I've been setting goals based on what I think I *should* want rather than what I actually want. Need to sit with this more.`,
  `Tried a no-phone morning today. Read, journaled, worked out, had a slow breakfast — all before checking any notifications. By the time I opened my phone there was nothing urgent. Of course there wasn't.`,
  `Social media lockout before noon has been the single biggest productivity unlock. I get more done before lunch now than I used to get done all day. Wish I'd started this sooner.`,
  `Weekly review done. Solid week overall — 6/7 days hit most habits. The one miss was Friday when work ran late and I just didn't have it in me. Forgiving myself and moving on.`,
  `End of month reflection: started with low consistency, ended strong. The key was not trying to be perfect. When I missed a day I just picked back up instead of spiraling. Compound consistency.`,
  `Ran into an old friend at the bookshop today. We grabbed coffee and talked for two hours. Sometimes the best days are the unplanned ones.`,
  `Gym session today focused on form over weight. Dropped 10kg and really focused on the movement. Trainer was right — I've been compensating with bad posture for months. Starting over properly.`,
  `Read for an hour tonight. Completely lost track of time. That's the feeling I'm chasing with every habit — being so absorbed in something good that you forget to check your phone.`,
  `Mood: 4/5. Energy high. The water habit is making a real difference — less afternoon headaches, better focus. Boring habit, meaningful impact.`,
  `Cooked breakfast for the first time in weeks instead of grabbing something rushed. Scrambled eggs, toast, coffee. Took 15 minutes. Why do I default to chaos when calm is this easy?`,
];

// ─── Task pools ───────────────────────────────────────────────────────────────

const TASK_POOL = [
  // Work / productivity
  'Finish project proposal draft',
  'Review and reply to important emails',
  'Update weekly status doc',
  'Prep slides for Friday meeting',
  'Refactor the auth module',
  'Write unit tests for new feature',
  'Review open pull requests',
  'Block time for deep work tomorrow',
  'Clean up Notion workspace',
  'Schedule 1:1 with manager',

  // Health / fitness
  'Book physio appointment',
  'Order new running shoes',
  'Meal prep for the week',
  'Research new workout program',
  'Track macros for the day',
  'Stretch before bed',

  // Personal / admin
  'Call parents',
  'Pay credit card bill',
  'Renew gym membership',
  'Organise desk',
  'Cancel unused subscriptions',
  'Back up laptop',
  'Read 2 chapters',
  'Buy birthday gift for friend',
  'Book dentist appointment',
  'Plan weekend activities',

  // Learning / growth
  'Watch course module on system design',
  'Review flashcards for 15 mins',
  'Write one paragraph for essay',
  'Listen to recommended podcast episode',
  'Read one article on the topic',
];

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function makeTasks(count) {
  return pickRandom(TASK_POOL, count).map((text, i) => ({
    id: `seed-task-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    text,
    completed: Math.random() < 0.6, // 60% chance already done
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Weighted random — higher completionRate = more likely to return true */
function shouldComplete(rate) {
  // Add some streaks / slumps for realism
  return Math.random() < rate;
}

function isHabitDueOnDate(habit, date) {
  if (habit.frequency) {
    // 0 = Sunday, 1 = Monday ... 6 = Saturday
    const dow = date.getDay();
    return habit.frequency.includes(dow);
  }
  return true; // daily or weekly-target habits can be done any day
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function getUserId() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find(u => u.email === TEST_EMAIL);
  if (!user) throw new Error(`User ${TEST_EMAIL} not found`);
  return user.id;
}

async function clean(userId) {
  console.log('Cleaning seeded data for', TEST_EMAIL, '...');

  const { error: ce } = await supabase
    .from('completions')
    .delete()
    .eq('user_id', userId);
  if (ce) console.error('completions delete error:', ce.message);

  const { error: he } = await supabase
    .from('habits')
    .delete()
    .eq('user_id', userId);
  if (he) console.error('habits delete error:', he.message);

  const { error: ne } = await supabase
    .from('daily_notes')
    .delete()
    .eq('user_id', userId);
  if (ne) console.error('daily_notes delete error:', ne.message);

  console.log('Done — all habits, completions and notes removed.');
}

async function seed(userId) {
  console.log('Seeding test data for', TEST_EMAIL, `(userId: ${userId})...`);

  // 1. Insert habits
  const habitRows = HABITS.map((h, i) => ({
    user_id: userId,
    name: h.name,
    color: h.color,
    goal: h.goal,
    type: h.type,
    frequency: h.frequency,
    weekly_target: h.weeklyTarget,
    sort_order: i,
  }));

  const { data: insertedHabits, error: habitErr } = await supabase
    .from('habits')
    .insert(habitRows)
    .select('id, name');
  if (habitErr) throw new Error('habits insert: ' + habitErr.message);
  console.log(`  Inserted ${insertedHabits.length} habits`);

  // Map name → {id, config} for completions
  const habitMap = insertedHabits.reduce((acc, row) => {
    const config = HABITS.find(h => h.name === row.name);
    acc[row.id] = { ...config, id: row.id };
    return acc;
  }, {});

  // 2. Build completions for past 90 days
  const today = new Date('2026-05-27');
  const completionRows = [];

  for (let dayOffset = -90; dayOffset <= 0; dayOffset++) {
    const date = addDays(today, dayOffset);
    const dk = dateKey(date);

    for (const [habitId, habit] of Object.entries(habitMap)) {
      if (!isHabitDueOnDate(habit, date)) continue;
      if (shouldComplete(habit.completionRate)) {
        completionRows.push({
          user_id: userId,
          habit_id: habitId,
          date_key: dk,
        });
      }
    }
  }

  // Insert in batches of 500
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < completionRows.length; i += BATCH) {
    const batch = completionRows.slice(i, i + BATCH);
    const { error } = await supabase.from('completions').insert(batch);
    if (error) throw new Error('completions insert: ' + error.message);
    inserted += batch.length;
  }
  console.log(`  Inserted ${inserted} completion records over 90 days`);

  // 3. Insert daily notes — every day gets tasks; ~60% also get a journal + mood
  const MOODS = [1, 2, 3, 4, 5];
  // Bias toward positive moods (3-5) with occasional dips
  const MOOD_WEIGHTS = [1, 2, 3, 4, 5, 3, 4, 5, 4, 5]; // weighted towards higher

  const noteRows = [];
  for (let dayOffset = -90; dayOffset <= 0; dayOffset++) {
    const date = addDays(today, dayOffset);
    const dk = dateKey(date);

    const hasJournal = Math.random() < 0.60; // 60% of days have a journal entry
    const hasMood = Math.random() < 0.75;    // 75% of days have a mood
    const taskCount = Math.floor(Math.random() * 5) + 1; // 1–5 tasks per day

    const mood = hasMood ? MOOD_WEIGHTS[Math.floor(Math.random() * MOOD_WEIGHTS.length)] : undefined;
    const journal = hasJournal ? JOURNALS[Math.floor(Math.random() * JOURNALS.length)] : undefined;
    const tasks = makeTasks(taskCount);

    noteRows.push({
      user_id: userId,
      date_key: dk,
      content: JSON.stringify({
        tasks,
        ...(mood !== undefined ? { mood } : {}),
        ...(journal !== undefined ? { journal } : {}),
        inactiveHabits: [],
      }),
    });
  }

  if (noteRows.length > 0) {
    const { error: noteErr } = await supabase.from('daily_notes').insert(noteRows);
    if (noteErr) throw new Error('daily_notes insert: ' + noteErr.message);
    console.log(`  Inserted ${noteRows.length} daily notes`);
  }

  console.log('\nSeed complete! Log in as', TEST_EMAIL, 'to test the app.');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const isClean = process.argv.includes('--clean');

try {
  const userId = await getUserId();
  if (isClean) {
    await clean(userId);
  } else {
    await seed(userId);
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
