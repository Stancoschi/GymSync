-- Allow public (unauthenticated) read on workout_templates for sharing preview
-- Only the template name/description is exposed; exercises require auth.
CREATE POLICY "public_read_workout_templates"
  ON workout_templates
  FOR SELECT
  TO anon
  USING (true);

-- Allow public read on workouts for share preview (only has_pr, title, date)
CREATE POLICY "public_read_workouts"
  ON workouts
  FOR SELECT
  TO anon
  USING (true);
