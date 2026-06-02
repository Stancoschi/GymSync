"use client";

import Link from "next/link";
import { useState } from "react";
import { ReactionButton } from "@/components/feed/reaction-button";
import { CommentForm } from "@/components/feed/comment-form";
import { ShareWorkoutButton } from "@/components/feed/share-workout-button";

type ExerciseSummary = {
  name: string;
  muscle_group: string | null;
  sets: number;
  total_volume_kg: number;
  best_weight_kg: number | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_username: string | null;
};

type Props = {
  id: string;
  actor_name: string;
  actor_username: string | null;
  actor_avatar_url: string | null;
  created_at: string;
  title: string;
  duration_minutes: number | null;
  has_pr: boolean;
  exercises: ExerciseSummary[];
  reaction_count: number;
  reacted_by_me: boolean;
  comments: Comment[];
};

function muscleColor(group: string | null): string {
  const g = (group ?? "").toLowerCase();
  if (g.includes("chest")) return "bg-red-500/20 text-red-400";
  if (g.includes("back") || g.includes("lat")) return "bg-blue-500/20 text-blue-400";
  if (g.includes("shoulder")) return "bg-purple-500/20 text-purple-400";
  if (g.includes("bicep")) return "bg-orange-500/20 text-orange-400";
  if (g.includes("tricep")) return "bg-yellow-500/20 text-yellow-400";
  if (g.includes("quad") || g.includes("leg")) return "bg-green-500/20 text-green-400";
  if (g.includes("hamstring") || g.includes("glute")) return "bg-emerald-500/20 text-emerald-400";
  if (g.includes("core") || g.includes("abs")) return "bg-pink-500/20 text-pink-400";
  return "bg-muted text-muted-foreground";
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

export function WorkoutPreviewCard({
  id,
  actor_name,
  actor_username,
  actor_avatar_url,
  created_at,
  title,
  duration_minutes,
  has_pr,
  exercises,
  reaction_count,
  reacted_by_me,
  comments,
}: Props) {
  const [showAllComments, setShowAllComments] = useState(false);
  const totalVolume = exercises.reduce((s, e) => s + e.total_volume_kg, 0);
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const visibleComments = showAllComments ? comments : comments.slice(0, 2);

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
            {actor_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm">{actor_name}</span>
              {actor_username && (
                <Link href={`/profile/${actor_username}`} className="text-xs text-muted-foreground hover:underline">
                  @{actor_username}
                </Link>
              )}
              {has_pr && (
                <span className="text-xs bg-amber-500/15 text-amber-500 rounded-full px-2 py-0.5 font-medium">
                  🏆 PR
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{relativeTime(created_at)}</p>
          </div>
        </div>
        <ShareWorkoutButton workoutId={id} workoutTitle={title} />
      </div>

      {/* Workout title + stats */}
      <div className="px-4 pb-3 space-y-2">
        <h3 className="font-bold text-base leading-tight">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {duration_minutes && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              {duration_minutes}min
            </span>
          )}
          {totalSets > 0 && (
            <span>{totalSets} sets</span>
          )}
          {totalVolume > 0 && (
            <span>{formatVolume(totalVolume)} volume</span>
          )}
          <span>{exercises.length} exercise{exercises.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Exercise list */}
      {exercises.length > 0 && (
        <div className="px-4 pb-3">
          <div className="rounded-xl bg-muted/30 divide-y divide-border/50 overflow-hidden">
            {exercises.slice(0, 5).map((ex, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {ex.muscle_group && (
                    <span className={`shrink-0 text-[10px] rounded-full px-1.5 py-0.5 font-medium ${muscleColor(ex.muscle_group)}`}>
                      {ex.muscle_group}
                    </span>
                  )}
                  <span className="text-sm font-medium truncate">{ex.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                  <span>{ex.sets}×</span>
                  {ex.best_weight_kg && <span className="font-medium text-foreground">{ex.best_weight_kg}kg</span>}
                </div>
              </div>
            ))}
            {exercises.length > 5 && (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                +{exercises.length - 5} more exercise{exercises.length - 5 !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <ReactionButton
          itemType="workout"
          itemId={id}
          count={reaction_count}
          reacted={reacted_by_me}
        />
      </div>

      {/* Comment form */}
      <div className="px-4 pb-3">
        <CommentForm itemType="workout" itemId={id} />
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="border-t divide-y divide-border/40">
          {visibleComments.map((c) => (
            <div key={c.id} className="px-4 py-2.5 flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0 mt-0.5">
                {c.author_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold">{c.author_name}</span>{" "}
                <span className="text-xs text-muted-foreground">{c.content}</span>
              </div>
            </div>
          ))}
          {comments.length > 2 && (
            <button
              onClick={() => setShowAllComments((v) => !v)}
              className="w-full text-xs text-muted-foreground py-2 hover:text-foreground transition-colors"
            >
              {showAllComments ? "Show less" : `View all ${comments.length} comments`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
