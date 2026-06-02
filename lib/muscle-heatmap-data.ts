import type { SupabaseClient } from "@supabase/supabase-js";
import { normaliseMuscle } from "@/lib/muscle-utils";

export type MuscleSetCount = {
  muscle: string;
  sets: number;
};

/**
 * Fetches muscle group set counts for a user in the last `days` days.
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

  // Map wse_id → muscle_group
  const wseMuscleMap = new Map<string, string | null>();
  for (const wse of wseRows) {
    wseMuscleMap.set(wse.id, exMuscleMap.get(wse.exercise_id as string) ?? null);
  }

  // Step 4: completed set logs
  const { data: setLogs } = await supabase
    .from("workout_set_logs")
    .select("workout_session_exercise_id")
    .in("workout_session_exercise_id", wseIds)
    .eq("completed", true);

  if (!setLogs || setLogs.length === 0) return [];

  // Count sets per muscle
  const muscleSetCount = new Map<string, number>();
  for (const log of setLogs) {
    const rawMuscle = wseMuscleMap.get(log.workout_session_exercise_id as string);
    const key = normaliseMuscle(rawMuscle ?? null);
    if (!key) continue;
    muscleSetCount.set(key, (muscleSetCount.get(key) ?? 0) + 1);
  }

  return Array.from(muscleSetCount.entries()).map(([muscle, sets]) => ({ muscle, sets }));
}
