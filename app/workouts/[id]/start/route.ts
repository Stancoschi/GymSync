import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .select("id, user_id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (templateError || !template) {
    return NextResponse.redirect(
      new URL(`/workouts?message=${encodeURIComponent("Workout template not found")}`, request.url)
    );
  }

  const { data: templateExercises, error: templateExercisesError } = await supabase
    .from("workout_template_exercises")
    .select(`
      id,
      exercise_id,
      order_index,
      target_sets,
      min_reps,
      max_reps,
      target_rir,
      load_increment
    `)
    .eq("workout_template_id", id)
    .order("order_index", { ascending: true });

  if (templateExercisesError) {
    return NextResponse.redirect(
      new URL(`/workouts/${id}?message=${encodeURIComponent(templateExercisesError.message)}`, request.url)
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      workout_template_id: id,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return NextResponse.redirect(
      new URL(`/workouts/${id}?message=${encodeURIComponent(sessionError?.message || "Failed to create session")}`, request.url)
    );
  }

  if ((templateExercises ?? []).length > 0) {
    const sessionExercises = templateExercises.map((exercise: any) => ({
      workout_session_id: session.id,
      workout_template_exercise_id: exercise.id,
      exercise_id: exercise.exercise_id,
      order_index: exercise.order_index,
      target_sets: exercise.target_sets,
      min_reps: exercise.min_reps,
      max_reps: exercise.max_reps,
      target_rir: exercise.target_rir,
      load_increment: exercise.load_increment,
    }));

    const { error: insertExercisesError } = await supabase
      .from("workout_session_exercises")
      .insert(sessionExercises);

    if (insertExercisesError) {
      return NextResponse.redirect(
        new URL(
          `/workouts/${id}?message=${encodeURIComponent(insertExercisesError.message)}`,
          request.url
        )
      );
    }
  }

  return NextResponse.redirect(new URL(`/sessions/${session.id}`, request.url));
}