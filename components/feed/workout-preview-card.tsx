import Link from "next/link";
import { ReactionButton } from "@/components/feed/reaction-button";
import { CommentForm } from "@/components/feed/comment-form";

type ExerciseSummary = {
  name: string;
  muscle_group: string | null;
  sets: number;
  total_volume_kg: number;
  best_weight_kg: number | null;
};

type FeedComment = {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_username: string | null;
};

type WorkoutPreviewCardProps = {
  id: string;
  actor_name: string;
  actor_username: string | null;
  actor_avatar_url: string | null;
  created_at: string;
  title: string;
  share_message: string | null;
  duration_minutes: number | null;
  has_pr: boolean;
  exercises: ExerciseSummary[];
  reaction_count: number;
  reacted_by_me: boolean;
  comments: FeedComment[];
};

function muscleGroupEmoji(group: string | null): string {
  if (!group) return "💪";
  const g = group.toLowerCase();
  if (g.includes("chest")) return "💪";
  if (g.includes("back")) return "🔙";
  if (g.includes("leg") || g.includes("quad") || g.includes("hamstring")) return "🦵";
  if (g.includes("shoulder") || g.includes("delt")) return "🤸";
  if (g.includes("bicep") || g.includes("tricep") || g.includes("arm")) return "💪";
  if (g.includes("glute") || g.includes("hip")) return "🏃";
  if (g.includes("core") || g.includes("abs")) return "⚡";
  if (g.includes("calf")) return "🦵";
  return "💪";
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg.toLocaleString()} kg`;
}

export function WorkoutPreviewCard({
  id,
  actor_name,
  actor_username,
  created_at,
  title,
  share_message,
  duration_minutes,
  has_pr,
  exercises,
  reaction_count,
  reacted_by_me,
  comments,
}: WorkoutPreviewCardProps) {
  const totalVolume = exercises.reduce((acc, e) => acc + e.total_volume_kg, 0);
  const totalSets = exercises.reduce((acc, e) => acc + e.sets, 0);
  const uniqueMuscles = Array.from(
    new Set(exercises.map((e) => e.muscle_group).filter(Boolean))
  ) as string[];

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {has_pr && (
        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500" />
      )}

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{actor_name}</p>
              {actor_username && (
                <Link
                  href={`/profile/${actor_username}`}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  @{actor_username}
                </Link>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(created_at).toLocaleDateString("ro-RO", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {has_pr && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                🏆 PR
              </span>
            )}
            <span className="text-xs rounded-md bg-muted px-2 py-1 text-muted-foreground">
              workout
            </span>
          </div>
        </div>

        {/* Workout title + optional share message */}
        <div className="space-y-1">
          <p className="font-bold text-base leading-tight">{title}</p>
          {share_message && (
            <p className="text-sm text-muted-foreground italic">&ldquo;{share_message}&rdquo;</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-sm flex-wrap">
          {duration_minutes !== null && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{duration_minutes} min</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 4v16M18 4v16M6 12h12" />
            </svg>
            <span>{totalSets} sets</span>
          </div>
          {totalVolume > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M2 12h4l3-8 4 16 3-8h4" />
              </svg>
              <span>{formatVolume(totalVolume)} volume</span>
            </div>
          )}
        </div>

        {/* Exercise breakdown */}
        {exercises.length > 0 && (
          <div className="rounded-xl bg-muted/40 divide-y divide-border/50 overflow-hidden">
            {exercises.slice(0, 4).map((ex, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none">
                    {muscleGroupEmoji(ex.muscle_group)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ex.name}</p>
                    {ex.muscle_group && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {ex.muscle_group}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums">
                    {ex.sets} ×
                    {ex.best_weight_kg !== null ? ` ${ex.best_weight_kg} kg` : ""}
                  </p>
                  {ex.total_volume_kg > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formatVolume(ex.total_volume_kg)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {exercises.length > 4 && (
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  +{exercises.length - 4} more exercise{exercises.length - 4 > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Muscle group chips */}
        {uniqueMuscles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {uniqueMuscles.slice(0, 5).map((m) => (
              <span
                key={m}
                className="rounded-full bg-primary/10 text-primary text-xs px-2.5 py-0.5 capitalize font-medium"
              >
                {m}
              </span>
            ))}
          </div>
        )}

        {/* Reactions + Comments */}
        <div className="flex items-center gap-3 pt-1">
          <ReactionButton
            itemType="workout"
            itemId={id}
            count={reaction_count}
            reacted={reacted_by_me}
          />
        </div>
        <CommentForm itemType="workout" itemId={id} />
        {comments.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            {comments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-medium">{c.author_name}</span>{" "}
                <span className="text-muted-foreground">{c.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
