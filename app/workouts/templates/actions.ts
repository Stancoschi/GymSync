"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function startWorkoutFromTemplate(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const templateId = formData.get("template_id") as string;
  if (!templateId) redirect("/workouts/templates?message=Missing+template");

  // 1. Fetch template + exercises
  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .select(`
      id, name,
      template_exercises (
        id, exercise_name, sets, reps, rest_seconds, notes, sort_order
      )
    `)
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    redirect("/workouts/templates?message=Template+not+found");
  }

  const exercises = [...(template.template_exercises ?? [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  // 2. Create workout_session
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      workout_template_id: templateId,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    redirect(
      `/workouts/templates?message=${encodeURIComponent(sessionError?.message ?? "Failed to create session")}`
    );
  }

  // 3. For each exercise: upsert into exercise_library by name, then add to session
  for (const [index, ex] of exercises.entries()) {
    const name = (ex as any).exercise_name as string;

    await supabase
      .from("exercise_library")
      .upsert({ name }, { onConflict: "name", ignoreDuplicates: true });

    const { data: libEx } = await supabase
      .from("exercise_library")
      .select("id")
      .eq("name", name)
      .single();

    if (!libEx) continue;

    const rawReps = (ex as any).reps as string;
    const repsParsed = rawReps === "AMRAP" ? null : parseInt(rawReps.split("/")[0], 10);

    await supabase.from("workout_session_exercises").insert({
      workout_session_id: session.id,
      exercise_id: libEx.id,
      order_index: index + 1,
      target_sets: (ex as any).sets,
      min_reps: repsParsed,
      max_reps: repsParsed,
      target_rir: null,
      load_increment: 2.5,
      notes: (ex as any).notes ?? null,
    });
  }

  revalidatePath("/workouts");
  redirect(`/sessions/${session.id}`);
}
