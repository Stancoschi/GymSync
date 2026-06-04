import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddSetLogForm } from "@/components/sessions/add-set-log-form";
import { CompleteSessionForm } from "@/components/sessions/complete-session-form";
import { CheckCircle2, Dumbbell, ChevronLeft, Clock, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";

function getRecommendedNextLoad(params: {
  latestWeight: number | null;
  minReps: number | null;
  maxReps: number | null;
  loadIncrement: number | null;
  setLogs: Array<{ reps: number | null; weight_kg: number | null; rir: number | null }>;
}) {
  const { latestWeight, minReps, maxReps, loadIncrement, setLogs } = params;
  if (!latestWeight || !maxReps || !loadIncrement || setLogs.length === 0) return null;
  const completedSets = setLogs.filter((s) => s.weight_kg !== null || s.reps !== null);
  if (completedSets.length === 0) return null;
  const allAtOrAboveTopRange = completedSets.every((s) => (s.reps ?? 0) >= maxReps);
  const avgRir = completedSets.reduce((sum, s) => sum + (s.rir ?? 0), 0) / completedSets.length;
  if (allAtOrAboveTopRange && avgRir >= 1 && avgRir <= 3) {
    return { type: "increase" as const, nextWeight: Number((latestWeight + loadIncrement).toFixed(2)), message: `Increase to ${Number((latestWeight + loadIncrement).toFixed(2))} kg next time` };
  }
  const withinRange = completedSets.every((s) => (s.reps ?? 0) >= (minReps ?? 0));
  if (withinRange) return { type: "hold" as const, nextWeight: latestWeight, message: `Keep ${latestWeight} kg — try to add reps` };
  return { type: "repeat" as const, nextWeight: latestWeight, message: `Repeat ${latestWeight} kg until reps and RIR improve` };
}

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select(`id, user_id, status, started_at, completed_at, workout_templates!workout_sessions_workout_template_id_fkey (id, name)`)
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return (
      <main className="p-6">
        <p className="text-sm text-destructive">{sessionError?.message || "Session not found"}</p>
      </main>
    );
  }

  const { data: sessionExercises, error: sessionExercisesError } = await supabase
    .from("workout_session_exercises")
    .select(`id, exercise_id, order_index, target_sets, min_reps, max_reps, target_rir, load_increment, exercise_library (id, name, muscle_group, equipment)`)
    .eq("workout_session_id", sessionId)
    .order("order_index", { ascending: true });

  if (sessionExercisesError) {
    return <main className="p-6"><p className="text-sm text-destructive">{sessionExercisesError.message}</p></main>;
  }

  const sessionExerciseIds = (sessionExercises ?? []).map((item: any) => item.id);
  const { data: setLogs, error: setLogsError } = sessionExerciseIds.length > 0
    ? await supabase.from("workout_set_logs").select("id, workout_session_exercise_id, set_number, reps, weight_kg, rir").in("workout_session_exercise_id", sessionExerciseIds).order("set_number", { ascending: true })
    : { data: [], error: null };

  if (setLogsError) return <main className="p-6"><p className="text-sm text-destructive">{setLogsError.message}</p></main>;

  const logsMap = new Map<string, Array<{ id: string; set_number: number; reps: number | null; weight_kg: number | null; rir: number | null }>>();
  for (const log of setLogs ?? []) {
    const key = (log as any).workout_session_exercise_id;
    logsMap.set(key, [...(logsMap.get(key) ?? []), log as any]);
  }

  const templateName = (session.workout_templates as any)?.name || "Workout session";
  const isCompleted = session.status === "completed";
  const startedAt = new Date(session.started_at);
  const completedAt = session.completed_at ? new Date(session.completed_at) : null;
  const totalExercises = (sessionExercises ?? []).length;
  const totalSetsLogged = [...logsMap.values()].reduce((sum, logs) => sum + logs.length, 0);
  const totalSetsTarget = (sessionExercises ?? []).reduce((sum: number, ex: any) => sum + (ex.target_sets ?? 0), 0);

  return (
    <main className="p-4 md:p-6 space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link href="/workouts" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to workouts
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">{templateName}</h1>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Started {startedAt.toLocaleString("ro-RO", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {completedAt && ` · Finished ${completedAt.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
        </div>

        {!isCompleted && <CompleteSessionForm sessionId={sessionId} />}
      </div>

      {/* Progress bar */}
      {!isCompleted && totalSetsTarget > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Sets logged</span>
            <span className="tabular-nums font-medium">{totalSetsLogged} / {totalSetsTarget}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.round((totalSetsLogged / totalSetsTarget) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Flash message */}
      {query?.message && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {query.message}
        </div>
      )}

      {/* Exercises */}
      <section className="space-y-5">
        {(sessionExercises ?? []).length > 0 ? (
          sessionExercises!.map((exercise: any) => {
            const logs = logsMap.get(exercise.id) ?? [];
            const loggedCount = logs.length;
            const targetSets = exercise.target_sets ?? 0;
            const isExerciseDone = loggedCount >= targetSets && targetSets > 0;
            const latestWeight = logs.map((l) => l.weight_kg).filter((v): v is number => v !== null).at(-1) ?? null;
            const recommendation = getRecommendedNextLoad({
              latestWeight,
              minReps: exercise.min_reps,
              maxReps: exercise.max_reps,
              loadIncrement: exercise.load_increment,
              setLogs: logs,
            });

            const recIcon = recommendation?.type === "increase" ? TrendingUp
              : recommendation?.type === "hold" ? Minus
              : recommendation?.type === "repeat" ? TrendingDown
              : null;
            const RecIcon = recIcon;
            const recColor = recommendation?.type === "increase" ? "text-emerald-400"
              : recommendation?.type === "hold" ? "text-yellow-400"
              : "text-rose-400";

            return (
              <div key={exercise.id} className={`rounded-2xl border bg-card p-5 space-y-4 transition-all duration-300 ${isExerciseDone ? "border-emerald-500/30" : "border-border"}` }>
                {/* Exercise header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{exercise.order_index}</span>
                      <h2 className="text-base font-semibold">{exercise.exercise_library?.name}</h2>
                      {isExerciseDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {exercise.exercise_library?.muscle_group || "—"} · {exercise.exercise_library?.equipment || "—"}
                    </p>
                  </div>

                  {/* Targets */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Sets</p>
                      <p className="text-sm font-semibold tabular-nums">{loggedCount}/{targetSets}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Reps</p>
                      <p className="text-sm font-semibold tabular-nums">{exercise.min_reps}–{exercise.max_reps}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">RIR</p>
                      <p className="text-sm font-semibold tabular-nums">{exercise.target_rir ?? "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                {recommendation ? (
                  <div className={`flex items-start gap-2.5 rounded-xl bg-muted/40 border border-border px-3.5 py-3 text-sm`}>
                    {RecIcon && <RecIcon className={`w-4 h-4 mt-0.5 shrink-0 ${recColor}`} />}
                    <div>
                      <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Next session</p>
                      <p className={`text-sm font-medium ${recColor}`}>{recommendation.message}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-muted/30 border border-border px-3.5 py-3 text-xs text-muted-foreground">
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    Log your sets to unlock a recommendation for next session.
                  </div>
                )}

                {/* Set log rows */}
                <div className="space-y-2">
                  {Array.from({ length: targetSets }).map((_, index) => {
                    const setNumber = index + 1;
                    const existingSet = logs.find((l) => l.set_number === setNumber);
                    return (
                      <AddSetLogForm
                        key={setNumber}
                        sessionId={sessionId}
                        workoutSessionExerciseId={exercise.id}
                        setNumber={setNumber}
                        defaultReps={existingSet?.reps ?? null}
                        defaultWeight={existingSet?.weight_kg ?? null}
                        defaultRir={existingSet?.rir ?? null}
                        isLogged={!!existingSet}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center gap-3 text-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No exercises found in this session.</p>
          </div>
        )}
      </section>

      {/* Bottom complete button (sticky on mobile) */}
      {!isCompleted && (
        <div className="sticky bottom-4 flex justify-center pt-4">
          <CompleteSessionForm sessionId={sessionId} variant="large" />
        </div>
      )}
    </main>
  );
}
