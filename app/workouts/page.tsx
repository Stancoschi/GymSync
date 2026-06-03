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

  // Fetch own templates
  const { data: myTemplates, error, count } = await supabase
    .from("workout_templates")
    .select("id, name, description, created_at, user_id, is_public", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  // Fetch public templates (Jeff Nippard etc.)
  const { data: publicTemplates } = await supabase
    .from("workout_templates")
    .select("id, name, description, created_at, user_id, is_public")
    .eq("is_public", true)
    .is("user_id", null)
    .order("name", { ascending: true });

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

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
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Training</p>
          <h1 className="text-3xl font-semibold">Workout templates</h1>
          <p className="text-sm text-muted-foreground">
            Build reusable workouts with exercises, sets, reps and RIR targets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm">Back to dashboard</Link>
          <Link href="/workouts/new" className="rounded-md bg-black px-4 py-2 text-sm text-white">New workout</Link>
        </div>
      </div>

      {/* Public / Program templates */}
      {publicTemplates && publicTemplates.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Programs</h2>
            <p className="text-sm text-muted-foreground">Ready-made programs you can start immediately.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {publicTemplates.map((template: any) => (
              <Link
                key={template.id}
                href={`/workouts/${template.id}`}
                className="rounded-2xl border p-5 transition hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">public</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {template.description || "No description yet."}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* My templates */}
      <section className="space-y-4">
        {(myTemplates?.length ?? 0) > 0 && (
          <h2 className="text-lg font-semibold">My workouts</h2>
        )}
        {myTemplates && myTemplates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {myTemplates.map((template: any) => (
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
