
import { Habit } from './types';

export const INITIAL_HABITS: Habit[] = [];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const THEMES = [
  { name: 'Sage & Rose', primary: '#8da18d', secondary: '#d1b1b1' },
  { name: 'Ocean & Sky', primary: '#5b8a8a', secondary: '#8db1d1' },
  { name: 'Sunset & Clay', primary: '#b28d6c', secondary: '#d1a1a1' },
  { name: 'Lavender & Slate', primary: '#8d8da1', secondary: '#b1a1d1' },
  { name: 'Forest & Earth', primary: '#5a7a5a', secondary: '#a18d7c' },
  { name: 'Peach & Mint', primary: '#d4a89f', secondary: '#a8c9b8' },
  { name: 'Lilac & Cream', primary: '#b8a8d4', secondary: '#d9cdb8' },
  { name: 'Dusty Blue & Mauve', primary: '#8fa8c9', secondary: '#c9a8b8' },
  { name: 'Coral & Sand', primary: '#d4a8a8', secondary: '#c9b89f' },
  { name: 'Mint & Blush', primary: '#a8d4c9', secondary: '#d4b8c9' },
  { name: 'Honey & Fog', primary: '#c9b88f', secondary: '#a8b8c9' },
  { name: 'Plum & Sage', primary: '#a88fa8', secondary: '#9fb8a8' },
  { name: 'Monochrome', primary: '#2d2d2d', secondary: '#6b6b6b' },
];

/**
 * Canonical mood 1-5 scale. Previously hand-typed identically in 6 files
 * (DESIGN_SYSTEM.md §1.6, §9 #9). Index 0 = mood 1.
 *
 * Deliberately plain hex strings, NOT `var(--mood-N)`: consumers include SVG
 * presentation attributes (lucide's `color` prop, `fill=`), a detached PDF
 * document, canvas `ctx.fillStyle`, and hex-alpha concatenation
 * (`MOOD_SCALE[i] + '18'`) — none of which can resolve a CSS variable.
 * The matching `--mood-1..5` tokens exist for CSS/className contexts.
 */
export const MOOD_SCALE = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'];

/**
 * Background tints paired with MOOD_SCALE. These were duplicated too, and
 * disagreed: mood 3 was #fef9c3 in App.tsx but #fef3c7 in exportJournalPdf.ts.
 * Unified on the yellow-100 value (#fef9c3), since mood 3 is yellow-500.
 */
export const MOOD_TINTS = ['#fee2e2', '#ffedd5', '#fef9c3', '#ecfccb', '#d1fae5'];

export const LOCAL_HABITS_KEY = 'guest_habits';
export const LOCAL_COMPLETIONS_KEY = 'guest_completions';

export const COLORS = {
  sage: '#8da18d',
  clay: '#b2967d',
  slate: '#7b9fb3',
  dustyRose: '#a68a8a',
  background: '#fcfbf7',
  card: '#ffffff',
  text: '#3d4b3d',
  gridEmpty: '#f3f4f6',
};
