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

// Supabase may return gyms as an object (when using .single()) or an array
// depending on how the foreign key relation is resolved.
export interface GymSessionRow {
  id: string;
  title: string;
  scheduled_for: string;
  max_participants: number | null;
  gyms:
    | { name: string; city: string | null }
    | { name: string; city: string | null }[]
    | null;
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
  bio: string | null;
  goal: string | null;
  avatar_url: string | null;
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

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'session_joined'
  | 'pr_achieved';

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
  // joined
  actor?: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
}

// Helper to normalize gyms field from GymSessionRow
export function getSessionGym(
  gyms: GymSessionRow["gyms"]
): { name: string; city: string | null } | null {
  if (!gyms) return null;
  if (Array.isArray(gyms)) return gyms[0] ?? null;
  return gyms;
}
