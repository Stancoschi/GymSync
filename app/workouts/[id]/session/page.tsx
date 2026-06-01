import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveSessionClient } from "@/components/workouts/live-session-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Live Session" };

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Load template + exercises with last-session weights for each exercise
  const { data: template, error: tErr } = await supabase
    .from("workout_templates")
    .select("id, name, description")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (tErr || !template) redirect("/workouts");

  const { data: templateExercises } = await supabase
    .from("workout_template_exercises")
    .select(`
      id,
      order_index,
      target_sets,
      min_reps,
      max_reps,
      target_rir,
      notes,
      exercise_library ( id, name, muscle_group )
    `)
    .eq("workout_template_id", id)
    .order("order_index", { ascending: true });

  // For each exercise, fetch the best set from previous sessions (PR detection)
  const exerciseLibraryIds = (templateExercises ?? []).map((te: any) =>
    Array.isArray(te.exercise_library) ? te.exercise_library[0]?.id : te.exercise_library?.id
  ).filter(Boolean);

  const { data: previousBests } = exerciseLibraryIds.length > 0
    ? await supabase
        .from("workout_set_logs")
        .select(`weight_kg, reps, workout_session_exercises!inner ( exercise_id )`)
        .in("workout_session_exercises.exercise_id", exerciseLibraryIds)
        .not("weight_kg", "is", null)
        .order("weight_kg", { ascending: false })
        .limit(200)
    : { data: [] };

  // Build map: exercise_id -> { weight_kg, reps } (best 1RM equivalent)
  const prMap: Record<string, { weight_kg: number; reps: number }> = {};
  for (const row of previousBests ?? []) {
    const exId = Array.isArray(row.workout_session_exercises)
      ? row.workout_session_exercises[0]?.exercise_id
      : (row.workout_session_exercises as any)?.exercise_id;
    if (!exId) continue;
    const e1rm = Number(row.weight_kg) * (1 + Number(row.reps) / 30);
    const cur = prMap[exId];
    const curE1rm = cur ? cur.weight_kg * (1 + cur.reps / 30) : 0;
    if (e1rm > curE1rm) prMap[exId] = { weight_kg: Number(row.weight_kg), reps: Number(row.reps) };
  }

  return (
    <LiveSessionClient
      templateId={id}
      templateName={template.name}
      exercises={(templateExercises ?? []) as any[]}
      prMap={prMap}
      userId={user.id}
    />
  );
}
