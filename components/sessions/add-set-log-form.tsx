"use client";

import { upsertSetLog } from "@/app/sessions/actions";

export function AddSetLogForm({
  sessionId,
  workoutSessionExerciseId,
  setNumber,
  defaultReps,
  defaultWeight,
  defaultRir,
}: {
  sessionId: string;
  workoutSessionExerciseId: string;
  setNumber: number;
  defaultReps?: number | null;
  defaultWeight?: number | null;
  defaultRir?: number | null;
}) {
  return (
    <form action={upsertSetLog} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[0.7fr_1fr_1fr_1fr_auto]">
      <input type="hidden" name="session_id" value={sessionId} />
      <input
        type="hidden"
        name="workout_session_exercise_id"
        value={workoutSessionExerciseId}
      />
      <input type="hidden" name="set_number" value={setNumber} />

      <div className="flex items-center text-sm font-medium">
        Set {setNumber}
      </div>

      <input
        name="reps"
        type="number"
        min="0"
        placeholder="Reps"
        defaultValue={defaultReps ?? ""}
        className="rounded-xl border px-3 py-2"
      />

      <input
        name="weight_kg"
        type="number"
        min="0"
        step="0.5"
        placeholder="Weight (kg)"
        defaultValue={defaultWeight ?? ""}
        className="rounded-xl border px-3 py-2"
      />

      <input
        name="rir"
        type="number"
        min="0"
        max="10"
        step="0.5"
        placeholder="RIR"
        defaultValue={defaultRir ?? ""}
        className="rounded-xl border px-3 py-2"
      />

      <button
        type="submit"
        className="rounded-xl bg-black px-4 py-2 text-white"
      >
        Save
      </button>
    </form>
  );
}