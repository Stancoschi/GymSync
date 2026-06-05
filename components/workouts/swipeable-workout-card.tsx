"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Clock, Share2, Trash2, Edit3 } from "lucide-react";
import { deleteWorkout } from "@/app/workouts/actions";
import { ShareWorkoutButton } from "./share-workout-button";

type Workout = {
  id: string;
  title: string;
  workout_date: string;
  duration_minutes: number | null;
  is_shared_to_feed: boolean | null;
  share_message: string | null;
};

export function SwipeableWorkoutCard({ workout: w }: { workout: Workout }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [revealed, setRevealed] = useState<"left" | "right" | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const startX = useRef(0);
  const currentX = useRef(0);
  const THRESHOLD = 72;

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    setDragging(true);
    setRevealed(null);
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current;
    currentX.current = dx;
    setOffset(Math.max(-120, Math.min(120, dx)));
  }

  function onTouchEnd() {
    setDragging(false);
    const dx = currentX.current;
    if (dx < -THRESHOLD) {
      setOffset(-88);
      setRevealed("left");
    } else if (dx > THRESHOLD) {
      setOffset(88);
      setRevealed("right");
    } else {
      setOffset(0);
      setRevealed(null);
    }
  }

  function resetSwipe() {
    setOffset(0);
    setRevealed(null);
  }

  function handleDelete() {
    setShowDeleteConfirm(true);
    resetSwipe();
  }

  function confirmDelete() {
    startTransition(() => deleteWorkout(w.id));
    setShowDeleteConfirm(false);
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        {/* Left action — delete (revealed on swipe left) */}
        <div className="absolute inset-y-0 right-0 flex items-center px-4 bg-destructive rounded-2xl">
          <button
            onClick={handleDelete}
            className="flex flex-col items-center gap-1 text-white"
            aria-label="Delete workout"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Delete</span>
          </button>
        </div>

        {/* Right action — share (revealed on swipe right) */}
        <div className="absolute inset-y-0 left-0 flex items-center px-4 bg-primary rounded-2xl">
          <button
            onClick={() => { setShowShareModal(true); resetSwipe(); }}
            className="flex flex-col items-center gap-1 text-primary-foreground"
            aria-label="Share workout"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Share</span>
          </button>
        </div>

        {/* Card */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={revealed ? resetSwipe : undefined}
          style={{
            transform: `translateX(${offset}px)`,
            transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.25,1,0.5,1)",
          }}
          className="relative flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 cursor-grab active:cursor-grabbing select-none"
        >
          <Link
            href={revealed ? "#" : `/workouts/${w.id}`}
            onClick={(e) => { if (revealed) { e.preventDefault(); resetSwipe(); } }}
            className="flex-1 min-w-0"
          >
            <p className="text-sm font-semibold truncate">{w.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {new Date(w.workout_date).toLocaleDateString("ro-RO", {
                  weekday: "short", day: "numeric", month: "short",
                })}
              </span>
              {w.duration_minutes && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {w.duration_minutes} min
                </span>
              )}
              {w.is_shared_to_feed && (
                <span className="inline-flex items-center gap-1 text-xs text-primary">
                  <Share2 className="w-3 h-3" />
                  Shared
                </span>
              )}
            </div>
          </Link>

          {/* Desktop action buttons (hover) */}
          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/workouts/${w.id}/edit`}
              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <p className="font-semibold">Delete workout?</p>
              <p className="text-sm text-muted-foreground">
                &ldquo;{w.title}&rdquo; will be permanently removed.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <p className="font-semibold">Share to feed</p>
            <ShareWorkoutButton
              workoutId={w.id}
              isShared={w.is_shared_to_feed ?? false}
              workoutTitle={w.title}
            />
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
