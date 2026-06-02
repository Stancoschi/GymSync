import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Workouts" };

const PAGE_SIZE = 12;

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: templates, error, count } = await supabase
    .from("workout_templates")
    .select("id, name, description, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Last 4 completed workout sessions with template name
  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select("id, completed_at, duration_seconds, workout_templates(name)")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(4);

  if (error) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-6 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Training</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Workout Templates</h1>
          <p className="text-sm text-muted-foreground">
            Build reusable workouts with exercises, sets, reps and RIR targets.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard" className="rounded-md border px-3 py-2 text-sm hidden sm:inline-flex">Dashboard</Link>
          <Link href="/workouts/new" className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">+ New</Link>
        </div>
      </div>

      {/* Recent Workouts — Last 4 */}
      {recentSessions && recentSessions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">Recent</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recentSessions.map((s: any) => {
              const mins = s.duration_seconds ? Math.round(s.duration_seconds / 60) : null;
              const date = new Date(s.completed_at);
              const dateStr = date.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
              const templateName = s.workout_templates?.name ?? "Workout";
              return (
                <Link
                  key={s.id}
                  href={`/workouts/${s.id}/session/summary`}
                  className="group rounded-xl border bg-muted/30 p-4 space-y-2 hover:bg-muted/60 transition-colors"
                >
                  <p className="text-xs text-muted-foreground">{dateStr}</p>
                  <p className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{templateName}</p>
                  {mins && (
                    <p className="text-xs text-muted-foreground">{mins} min</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Templates Grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">Templates</h2>
        {templates && templates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template: any) => (
              <Link
                key={template.id}
                href={`/workouts/${template.id}`}
                className="rounded-2xl border p-5 transition hover:bg-muted/40 space-y-2"
              >
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {template.description || "No description yet."}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center space-y-2">
            <p className="text-2xl">🏋️</p>
            <p className="font-medium">No templates yet</p>
            <p className="text-sm text-muted-foreground">Create your first Push, Pull or Legs session.</p>
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link href={`/workouts?page=${page - 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              ← Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/workouts?page=${page + 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
