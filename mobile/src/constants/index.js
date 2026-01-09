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

export const INITIAL_HABITS = [
    { id: '1', name: 'Drink Water', type: 'daily', color: '#0ea5e9', goal: 100 },
    { id: '2', name: 'Exercise', type: 'daily', color: '#22c55e', goal: 100 },
    { id: '3', name: 'Read', type: 'daily', color: '#8b5cf6', goal: 100 },
];

export const LOCAL_HABITS_KEY = 'habit_tracker_habits';
export const LOCAL_COMPLETIONS_KEY = 'habit_tracker_completions';
export const LOCAL_THEME_KEY = 'habit_tracker_theme';

import { Meh, Frown, Smile, Laugh, Angry } from 'lucide-react-native';

export const MOODS = [
    { value: 1, icon: Angry, label: 'Very Bad', color: '#ef4444' },
    { value: 2, icon: Frown, label: 'Bad', color: '#f97316' },
    { value: 3, icon: Meh, label: 'Okay', color: '#eab308' },
    { value: 4, icon: Smile, label: 'Good', color: '#84cc16' },
    { value: 5, icon: Laugh, label: 'Great', color: '#22c55e' },
];

export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];
