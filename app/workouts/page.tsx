import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShareWorkoutButton } from "@/components/workouts/share-workout-button";
import { Plus, History, LayoutTemplate, Clock, ChevronRight, Share2 } from "lucide-react";

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    <main className="p-4 md:p-6 space-y-8 page-enter pb-24 md:pb-6">
      {query?.message && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {decodeURIComponent(query.message)}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Training</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Workouts</h1>
        </div>
        <Link
          href="/workouts/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New workout
        </Link>
      </div>

      {/* Workout history */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">History</h2>
        </div>

        {workouts && workouts.length > 0 ? (
          <div className="space-y-2">
            {workouts.map((w) => (
              <div
                key={w.id}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <Link href={`/workouts/${w.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{w.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {new Date(w.workout_date).toLocaleDateString("ro-RO", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    {w.duration_minutes && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {w.duration_minutes} min
                      </span>
                    )}
                    {w.is_shared_to_feed && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <Share2 className="w-3 h-3" />
                        Shared
                      </span>
                    )}
                  </div>
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
          <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center gap-3 text-center">
            <History className="w-8 h-8 text-muted-foreground/30" />
            <div className="space-y-1">
              <p className="text-sm font-medium">No workouts logged yet</p>
              <p className="text-sm text-muted-foreground">Start a session from a template below.</p>
            </div>
          </div>
        )}
      </section>

      {/* Templates */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Templates</h2>
        </div>

        {templates && templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/workouts/${t.id}`}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{t.name}</p>
                  {t.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-3 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No templates yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}
