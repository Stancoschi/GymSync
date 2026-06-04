import type { SupabaseClient } from "@supabase/supabase-js";

export interface VolumeDayEntry {
  date: string;    // YYYY-MM-DD
  /** Total volume in kg (weight × reps across all completed sets) */
  volumeKg: number;
  /** Number of completed sets */
  sets: number;
}

/**
 * Returns per-day training volume for the user over the last `days` days.
 * Volume = sum of (weight_kg × reps) for every completed set in that day's sessions.
 */
export async function loadVolumeHeatmapData(
  supabase: SupabaseClient,
  userId: string,
  days = 112  // 16 weeks default
): Promise<VolumeDayEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  // Step 1: completed sessions in range
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, completed_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("completed_at", sinceIso);

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  // Map session_id → YYYY-MM-DD
  const sessionDateMap = new Map<string, string>(
    sessions.map((s) => [s.id, (s.completed_at as string).split("T")[0]])
  );

  // Step 2: workout_session_exercises for those sessions
  const { data: wseRows } = await supabase
    .from("workout_session_exercises")
    .select("id, workout_session_id")
    .in("workout_session_id", sessionIds);

  if (!wseRows || wseRows.length === 0) return [];

  const wseIds = wseRows.map((w) => w.id);
  // Map wse_id → date
  const wseDateMap = new Map<string, string>();
  for (const wse of wseRows) {
    const date = sessionDateMap.get(wse.workout_session_id as string);
    if (date) wseDateMap.set(wse.id, date);
  }

  // Step 3: completed set logs with weight+reps
  const { data: setLogs } = await supabase
    .from("workout_set_logs")
    .select("workout_session_exercise_id, weight_kg, reps")
    .in("workout_session_exercise_id", wseIds)
    .eq("completed", true)
    .not("weight_kg", "is", null)
    .not("reps", "is", null);

  if (!setLogs || setLogs.length === 0) return [];

  // Aggregate per day
  const dayMap = new Map<string, { volumeKg: number; sets: number }>();
  for (const log of setLogs) {
    const date = wseDateMap.get(log.workout_session_exercise_id as string);
    if (!date) continue;
    const vol = (Number(log.weight_kg) || 0) * (Number(log.reps) || 0);
    const existing = dayMap.get(date) ?? { volumeKg: 0, sets: 0 };
    dayMap.set(date, { volumeKg: existing.volumeKg + vol, sets: existing.sets + 1 });
  }

  return Array.from(dayMap.entries()).map(([date, { volumeKg, sets }]) => ({
    date,
    volumeKg: Math.round(volumeKg),
    sets,
  }));
}
