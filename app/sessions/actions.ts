"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";




export async function upsertSetLog(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const sessionId = formData.get("session_id") as string;
  const workoutSessionExerciseId = formData.get("workout_session_exercise_id") as string;
  const setNumber = Number(formData.get("set_number"));
  const repsRaw = formData.get("reps") as string;
  const weightRaw = formData.get("weight_kg") as string;
  const rirRaw = formData.get("rir") as string;

  const reps = repsRaw ? Number(repsRaw) : null;
  const weight_kg = weightRaw ? Number(weightRaw) : null;
  const rir = rirRaw ? Number(rirRaw) : null;

  const { data: existing } = await supabase
    .from("workout_set_logs")
    .select("id")
    .eq("workout_session_exercise_id", workoutSessionExerciseId)
    .eq("set_number", setNumber)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("workout_set_logs")
      .update({
        reps,
        weight_kg,
        rir,
        completed: true,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("workout_set_logs").insert({
      workout_session_exercise_id: workoutSessionExerciseId,
      set_number: setNumber,
      reps,
      weight_kg,
      rir,
      completed: true,
    });
  }

  revalidatePath(`/sessions/${sessionId}`);
}

export async function completeWorkoutSession(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const sessionId = formData.get("session_id") as string;

  const { error } = await supabase
    .from("workout_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/sessions/${sessionId}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  redirect(`/sessions/${sessionId}?message=Workout%20completed`);
}