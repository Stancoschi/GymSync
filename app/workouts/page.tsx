import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShareWorkoutButton } from "@/components/workouts/share-workout-button";

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, title, workout_date, duration_minutes, is_shared_to_feed, share_message")
    .eq("user_id", user.id)
    .order("workout_date", { ascending: false });

  const { data: templates } = await supabase
    .from("workout_templates")
    .select("id, name, description")
    .or(`user_id.eq.${user.id},is_public.eq.true`)
    .order("name");

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {query?.message && (
        <div className="rounded-lg bg-muted px-4 py-3 text-sm">
          {decodeURIComponent(query.message)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Workouts</h1>
        <Link
          href="/workouts/new"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + New workout
        </Link>
      </div>

      {/* Workout history */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">History</h2>
        {workouts && workouts.length > 0 ? (
          <div className="space-y-2">
            {workouts.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 gap-3"
              >
                <Link href={`/workouts/${w.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{w.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(w.workout_date).toLocaleDateString("ro-RO", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {w.duration_minutes ? ` · ${w.duration_minutes} min` : ""}
                  </p>
                </Link>
                <ShareWorkoutButton
                  workoutId={w.id}
                  isShared={w.is_shared_to_feed ?? false}
                  workoutTitle={w.title}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
        )}
      </section>

      {/* Templates */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Templates</h2>
        {templates && templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/workouts/${t.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  {t.description && (
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  )}
                </div>
                <span className="text-muted-foreground text-sm ml-3 shrink-0">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No templates yet.</p>
        )}
      </section>
    </div>
  );
}
