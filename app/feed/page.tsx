import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReactionButton } from "@/components/feed/reaction-button";
import { CommentForm } from "@/components/feed/comment-form";
import { WorkoutPreviewCard } from "@/components/feed/workout-preview-card";
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
  actor_id: string;
  actor_name: string;
  actor_username: string | null;
  title: string;
  subtitle: string;
  share_message: string | null;
  reaction_count: number;
  reacted_by_me: boolean;
  comments: FeedComment[];
  has_pr?: boolean;
};

type ExerciseSummary = {
  name: string;
  muscle_group: string | null;
  sets: number;
  total_volume_kg: number;
  best_weight_kg: number | null;
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: friendships } = await supabase
    .from("friendships")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  const friendIds: string[] = [user.id];
  if (friendships) {
    for (const f of friendships) {
      const otherId = f.user_a_id === user.id ? f.user_b_id : f.user_a_id;
      if (!friendIds.includes(otherId)) friendIds.push(otherId);
    }
  }

  const { data: rawItems } = await supabase
    .from("feed_items")
    .select(
      "id, type, created_at, actor_id, actor_name, actor_username, title, subtitle, share_message, reaction_count, comments:feed_comments(id, content, created_at, author_name, author_username)"
    )
    .in("actor_id", friendIds)
    .order("created_at", { ascending: false })
    .range(from, to);

  const itemIds = (rawItems ?? []).map((i: any) => i.id as string);
  const reactedSet = new Set<string>();
  if (itemIds.length > 0) {
    const { data: myReactions } = await supabase
      .from("feed_reactions")
      .select("feed_item_id")
      .eq("user_id", user.id)
      .in("feed_item_id", itemIds);
    for (const r of myReactions ?? []) reactedSet.add(r.feed_item_id);
  }

  const workoutItemIds = (rawItems ?? [])
    .filter((i: any) => i.type === "workout")
    .map((i: any) => i.id as string);

  const prWorkoutIds = new Set<string>();
  if (workoutItemIds.length > 0) {
    const { data: prRows } = await supabase
      .from("workouts")
      .select("id")
      .in("id", workoutItemIds)
      .eq("has_pr", true);
    for (const row of prRows ?? []) prWorkoutIds.add(row.id);
  }

  const workoutPreviewMap = new Map<string, ExerciseSummary[]>();
  const workoutDurationMap = new Map<string, number | null>();

  if (workoutItemIds.length > 0) {
    const actorIds = Array.from(
      new Set(
        (rawItems ?? [])
          .filter((i: any) => i.type === "workout")
          .map((i: any) => i.actor_id as string)
      )
    );

    const { data: workoutRows } = await supabase
      .from("workouts")
      .select("id, workout_date")
      .in("id", workoutItemIds);

    const workoutDateMap = new Map(
      (workoutRows ?? []).map((w) => [w.id, w.workout_date])
    );

    const feedWorkoutActors = new Map(
      (rawItems ?? [])
        .filter((i: any) => i.type === "workout")
        .map((i: any) => [i.id as string, i.actor_id as string])
    );

    const { data: sessionsWithUser } = await supabase
      .from("workout_sessions")
      .select("id, user_id, completed_at, duration_seconds")
      .in("user_id", actorIds)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(workoutItemIds.length * 2 + 10);

    const sessionIds = (sessionsWithUser ?? []).map((s) => s.id);
    const sessionExerciseMap = new Map<string, Map<string, ExerciseSummary>>();

    if (sessionIds.length > 0) {
      const { data: wseRows } = await supabase
        .from("workout_session_exercises")
        .select("id, exercise_id, workout_session_id")
        .in("workout_session_id", sessionIds);

      if (wseRows && wseRows.length > 0) {
        const wseIds = wseRows.map((w) => w.id);

        const { data: exerciseDetails } = await supabase
          .from("exercise_library")
          .select("id, name, muscle_group")
          .in("id", Array.from(new Set(wseRows.map((w) => w.exercise_id as string))));

        const { data: setLogs } = await supabase
          .from("workout_set_logs")
          .select("reps, weight_kg, workout_session_exercise_id")
          .in("workout_session_exercise_id", wseIds)
          .eq("completed", true);

        const exMap = new Map((exerciseDetails ?? []).map((e) => [e.id, e]));

        for (const wse of wseRows) {
          const sid = wse.workout_session_id as string;
          const exId = wse.exercise_id as string;
          const ex = exMap.get(exId);
          if (!ex) continue;

          if (!sessionExerciseMap.has(sid)) sessionExerciseMap.set(sid, new Map());
          const exSummaries = sessionExerciseMap.get(sid)!;

          if (!exSummaries.has(exId)) {
            exSummaries.set(exId, {
              name: ex.name,
              muscle_group: ex.muscle_group,
              sets: 0,
              total_volume_kg: 0,
              best_weight_kg: null,
            });
          }

          const summary = exSummaries.get(exId)!;
          const wseSetLogs = (setLogs ?? []).filter(
            (l) => l.workout_session_exercise_id === wse.id
          );
          for (const log of wseSetLogs) {
            const w = Number(log.weight_kg ?? 0);
            const r = Number(log.reps ?? 0);
            summary.sets += 1;
            summary.total_volume_kg += w * r;
            if (w > 0 && (summary.best_weight_kg === null || w > summary.best_weight_kg)) {
              summary.best_weight_kg = w;
            }
          }
        }
      }
    }

    for (const feedItemId of workoutItemIds) {
      const actorId = feedWorkoutActors.get(feedItemId);
      const workoutDate = workoutDateMap.get(feedItemId);
      if (!actorId || !workoutDate) continue;

      let bestSession: (typeof sessionsWithUser)[0] | null = null;
      let bestDiff = Infinity;
      const workoutTime = new Date(workoutDate).getTime();

      for (const s of sessionsWithUser ?? []) {
        if (s.user_id !== actorId || !s.completed_at) continue;
        const diff = Math.abs(new Date(s.completed_at).getTime() - workoutTime);
        if (diff < bestDiff) { bestDiff = diff; bestSession = s; }
      }

      if (!bestSession) continue;

      workoutDurationMap.set(
        feedItemId,
        bestSession.duration_seconds ? Math.round(bestSession.duration_seconds / 60) : null
      );

      const exSummaries = sessionExerciseMap.get(bestSession.id);
      if (exSummaries) workoutPreviewMap.set(feedItemId, Array.from(exSummaries.values()));
    }
  }

  const feedItems: FeedItem[] = (rawItems ?? []).map((item: any) => ({
    ...item,
    reacted_by_me: reactedSet.has(item.id),
    has_pr: item.type === "workout" ? prWorkoutIds.has(item.id) : false,
  }));

  const { count } = await supabase
    .from("feed_items")
    .select("id", { count: "exact", head: true })
    .in("actor_id", friendIds);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed</h1>
        <span className="text-xs text-muted-foreground">
          {friendIds.length - 1} friend{friendIds.length - 1 !== 1 ? "s" : ""}
        </span>
      </div>

      {feedItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
          <p className="text-3xl">🏋️</p>
          <p className="font-semibold">Nothing here yet</p>
          <p className="text-sm text-muted-foreground">
            Share a workout to appear in the feed!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedItems.map((item) => {
            if (item.type === "workout") {
              return (
                <WorkoutPreviewCard
                  key={item.id}
                  id={item.id}
                  actor_name={item.actor_name}
                  actor_username={item.actor_username}
                  actor_avatar_url={null}
                  created_at={item.created_at}
                  title={item.title}
                  share_message={item.share_message}
                  duration_minutes={workoutDurationMap.get(item.id) ?? null}
                  has_pr={item.has_pr ?? false}
                  exercises={workoutPreviewMap.get(item.id) ?? []}
                  reaction_count={item.reaction_count}
                  reacted_by_me={item.reacted_by_me}
                  comments={item.comments}
                />
              );
            }

            return (
              <div key={item.id} className="rounded-2xl border p-4 space-y-4">
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
                  <span className="text-xs rounded-md bg-muted px-2 py-1">session</span>
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <ReactionButton
                    itemType="session"
                    itemId={item.id}
                    count={item.reaction_count}
                    reacted={item.reacted_by_me}
                  />
                </div>
                <CommentForm itemType="session" itemId={item.id} />
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
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 && (
            <Link href={`/feed?page=${page - 1}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              &larr; Prev
            </Link>
          )}
          <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`/feed?page=${page + 1}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Next &rarr;
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
