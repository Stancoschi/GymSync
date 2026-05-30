"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function toggleWorkoutReaction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const workoutId = formData.get("workout_id") as string;

  const { data: existing } = await supabase
    .from("workout_reactions")
    .select("id")
    .eq("workout_id", workoutId)
    .eq("user_id", user.id)
    .eq("reaction_type", "fire")
    .maybeSingle();

  if (existing) {
    await supabase.from("workout_reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("workout_reactions").insert({
      workout_id: workoutId,
      user_id: user.id,
      reaction_type: "fire",
    });
  }

  revalidatePath("/feed");
}

export async function toggleSessionReaction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const sessionId = formData.get("session_id") as string;

  const { data: existing } = await supabase
    .from("session_reactions")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .eq("reaction_type", "fire")
    .maybeSingle();

  if (existing) {
    await supabase.from("session_reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("session_reactions").insert({
      session_id: sessionId,
      user_id: user.id,
      reaction_type: "fire",
    });
  }
  

  revalidatePath("/feed");
  
}