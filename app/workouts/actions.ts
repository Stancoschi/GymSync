"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWorkout(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const title = formData.get("title") as string;
  const workout_date = formData.get("workout_date") as string;
  const duration_minutes = formData.get("duration_minutes");
  const notes = formData.get("notes") as string | null;

  const { error } = await supabase.from("workouts").insert({
    user_id: user.id,
    title,
    workout_date,
    duration_minutes: duration_minutes ? Number(duration_minutes) : null,
    notes,
  });

  if (error) redirect("/workouts?message=" + encodeURIComponent(error.message));
  revalidatePath("/workouts");
  redirect("/workouts?message=Workout+saved");
}

export async function deleteWorkout(workoutId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", user.id);

  revalidatePath("/workouts");
}

export async function createWorkoutTemplate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  const { error } = await supabase.from("workout_templates").insert({
    user_id: user.id,
    name,
    description,
  });

  if (error) redirect("/workouts?message=" + encodeURIComponent(error.message));
  revalidatePath("/workouts");
  redirect("/workouts?message=Template+created");
}

// Alias used by create-workout-form.tsx
export const createWorkout2 = createWorkoutTemplate;

export async function addTemplateExercise(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const workout_template_id = formData.get("workout_template_id") as string;
  const exercise_name = formData.get("exercise_name") as string;
  const sets = Number(formData.get("sets"));
  const reps = formData.get("reps") as string;
  const rest_seconds = Number(formData.get("rest_seconds"));
  const notes = formData.get("notes") as string | null;

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("template_exercises")
    .select("sort_order")
    .eq("workout_template_id", workout_template_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = ((existing?.[0]?.sort_order ?? 0) as number) + 1;

  const { error } = await supabase.from("template_exercises").insert({
    workout_template_id,
    exercise_name,
    sets,
    reps,
    rest_seconds,
    notes,
    sort_order: nextSortOrder,
  });

  if (error) {
    redirect(
      `/workouts/${workout_template_id}?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/workouts/${workout_template_id}`);
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("workout_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", user.id);

  revalidatePath("/workouts");
}

export async function togglePinTemplate(templateId: string, currentPinned: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("workout_templates")
    .update({ is_pinned: !currentPinned })
    .eq("id", templateId)
    .eq("user_id", user.id);

  revalidatePath("/workouts");
}
