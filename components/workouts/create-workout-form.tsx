"use client";

import { createWorkout } from "@/app/workouts/actions";
import { useLanguage } from "@/lib/i18n/language-context";

type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
};

export function CreateWorkoutForm({ exercises }: { exercises: Exercise[] }) {
  const { t } = useLanguage();
  const w = t.workouts;

  return (
    <form action={createWorkout} className="space-y-4 rounded-2xl border p-6">
      <h2 className="text-lg font-semibold">{w.newWorkout ?? "Create workout"}</h2>

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          {w.workoutName ?? "Title"}
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded-md border px-3 py-2"
          placeholder="Upper body session"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="workout_date" className="text-sm font-medium">
          {w.workoutDate ?? "Workout date"}
        </label>
        <input
          id="workout_date"
          name="workout_date"
          type="date"
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="duration_minutes" className="text-sm font-medium">
          {w.duration ?? "Duration"} ({w.minutes ?? "minutes"})
        </label>
        <input
          id="duration_minutes"
          name="duration_minutes"
          type="number"
          min="1"
          className="w-full rounded-md border px-3 py-2"
          placeholder="60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="exercise_id" className="text-sm font-medium">
          {w.selectExercise ?? "Exercise"}
        </label>
        <select
          id="exercise_id"
          name="exercise_id"
          required
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">{w.selectExercise ?? "Select exercise"}</option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name} {exercise.muscle_group ? `- ${exercise.muscle_group}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="space-y-2">
            <p className="text-sm font-medium">{w.sets ? `${w.sets} ${n}` : `Set ${n}`}</p>
            <input
              name={`set${n}_reps`}
              type="number"
              min="1"
              className="w-full rounded-md border px-3 py-2"
              placeholder={w.repsRange ?? "Reps"}
            />
            <input
              name={`set${n}_weight`}
              type="number"
              min="0"
              step="0.5"
              className="w-full rounded-md border px-3 py-2"
              placeholder={w.kg ? `${w.kg}` : "Weight kg"}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          {w.notes ?? "Notes"}
        </label>
        <textarea
          id="notes"
          name="notes"
          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
          placeholder="Felt strong today."
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-black text-white px-4 py-2"
      >
        {w.saveWorkout ?? "Save workout"}
      </button>
    </form>
  );
}
