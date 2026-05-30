"use client";

import { createWorkoutTemplate } from "@/app/workouts/actions";

export function CreateWorkoutTemplateForm() {
  return (
    <form action={createWorkoutTemplate} className="max-w-2xl space-y-6 rounded-2xl border p-6">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Workout name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Push A"
          className="w-full rounded-xl border px-3 py-2"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          placeholder="Chest, shoulders, triceps focus"
          className="w-full rounded-xl border px-3 py-2"
          rows={4}
        />
      </div>

      <button
        type="submit"
        className="rounded-xl bg-black px-6 py-3 text-white"
      >
        Create workout
      </button>
    </form>
  );
}