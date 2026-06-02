import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StartWorkoutFromTemplateForm } from "@/components/workouts/start-workout-from-template-form";

export const metadata = { title: "Workout Templates — GymSync" };

export default async function TemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: templates, error } = await supabase
    .from("workout_templates")
    .select(`
      id,
      name,
      description,
      is_public,
      user_id,
      template_exercises (
        id,
        exercise_name,
        sets,
        reps,
        rest_seconds,
        notes,
        sort_order
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">{error.message}</p>
      </main>
    );
  }

  const myTemplates = (templates ?? []).filter((t) => t.user_id === user.id);
  const publicTemplates = (templates ?? []).filter((t) => t.is_public && t.user_id !== user.id);

  return (
    <main className="p-6 space-y-8 max-w-2xl mx-auto">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Workouts</p>
        <h1 className="text-3xl font-semibold">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Selectează un template și începe antrenamentul instant.
        </p>
      </div>

      {myTemplates.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Ale mele</h2>
          {myTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </section>
      )}

      {publicTemplates.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Programe publice</h2>
          {publicTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </section>
      )}

      {(templates ?? []).length === 0 && (
        <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">
          Niciun template găsit. Adaugă primul tău workout template.
        </div>
      )}
    </main>
  );
}

function TemplateCard({ template }: { template: any }) {
  const exercises = [...(template.template_exercises ?? [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  return (
    <div className="rounded-2xl border p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{template.name}</h3>
            {template.is_public && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                public
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground">{template.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {exercises.length} exerciții
          </p>
        </div>
        <StartWorkoutFromTemplateForm templateId={template.id} />
      </div>

      <ul className="space-y-1">
        {exercises.map((ex: any, i: number) => (
          <li key={ex.id} className="flex items-baseline gap-3 text-sm">
            <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
            <span className="font-medium">{ex.exercise_name}</span>
            <span className="text-muted-foreground">
              {ex.sets} × {ex.reps}
            </span>
            {ex.rest_seconds && (
              <span className="text-muted-foreground text-xs">
                {ex.rest_seconds}s rest
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
