"use client";

import { createWorkout } from "@/app/workouts/actions";

type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
};

export function CreateWorkoutForm({ exercises }: { exercises: Exercise[] }) {
  return (
    <form action={createWorkout} className="space-y-4 rounded-2xl border p-6">
      <h2 className="text-lg font-semibold">Create workout</h2>

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
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
          Workout date
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
          Duration (minutes)
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
          Exercise
        </label>
        <select
          id="exercise_id"
          name="exercise_id"
          required
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">Select exercise</option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name} {exercise.muscle_group ? `- ${exercise.muscle_group}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <p className="text-sm font-medium">Set 1</p>
          <input
            name="set1_reps"
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Reps"
          />
          <input
            name="set1_weight"
            type="number"
            min="0"
            step="0.5"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Weight kg"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Set 2</p>
          <input
            name="set2_reps"
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Reps"
          />
          <input
            name="set2_weight"
            type="number"
            min="0"
            step="0.5"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Weight kg"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Set 3</p>
          <input
            name="set3_reps"
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Reps"
          />
          <input
            name="set3_weight"
            type="number"
            min="0"
            step="0.5"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Weight kg"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
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
        Save workout
      </button>
    </form>
  );
}