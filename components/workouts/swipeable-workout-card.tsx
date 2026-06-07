"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Clock, Share2, Trash2, Edit3, MoreHorizontal } from "lucide-react";
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
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
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
    setShowDesktopMenu(false);
  }

  function confirmDelete() {
    startTransition(() => deleteWorkout(w.id));
    setShowDeleteConfirm(false);
  }

  const displayDate = new Date(w.workout_date).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
  });

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl">
        {/* Swipe-left BG — delete */}
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive"
          style={{ width: 88, borderRadius: "inherit" }}
        >
          <button
            onClick={handleDelete}
            className="flex flex-col items-center gap-1 text-white w-full items-center justify-center py-3"
            aria-label="Delete workout"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wide">Delete</span>
          </button>
        </div>

        {/* Swipe-right BG — share */}
        <div
          className="absolute inset-y-0 left-0 flex items-center bg-primary"
          style={{ width: 88, borderRadius: "inherit" }}
        >
          <button
            onClick={() => { setShowShareModal(true); resetSwipe(); }}
            className="flex flex-col items-center gap-1 text-primary-foreground w-full items-center justify-center py-3"
            aria-label="Share workout"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wide">Share</span>
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
            transition: dragging ? "none" : "transform 0.28s cubic-bezier(0.25,1,0.5,1)",
          }}
          className="relative flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 select-none"
        >
          {/* Date badge */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-muted/60 text-center leading-none gap-0.5">
            <span className="text-[13px] font-extrabold tabular-nums leading-none">
              {new Date(w.workout_date).getDate()}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              {new Date(w.workout_date).toLocaleDateString("ro-RO", { month: "short" })}
            </span>
          </div>

          {/* Content */}
          <Link
            href={revealed ? "#" : `/workouts/${w.id}`}
            onClick={(e) => { if (revealed) { e.preventDefault(); resetSwipe(); } }}
            className="flex-1 min-w-0"
            draggable={false}
          >
            <p className="text-sm font-semibold truncate leading-snug">{w.title}</p>
            <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
              {w.duration_minutes && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {w.duration_minutes} min
                </span>
              )}
              {w.is_shared_to_feed && (
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                  <Share2 className="w-3 h-3" />
                  Shared
                </span>
              )}
            </div>
          </Link>

          {/* Desktop ··· menu */}
          <div className="relative hidden md:block shrink-0">
            <button
              onClick={() => setShowDesktopMenu((v) => !v)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showDesktopMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDesktopMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-xl border border-border bg-card shadow-xl py-1">
                  <Link
                    href={`/workouts/${w.id}/edit`}
                    onClick={() => setShowDesktopMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => { setShowShareModal(true); setShowDesktopMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share to feed
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <p className="font-semibold">Ștergi sesiunea?</p>
              <p className="text-sm text-muted-foreground">
                &ldquo;{w.title}&rdquo; va fi ștearsă definitiv.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isPending ? "Se șterge..." : "Șterge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <p className="font-semibold">Distribuie în feed</p>
            <ShareWorkoutButton
              workoutId={w.id}
              isShared={w.is_shared_to_feed ?? false}
              workoutTitle={w.title}
            />
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
            >
              Anulează
            </button>
          </div>
        </div>
      )}
    </>
  );
}
