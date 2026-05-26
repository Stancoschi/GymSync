import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateWorkoutForm } from "@/components/workouts/create-workout-form";

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .order("name");

  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select(`
      id,
      title,
      notes,
      workout_date,
      duration_minutes,
      created_at,
      workout_exercises (
        id,
        position,
        exercises (
          id,
          name,
          muscle_group
        ),
        exercise_sets (
          id,
          set_number,
          reps,
          weight_kg,
          rir
        )
      )
    `)
    .order("workout_date", { ascending: false });

  if (exercisesError || workoutsError) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">Failed to load workouts data.</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workouts</h1>
          <p className="text-sm text-muted-foreground">
            Log workouts and track your training.
          </p>
        </div>

        <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm">
          Back to dashboard
        </Link>
      </div>

      {params?.message ? (
        <p className="rounded-md bg-muted p-3 text-sm">
          {params.message}
        </p>
      ) : null}

      <CreateWorkoutForm exercises={exercises ?? []} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Workout history</h2>

        {workouts && workouts.length > 0 ? (
          <div className="grid gap-4">
            {workouts.map((workout: any) => (
              <div key={workout.id} className="rounded-2xl border p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{workout.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {workout.workout_date}
                    {workout.duration_minutes
                      ? ` • ${workout.duration_minutes} min`
                      : ""}
                  </p>
                </div>

                {workout.workout_exercises?.map((we: any) => (
                  <div key={we.id} className="rounded-xl bg-muted/40 p-4 space-y-2">
                    <p className="font-medium">
                      {we.exercises?.name ?? "Exercise"}
                    </p>

                    {we.exercise_sets?.length > 0 ? (
                      <div className="space-y-1 text-sm">
                        {we.exercise_sets
                          .sort((a: any, b: any) => a.set_number - b.set_number)
                          .map((set: any) => (
                            <p key={set.id}>
                              Set {set.set_number}: {set.reps ?? "-"} reps ×{" "}
                              {set.weight_kg ?? "-"} kg
                            </p>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No sets recorded.
                      </p>
                    )}
                  </div>
                ))}

                {workout.notes ? (
                  <p className="text-sm text-muted-foreground">{workout.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
            No workouts yet.
          </div>
        )}
      </section>
    </main>
  );
}