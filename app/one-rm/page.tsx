import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OneRMTable, type OneRMEntry } from "@/components/one-rm/one-rm-table";

function epley(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}
function brzycki(weight: number, reps: number) {
  return weight * (36 / (37 - reps));
}

export default async function OneRMPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 1. Get all completed sessions for the user
  const { data: userSessions } = await supabase
    .from("workout_sessions")
    .select("id, completed_at")
    .eq("user_id", user.id)
    .eq("status", "completed");

  const entries: OneRMEntry[] = [];

  if (userSessions && userSessions.length > 0) {
    const sessionIds = userSessions.map((s) => s.id);
    const sessionDateMap = new Map<string, string>(
      userSessions.map((s) => [s.id, s.completed_at as string])
    );

    // 2. Get all session exercises with exercise names
    const { data: wseRows } = await supabase
      .from("workout_session_exercises")
      .select("id, workout_session_id, exercise_library ( name )")
      .in("workout_session_id", sessionIds);

    if (wseRows && wseRows.length > 0) {
      const wseIds = wseRows.map((w) => w.id);
      const wseMetaMap = new Map<string, { exerciseName: string; completedAt: string }>();
      for (const wse of wseRows) {
        const exerciseName = Array.isArray(wse.exercise_library)
          ? (wse.exercise_library[0] as { name: string } | undefined)?.name
          : (wse.exercise_library as { name: string } | null)?.name;
        const completedAt = sessionDateMap.get(wse.workout_session_id as string);
        if (exerciseName && completedAt) {
          wseMetaMap.set(wse.id, { exerciseName, completedAt });
        }
      }

      // 3. Get all completed weighted set logs
      const { data: setLogs } = await supabase
        .from("workout_set_logs")
        .select("reps, weight_kg, workout_session_exercise_id")
        .in("workout_session_exercise_id", wseIds)
        .eq("completed", true)
        .not("weight_kg", "is", null)
        .not("reps", "is", null);

      if (setLogs && setLogs.length > 0) {
        // Aggregate per exercise: best set by Epley 1RM, total sets, last date
        const exerciseMap = new Map<
          string,
          { bestWeight: number; bestReps: number; best1RM: number; totalSets: number; lastPerformed: string }
        >();

        for (const set of setLogs) {
          const meta = wseMetaMap.get(set.workout_session_exercise_id as string);
          if (!meta) continue;
          const reps = Number(set.reps);
          const weight = Number(set.weight_kg);
          if (!reps || !weight || reps > 36) continue; // Brzycki breaks at reps >= 37

          const estimated = epley(weight, reps);
          const existing = exerciseMap.get(meta.exerciseName);

          if (!existing || estimated > existing.best1RM) {
            exerciseMap.set(meta.exerciseName, {
              bestWeight: weight,
              bestReps: reps,
              best1RM: estimated,
              totalSets: (existing?.totalSets ?? 0) + 1,
              lastPerformed: meta.completedAt,
            });
          } else {
            existing.totalSets++;
            if (new Date(meta.completedAt) > new Date(existing.lastPerformed)) {
              existing.lastPerformed = meta.completedAt;
            }
          }
        }

        for (const [exerciseName, data] of exerciseMap) {
          entries.push({
            exerciseName,
            bestWeight: data.bestWeight,
            bestReps: data.bestReps,
            epley1RM: epley(data.bestWeight, data.bestReps),
            brzycki1RM: brzycki(data.bestWeight, data.bestReps),
            totalSets: data.totalSets,
            lastPerformed: data.lastPerformed,
          });
        }

        entries.sort((a, b) => b.epley1RM - a.epley1RM);
      }
    }
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">1RM Calculator</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Estimated one-rep max from your best logged sets. Switch formulas to compare.
        </p>
      </div>

      {/* Info callout */}
      <div className="rounded-2xl border border-primary/20 bg-accent/40 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">How it works:</strong> Each formula uses your best set (weight × reps) per exercise.
        Epley: <code className="bg-muted rounded px-1">w × (1 + r/30)</code> &nbsp;·&nbsp;
        Brzycki: <code className="bg-muted rounded px-1">w × 36/(37−r)</code> &nbsp;·&nbsp;
        Lander: <code className="bg-muted rounded px-1">(100w)/(101.3−2.67r)</code> &nbsp;·&nbsp;
        Lombardi: <code className="bg-muted rounded px-1">w × r^0.1</code>.
        Expand any exercise to see training percentages (60–100% of 1RM).
      </div>

      <OneRMTable entries={entries} />
    </div>
  );
}
