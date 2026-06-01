import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Session Summary" };

export default async function SessionSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string; prs?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const sessionId = sp.session_id;
  const newPrs = sp.prs ? sp.prs.split(",").filter(Boolean) : [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  if (!sessionId) redirect(`/workouts/${id}`);

  // Load session data
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, completed_at, duration_seconds, workout_template_id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) redirect(`/workouts/${id}`);

  // Load sets for this session
  const { data: sessionExercises } = await supabase
    .from("workout_session_exercises")
    .select(`
      id,
      exercise_id,
      exercise_library ( name, muscle_group ),
      workout_set_logs ( set_number, reps, weight_kg, rir )
    `)
    .eq("workout_session_id", sessionId)
    .order("order_index", { ascending: true });

  // Compute totals
  let totalSets = 0;
  let totalVolume = 0;
  for (const ex of sessionExercises ?? []) {
    const logs = Array.isArray(ex.workout_set_logs) ? ex.workout_set_logs : [];
    totalSets += logs.length;
    for (const s of logs) {
      if (s.weight_kg && s.reps) totalVolume += Number(s.weight_kg) * Number(s.reps);
    }
  }

  const durationMin = session.duration_seconds ? Math.round(session.duration_seconds / 60) : 0;

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-5xl">🎉</p>
        <h1 className="text-3xl font-bold">Workout done!</h1>
        <p className="text-muted-foreground text-sm">
          {session.completed_at
            ? new Date(session.completed_at).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })
            : "Today"}
        </p>
      </div>

      {/* New PRs */}
      {newPrs.length > 0 && (
        <div className="rounded-2xl border border-yellow-400/40 bg-yellow-50 dark:bg-yellow-950/20 p-5 space-y-3">
          <h2 className="font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
            <span>🏆</span> New Personal Records!
          </h2>
          <ul className="space-y-1">
            {newPrs.map((pr) => (
              <li key={pr} className="text-sm font-medium text-yellow-800 dark:text-yellow-300">• {pr}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: "Duration", value: `${durationMin} min` },
          { label: "Total sets", value: `${totalSets}` },
          { label: "Volume", value: `${totalVolume.toFixed(0)} kg` },
        ]).map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-card p-4 text-center space-y-1">
            <p className="text-2xl font-bold tabular-nums text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Exercise breakdown */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Exercise breakdown</h2>
        {(sessionExercises ?? []).map((ex: any) => {
          const name = Array.isArray(ex.exercise_library) ? ex.exercise_library[0]?.name : ex.exercise_library?.name;
          const logs = Array.isArray(ex.workout_set_logs) ? ex.workout_set_logs : [];
          return (
            <div key={ex.id} className="rounded-xl border px-4 py-3 space-y-2">
              <p className="font-medium">{name}</p>
              <div className="space-y-1">
                {logs.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="w-6 text-center font-mono text-xs">#{s.set_number}</span>
                    <span>{s.weight_kg} kg × {s.reps} reps</span>
                    {s.rir !== null && <span className="ml-auto text-xs">RIR {s.rir}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/dashboard" className="flex-1 rounded-xl border px-4 py-3 text-sm text-center hover:bg-muted/40 transition-colors">
          ← Dashboard
        </Link>
        <Link href={`/workouts/${id}`} className="flex-1 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm text-center font-medium hover:opacity-90 transition-opacity">
          Workout details
        </Link>
      </div>
    </main>
  );
}
