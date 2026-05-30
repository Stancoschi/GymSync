import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddTemplateExerciseForm } from "@/components/workouts/add-template-exercise-form";

export default async function WorkoutTemplateDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .select("id, name, description, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (templateError || !template) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">
          {templateError?.message || "Workout not found"}
        </p>
      </main>
    );
  }

  const { data: templateExercises, error: exercisesError } = await supabase
    .from("workout_template_exercises")
    .select(`
      id,
      order_index,
      target_sets,
      min_reps,
      max_reps,
      target_rir,
      load_increment,
      notes,
      exercise_library (
        id,
        name,
        muscle_group,
        equipment
      )
    `)
    .eq("workout_template_id", id)
    .order("order_index", { ascending: true });

  const { data: exerciseLibrary, error: libraryError } = await supabase
    .from("exercise_library")
    .select("id, name, muscle_group, equipment")
    .order("name", { ascending: true });

  if (exercisesError || libraryError) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">
          {exercisesError?.message || libraryError?.message}
        </p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Training
          </p>
          <h1 className="text-3xl font-semibold">{template.name}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {template.description || "No description yet."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/workouts" className="rounded-md border px-4 py-2 text-sm">
            Back to workouts
          </Link>
          <Link href={`/workouts/${id}/start`} className="rounded-md bg-black px-4 py-2 text-sm text-white">
  Start workout
</Link>
        </div>
      </div>

      {query?.message ? (
        <div className="rounded-xl border px-4 py-3 text-sm">{query.message}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border p-5 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Exercises</h2>
            <p className="text-sm text-muted-foreground">
              Ordered list of exercises and target execution details.
            </p>
          </div>

          {templateExercises && templateExercises.length > 0 ? (
            <div className="space-y-3">
              {templateExercises.map((item: any) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {item.order_index}. {item.exercise_library?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.exercise_library?.muscle_group || "Unknown group"} •{" "}
                        {item.exercise_library?.equipment || "Unknown equipment"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-4 text-sm">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-muted-foreground">Sets</p>
                      <p className="font-medium">{item.target_sets}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-muted-foreground">Reps</p>
                      <p className="font-medium">
                        {item.min_reps}-{item.max_reps}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-muted-foreground">Target RIR</p>
                      <p className="font-medium">
                        {item.target_rir ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-muted-foreground">Load increment</p>
                      <p className="font-medium">
                        {item.load_increment ? `${item.load_increment} kg` : "-"}
                      </p>
                    </div>
                  </div>

                  {item.notes ? (
                    <p className="mt-3 text-sm text-muted-foreground">{item.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              No exercises added yet.
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-5">
          <h2 className="text-xl font-semibold">Add exercise</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Choose an exercise and define target sets, rep range and RIR.
          </p>

          <AddTemplateExerciseForm
            workoutTemplateId={id}
            exercises={exerciseLibrary ?? []}
            nextOrderIndex={(templateExercises?.length ?? 0) + 1}
          />
        </div>
      </section>
    </main>
  );
}