import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { WorkoutHistorySection } from "@/components/workouts/workout-history-section";
import { TemplatesSection } from "@/components/workouts/templates-section";

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
    .select("id, name, description, is_pinned")
    .or(`user_id.eq.${user.id},is_public.eq.true`)
    .order("is_pinned", { ascending: false })
    .order("name");

  return (
    <main className="p-4 md:p-6 space-y-8 page-enter pb-28 md:pb-6">
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

      {/* Templates first */}
      <TemplatesSection templates={templates ?? []} />

      {/* History below */}
      <WorkoutHistorySection workouts={workouts ?? []} />
    </main>
  );
}
