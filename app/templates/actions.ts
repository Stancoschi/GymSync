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
  if (!templateId) redirect("/templates?message=Missing+template");

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
    redirect("/templates?message=Template+not+found");
  }

  const exercises = [...(template.template_exercises ?? [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  if (exercises.length === 0) {
    redirect("/templates?message=Template+has+no+exercises");
  }

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
      `/templates?message=${encodeURIComponent(sessionError?.message ?? "Failed to create session")}`
    );
  }

  // 3. Fetch ALL exercise_library ids by name in one query (avoids upsert RLS issues)
  const exerciseNames = exercises.map((ex: any) => ex.exercise_name as string);

  const { data: libraryExercises, error: libraryError } = await supabase
    .from("exercise_library")
    .select("id, name")
    .in("name", exerciseNames);

  if (libraryError || !libraryExercises || libraryExercises.length === 0) {
    redirect(
      `/templates?message=${encodeURIComponent("Exercises not found in library: " + (libraryError?.message ?? "empty"))}`
    );
  }

  // Build a name -> id map
  const nameToId = new Map<string, string>(
    libraryExercises.map((ex: any) => [ex.name, ex.id])
  );

  // 4. Insert all workout_session_exercises
  const toInsert = exercises
    .map((ex: any, index: number) => {
      const exerciseId = nameToId.get(ex.exercise_name);
      if (!exerciseId) return null;

      const rawReps = ex.reps as string;
      const repsParsed =
        rawReps === "AMRAP" ? null : parseInt(rawReps.split("/")[0], 10);

      return {
        workout_session_id: session.id,
        exercise_id: exerciseId,
        order_index: index + 1,
        target_sets: ex.sets,
        min_reps: repsParsed,
        max_reps: repsParsed,
        target_rir: null,
        load_increment: 2.5,
        notes: ex.notes ?? null,
      };
    })
    .filter(Boolean);

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("workout_session_exercises")
      .insert(toInsert as any[]);

    if (insertError) {
      redirect(
        `/templates?message=${encodeURIComponent("Failed to add exercises: " + insertError.message)}`
      );
    }
  }

  revalidatePath("/workouts");
  redirect(`/sessions/${session.id}`);
}
