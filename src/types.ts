
export type HabitType = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  color: string;
  goal: number; // Percentage goal
}

export interface HabitCompletion {
  [habitId: string]: {
    [dateKey: string]: boolean; // dateKey in YYYY-MM-DD format
  };
}

export interface DailyNote {
  [dateKey: string]: string;
}

export interface Theme {
  name: string;
  primary: string;
  secondary: string;
}

export interface MonthStats {
  completed: number;
  total: number;
  remaining: number;
  percentage: number;
}

