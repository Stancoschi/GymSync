"use client";

import { upsertSetLog } from "@/app/sessions/actions";
import { Check } from "lucide-react";

export function AddSetLogForm({
  sessionId,
  workoutSessionExerciseId,
  setNumber,
  defaultReps,
  defaultWeight,
  defaultRir,
  isLogged = false,
}: {
  sessionId: string;
  workoutSessionExerciseId: string;
  setNumber: number;
  defaultReps?: number | null;
  defaultWeight?: number | null;
  defaultRir?: number | null;
  isLogged?: boolean;
}) {
  return (
    <form
      action={upsertSetLog}
      className={`grid items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors md:grid-cols-[2rem_1fr_1fr_1fr_auto] ${
        isLogged
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-border bg-card hover:bg-muted/30"
      }`}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="workout_session_exercise_id" value={workoutSessionExerciseId} />
      <input type="hidden" name="set_number" value={setNumber} />

      {/* Set badge */}
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
        isLogged ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
      }`}>
        {isLogged ? <Check className="w-3.5 h-3.5" /> : setNumber}
      </div>

      <div className="relative">
        <input
          name="reps"
          type="number"
          min="0"
          placeholder="Reps"
          defaultValue={defaultReps ?? ""}
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="relative">
        <input
          name="weight_kg"
          type="number"
          min="0"
          step="0.5"
          placeholder="kg"
          defaultValue={defaultWeight ?? ""}
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="relative">
        <input
          name="rir"
          type="number"
          min="0"
          max="10"
          step="0.5"
          placeholder="RIR"
          defaultValue={defaultRir ?? ""}
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
      >
        Save
      </button>
    </form>
  );
}
