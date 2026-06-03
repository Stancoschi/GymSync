import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveSessionClient } from "@/components/workouts/live-session-client";
import type { LastSessionMap } from "@/components/workouts/live-session-client";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 1. Load template + exercises — allow own templates AND public templates
  const { data: template } = await supabase
    .from("workout_templates")
    .select("id, name, user_id, is_public")
    .eq("id", id)
    .or(`user_id.eq.${user.id},is_public.eq.true`)
    .single();

  if (!template) notFound();

  const { data: exercises } = await supabase
    .from("workout_template_exercises")
    .select(
      `id, order_index, target_sets, min_reps, max_reps, target_rir, notes, load_increment,
       exercise_library ( id, name, muscle_group )`
    )
    .eq("workout_template_id", id)
    .order("order_index");

  if (!exercises || exercises.length === 0) notFound();

  // 2. PR baselines — best ever set per exercise for this user
  const exerciseIds = exercises
    .map((e) => {
      const lib = Array.isArray(e.exercise_library)
        ? e.exercise_library[0]
        : e.exercise_library;
      return lib?.id;
    })
    .filter(Boolean) as string[];

  const { data: userSessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "completed");

  const sessionIds = (userSessions ?? []).map((s) => s.id);

  const prMap: Record<string, { weight_kg: number; reps: number }> = {};
  const lastSessionMap: LastSessionMap = {};

  if (sessionIds.length > 0) {
    const { data: wseRows } = await supabase
      .from("workout_session_exercises")
      .select("id, exercise_id, workout_session_id")
      .in("workout_session_id", sessionIds)
      .in("exercise_id", exerciseIds);

    if (wseRows && wseRows.length > 0) {
      const wseIds = wseRows.map((w) => w.id);

      const { data: setLogs } = await supabase
        .from("workout_set_logs")
        .select("reps, weight_kg, workout_session_exercise_id, set_number")
        .in("workout_session_exercise_id", wseIds)
        .eq("completed", true)
        .not("weight_kg", "is", null)
        .not("reps", "is", null);

      for (const log of setLogs ?? []) {
        const wse = wseRows.find((w) => w.id === log.workout_session_exercise_id);
        if (!wse) continue;
        const exerciseId = wse.exercise_id as string;
        const w = Number(log.weight_kg);
        const r = Number(log.reps);
        if (!w || !r) continue;
        const e1rm = w * (1 + r / 30);
        const existing = prMap[exerciseId];
        if (!existing || e1rm > existing.weight_kg * (1 + existing.reps / 30)) {
          prMap[exerciseId] = { weight_kg: w, reps: r };
        }
      }

      const { data: recentSessions } = await supabase
        .from("workout_sessions")
        .select("id, completed_at")
        .in("id", sessionIds)
        .order("completed_at", { ascending: false })
        .limit(20);

      const recentSessionIds = (recentSessions ?? []).map((s) => s.id);

      for (const exId of exerciseIds) {
        const recentWse = recentSessionIds
          .flatMap((sid) =>
            wseRows.filter(
              (w) => w.workout_session_id === sid && w.exercise_id === exId
            )
          )
          .find(Boolean);

        if (!recentWse) continue;

        const setsForWse = (setLogs ?? [])
          .filter((l) => l.workout_session_exercise_id === recentWse.id)
          .sort((a, b) => Number(a.set_number) - Number(b.set_number))
          .map((l) => ({
            set_number: Number(l.set_number),
            reps: Number(l.reps),
            weight_kg: Number(l.weight_kg),
          }));

        if (setsForWse.length > 0) {
          lastSessionMap[exId] = setsForWse;
        }
      }
    }
  }

  return (
    <LiveSessionClient
      templateId={template.id}
      templateName={template.name}
      exercises={exercises as Parameters<typeof LiveSessionClient>[0]["exercises"]}
      prMap={prMap}
      lastSessionMap={lastSessionMap}
      userId={user.id}
    />
  );
}
