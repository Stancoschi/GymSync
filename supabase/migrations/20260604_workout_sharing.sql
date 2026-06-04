-- Add sharing fields to workouts table
alter table workouts
  add column if not exists is_shared_to_feed boolean not null default false,
  add column if not exists share_message text;

-- Index for feed query (only shared workouts)
create index if not exists idx_workouts_shared_feed
  on workouts (workout_date desc)
  where is_shared_to_feed = true;
