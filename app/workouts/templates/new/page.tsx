import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createWorkoutTemplate } from "@/app/workouts/actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewTemplatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .order("name");

  return (
    <main className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/workouts"
          className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Templates</p>
          <h1 className="text-xl font-extrabold tracking-tight">New template</h1>
        </div>
      </div>

      {/* Form */}
      <form action={createWorkoutTemplate} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Template name <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Push A — Chest & Shoulders"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Chest, shoulders, triceps focus — hypertrophy block"
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/workouts"
            className="flex-1 rounded-xl border border-border py-2.5 text-center text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create template
          </button>
        </div>
      </form>
    </main>
  );
}
