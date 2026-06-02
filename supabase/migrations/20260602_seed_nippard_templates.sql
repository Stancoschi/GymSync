-- Seed: Jeff Nippard Full Body 4x/week templates
-- is_public = TRUE, user_id = NULL (system templates visible to all users)

-- Day 1: Lower Focused Full Body
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO workout_templates (name, description, is_public)
    VALUES ('Lower Focused Full Body', 'Jeff Nippard Full Body 4x — Day 1. Squat-focused. Emphasis on quads, hamstrings and upper back.', TRUE)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_id;
  IF v_id IS NOT NULL THEN
    INSERT INTO template_exercises (template_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
      (v_id, 'Back Squat', 4, '4', 150, 'Sit back and down, 15° toe flare, drive your knees out laterally', 0),
      (v_id, 'Dumbbell Incline Press', 3, '8', 150, '~45 degree incline, mind muscle connection with upper pecs', 1),
      (v_id, 'Lying Leg Curl', 3, '10', 90, 'Focus on squeezing your hamstrings to move the weight', 2),
      (v_id, 'Pronated Pulldown', 3, '10', 150, 'Pull your elbows down and in', 3),
      (v_id, 'Seated Hip Abduction', 3, '20', 90, 'Focus on driving your knees out', 4),
      (v_id, 'Supinated EZ Bar Curl', 3, '15/15', 90, 'Dropset. Drop weight by ~50% on second 15 reps. 30 reps total.', 5),
      (v_id, 'Standing Calf Raise', 3, '8', 90, '1-2 second pause at the bottom of each rep', 6);
  END IF;
END $$;

-- Day 2: Chest Focused Full Body
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO workout_templates (name, description, is_public)
    VALUES ('Chest Focused Full Body', 'Jeff Nippard Full Body 4x — Day 2. Bench press-focused. Emphasis on chest, glutes and upper back.', TRUE)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_id;
  IF v_id IS NOT NULL THEN
    INSERT INTO template_exercises (template_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
      (v_id, 'Barbell Bench Press', 3, '3', 180, 'Set up a comfortable arch, 1-2 second pause on chest, explode off chest with max force', 0),
      (v_id, 'Low to High Cable Flye', 3, '15', 90, 'Hands out to sides, palms facing ceiling. Pull elbows up and in while rotating palms to face floor.', 1),
      (v_id, 'Barbell Hip Thrust or RDL', 4, '12', 150, 'Hip thrust if glutes are priority, RDL if hamstrings are priority. Focus on mind muscle connection.', 2),
      (v_id, 'Chest-Supported T-Bar Row', 3, '15', 120, 'Squeeze your shoulder blades together at the top, let them round forward at the bottom', 3),
      (v_id, 'Arnold Press', 3, '10', 120, 'Start with elbows in front of you and palms facing in. Rotate the dumbbells so that your palms face forward as you press.', 4),
      (v_id, 'Tricep Pressdown', 3, '15', 90, 'Focus on squeezing your triceps to move the weight', 5),
      (v_id, 'Hex Bar or Smith Machine Shrug', 3, '12', 90, 'Shrug up and in, pull shoulders up to ears!', 6);
  END IF;
END $$;

-- Day 3: Back Focused Full Body
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO workout_templates (name, description, is_public)
    VALUES ('Back Focused Full Body', 'Jeff Nippard Full Body 4x — Day 3. Pull-up focused. Emphasis on lats, upper back and triceps.', TRUE)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_id;
  IF v_id IS NOT NULL THEN
    INSERT INTO template_exercises (template_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
      (v_id, 'Weighted Pull-Up', 3, '6', 150, '1.5x shoulder width grip, pull your chest to the bar', 0),
      (v_id, 'Humble Row', 3, '10', 150, 'Pin your lower chest against the top of an incline bench', 1),
      (v_id, 'Leg Press', 3, '15', 150, 'Low/medium/high foot placement, do not allow your lower back to round', 2),
      (v_id, 'Cable Rope Upright Row', 3, '10', 90, 'Focus on squeezing the upper traps at the top', 3),
      (v_id, 'EZ Bar Skull Crusher', 3, '15', 90, 'Arc the bar back behind your head, keep constant tension on triceps', 4),
      (v_id, 'Hammer Curl', 3, '8', 90, '3-second eccentric. Arch the dumbbell out not up, focus on squeezing your forearms', 5),
      (v_id, 'Bicycle Crunch', 3, '15', 90, 'Focus on flexing and rotating your spine, bring left elbow to right knee, right elbow to left knee', 6);
  END IF;
END $$;

-- Day 4: Lower Focused Full Body 2
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO workout_templates (name, description, is_public)
    VALUES ('Lower Focused Full Body 2', 'Jeff Nippard Full Body 4x — Day 4. Deadlift-focused. Emphasis on posterior chain, shoulders and core.', TRUE)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_id;
  IF v_id IS NOT NULL THEN
    INSERT INTO template_exercises (template_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
      (v_id, 'Deadlift', 4, '2', 240, 'Brace your lats, chest tall, hips high, pull the slack out of the bar prior to moving it off the ground', 0),
      (v_id, 'Overhead Press', 4, '6', 150, 'Squeeze your glutes to keep your torso upright, clear your head out of the way, press up and slightly back', 1),
      (v_id, 'Leg Extension', 3, '15', 90, 'Focus on squeezing your quads to move the weight', 2),
      (v_id, 'Dumbbell Lateral Raise', 3, '20', 90, 'Raise the dumbbell out not up, mind muscle connection with middle fibers', 3),
      (v_id, 'Rope Face Pull', 3, '20', 90, 'Pull your elbows up and out, squeeze your shoulder blades together', 4),
      (v_id, 'Standing Calf Raise', 3, '12', 90, 'Press onto your toes', 5),
      (v_id, 'Hanging Leg Raise', 3, '12', 90, 'Roll hips up as you squeeze lower abs, avoid swinging', 6),
      (v_id, 'Push Up', 2, 'AMRAP', 90, 'Perform as many reps as you can to hit target RPE6', 7);
  END IF;
END $$;
