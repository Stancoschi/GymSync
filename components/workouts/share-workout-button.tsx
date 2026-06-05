"use client";

import { useState, useTransition } from "react";
import { shareWorkoutToFeed } from "@/app/workouts/actions";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";

export function ShareWorkoutButton({ workoutId }: { workoutId: string }) {
  const { t } = useLanguage();
  const w = t.workouts;
  const c = t.common;

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [shared, setShared] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleShare() {
    const fd = new FormData();
    fd.append("workout_id", workoutId);
    if (message) fd.append("message", message);
    startTransition(async () => {
      await shareWorkoutToFeed(fd);
      setShared(true);
      setOpen(false);
    });
  }

  if (shared)
    return (
      <span className="text-sm text-muted-foreground">{w.shared}</span>
    );

  return (
    <div className="space-y-2">
      {!open ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {w.shareWorkout}
        </Button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={w.shareMessage}
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleShare} disabled={isPending}>
              {isPending ? c.loading : w.shareWorkout}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {c.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
