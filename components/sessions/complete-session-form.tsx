"use client";

import { completeWorkoutSession } from "@/app/sessions/actions";
import { CheckCircle2 } from "lucide-react";

export function CompleteSessionForm({
  sessionId,
  variant = "default",
}: {
  sessionId: string;
  variant?: "default" | "large";
}) {
  return (
    <form action={completeWorkoutSession}>
      <input type="hidden" name="session_id" value={sessionId} />
      <button
        type="submit"
        className={
          variant === "large"
            ? "inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all"
            : "inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
        }
      >
        <CheckCircle2 className="w-4 h-4" />
        Complete workout
      </button>
    </form>
  );
}
