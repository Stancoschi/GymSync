import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { Users, Plus, MapPin, Calendar, ChevronLeft, ChevronRight, Crown } from "lucide-react";

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
        <p className="text-sm text-destructive">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-6 space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Social</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Gym Sessions</h1>
          <p className="text-sm text-muted-foreground">Join or create gym sessions with your friends.</p>
        </div>
        <Link
          href="/sessions/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New session
        </Link>
      </div>

      {/* Session cards */}
      {sessions && sessions.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {sessions.map((session: any) => {
            const gym = Array.isArray(session.gyms) ? session.gyms[0] : session.gyms;
            const isCreator = session.creator_id === user.id;
            const date = new Date(session.scheduled_for);
            const isUpcoming = date > new Date();
            return (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="group rounded-2xl border border-border bg-card hover:bg-muted/30 p-5 space-y-3 transition-all hover:shadow-md block"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold group-hover:text-primary transition-colors">{session.title}</h2>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCreator && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        <Crown className="w-3 h-3" /> Creator
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{date.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  {gym && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{gym.name}{gym.city ? ` · ${gym.city}` : ""}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Max {session.max_participants} participants</span>
                  </div>
                </div>

                {session.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border pt-2.5">{session.notes}</p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No sessions yet</p>
            <p className="text-sm text-muted-foreground">Create the first one and invite your gym friends.</p>
          </div>
          <Link
            href="/sessions/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create session
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link href={`/sessions?page=${page - 1}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" /> Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground tabular-nums px-2">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/sessions?page=${page + 1}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
