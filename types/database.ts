// Shared TypeScript types for GymSync database rows.
// Use these instead of `any` when mapping over Supabase query results.

export interface WorkoutRow {
  id: string;
  title: string;
  workout_date: string;
  duration_minutes: number | null;
}

export interface BodyLogRow {
  id: string;
  log_date: string;
  weight_kg: number;
  body_fat_percent: number | null;
}

export interface GymSessionRow {
  id: string;
  title: string;
  scheduled_for: string;
  gyms: {
    name: string;
    city: string | null;
  } | null;
}

export interface PrHighlight {
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  workoutDate: string;
}

export interface StatCard {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}
