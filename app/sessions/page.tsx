import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sessions" };

const PAGE_SIZE = 10;

export default async function SessionsPage({
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

  const { data: sessions, error, count } = await supabase
    .from("gym_sessions")
    .select(`id, title, scheduled_for, max_participants, notes, creator_id, gyms ( name, city )`, { count: "exact" })
    .order("scheduled_for", { ascending: true })
    .range(from, to);

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
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Social</p>
          <h1 className="text-3xl font-semibold">Gym sessions</h1>
          <p className="text-sm text-muted-foreground">Join or create gym sessions with your friends.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm">Back to dashboard</Link>
          <Link href="/sessions/new" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">New session</Link>
        </div>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session: any) => {
            const gym = Array.isArray(session.gyms) ? session.gyms[0] : session.gyms;
            const isCreator = session.creator_id === user.id;
            return (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="rounded-2xl border p-5 space-y-2 hover:bg-muted/40 transition-colors block"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{session.title}</h2>
                  {isCreator && (
                    <span className="text-xs rounded-md bg-primary/10 text-primary px-2 py-0.5 shrink-0">Creator</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.scheduled_for).toLocaleDateString("ro-RO", {
                    weekday: "short", day: "numeric", month: "short",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                {gym && (
                  <p className="text-sm text-muted-foreground">
                    {gym.name}{gym.city ? ` · ${gym.city}` : ""}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Max {session.max_participants} participants
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          No sessions yet. Create the first one!
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link href={`/sessions?page=${page - 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              ← Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/sessions?page=${page + 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
