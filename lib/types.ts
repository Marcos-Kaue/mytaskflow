export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  color: string
  frequency: 'daily' | 'weekly' | 'monthly'
  target_count: number
  created_at: string
  is_active: boolean
}

export interface HabitCompletion {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes: string | null
}

export interface MonthlyGoal {
  id: string
  user_id: string
  month: number
  year: number
  target_percentage: number
  achieved_percentage: number
  is_completed: boolean
  created_at: string
}

export interface Reward {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  points_required: number
  is_claimed: boolean
  claimed_at: string | null
  created_at: string
}

export interface Discipline {
  id: string
  user_id: string
  name: string
  description: string | null
  penalty_type: 'points' | 'streak_reset' | 'custom'
  penalty_value: number
  triggered_at: string
  goal_id: string | null
  created_at: string
}

export interface UserStats {
  id: string
  user_id: string
  total_points: number
  current_streak: number
  longest_streak: number
  total_completions: number
  total_habits: number
  updated_at: string
}

export interface DailyStats {
  date: string
  completedCount: number
  totalHabits: number
  percentage: number
}

export interface WeeklyStats {
  weekStart: string
  averagePercentage: number
  totalCompletions: number
}
