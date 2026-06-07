"use client";

import { useState, useMemo } from "react";
import { History, Calendar, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { SwipeableWorkoutCard } from "./swipeable-workout-card";

type Workout = {
  id: string;
  title: string;
  workout_date: string;
  duration_minutes: number | null;
  is_shared_to_feed: boolean | null;
  share_message: string | null;
};

type DateFilter = "3d" | "7d" | "30d" | "all";

const FILTER_LABELS: Record<DateFilter, string> = {
  "3d": "3 zile",
  "7d": "7 zile",
  "30d": "30 zile",
  "all": "Tot",
};

const FILTER_DAYS: Record<DateFilter, number | null> = {
  "3d": 3,
  "7d": 7,
  "30d": 30,
  "all": null,
};

export function WorkoutHistorySection({ workouts }: { workouts: Workout[] }) {
  const [filter, setFilter] = useState<DateFilter>("3d");
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    const days = FILTER_DAYS[filter];
    if (days === null) return workouts;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return workouts.filter((w) => new Date(w.workout_date) >= cutoff);
  }, [workouts, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of filtered) {
      const dateKey = new Date(w.workout_date).toLocaleDateString("ro-RO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(w);
    }
    return map;
  }, [filtered]);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Istoric
          </h2>
          {filtered.length > 0 && (
            <span className="text-xs font-semibold bg-muted text-muted-foreground rounded-full px-2 py-0.5 tabular-nums">
              {filtered.length}
            </span>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1">
          {(Object.keys(FILTER_LABELS) as DateFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Swipe hint */}
      {filtered.length > 0 && (
        <p className="text-[11px] text-muted-foreground/50 select-none -mt-2">
          ← Swipe stânga: șterge · Swipe dreapta: share
        </p>
      )}

      {/* Grouped cards */}
      {filtered.length > 0 ? (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 capitalize">
                {dateLabel}
              </p>
              <div className="space-y-2">
                {items.map((w) => (
                  <SwipeableWorkoutCard key={w.id} workout={w} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 flex flex-col items-center gap-3 text-center bg-muted/10">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {filter !== "all" ? `Nicio sesiune în ultimele ${FILTER_DAYS[filter]} zile` : "Nicio sesiune înregistrată"}
            </p>
            <p className="text-xs text-muted-foreground">
              {filter !== "all"
                ? "Extinde intervalul sau începe o sesiune dintr-un template."
                : "Pornește prima ta sesiune dintr-un template de mai sus."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
