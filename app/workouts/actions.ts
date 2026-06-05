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
