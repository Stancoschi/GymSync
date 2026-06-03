-- Migration: move Jeff Nippard template exercises from template_exercises
-- into workout_template_exercises (the system used by /workouts/[id])
--
-- Run AFTER the seed has been applied and exercise_library has been populated.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

INSERT INTO workout_template_exercises (
  workout_template_id,
  exercise_id,
  order_index,
  target_sets,
  min_reps,
  max_reps,
  target_rir,
  load_increment,
  notes
)
SELECT
  te.template_id,
  el.id,
  te.sort_order + 1,
  te.sets,
  CASE
    WHEN te.reps = 'AMRAP' THEN NULL
    ELSE CAST(split_part(te.reps, '/', 1) AS INTEGER)
  END,
  CASE
    WHEN te.reps = 'AMRAP' THEN NULL
    ELSE CAST(split_part(te.reps, '/', 1) AS INTEGER)
  END,
  NULL,
  2.5,
  te.notes
FROM template_exercises te
JOIN exercise_library el ON el.name = te.exercise_name
JOIN workout_templates wt ON wt.id = te.template_id AND wt.is_public = TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM workout_template_exercises wte
  WHERE wte.workout_template_id = te.template_id
    AND wte.exercise_id = el.id
);
