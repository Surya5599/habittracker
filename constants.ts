
import { Habit } from './types';

export const INITIAL_HABITS: Habit[] = [
  { id: '1', name: 'Meditation', type: 'daily', color: '#8da18d', goal: 90 },
  { id: '2', name: 'Exercise', type: 'daily', color: '#b2967d', goal: 80 },
  { id: '3', name: 'Drink 2L Water', type: 'daily', color: '#7b9fb3', goal: 100 },
  { id: '4', name: 'Reading', type: 'daily', color: '#a68a8a', goal: 70 },
  { id: '5', name: 'Journaling', type: 'daily', color: '#9e9e9e', goal: 85 },
  { id: '6', name: 'Limit Screen Time', type: 'daily', color: '#d4a373', goal: 95 },
  { id: '7', name: 'No Sugar', type: 'daily', color: '#7a827a', goal: 90 },
  { id: '8', name: 'Wake up 6AM', type: 'daily', color: '#c2b280', goal: 85 },
  { id: '9', name: 'Cold Shower', type: 'daily', color: '#87ceeb', goal: 60 },
  { id: '10', name: 'Plan Tomorrow', type: 'daily', color: '#bc8f8f', goal: 100 },
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
