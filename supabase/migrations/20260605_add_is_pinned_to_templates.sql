-- Add is_pinned column to workout_templates
alter table workout_templates
  add column if not exists is_pinned boolean not null default false;

create index if not exists idx_workout_templates_pinned
  on workout_templates (user_id, is_pinned desc, name);
