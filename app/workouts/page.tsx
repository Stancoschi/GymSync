import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WorkoutsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: templates, error } = await supabase
    .from("workout_templates")
    .select("id, name, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Training
          </p>
          <h1 className="text-3xl font-semibold">Workout templates</h1>
          <p className="text-sm text-muted-foreground">
            Build reusable workouts with exercises, sets, reps and RIR targets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm">
            Back to dashboard
          </Link>
          <Link href="/workouts/new" className="rounded-md bg-black px-4 py-2 text-sm text-white">
            New workout
          </Link>
        </div>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template: any) => (
            <Link
              key={template.id}
              href={`/workouts/${template.id}`}
              className="rounded-2xl border p-5 transition hover:bg-muted/40"
            >
              <h2 className="text-xl font-semibold">{template.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {template.description || "No description yet."}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          No workout templates yet. Create your first Push, Pull or Legs session.
        </div>
      )}
    </main>
  );
}