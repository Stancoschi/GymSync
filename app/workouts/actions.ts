"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWorkout(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const title = formData.get("title") as string;
  const notes = formData.get("notes") as string;
  const workoutDate = formData.get("workout_date") as string;
  const durationMinutesRaw = formData.get("duration_minutes") as string;
  const exerciseId = formData.get("exercise_id") as string;

  const durationMinutes = durationMinutesRaw ? Number(durationMinutesRaw) : null;

  const set1Reps = formData.get("set1_reps") as string;
  const set1Weight = formData.get("set1_weight") as string;

  const set2Reps = formData.get("set2_reps") as string;
  const set2Weight = formData.get("set2_weight") as string;

  const set3Reps = formData.get("set3_reps") as string;
  const set3Weight = formData.get("set3_weight") as string;

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      title,
      notes: notes || null,
      workout_date: workoutDate,
      duration_minutes: durationMinutes,
    })
    .select("id")
    .single();

  if (workoutError || !workout) {
    redirect(`/workouts?message=${encodeURIComponent(workoutError?.message || "Could not create workout")}`);
  }

  const { data: workoutExercise, error: workoutExerciseError } = await supabase
    .from("workout_exercises")
    .insert({
      workout_id: workout.id,
      exercise_id: exerciseId,
      position: 1,
    })
    .select("id")
    .single();

  if (workoutExerciseError || !workoutExercise) {
    redirect(`/workouts?message=${encodeURIComponent(workoutExerciseError?.message || "Could not create workout exercise")}`);
  }

  const setsToInsert = [
    { reps: set1Reps, weight: set1Weight, set_number: 1 },
    { reps: set2Reps, weight: set2Weight, set_number: 2 },
    { reps: set3Reps, weight: set3Weight, set_number: 3 },
  ]
    .filter((set) => set.reps || set.weight)
    .map((set) => ({
      workout_exercise_id: workoutExercise.id,
      set_number: set.set_number,
      reps: set.reps ? Number(set.reps) : null,
      weight_kg: set.weight ? Number(set.weight) : null,
    }));

  if (setsToInsert.length > 0) {
    const { error: setsError } = await supabase
      .from("exercise_sets")
      .insert(setsToInsert);

    if (setsError) {
      redirect(`/workouts?message=${encodeURIComponent(setsError.message)}`);
    }
  }

  revalidatePath("/workouts");
  redirect("/workouts?message=Workout%20created");
}