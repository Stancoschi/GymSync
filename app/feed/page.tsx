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
  has_pr?: boolean;
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

  const friendIds: string[] = [];
  if (friendships) {
    for (const f of friendships) {
      const otherId = f.user_a_id === user.id ? f.user_b_id : f.user_a_id;
      if (!friendIds.includes(otherId)) friendIds.push(otherId);
    }
  }
  // Include self in feed
  if (!friendIds.includes(user.id)) friendIds.push(user.id);

  if (friendIds.length === 0) {
    return (
      <main className="mx-auto max-w-xl space-y-6 p-6">
        <h1 className="text-2xl font-bold">Feed</h1>
        <p className="text-sm text-muted-foreground">
          Add friends to see their activity here.
        </p>
      </main>
    );
  }

  const { data: rawItems } = await supabase
    .from("feed_items")
    .select(
      "id, type, created_at, actor_name, actor_username, title, subtitle, reaction_count, reacted_by_me, comments:feed_comments(id, content, created_at, author_name, author_username)"
    )
    .in("actor_id", friendIds)
    .order("created_at", { ascending: false })
    .range(from, to);

  // --- Enrich workout items with has_pr flag ---
  const workoutItemIds = (rawItems ?? [])
    .filter((i: any) => i.type === "workout")
    .map((i: any) => i.id);

  const prWorkoutIds = new Set<string>();
  if (workoutItemIds.length > 0) {
    const { data: prRows } = await supabase
      .from("workouts")
      .select("id")
      .in("id", workoutItemIds)
      .eq("has_pr", true);
    for (const row of prRows ?? []) {
      prWorkoutIds.add(row.id);
    }
  }

  const feedItems: FeedItem[] = (rawItems ?? []).map((item: any) => ({
    ...item,
    has_pr: item.type === "workout" ? prWorkoutIds.has(item.id) : false,
  }));

  // Count total for pagination
  const { count } = await supabase
    .from("feed_items")
    .select("id", { count: "exact", head: true })
    .in("actor_id", friendIds);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Feed</h1>

      {feedItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing here yet. Start a workout or join a gym session!
        </p>
      ) : (
        <div className="space-y-4">
          {feedItems.map((item) => (
            <div key={item.id} className="rounded-2xl border p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{item.actor_name}</p>
                    {item.actor_username && (
                      <Link
                        href={`/profile/${item.actor_username}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        @{item.actor_username}
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* PR badge */}
                  {item.has_pr && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                      🏆 PR
                    </span>
                  )}
                  <span className="text-xs rounded-md bg-muted px-2 py-1">
                    {item.type}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              </div>

              {/* Reactions + Comments */}
              <div className="flex items-center gap-3">
                <ReactionButton
                  id={item.id}
                  count={item.reaction_count}
                  reacted={item.reacted_by_me}
                />
              </div>
              <CommentForm id={item.id} />
              {item.comments.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  {item.comments.map((c) => (
                    <div key={c.id} className="text-sm">
                      <span className="font-medium">{c.author_name}</span>{" "}
                      <span className="text-muted-foreground">{c.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link
              href={`/feed?page=${page - 1}`}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              &larr; Prev
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/feed?page=${page + 1}`}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Next &rarr;
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </main>
  );
}
