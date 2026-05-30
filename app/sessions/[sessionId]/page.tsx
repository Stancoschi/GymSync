import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddSetLogForm } from "@/components/sessions/add-set-log-form";
import { CompleteSessionForm } from "@/components/sessions/complete-session-form";

function getRecommendedNextLoad(params: {
  latestWeight: number | null;
  minReps: number | null;
  maxReps: number | null;
  loadIncrement: number | null;
  setLogs: Array<{ reps: number | null; weight_kg: number | null; rir: number | null }>;
}) {
  const { latestWeight, minReps, maxReps, loadIncrement, setLogs } = params;

  if (!latestWeight || !maxReps || !loadIncrement || setLogs.length === 0) {
    return null;
  }

  const completedSets = setLogs.filter(
    (set) => set.weight_kg !== null || set.reps !== null
  );

  if (completedSets.length === 0) {
    return null;
  }

  const allAtOrAboveTopRange = completedSets.every(
    (set) => (set.reps ?? 0) >= maxReps
  );

  const avgRir =
    completedSets.reduce((sum, set) => sum + (set.rir ?? 0), 0) / completedSets.length;

  if (allAtOrAboveTopRange && avgRir >= 1 && avgRir <= 3) {
    return {
      type: "increase",
      nextWeight: Number((latestWeight + loadIncrement).toFixed(2)),
      message: `Increase next time to ${Number(
        (latestWeight + loadIncrement).toFixed(2)
      )} kg`,
    };
  }

  const withinRange = completedSets.every(
    (set) => (set.reps ?? 0) >= (minReps ?? 0)
  );

  if (withinRange) {
    return {
      type: "hold",
      nextWeight: latestWeight,
      message: `Keep ${latestWeight} kg and try to add reps next session`,
    };
  }

  return {
    type: "repeat",
    nextWeight: latestWeight,
    message: `Repeat ${latestWeight} kg until reps and RIR improve`,
  };
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select(`
      id,
      user_id,
      status,
      started_at,
      completed_at,
      workout_templates (
        id,
        name
      )
    `)
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">
          {sessionError?.message || "Session not found"}
        </p>
      </main>
    );
  }

  const { data: sessionExercises, error: sessionExercisesError } = await supabase
    .from("workout_session_exercises")
    .select(`
      id,
      exercise_id,
      order_index,
      target_sets,
      min_reps,
      max_reps,
      target_rir,
      load_increment,
      exercise_library (
        id,
        name,
        muscle_group,
        equipment
      )
    `)
    .eq("workout_session_id", sessionId)
    .order("order_index", { ascending: true });

  if (sessionExercisesError) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">{sessionExercisesError.message}</p>
      </main>
    );
  }

  const sessionExerciseIds = (sessionExercises ?? []).map((item: any) => item.id);

  const { data: setLogs, error: setLogsError } =
    sessionExerciseIds.length > 0
      ? await supabase
          .from("workout_set_logs")
          .select("id, workout_session_exercise_id, set_number, reps, weight_kg, rir")
          .in("workout_session_exercise_id", sessionExerciseIds)
          .order("set_number", { ascending: true })
      : { data: [], error: null };

  if (setLogsError) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">{setLogsError.message}</p>
      </main>
    );
  }

  const logsMap = new Map<
    string,
    Array<{
      id: string;
      set_number: number;
      reps: number | null;
      weight_kg: number | null;
      rir: number | null;
    }>
  >();

  for (const log of setLogs ?? []) {
    const key = (log as any).workout_session_exercise_id;
    logsMap.set(key, [...(logsMap.get(key) ?? []), log as any]);
  }

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Live session
          </p>
          <h1 className="text-3xl font-semibold">
            {(session.workout_templates as any)?.name || "Workout session"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Status: {session.status} • Started {new Date(session.started_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/workouts" className="rounded-md border px-4 py-2 text-sm">
            Back to workouts
          </Link>
          {session.status !== "completed" ? (
            <CompleteSessionForm sessionId={sessionId} />
          ) : null}
        </div>
      </div>

      {query?.message ? (
        <div className="rounded-xl border px-4 py-3 text-sm">{query.message}</div>
      ) : null}

      <section className="space-y-6">
        {(sessionExercises ?? []).length > 0 ? (
          sessionExercises.map((exercise: any) => {
            const logs = logsMap.get(exercise.id) ?? [];
            const latestWeight =
              logs
                .map((log) => log.weight_kg)
                .filter((value): value is number => value !== null)
                .at(-1) ?? null;

            const recommendation = getRecommendedNextLoad({
              latestWeight,
              minReps: exercise.min_reps,
              maxReps: exercise.max_reps,
              loadIncrement: exercise.load_increment,
              setLogs: logs,
            });

            const targetSets = exercise.target_sets ?? 0;

            return (
              <div key={exercise.id} className="rounded-2xl border p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">
                      {exercise.order_index}. {exercise.exercise_library?.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {(exercise.exercise_library as any)?.muscle_group || "Unknown group"} •{" "}
                      {(exercise.exercise_library as any)?.equipment || "Unknown equipment"}
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p>{exercise.target_sets} sets</p>
                    <p>
                      {exercise.min_reps}-{exercise.max_reps} reps
                    </p>
                    <p>RIR target: {exercise.target_rir ?? "-"}</p>
                  </div>
                </div>

                {recommendation ? (
                  <div className="rounded-xl bg-muted/40 p-4 text-sm">
                    <p className="font-medium">Next workout suggestion</p>
                    <p className="text-muted-foreground">{recommendation.message}</p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                    Log your sets to unlock a recommendation for next time.
                  </div>
                )}

                <div className="space-y-3">
                  {Array.from({ length: targetSets }).map((_, index) => {
                    const setNumber = index + 1;
                    const existingSet = logs.find((log) => log.set_number === setNumber);

                    return (
                      <AddSetLogForm
                        key={setNumber}
                        sessionId={sessionId}
                        workoutSessionExerciseId={exercise.id}
                        setNumber={setNumber}
                        defaultReps={existingSet?.reps ?? null}
                        defaultWeight={existingSet?.weight_kg ?? null}
                        defaultRir={existingSet?.rir ?? null}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
            No exercises found in this session.
          </div>
        )}
      </section>
    </main>
  );
}