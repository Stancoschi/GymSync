"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications";

export async function finishWorkoutSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const templateId = formData.get("template_id") as string;
  const setsJson = formData.get("sets_json") as string;
  const durationSeconds = parseInt(formData.get("duration_seconds") as string, 10);
  const newPrsJson = formData.get("new_prs_json") as string;

  let sets: Array<{ exercise_id: string; exercise_name: string; set_number: number; reps: number; weight_kg: number; rir: number | null }> = [];
  let newPrs: string[] = [];
  try {
    sets = JSON.parse(setsJson);
    newPrs = JSON.parse(newPrsJson);
  } catch {
    redirect(`/workouts/${templateId}?message=Invalid+session+data`);
  }

  // 1. Insert workout_session
  const { data: session, error: sessionErr } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      workout_template_id: templateId,
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .select("id")
    .single();

  if (sessionErr || !session) {
    redirect(`/workouts/${templateId}?message=${encodeURIComponent(sessionErr?.message ?? "Session error")}`);
  }

  // 2. Group sets by exercise and insert workout_session_exercises + workout_set_logs
  const exerciseGroups = new Map<string, typeof sets>();
  for (const s of sets) {
    const arr = exerciseGroups.get(s.exercise_id) ?? [];
    arr.push(s);
    exerciseGroups.set(s.exercise_id, arr);
  }

  for (const [exerciseId, exSets] of exerciseGroups) {
    const { data: wse, error: wseErr } = await supabase
      .from("workout_session_exercises")
      .insert({
        workout_session_id: session.id,
        exercise_id: exerciseId,
        order_index: 1,
      })
      .select("id")
      .single();

    if (wseErr || !wse) continue;

    await supabase.from("workout_set_logs").insert(
      exSets.map((s) => ({
        workout_session_exercise_id: wse.id,
        set_number: s.set_number,
        reps: s.reps,
        weight_kg: s.weight_kg,
        rir: s.rir,
        completed: true,
      }))
    );
  }

  // 3. Insert workout log (for streak/feed) — include has_pr flag
  const { data: wTemplate } = await supabase
    .from("workout_templates")
    .select("name")
    .eq("id", templateId)
    .single();

  await supabase.from("workouts").insert({
    user_id: user.id,
    title: wTemplate?.name ?? "Workout",
    workout_date: new Date().toISOString().split("T")[0],
    duration_minutes: Math.round(durationSeconds / 60),
    has_pr: newPrs.length > 0,
  });

  // 4. Notify friends about PRs
  if (newPrs.length > 0) {
    const prText = newPrs.join(", ");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();

    const name = profile?.full_name ?? profile?.username ?? "Someone";

    const { data: friendships } = await supabase
      .from("friendships")
      .select("user_a_id, user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

    const friendIds = (friendships ?? []).map((f) =>
      f.user_a_id === user.id ? f.user_b_id : f.user_a_id
    );

    for (const friendId of friendIds) {
      await createNotification(supabase, {
        user_id: friendId,
        type: "pr_achieved",
        title: `${name} hit a new PR! 🏆`,
        body: `New personal record on ${prText}`,
        link: `/profile/${user.id}`,
      });
    }
  }

  redirect(
    `/workouts/${templateId}/session/summary?session_id=${session.id}&prs=${encodeURIComponent(newPrs.join(","))}`
  );
}
