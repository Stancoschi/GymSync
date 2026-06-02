"use client";

import { addTemplateExercise } from "@/app/workouts/actions";
import { ExerciseCombobox } from "./exercise-combobox";

type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
};

export function AddTemplateExerciseForm({
  workoutTemplateId,
  exercises,
  nextOrderIndex,
}: {
  workoutTemplateId: string;
  exercises: Exercise[];
  nextOrderIndex: number;
}) {
  return (
    <form action={addTemplateExercise} className="space-y-4">
      <input type="hidden" name="workout_template_id" value={workoutTemplateId ?? ""} />
      <input type="hidden" name="order_index" value={nextOrderIndex ?? 1} />

      <div className="space-y-2">
        <label className="text-sm font-medium">Exercise</label>
        <ExerciseCombobox exercises={exercises} inputName="exercise_id" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="target_sets" className="text-sm font-medium">Target sets</label>
          <input
            id="target_sets"
            name="target_sets"
            type="number"
            min="1"
            defaultValue="3"
            className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="target_rir" className="text-sm font-medium">Target RIR</label>
          <input
            id="target_rir"
            name="target_rir"
            type="number"
            min="0"
            max="10"
            step="0.5"
            placeholder="2"
            className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="min_reps" className="text-sm font-medium">Min reps</label>
          <input
            id="min_reps"
            name="min_reps"
            type="number"
            min="1"
            defaultValue="8"
            className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="max_reps" className="text-sm font-medium">Max reps</label>
          <input
            id="max_reps"
            name="max_reps"
            type="number"
            min="1"
            defaultValue="10"
            className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="load_increment" className="text-sm font-medium">Load increment (kg)</label>
        <input
          id="load_increment"
          name="load_increment"
          type="number"
          min="0"
          step="0.5"
          placeholder="2.5"
          className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Pause on chest, controlled eccentric…"
          className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Add exercise
      </button>
    </form>
  );
}
