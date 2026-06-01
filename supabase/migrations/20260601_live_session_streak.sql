-- Add duration_seconds to workout_sessions if not exists
alter table workout_sessions
  add column if not exists duration_seconds integer;

-- Add pr_achieved to notifications type check (extend existing enum or text column)
-- Assuming notifications.type is text — no migration needed, just insert 'pr_achieved'

-- Index for streak calculation (workout_date lookups)
create index if not exists idx_workouts_user_date
  on workouts (user_id, workout_date desc);

-- Index for PR queries
create index if not exists idx_workout_set_logs_wse
  on workout_set_logs (workout_session_exercise_id);
