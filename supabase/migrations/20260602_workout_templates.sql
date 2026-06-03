-- Migration: workout_templates + template_exercises
-- Allows storing reusable workout templates (public or per-user)

CREATE TABLE IF NOT EXISTS workout_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  is_public     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID REFERENCES workout_templates(id) ON DELETE CASCADE NOT NULL,
  exercise_name   TEXT NOT NULL,
  sets            INT NOT NULL,
  reps            TEXT NOT NULL,
  rest_seconds    INT DEFAULT 90,
  notes           TEXT,
  sort_order      INT NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own + public templates" ON workout_templates
  FOR SELECT USING (user_id = auth.uid() OR is_public = TRUE);

CREATE POLICY "Users manage own templates" ON workout_templates
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users see exercises of accessible templates" ON template_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      WHERE wt.id = template_exercises.template_id
        AND (wt.user_id = auth.uid() OR wt.is_public = TRUE)
    )
  );

CREATE POLICY "Users manage exercises of own templates" ON template_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      WHERE wt.id = template_exercises.template_id
        AND wt.user_id = auth.uid()
    )
  );
