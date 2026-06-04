import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddTemplateExerciseForm } from "@/components/workouts/add-template-exercise-form";
import { loadPrBaselines } from "@/lib/pr-tracker";
import type { Metadata } from "next";
import { Play, ChevronLeft, Trophy, Globe, Plus, Dumbbell } from "lucide-react";

export const metadata: Metadata = { title: "Workout" };

// Muscle group → accent color
const MUSCLE_COLORS: Record<string, string> = {
  chest: "text-orange-400",
  back: "text-blue-400",
  legs: "text-emerald-400",
  shoulders: "text-purple-400",
  arms: "text-yellow-400",
  core: "text-rose-400",
  glutes: "text-emerald-400",
  hamstrings: "text-emerald-400",
  quads: "text-emerald-400",
  calves: "text-teal-400",
};

function getMuscleColor(group: string | null | undefined) {
  if (!group) return "text-muted-foreground";
  return MUSCLE_COLORS[group.toLowerCase()] ?? "text-muted-foreground";
}

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: template, error: templateError }, { data: templateExercises }, { data: allExercises }] =
    await Promise.all([
      supabase
        .from("workout_templates")
        .select("id, name, description, user_id, is_public")
        .eq("id", id)
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .single(),
      supabase
        .from("workout_template_exercises")
        .select(`id, order_index, target_sets, min_reps, max_reps, target_rir, load_increment, notes, exercise_library:exercise_id (id, name, muscle_group, equipment)`)
        .eq("workout_template_id", id)
        .order("order_index"),
      supabase.from("exercise_library").select("id, name, muscle_group, equipment").order("name"),
    ]);

  if (templateError || !template) {
    return (
      <main className="p-6">
        <p className="text-sm text-destructive">{templateError?.message || "Workout not found"}</p>
      </main>
    );
  }

  const isOwner = template.user_id === user.id;
  const exerciseIds: string[] = [];
  if (templateExercises) {
    for (const item of templateExercises as any[]) {
      const lib = Array.isArray(item.exercise_library) ? item.exercise_library[0] : item.exercise_library;
      if (lib?.id) exerciseIds.push(lib.id);
    }
  }

  const prBaselines = await loadPrBaselines(supabase, user.id, exerciseIds);
  const nextOrderIndex = (templateExercises?.length ?? 0) + 1;
  const exerciseList = allExercises ?? [];
  const hasExercises = (templateExercises?.length ?? 0) > 0;
  const totalSets = (templateExercises ?? []).reduce((sum: number, ex: any) => sum + (ex.target_sets ?? 0), 0);
  const muscleGroups = [...new Set((templateExercises ?? []).map((ex: any) => {
    const lib = Array.isArray(ex.exercise_library) ? ex.exercise_library[0] : ex.exercise_library;
    return lib?.muscle_group;
  }).filter(Boolean))];

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 md:p-6 page-enter">
      {query?.message && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {decodeURIComponent(query.message)}
        </div>
      )}

      {/* Back */}
      <Link href="/workouts" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to workouts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight">{template.name}</h1>
            {template.is_public && !isOwner && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Globe className="w-3 h-3" /> Public
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground">{template.description}</p>
          )}
          {/* Quick stats */}
          {hasExercises && (
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{templateExercises!.length}</span> exercises
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{totalSets}</span> total sets
              </span>
              {muscleGroups.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {muscleGroups.slice(0, 3).join(" · ")}{muscleGroups.length > 3 ? " +more" : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {hasExercises ? (
          <Link
            href={`/workouts/${id}/session`}
            className="inline-flex items-center gap-2 shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Play className="w-4 h-4" /> Start
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 shrink-0 rounded-xl bg-muted px-5 py-2.5 text-sm font-semibold text-muted-foreground cursor-not-allowed">
            <Play className="w-4 h-4" /> Start
          </span>
        )}
      </div>

      {/* Exercise list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Exercises</h2>

        {hasExercises ? (
          <div className="space-y-3">
            {(templateExercises as any[]).map((item) => {
              const lib = Array.isArray(item.exercise_library) ? item.exercise_library[0] : item.exercise_library;
              const baseline = lib?.id ? prBaselines.get(lib.id) : undefined;
              const hasPr = !!baseline;
              const best1rm = baseline ? Math.round(baseline.best_1rm * 10) / 10 : null;
              const muscleColor = getMuscleColor(lib?.muscle_group);

              return (
                <div key={item.id} className="rounded-2xl border border-border bg-card p-4 space-y-4">
                  {/* Exercise header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{item.order_index}</span>
                        <p className="font-semibold text-sm">{lib?.name}</p>
                      </div>
                      <p className={`text-xs font-medium ${muscleColor} pl-7`}>
                        {lib?.muscle_group || "—"}
                        <span className="text-muted-foreground font-normal"> · {lib?.equipment || "—"}</span>
                      </p>
                    </div>

                    {hasPr && (
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-400">
                          <Trophy className="w-3 h-3" /> PR
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">{best1rm} kg 1RM</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {baseline!.best_weight_kg} kg × {baseline!.best_reps}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stat tiles */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Sets", value: item.target_sets },
                      { label: "Reps", value: `${item.min_reps}–${item.max_reps}` },
                      { label: "RIR", value: item.target_rir ?? "—" },
                      { label: "Load +", value: item.load_increment ? `${item.load_increment} kg` : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl bg-muted/40 px-3 py-2.5 text-center">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
                        <p className="text-sm font-bold tabular-nums">{value}</p>
                      </div>
                    ))}
                  </div>

                  {item.notes && (
                    <p className="text-xs text-muted-foreground border-t border-border pt-3">{item.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center gap-3 text-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No exercises added yet.</p>
          </div>
        )}
      </section>

      {/* Add exercise — only for owners */}
      {isOwner && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Add exercise</h2>
          </div>
          <AddTemplateExerciseForm
            workoutTemplateId={id}
            exercises={exerciseList}
            nextOrderIndex={nextOrderIndex}
          />
        </section>
      )}
    </main>
  );
}
