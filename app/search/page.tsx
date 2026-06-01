import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SearchForm } from "@/components/search/search-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search" };

const MAX_RESULTS = 8;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const q = (params.q ?? "").trim();

  let users: { id: string; username: string | null; full_name: string | null; city: string | null }[] = [];
  let sessions: { id: string; title: string; scheduled_for: string; gyms: { name: string; city: string | null } | null }[] = [];
  let exercises: { id: string; name: string; muscle_group: string | null }[] = [];

  if (q.length >= 2) {
    const pattern = `%${q}%`;

    const [usersRes, sessionsRes, exercisesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, full_name, city")
        .or(`username.ilike.${pattern},full_name.ilike.${pattern}`)
        .neq("id", user.id)
        .limit(MAX_RESULTS),

      supabase
        .from("gym_sessions")
        .select("id, title, scheduled_for, gyms ( name, city )")
        .ilike("title", pattern)
        .gte("scheduled_for", new Date().toISOString())
        .order("scheduled_for", { ascending: true })
        .limit(MAX_RESULTS),

      supabase
        .from("exercises")
        .select("id, name, muscle_group")
        .ilike("name", pattern)
        .order("name", { ascending: true })
        .limit(MAX_RESULTS),
    ]);

    users = (usersRes.data ?? []) as typeof users;
    sessions = (sessionsRes.data ?? []) as typeof sessions;
    exercises = (exercisesRes.data ?? []) as typeof exercises;
  }

  const hasQuery = q.length >= 2;
  const hasResults = users.length > 0 || sessions.length > 0 || exercises.length > 0;

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Discover</p>
          <h1 className="text-3xl font-semibold">Search</h1>
          <p className="text-sm text-muted-foreground">Find users, sessions and exercises.</p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 rounded-md border px-4 py-2 text-sm hover:bg-muted/40 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Search input */}
      <SearchForm initialQ={q} />

      {/* Prompt */}
      {!hasQuery && (
        <div className="rounded-2xl border border-dashed p-10 text-center space-y-2">
          <p className="text-3xl">🔍</p>
          <p className="font-medium">Start typing to search</p>
          <p className="text-sm text-muted-foreground">Minimum 2 characters.</p>
        </div>
      )}

      {/* No results */}
      {hasQuery && !hasResults && (
        <div className="rounded-2xl border border-dashed p-10 text-center space-y-2">
          <p className="text-3xl">😶</p>
          <p className="font-medium">No results for &ldquo;{q}&rdquo;</p>
          <p className="text-sm text-muted-foreground">Try a different search term.</p>
        </div>
      )}

      {/* Users */}
      {users.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Users</h2>
          <ul className="space-y-2">
            {users.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/profile/${u.id}`}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                    {(u.full_name || u.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{u.full_name || u.username || "Unknown"}</p>
                    {u.username && (
                      <p className="text-xs text-muted-foreground">@{u.username}{u.city ? ` · ${u.city}` : ""}</p>
                    )}
                  </div>
                  <span className="ml-auto text-muted-foreground text-sm">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sessions */}
      {sessions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Upcoming Sessions</h2>
          <ul className="space-y-2">
            {sessions.map((s) => {
              const gym = Array.isArray(s.gyms) ? s.gyms[0] : s.gyms;
              return (
                <li key={s.id}>
                  <Link
                    href={`/sessions/${s.id}`}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0">
                      🏋️
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.scheduled_for).toLocaleDateString("ro-RO", {
                          weekday: "short", day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit",
                        })}
                        {gym ? ` · ${gym.name}` : ""}
                      </p>
                    </div>
                    <span className="ml-auto text-muted-foreground text-sm">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Exercises */}
      {exercises.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Exercises</h2>
          <ul className="space-y-2">
            {exercises.map((e) => (
              <li key={e.id}>
                <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm shrink-0">
                    💪
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{e.name}</p>
                    {e.muscle_group && (
                      <p className="text-xs text-muted-foreground capitalize">{e.muscle_group}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
