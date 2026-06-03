import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddTemplateExerciseForm } from "@/components/workouts/add-template-exercise-form";
import { loadPrBaselines } from "@/lib/pr-tracker";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Workout" };

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

  const [{ data: template, error: templateError }, { data: templateExercises }, { data: allExercises }] =
    await Promise.all([
      // Allow own templates AND public templates
      supabase
        .from("workout_templates")
        .select("id, name, description, user_id, is_public")
        .eq("id", id)
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .single(),
      supabase
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
          exercise_library:exercise_id (
            id,
            name,
            muscle_group,
            equipment
          )
        `)
        .eq("workout_template_id", id)
        .order("order_index"),
      supabase
        .from("exercise_library")
        .select("id, name, muscle_group, equipment")
        .order("name"),
    ]);

  if (templateError || !template) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">
          {templateError?.message || "Workout not found"}
        </p>
      </main>
    );
  }

  const isOwner = template.user_id === user.id;

  // --- PR baselines per exercise ---
  const exerciseIds: string[] = [];
  if (templateExercises) {
    for (const item of templateExercises as any[]) {
      const lib = Array.isArray(item.exercise_library)
        ? item.exercise_library[0]
        : item.exercise_library;
      if (lib?.id) exerciseIds.push(lib.id);
    }
  }

  const prBaselines = await loadPrBaselines(supabase, user.id, exerciseIds);
  const nextOrderIndex = (templateExercises?.length ?? 0) + 1;
  const exerciseList = allExercises ?? [];

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      {query?.message && (
        <div className="rounded-lg bg-muted px-4 py-3 text-sm">
          {decodeURIComponent(query.message)}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{template.name}</h1>
            {template.is_public && !isOwner && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                public
              </span>
            )}
          </div>
          {template.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {template.description}
            </p>
          )}
        </div>
        {(templateExercises?.length ?? 0) > 0 ? (
          <Link
            href={`/workouts/${id}/session`}
            className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Start workout
          </Link>
        ) : (
          <span className="shrink-0 rounded-xl bg-muted px-5 py-2.5 text-sm font-semibold text-muted-foreground cursor-not-allowed">
            Start workout
          </span>
        )}
      </div>

      {/* Exercise list */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Exercises</h2>

        {templateExercises && templateExercises.length > 0 ? (
          <div className="space-y-3">
            {(templateExercises as any[]).map((item) => {
              const lib = Array.isArray(item.exercise_library)
                ? item.exercise_library[0]
                : item.exercise_library;

              const baseline = lib?.id ? prBaselines.get(lib.id) : undefined;
              const hasPr = !!baseline;
              const best1rm = baseline
                ? Math.round(baseline.best_1rm * 10) / 10
                : null;

              return (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {item.order_index}. {lib?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lib?.muscle_group || "Unknown group"} &bull;{" "}
                        {lib?.equipment || "Unknown equipment"}
                      </p>
                    </div>

                    {hasPr && (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                          🏆 PR
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Best 1RM: {best1rm} kg
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {baseline!.best_weight_kg} kg &times; {baseline!.best_reps} reps
                        </span>
                      </div>
                    )}
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
                      <p className="font-medium">{item.target_rir ?? "-"}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-muted-foreground">Load increment</p>
                      <p className="font-medium">
                        {item.load_increment ? `${item.load_increment} kg` : "-"}
                      </p>
                    </div>
                  </div>

                  {item.notes ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {item.notes}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            No exercises added yet.
          </div>
        )}
      </section>

      {/* Add exercise — only for owners */}
      {isOwner && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Add exercise</h2>
          <AddTemplateExerciseForm
            workoutTemplateId={id}
            exercises={exerciseList}
            nextOrderIndex={nextOrderIndex}
          />
        </section>
      )}

      <div className="flex gap-3">
        <Link
          href="/workouts"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          &larr; Back to workouts
        </Link>
      </div>
    </main>
  );
}
