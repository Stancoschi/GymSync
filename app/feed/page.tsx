import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReactionButton } from "@/components/feed/reaction-button";
import { CommentForm } from "@/components/feed/comment-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Feed" };

const PAGE_SIZE = 15;

type FeedComment = {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_username: string | null;
};

type FeedItem = {
  id: string;
  type: "workout" | "session";
  created_at: string;
  actor_name: string;
  actor_username: string | null;
  title: string;
  subtitle: string;
  reaction_count: number;
  reacted_by_me: boolean;
  comments: FeedComment[];
};

export default async function FeedPage({
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

  const { data: friendships, error: friendshipsError } = await supabase
    .from("friendships")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  if (friendshipsError) {
    return <main className="p-6"><p className="text-sm text-red-600">{friendshipsError.message}</p></main>;
  }

  const friendIds = (friendships ?? []).map((f: any) =>
    f.user_a_id === user.id ? f.user_b_id : f.user_a_id
  );

  if (friendIds.length === 0) {
    return (
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Feed</h1>
            <p className="text-sm text-muted-foreground">Recent activity from your friends.</p>
          </div>
          <Link href="/friends" className="rounded-md border px-4 py-2 text-sm">Find friends →</Link>
        </div>
        <div className="rounded-2xl border p-8 text-center space-y-2">
          <p className="text-2xl">👥</p>
          <p className="font-medium">Your feed is empty</p>
          <p className="text-sm text-muted-foreground">Add friends to see their workouts and sessions here.</p>
        </div>
      </main>
    );
  }

  const { data: friendProfiles } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", friendIds);

  const profileMap = new Map(
    (friendProfiles ?? []).map((p: any) => [p.id, p])
  );

  // Paginated workouts + sessions in parallel
  const [workoutsResult, sessionsResult] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, user_id, title, workout_date, duration_minutes, created_at", { count: "exact" })
      .in("user_id", friendIds)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("gym_sessions")
      .select(`id, creator_id, title, scheduled_for, created_at, gyms ( name, city )`, { count: "exact" })
      .in("creator_id", friendIds)
      .order("created_at", { ascending: false })
      .range(from, to),
  ]);

  const workouts = workoutsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];

  // Rough total for pagination — sum of both counts, divide by page size
  const totalItems = (workoutsResult.count ?? 0) + (sessionsResult.count ?? 0);
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const workoutIds = workouts.map((w: any) => w.id);
  const sessionIds = sessions.map((s: any) => s.id);

  const [wReactions, sReactions, wComments, sComments] = await Promise.all([
    workoutIds.length > 0
      ? supabase.from("workout_reactions").select("id, workout_id, user_id").in("workout_id", workoutIds)
      : Promise.resolve({ data: [] }),
    sessionIds.length > 0
      ? supabase.from("session_reactions").select("id, session_id, user_id").in("session_id", sessionIds)
      : Promise.resolve({ data: [] }),
    workoutIds.length > 0
      ? supabase.from("workout_comments").select("id, workout_id, user_id, content, created_at").in("workout_id", workoutIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    sessionIds.length > 0
      ? supabase.from("session_comments").select("id, session_id, user_id, content, created_at").in("session_id", sessionIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const commentAuthorIds = Array.from(new Set([
    ...(wComments.data ?? []).map((c: any) => c.user_id),
    ...(sComments.data ?? []).map((c: any) => c.user_id),
  ]));
  const { data: commentAuthors } = commentAuthorIds.length > 0
    ? await supabase.from("profiles").select("id, username, full_name").in("id", commentAuthorIds)
    : { data: [] };
  const authorMap = new Map((commentAuthors ?? []).map((a: any) => [a.id, a]));

  function buildComments(rows: any[], idKey: string): Map<string, FeedComment[]> {
    const map = new Map<string, FeedComment[]>();
    for (const c of rows ?? []) {
      const author = authorMap.get(c.user_id);
      const item: FeedComment = {
        id: c.id, content: c.content, created_at: c.created_at,
        author_name: author?.full_name || author?.username || "Unknown",
        author_username: author?.username || null,
      };
      map.set(c[idKey], [...(map.get(c[idKey]) ?? []), item]);
    }
    return map;
  }

  const wReactionCount = new Map<string, number>();
  const wReactedByMe = new Set<string>();
  for (const r of wReactions.data ?? []) {
    wReactionCount.set((r as any).workout_id, (wReactionCount.get((r as any).workout_id) ?? 0) + 1);
    if ((r as any).user_id === user.id) wReactedByMe.add((r as any).workout_id);
  }
  const sReactionCount = new Map<string, number>();
  const sReactedByMe = new Set<string>();
  for (const r of sReactions.data ?? []) {
    sReactionCount.set((r as any).session_id, (sReactionCount.get((r as any).session_id) ?? 0) + 1);
    if ((r as any).user_id === user.id) sReactedByMe.add((r as any).session_id);
  }

  const wCommentsMap = buildComments(wComments.data ?? [], "workout_id");
  const sCommentsMap = buildComments(sComments.data ?? [], "session_id");

  const feedItems: FeedItem[] = [
    ...workouts.map((w: any): FeedItem => {
      const actor = profileMap.get(w.user_id);
      return {
        id: w.id, type: "workout", created_at: w.created_at,
        actor_name: actor?.full_name || actor?.username || "A friend",
        actor_username: actor?.username || null,
        title: `${actor?.full_name || actor?.username || "A friend"} logged a workout`,
        subtitle: `${w.title} · ${w.workout_date}${w.duration_minutes ? ` · ${w.duration_minutes} min` : ""}`,
        reaction_count: wReactionCount.get(w.id) ?? 0,
        reacted_by_me: wReactedByMe.has(w.id),
        comments: wCommentsMap.get(w.id) ?? [],
      };
    }),
    ...sessions.map((s: any): FeedItem => {
      const actor = profileMap.get(s.creator_id);
      const gym = Array.isArray(s.gyms) ? s.gyms[0] : s.gyms;
      return {
        id: s.id, type: "session", created_at: s.created_at,
        actor_name: actor?.full_name || actor?.username || "A friend",
        actor_username: actor?.username || null,
        title: `${actor?.full_name || actor?.username || "A friend"} created a gym session`,
        subtitle: `${s.title} · ${gym?.name || "Gym"}${gym?.city ? ` · ${gym.city}` : ""} · ${new Date(s.scheduled_for).toLocaleString("ro-RO")}`,
        reaction_count: sReactionCount.get(s.id) ?? 0,
        reacted_by_me: sReactedByMe.has(s.id),
        comments: sCommentsMap.get(s.id) ?? [],
      };
    }),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feed</h1>
          <p className="text-sm text-muted-foreground">Recent activity from your friends.</p>
        </div>
      </div>

      <section className="space-y-4">
        {feedItems.length > 0 ? (
          <div className="grid gap-4">
            {feedItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="rounded-2xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.actor_username ? `@${item.actor_username}` : item.actor_name}
                    </p>
                  </div>
                  <span className="text-xs rounded-md bg-muted px-2 py-1 shrink-0">{item.type}</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <ReactionButton itemType={item.type} itemId={item.id} count={item.reaction_count} reacted={item.reacted_by_me} />
                </div>
                <div className="mt-4 space-y-3">
                  <CommentForm itemType={item.type} itemId={item.id} />
                  {item.comments.length > 0 ? (
                    <div className="space-y-2">
                      {item.comments.map((comment) => (
                        <div key={comment.id} className="rounded-xl bg-muted/40 px-3 py-2">
                          <p className="text-sm font-medium">{comment.author_username ? `@${comment.author_username}` : comment.author_name}</p>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No comments yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border p-6 text-sm text-muted-foreground">No friend activity yet.</div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link href={`/feed?page=${page - 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">← Previous</Link>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/feed?page=${page + 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">Next →</Link>
          )}
        </div>
      )}
    </main>
  );
}
