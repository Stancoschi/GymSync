"use client";

import { useRef, useState, useTransition } from "react";
import { shareWorkoutToFeed } from "@/app/workouts/share-actions";

interface Props {
  workoutId: string;
  isShared: boolean;
  workoutTitle: string;
}

export function ShareWorkoutButton({ workoutId, isShared, workoutTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [shared, setShared] = useState(isShared);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await shareWorkoutToFeed(fd);
      setShared((prev) => !prev);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
          shared
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        }`}
      >
        {shared ? "\u2713 Shared" : "Share to feed"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl mx-3 mb-4 sm:mb-0">
            <div>
              <h2 className="text-base font-semibold">
                {shared ? "Remove from feed?" : "Share to feed"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {shared
                  ? `"${workoutTitle}" will be removed from your public feed.`
                  : `Post "${workoutTitle}" so your friends can see it and react.`}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Required hidden fields */}
              <input type="hidden" name="workout_id" value={workoutId} />
              <input type="hidden" name="workout_title" value={workoutTitle} />
              <input type="hidden" name="unshare" value={String(shared)} />

              {!shared && (
                <textarea
                  name="share_message"
                  placeholder="Add a message (optional)…"
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    shared
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  } disabled:opacity-50`}
                >
                  {isPending ? "Saving…" : shared ? "Remove" : "Post to feed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
