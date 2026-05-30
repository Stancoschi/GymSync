"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWorkoutTemplate(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!name) {
    redirect("/workouts/new?message=Workout%20name%20is%20required");
  }

  const { data, error } = await supabase
    .from("workout_templates")
    .insert({
      user_id: user.id,
      name,
      description: description || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/workouts/new?message=${encodeURIComponent(error?.message || "Failed to create workout")}`
    );
  }

  revalidatePath("/workouts");
  redirect(`/workouts/${data.id}`);
}

export async function addTemplateExercise(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const workout_template_id = formData.get("workout_template_id") as string;
  const exercise_id = formData.get("exercise_id") as string;
  const order_index = Number(formData.get("order_index"));
  const target_sets = Number(formData.get("target_sets"));
  const min_reps = Number(formData.get("min_reps"));
  const max_reps = Number(formData.get("max_reps"));
  const target_rirRaw = formData.get("target_rir") as string;
  const load_incrementRaw = formData.get("load_increment") as string;
  const notes = (formData.get("notes") as string)?.trim();

  const { error } = await supabase
    .from("workout_template_exercises")
    .insert({
      workout_template_id,
      exercise_id,
      order_index,
      target_sets,
      min_reps,
      max_reps,
      target_rir: target_rirRaw ? Number(target_rirRaw) : null,
      load_increment: load_incrementRaw ? Number(load_incrementRaw) : null,
      notes: notes || null,
    });

  if (error) {
    redirect(
      `/workouts/${workout_template_id}?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/workouts/${workout_template_id}`);
  redirect(`/workouts/${workout_template_id}?message=Exercise%20added`);
}