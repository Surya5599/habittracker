
export type HabitType = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  color: string;
  goal: number; // Percentage goal
  frequency?: number[]; // Array of day indices (0-6) where the habit is active. undefined means everyday.
}

export interface HabitCompletion {
  [habitId: string]: {
    [dateKey: string]: boolean; // dateKey in YYYY-MM-DD format
  };
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyNote {
  [dateKey: string]: Task[] | string; // Helper type to support migration, runtime will strictly usage Task[]
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

export interface MonthlyGoal {
  id: string;
  text: string;
  completed: boolean;
  locked?: boolean;
}

export interface MonthlyGoals {
  [monthKey: string]: MonthlyGoal[]; // monthKey format: YYYY-M
}

