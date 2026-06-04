"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function shareWorkoutToFeed(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const workoutId = formData.get("workout_id") as string;
  const workoutTitle = formData.get("workout_title") as string;
  const message = (formData.get("share_message") as string | null) ?? null;
  const unshare = formData.get("unshare") === "true";

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, user_id")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (!workout) return { error: "Workout not found or access denied" };

  if (unshare) {
    await supabase
      .from("workouts")
      .update({ is_shared_to_feed: false, share_message: null })
      .eq("id", workoutId)
      .eq("user_id", user.id);

    await supabase.from("feed_items").delete().eq("id", workoutId);
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();

    await supabase
      .from("workouts")
      .update({
        is_shared_to_feed: true,
        share_message: message?.trim() || null,
      })
      .eq("id", workoutId)
      .eq("user_id", user.id);

    await supabase.from("feed_items").upsert(
      {
        id: workoutId,
        type: "workout",
        actor_id: user.id,
        actor_name: profile?.full_name ?? "Unknown",
        actor_username: profile?.username ?? null,
        title: workoutTitle,
        subtitle: "",
        share_message: message?.trim() || null,
      },
      { onConflict: "id" }
    );
  }

  revalidatePath("/feed");
  revalidatePath("/workouts");
  return { success: true };
}
