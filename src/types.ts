
export type HabitType = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  color: string;
  goal: number; // Percentage goal
  frequency?: number[]; // Array of day indices (0-6) where the habit is active. undefined means everyday.
  weeklyTarget?: number; // Number of times per week (1-7) for flexible habits
  sortOrder?: number;
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

export interface DayData {
  tasks: Task[];
  mood?: number; // 1-5
  journal?: string;
}

export interface DailyNote {
  [dateKey: string]: DayData;
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

export interface FeedbackReply {
  id: string;
  feedback_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_admin_reply: boolean;
}

export interface Feedback {
  id: string;
  user_id: string;
  type: 'bug' | 'suggestion';
  content: string;
  status: 'open' | 'closed' | 'replied';
  created_at: string;
  metadata?: any;
  replies?: FeedbackReply[];
}

