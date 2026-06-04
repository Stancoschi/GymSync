"use client";

import { createMeal } from "@/app/nutrition/actions";
import { Utensils } from "lucide-react";

export function MealForm() {
  return (
    <form action={createMeal} className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Utensils className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Log meal</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <label htmlFor="meal_name" className="text-sm font-medium">Meal name</label>
          <input
            id="meal_name"
            name="meal_name"
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Chicken rice bowl"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <label htmlFor="meal_log_date" className="text-sm font-medium">Date</label>
          <input
            id="meal_log_date"
            name="log_date"
            type="date"
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { id: "calories", name: "calories", label: "kcal", placeholder: "650", step: "1" },
          { id: "protein_g", name: "protein_g", label: "Protein", placeholder: "45", step: "0.1" },
          { id: "carbs_g", name: "carbs_g", label: "Carbs", placeholder: "70", step: "0.1" },
          { id: "fat_g", name: "fat_g", label: "Fat", placeholder: "18", step: "0.1" },
        ].map(({ id, name, label, placeholder, step }) => (
          <div key={id} className="space-y-1.5">
            <label htmlFor={id} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
            <input
              id={id}
              name={name}
              type="number"
              step={step}
              min="0"
              className="w-full rounded-xl border border-border bg-background px-2 py-2 text-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="meal_notes" className="text-sm font-medium">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
        <textarea
          id="meal_notes"
          name="notes"
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          placeholder="High protein lunch."
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Save meal
      </button>
    </form>
  );
}
