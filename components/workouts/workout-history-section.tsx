"use client";

import { useState, useMemo } from "react";
import { History, Clock, Share2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
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
  "3d": "Last 3 days",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "all": "All time",
};

const FILTER_DAYS: Record<DateFilter, number | null> = {
  "3d": 3,
  "7d": 7,
  "30d": 30,
  "all": null,
};

export function WorkoutHistorySection({ workouts }: { workouts: Workout[] }) {
  const [filter, setFilter] = useState<DateFilter>("3d");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filtered = useMemo(() => {
    const days = FILTER_DAYS[filter];
    if (days === null) return workouts;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return workouts.filter((w) => new Date(w.workout_date) >= cutoff);
  }, [workouts, filter]);

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">History</h2>
          {filtered.length > 0 && (
            <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {filtered.length}
            </span>
          )}
        </div>

        {/* Date filter pill */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <Calendar className="w-3 h-3" />
            {FILTER_LABELS[filter]}
            {showFilterMenu ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-xl border border-border bg-card shadow-lg py-1">
              {(Object.keys(FILTER_LABELS) as DateFilter[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { setFilter(key); setShowFilterMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-muted/50 ${
                    filter === key ? "text-primary" : "text-foreground"
                  }`}
                >
                  {FILTER_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Swipe hint — shown only when there are items */}
      {filtered.length > 0 && (
        <p className="text-[11px] text-muted-foreground/60 select-none">
          Swipe left to delete · Swipe right to share
        </p>
      )}

      {/* Cards */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((w) => (
            <SwipeableWorkoutCard key={w.id} workout={w} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center gap-3 text-center">
          <History className="w-8 h-8 text-muted-foreground/30" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {filter === "3d" ? "No workouts in the last 3 days" : `No workouts found`}
            </p>
            <p className="text-sm text-muted-foreground">
              {filter !== "all" ? "Try expanding the date range above." : "Start a session from a template above."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
