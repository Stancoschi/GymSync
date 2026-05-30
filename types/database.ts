// Central TypeScript types for GymSync — import from here, never use `any`.

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
  max_participants: number | null;
  gyms: { name: string; city: string | null } | null;
}

export interface PrHighlight {
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  workoutDate: string;
}

export interface ProfileRow {
  id: string;
  username: string | null;
  full_name: string | null;
  city: string | null;
}

export interface FriendshipRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
}

export interface FriendRequestRow {
  id: string;
  sender_id: string;
  status: string;
  created_at: string;
}

export interface ChallengeEntry {
  user_id: string;
  name: string;
  username: string | null;
  workouts_count: number;
  completed: boolean;
}

export interface WorkoutSetLog {
  id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  rir: number | null;
  completed: boolean;
}

export interface SessionParticipant {
  user_id: string;
  profiles: { full_name: string | null; username: string | null } | null;
}
