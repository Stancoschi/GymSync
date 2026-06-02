"use client";

import { useState } from "react";

type Props = {
  workoutId: string;
  workoutTitle: string;
};

export function ShareWorkoutButton({ workoutId, workoutTitle }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/workouts/${workoutId}`
      : `/workouts/${workoutId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({ title: workoutTitle, url });
    } else {
      handleCopy();
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        aria-label="Share workout"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 w-56 rounded-xl border bg-popover shadow-lg p-3 space-y-2">
          <p className="text-xs font-medium text-foreground truncate">{workoutTitle}</p>
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
            <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{url.replace("https://", "")}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs py-1.5 font-medium transition-colors"
            >
              {copied ? "✓ Copied" : "Copy link"}
            </button>
            <button
              onClick={handleNativeShare}
              className="flex-1 rounded-md border text-xs py-1.5 font-medium hover:bg-muted transition-colors"
            >
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
