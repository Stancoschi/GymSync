-- Migration: add has_pr column to workouts table
-- This flag is set to true when a workout session contains at least one new PR.
-- Used by feed/page.tsx to show the 🏆 PR badge on workout feed cards.

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS has_pr boolean NOT NULL DEFAULT false;

-- Index to make the feed query efficient
CREATE INDEX IF NOT EXISTS idx_workouts_has_pr
  ON workouts (has_pr)
  WHERE has_pr = true;
