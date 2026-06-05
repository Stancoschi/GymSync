import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayoutTemplate, Plus, ArrowLeft, Dumbbell, Clock } from "lucide-react";
import Link from "next/link";
import { StartWorkoutFromTemplateForm } from "@/components/workouts/start-workout-from-template-form";

export const metadata = { title: "Templates — GymSync" };

function formatRest(seconds: number) {
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m${seconds % 60 > 0 ? ` ${seconds % 60}s` : ""} rest`;
  return `${seconds}s rest`;
}

function TemplateCard({ template, isOwn }: { template: any; isOwn: boolean }) {
  const exercises = [...(template.template_exercises ?? [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );
  const totalSets = exercises.reduce((acc: number, ex: any) => acc + (ex.sets ?? 0), 0);
  const estMinutes = exercises.reduce((acc: number, ex: any) => {
    const restPerSet = ex.rest_seconds ?? 90;
    const timePerSet = 45 + restPerSet;
    return acc + (ex.sets ?? 3) * timePerSet;
  }, 0);
  const estDisplay = estMinutes >= 60
    ? `~${Math.round(estMinutes / 60)}h`
    : `~${Math.round(estMinutes / 60)}min`;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold leading-tight">{template.name}</h3>
                {template.is_public && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    public
                  </span>
                )}
                {isOwn && (
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">
                    mine
                  </span>
                )}
              </div>
              {template.description && (
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{template.description}</p>
              )}
            </div>
          </div>
          <StartWorkoutFromTemplateForm templateId={template.id} />
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Dumbbell className="w-3 h-3" />
            {exercises.length} exercises
          </span>
          <span className="text-border">·</span>
          <span>{totalSets} sets</span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {Math.round(estMinutes / 60)}min
          </span>
        </div>
      </div>

      {/* Exercise list */}
      <div className="border-t border-border">
        <ul className="divide-y divide-border/50">
          {exercises.map((ex: any, i: number) => (
            <li key={ex.id} className="flex items-center gap-3 px-5 py-2.5">
              <span className="text-xs font-mono text-muted-foreground/60 w-5 shrink-0">{i + 1}</span>
              <span className="flex-1 text-sm font-medium truncate">{ex.exercise_name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {ex.sets} × {ex.reps}
              </span>
              {ex.rest_seconds && (
                <span className="text-xs text-muted-foreground/60 shrink-0 hidden sm:inline">
                  {formatRest(ex.rest_seconds)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: templates, error } = await supabase
    .from("workout_templates")
    .select(`
      id, name, description, is_public, user_id,
      template_exercises (
        id, exercise_name, sets, reps, rest_seconds, notes, sort_order
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <p className="text-sm text-destructive">{error.message}</p>
      </main>
    );
  }

  const myTemplates = (templates ?? []).filter((t) => t.user_id === user.id);
  const publicTemplates = (templates ?? []).filter((t) => t.is_public && t.user_id !== user.id);

  return (
    <main className="p-4 md:p-6 max-w-2xl mx-auto space-y-8 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Training</p>
            <h1 className="text-xl font-extrabold tracking-tight">Templates</h1>
          </div>
        </div>
        <Link
          href="/workouts/templates/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New
        </Link>
      </div>

      {/* My templates */}
      {myTemplates.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">My templates</h2>
          <div className="space-y-3">
            {myTemplates.map((t) => (
              <TemplateCard key={t.id} template={t} isOwn={true} />
            ))}
          </div>
        </section>
      )}

      {/* Public programs */}
      {publicTemplates.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Public programs</h2>
          <div className="space-y-3">
            {publicTemplates.map((t) => (
              <TemplateCard key={t.id} template={t} isOwn={false} />
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {(templates ?? []).length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 flex flex-col items-center gap-3 text-center">
          <LayoutTemplate className="w-10 h-10 text-muted-foreground/30" />
          <div className="space-y-1">
            <p className="font-semibold">No templates yet</p>
            <p className="text-sm text-muted-foreground">Create your first template to get started.</p>
          </div>
          <Link
            href="/workouts/templates/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create template
          </Link>
        </div>
      )}
    </main>
  );
}
