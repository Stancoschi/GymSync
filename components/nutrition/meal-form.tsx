"use client";

import { createMeal } from "@/app/nutrition/actions";

export function MealForm() {
  return (
    <form action={createMeal} className="space-y-4 rounded-2xl border p-6">
      <h2 className="text-lg font-semibold">Add meal</h2>

      <div className="space-y-2">
        <label htmlFor="meal_log_date" className="text-sm font-medium">
          Date
        </label>
        <input
          id="meal_log_date"
          name="log_date"
          type="date"
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="meal_name" className="text-sm font-medium">
          Meal name
        </label>
        <input
          id="meal_name"
          name="meal_name"
          required
          className="w-full rounded-md border px-3 py-2"
          placeholder="Chicken rice bowl"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <label htmlFor="calories" className="text-sm font-medium">
            Calories
          </label>
          <input
            id="calories"
            name="calories"
            type="number"
            min="0"
            className="w-full rounded-md border px-3 py-2"
            placeholder="650"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="protein_g" className="text-sm font-medium">
            Protein
          </label>
          <input
            id="protein_g"
            name="protein_g"
            type="number"
            step="0.1"
            min="0"
            className="w-full rounded-md border px-3 py-2"
            placeholder="45"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="carbs_g" className="text-sm font-medium">
            Carbs
          </label>
          <input
            id="carbs_g"
            name="carbs_g"
            type="number"
            step="0.1"
            min="0"
            className="w-full rounded-md border px-3 py-2"
            placeholder="70"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fat_g" className="text-sm font-medium">
            Fat
          </label>
          <input
            id="fat_g"
            name="fat_g"
            type="number"
            step="0.1"
            min="0"
            className="w-full rounded-md border px-3 py-2"
            placeholder="18"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="meal_notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="meal_notes"
          name="notes"
          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
          placeholder="High protein lunch."
        />
      </div>

      <button type="submit" className="rounded-md bg-black text-white px-4 py-2">
        Save meal
      </button>
    </form>
  );
}