"use client";

import { createBodyLog } from "@/app/nutrition/actions";
import { Scale } from "lucide-react";

export function BodyLogForm() {
  return (
    <form action={createBodyLog} className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Scale className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Log body</h2>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="log_date" className="text-sm font-medium">Date</label>
        <input
          id="log_date"
          name="log_date"
          type="date"
          required
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="weight_kg" className="text-sm font-medium">Weight (kg)</label>
          <input
            id="weight_kg"
            name="weight_kg"
            type="number"
            step="0.1"
            min="0"
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="81.5"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="body_fat_percent" className="text-sm font-medium">Body fat %</label>
          <input
            id="body_fat_percent"
            name="body_fat_percent"
            type="number"
            step="0.1"
            min="0"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="18.5"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          placeholder="Morning weigh-in, fasted."
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Save body log
      </button>
    </form>
  );
}
