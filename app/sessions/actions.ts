"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ─── Gym Social Sessions ──────────────────────────────────────────────────────

export async function createSession(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const gymId = formData.get("gym_id") as string;
  const title = formData.get("title") as string;
  const scheduledFor = formData.get("scheduled_for") as string;
  const maxParticipantsRaw = formData.get("max_participants") as string;
  const notes = formData.get("notes") as string;

  const maxParticipants = maxParticipantsRaw ? Number(maxParticipantsRaw) : null;

  const { error } = await supabase.from("gym_sessions").insert({
    user_id: user.id,
    gym_id: gymId,
    title,
    scheduled_for: scheduledFor,
    max_participants: maxParticipants,
    notes: notes || null,
  });

  if (error) {
    redirect(`/sessions?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/sessions");
  redirect("/sessions?message=Session%20created%20successfully");
}

export async function joinSession(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const sessionId = formData.get("session_id") as string;

  // Prevent duplicate joins
  const { data: existing } = await supabase
    .from("gym_session_participants")
    .select("user_id")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("gym_session_participants").insert({
      session_id: sessionId,
      user_id: user.id,
    });

    if (error) {
      redirect(`/sessions?message=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/sessions");
  redirect("/sessions?message=Joined%20successfully");
}

// ─── Workout Set Logging ──────────────────────────────────────────────────────

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

// ─── Complete Workout Session ─────────────────────────────────────────────────

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
