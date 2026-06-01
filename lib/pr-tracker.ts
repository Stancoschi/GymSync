import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Epley formula: estimated 1-Rep Max
 * weight * (1 + reps / 30)
 * Used consistently across live-session-client (client) and this helper (server).
 */
export function calc1RM(weight_kg: number, reps: number): number {
  if (reps <= 0 || weight_kg <= 0) return 0;
  return weight_kg * (1 + reps / 30);
}

export interface PrBaseline {
  exercise_id: string;
  exercise_name: string;
  best_1rm: number;
  best_weight_kg: number;
  best_reps: number;
}

export interface ExercisePrStatus {
  exercise_id: string;
  exercise_name: string;
  /** Best historical 1RM before this workout session */
  baseline_1rm: number | null;
  /** Best set logged in this session */
  session_1rm: number | null;
  is_pr: boolean;
}

/**
 * Loads the best historical set (by Epley 1RM) for each exercise
 * the user has ever logged, excluding the current workout session.
 *
 * @param supabase  Server-side Supabase client
 * @param userId    Authenticated user id
 * @param exerciseIds  Subset of exercise ids to check (optional – if empty, loads all)
 */
export async function loadPrBaselines(
  supabase: SupabaseClient,
  userId: string,
  exerciseIds?: string[]
): Promise<Map<string, PrBaseline>> {
  let query = supabase
    .from("workout_set_logs")
    .select(`
      reps,
      weight_kg,
      workout_session_exercises!inner(
        exercise_id,
        exercises!inner( id, name ),
        workout_sessions!inner( user_id )
      )
    `)
    .eq("workout_session_exercises.workout_sessions.user_id", userId)
    .eq("completed", true)
    .not("weight_kg", "is", null);

  if (exerciseIds && exerciseIds.length > 0) {
    query = query.in(
      "workout_session_exercises.exercise_id",
      exerciseIds
    );
  }

  const { data, error } = await query;
  if (error || !data) return new Map();

  const baselines = new Map<string, PrBaseline>();

  for (const row of data as any[]) {
    const wse = row.workout_session_exercises;
    const ex = Array.isArray(wse?.exercises)
      ? wse.exercises[0]
      : wse?.exercises;
    if (!ex) continue;

    const exerciseId: string = ex.id;
    const exerciseName: string = ex.name;
    const weight: number = row.weight_kg ?? 0;
    const reps: number = row.reps ?? 0;
    const orm = calc1RM(weight, reps);

    const existing = baselines.get(exerciseId);
    if (!existing || orm > existing.best_1rm) {
      baselines.set(exerciseId, {
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        best_1rm: orm,
        best_weight_kg: weight,
        best_reps: reps,
      });
    }
  }

  return baselines;
}

/**
 * Given a list of sets logged in a session, compares each against
 * the historical baselines and returns PR status per exercise.
 */
export function detectPrs(
  sessionSets: Array<{
    exercise_id: string;
    exercise_name: string;
    weight_kg: number;
    reps: number;
  }>,
  baselines: Map<string, PrBaseline>
): ExercisePrStatus[] {
  // Group best 1RM per exercise within this session
  const sessionBest = new Map<string, { orm: number; weight_kg: number; reps: number; name: string }>();

  for (const s of sessionSets) {
    const orm = calc1RM(s.weight_kg, s.reps);
    const prev = sessionBest.get(s.exercise_id);
    if (!prev || orm > prev.orm) {
      sessionBest.set(s.exercise_id, {
        orm,
        weight_kg: s.weight_kg,
        reps: s.reps,
        name: s.exercise_name,
      });
    }
  }

  const results: ExercisePrStatus[] = [];

  for (const [exerciseId, session] of sessionBest.entries()) {
    const baseline = baselines.get(exerciseId);
    const is_pr = !baseline || session.orm > baseline.best_1rm;

    results.push({
      exercise_id: exerciseId,
      exercise_name: session.name,
      baseline_1rm: baseline?.best_1rm ?? null,
      session_1rm: session.orm,
      is_pr,
    });
  }

  return results;
}

/**
 * Convenience: checks a single set against the historical baseline.
 * Returns true if this set sets a new 1RM record.
 */
export function isSetPr(
  weight_kg: number,
  reps: number,
  baseline: PrBaseline | undefined
): boolean {
  if (!baseline) return true; // first time doing this exercise
  return calc1RM(weight_kg, reps) > baseline.best_1rm;
}
