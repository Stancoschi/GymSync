-- ============================================================
-- Migration: Program Blocks + Warm-up Sets + Last Session
-- Tables: program_exercises, workout_sessions (extend),
--         workout_set_logs (extend)
-- ============================================================

-- 1. Program exercises table (Jeff Nippard 4x/week blocks)
CREATE TABLE IF NOT EXISTS program_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block           TEXT NOT NULL,          -- 'Block 1', 'Block 2', 'Block 3'
  week            TEXT NOT NULL,          -- 'Week 1' ... 'Week 10 (AMRAPs)'
  week_number     INT  NOT NULL,          -- 1-10 for ordering
  workout         TEXT NOT NULL,          -- 'LOWER FOCUSED FULL BODY' etc.
  exercise        TEXT NOT NULL,
  warmup_sets     INT  NOT NULL DEFAULT 0,
  working_sets    INT  NOT NULL DEFAULT 1,
  reps            TEXT,                   -- '4', '15/15', 'AMRAP', '3-5'
  target_load     TEXT,                   -- '85', null if RPE only
  rpe             TEXT,                   -- 'RPE8', '0.775', 'RPE only'
  rest            TEXT,                   -- '2-4 min'
  notes           TEXT,
  order_index     INT  NOT NULL DEFAULT 0
);

-- Index for fast lookups by week + workout
CREATE INDEX IF NOT EXISTS idx_program_exercises_week_workout
  ON program_exercises (week, workout);

-- 2. Extend workout_sessions with program context
ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS program_week    TEXT,    -- 'Week 1', 'Week 5', etc.
  ADD COLUMN IF NOT EXISTS program_workout TEXT;   -- 'LOWER FOCUSED FULL BODY', etc.

-- Index for last-session lookups
CREATE INDEX IF NOT EXISTS idx_workout_sessions_program
  ON workout_sessions (user_id, program_week, program_workout, created_at DESC)
  WHERE program_week IS NOT NULL;

-- 3. Extend workout_set_logs with warm-up flag
ALTER TABLE workout_set_logs
  ADD COLUMN IF NOT EXISTS is_warmup BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. RLS for program_exercises (public read — same program for everyone)
ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read program exercises" ON program_exercises;
CREATE POLICY "Anyone can read program exercises" ON program_exercises
  FOR SELECT USING (TRUE);

-- Only service role can insert/update program data
DROP POLICY IF EXISTS "Service role manages program exercises" ON program_exercises;
CREATE POLICY "Service role manages program exercises" ON program_exercises
  FOR ALL USING (auth.role() = 'service_role');
