"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Toggles is_shared_to_feed on a workout the current user owns.
 * Optionally stores a share_message.
 */
export async function shareWorkoutToFeed(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const workoutId = formData.get("workout_id") as string;
  const message = ((formData.get("message") as string) ?? "").trim() || null;
  const currentShared = formData.get("current_shared") === "true";

  // Verify ownership before updating
  const { data: workout, error: fetchError } = await supabase
    .from("workouts")
    .select("id, user_id")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !workout) {
    redirect(`/workouts?message=${encodeURIComponent("Workout not found or access denied")}`);
  }

  const newShared = !currentShared;

  const { error } = await supabase
    .from("workouts")
    .update({
      is_shared_to_feed: newShared,
      share_message: newShared ? message : null,
    })
    .eq("id", workoutId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/workouts?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/feed");
  revalidatePath("/workouts");
}
