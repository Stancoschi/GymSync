import type { SupabaseClient } from "@supabase/supabase-js";
import { normaliseMuscle, getSecondaryContributions } from "@/lib/muscle-utils";
import type { MuscleKey } from "@/lib/muscle-utils";

export type MuscleSetCount = {
  muscle: string;
  /** Primary completed sets */
  sets: number;
  /** Secondary weighted contribution (from compound exercises) */
  secondarySets: number;
};

/**
 * Fetches muscle group set counts for a user in the last `days` days.
 * Primary sets = direct sets on that muscle.
 * Secondary sets = compound carry-over from other muscles (weighted).
 * Server-safe — no client imports.
 */
export async function loadMuscleHeatmapData(
  supabase: SupabaseClient,
  userId: string,
  days = 7
): Promise<MuscleSetCount[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  // Step 1: recent completed sessions
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("completed_at", sinceIso);

  if (!sessions || sessions.length === 0) return [];
  const sessionIds = sessions.map((s) => s.id);

  // Step 2: workout_session_exercises
  const { data: wseRows } = await supabase
    .from("workout_session_exercises")
    .select("id, exercise_id")
    .in("workout_session_id", sessionIds);

  if (!wseRows || wseRows.length === 0) return [];
  const wseIds = wseRows.map((w) => w.id);
  const exerciseIds = Array.from(new Set(wseRows.map((w) => w.exercise_id as string)));

  // Step 3: exercise_library muscle groups
  const { data: exercises } = await supabase
    .from("exercise_library")
    .select("id, muscle_group")
    .in("id", exerciseIds);

  const exMuscleMap = new Map<string, string | null>(
    (exercises ?? []).map((e) => [e.id, e.muscle_group])
  );

  // Map wse_id → normalised MuscleKey
  const wseMuscleMap = new Map<string, MuscleKey | null>();
  for (const wse of wseRows) {
    const raw = exMuscleMap.get(wse.exercise_id as string) ?? null;
    wseMuscleMap.set(wse.id, normaliseMuscle(raw));
  }

  // Step 4: completed set logs
  const { data: setLogs } = await supabase
    .from("workout_set_logs")
    .select("workout_session_exercise_id")
    .in("workout_session_exercise_id", wseIds)
    .eq("completed", true);

  if (!setLogs || setLogs.length === 0) return [];

  // Count primary sets per muscle
  const primaryMap = new Map<MuscleKey, number>();
  for (const log of setLogs) {
    const key = wseMuscleMap.get(log.workout_session_exercise_id as string);
    if (!key) continue;
    primaryMap.set(key, (primaryMap.get(key) ?? 0) + 1);
  }

  // Build secondary contributions from compound carry-over
  const secondaryMap = new Map<MuscleKey, number>();
  for (const [primaryKey, primarySets] of primaryMap.entries()) {
    for (const { muscle, sets } of getSecondaryContributions(primaryKey, primarySets)) {
      secondaryMap.set(muscle, (secondaryMap.get(muscle) ?? 0) + sets);
    }
  }

  // Merge: every muscle that has primary OR secondary data
  const allMuscles = new Set<MuscleKey>([
    ...primaryMap.keys(),
    ...secondaryMap.keys(),
  ]);

  return Array.from(allMuscles).map((muscle) => ({
    muscle,
    sets: primaryMap.get(muscle) ?? 0,
    secondarySets: secondaryMap.get(muscle) ?? 0,
  }));
}
