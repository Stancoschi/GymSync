"use client";

import { createBodyLog } from "@/app/nutrition/actions";

export function BodyLogForm() {
  return (
    <form action={createBodyLog} className="space-y-4 rounded-2xl border p-6">
      <h2 className="text-lg font-semibold">Add body log</h2>

      <div className="space-y-2">
        <label htmlFor="log_date" className="text-sm font-medium">
          Date
        </label>
        <input
          id="log_date"
          name="log_date"
          type="date"
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="weight_kg" className="text-sm font-medium">
          Weight (kg)
        </label>
        <input
          id="weight_kg"
          name="weight_kg"
          type="number"
          step="0.1"
          min="0"
          required
          className="w-full rounded-md border px-3 py-2"
          placeholder="81.5"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="body_fat_percent" className="text-sm font-medium">
          Body fat %
        </label>
        <input
          id="body_fat_percent"
          name="body_fat_percent"
          type="number"
          step="0.1"
          min="0"
          className="w-full rounded-md border px-3 py-2"
          placeholder="18.5"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
          placeholder="Morning weigh-in, fasted."
        />
      </div>

      <button type="submit" className="rounded-md bg-black text-white px-4 py-2">
        Save body log
      </button>
    </form>
  );
}