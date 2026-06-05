-- ============================================================
-- MIGRATION: GymSync Improvements
-- Date: 2026-06-05
-- ============================================================

-- ------------------------------------------------------------
-- 1. EXTENDED NOTIFICATION TYPES
--    Add support for workout_reaction, workout_comment, new_pr
-- ------------------------------------------------------------
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'friend_request'::text,
    'friend_accepted'::text,
    'session_joined'::text,
    'workout_reaction'::text,
    'workout_comment'::text,
    'session_comment'::text,
    'new_pr'::text
  ]));


-- ------------------------------------------------------------
-- 2. SCHEDULED WORKOUTS
--    Add scheduled_for column to workout_sessions
-- ------------------------------------------------------------
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone;


-- ------------------------------------------------------------
-- 3. PROGRAMS TABLE
--    Proper metadata entity for workout programs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  author_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  duration_weeks integer,
  days_per_week  integer,
  difficulty     text CHECK (difficulty = ANY (ARRAY['beginner','intermediate','advanced'])),
  goal           text CHECK (goal = ANY (ARRAY['lose_weight','maintain','gain_muscle','strength','endurance'])),
  is_public      boolean NOT NULL DEFAULT false,
  created_at     timestamp with time zone NOT NULL DEFAULT now(),
  updated_at     timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "programs_select" ON public.programs
  FOR SELECT USING (is_public = true OR (SELECT auth.uid()) = author_id);

CREATE POLICY "programs_insert" ON public.programs
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "programs_update" ON public.programs
  FOR UPDATE USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "programs_delete" ON public.programs
  FOR DELETE USING ((SELECT auth.uid()) = author_id);

-- Link program_exercises to programs table
ALTER TABLE public.program_exercises
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE;


-- ------------------------------------------------------------
-- 4. AUTOMATIC PR DETECTION TRIGGER
--    Fires after INSERT on workout_set_logs
--    Inserts a new pr_record if weight_kg > previous best
--    Also sets workouts.has_pr = true
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_check_and_insert_pr()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        uuid;
  v_exercise_id    uuid;
  v_session_id     uuid;
  v_best_weight    numeric;
BEGIN
  -- Only process completed, non-warmup sets with a weight
  IF NEW.completed = false OR NEW.is_warmup = true OR NEW.weight_kg IS NULL OR NEW.reps IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get user_id and exercise_id via joins
  SELECT
    ws.user_id,
    wse.exercise_id,
    wse.workout_session_id
  INTO v_user_id, v_exercise_id, v_session_id
  FROM public.workout_session_exercises wse
  JOIN public.workout_sessions ws ON ws.id = wse.workout_session_id
  WHERE wse.id = NEW.workout_session_exercise_id;

  IF v_user_id IS NULL OR v_exercise_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get current best weight for this exercise
  SELECT COALESCE(MAX(weight_kg), 0)
  INTO v_best_weight
  FROM public.pr_records
  WHERE user_id = v_user_id
    AND exercise_id = v_exercise_id;

  -- If new set is a PR, insert record and notify
  IF NEW.weight_kg > v_best_weight THEN
    INSERT INTO public.pr_records (user_id, exercise_id, weight_kg, reps, achieved_at)
    VALUES (v_user_id, v_exercise_id, NEW.weight_kg, NEW.reps, CURRENT_DATE)
    ON CONFLICT DO NOTHING;

    -- Mark the workout session as having a PR
    UPDATE public.workout_sessions
      SET notes = COALESCE(notes, '') -- preserve notes; has_pr handled in app layer
    WHERE id = v_session_id;

    -- Insert a notification for the user
    INSERT INTO public.notifications (user_id, type, actor_id, entity_id)
    VALUES (v_user_id, 'new_pr', v_user_id, v_exercise_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_pr ON public.workout_set_logs;

CREATE TRIGGER trg_check_pr
  AFTER INSERT ON public.workout_set_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_and_insert_pr();


-- ------------------------------------------------------------
-- 5. WEEKLY LEADERBOARD VIEW
--    Shows total volume (kg * reps) per user for current week
--    among friends
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_weekly_leaderboard AS
SELECT
  ws.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  COALESCE(SUM(sl.weight_kg * sl.reps), 0)::numeric AS total_volume_kg,
  COUNT(DISTINCT ws.id) AS sessions_count,
  DATE_TRUNC('week', NOW()) AS week_start
FROM public.workout_sessions ws
JOIN public.workout_session_exercises wse ON wse.workout_session_id = ws.id
JOIN public.workout_set_logs sl ON sl.workout_session_exercise_id = wse.id
JOIN public.profiles p ON p.id = ws.user_id
WHERE
  ws.status = 'completed'
  AND ws.started_at >= DATE_TRUNC('week', NOW())
  AND sl.completed = true
  AND sl.is_warmup = false
GROUP BY ws.user_id, p.username, p.full_name, p.avatar_url
ORDER BY total_volume_kg DESC;


-- ------------------------------------------------------------
-- 6. PROGRESS VIEW PER EXERCISE
--    Aggregates best weight per session per exercise per user
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_exercise_progress AS
SELECT
  ws.user_id,
  wse.exercise_id,
  el.name AS exercise_name,
  el.muscle_group,
  ws.started_at::date AS session_date,
  MAX(sl.weight_kg) AS best_weight_kg,
  MAX(sl.reps)      AS best_reps,
  MIN(sl.rir)       AS best_rir,
  COUNT(sl.id)      AS total_sets
FROM public.workout_sessions ws
JOIN public.workout_session_exercises wse ON wse.workout_session_id = ws.id
JOIN public.workout_set_logs sl ON sl.workout_session_exercise_id = wse.id
JOIN public.exercise_library el ON el.id = wse.exercise_id
WHERE
  ws.status = 'completed'
  AND sl.completed = true
  AND sl.is_warmup = false
  AND sl.weight_kg IS NOT NULL
GROUP BY ws.user_id, wse.exercise_id, el.name, el.muscle_group, ws.started_at::date
ORDER BY ws.user_id, wse.exercise_id, session_date;


-- ------------------------------------------------------------
-- 7. PERFORMANCE: INDEXES FOR UNINDEXED FOREIGN KEYS
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_exercise_sets_workout_exercise_id       ON public.exercise_sets(workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_author_id                 ON public.feed_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user_id                  ON public.feed_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id             ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_a_id                   ON public.friendships(user_a_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_b_id                   ON public.friendships(user_b_id);
CREATE INDEX IF NOT EXISTS idx_gym_session_participants_user_id        ON public.gym_session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_sessions_creator_id                 ON public.gym_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_gym_sessions_gym_id                     ON public.gym_sessions(gym_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id                           ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id                  ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_pr_records_exercise_id                  ON public.pr_records(exercise_id);
CREATE INDEX IF NOT EXISTS idx_pr_records_user_id                      ON public.pr_records(user_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_session_id             ON public.session_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_user_id                ON public.session_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_session_reactions_user_id               ON public.session_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template_id          ON public.template_exercises(template_id);
CREATE INDEX IF NOT EXISTS idx_workout_comments_user_id                ON public.workout_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_comments_workout_id             ON public.workout_comments(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id           ON public.workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_scheduled_for          ON public.workout_sessions(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_program_exercises_program_id            ON public.program_exercises(program_id);
