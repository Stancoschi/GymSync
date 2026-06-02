"use client";

import { useMemo, useState } from "react";

type WorkoutDay = {
  date: string; // YYYY-MM-DD
  title: string;
  duration_minutes: number | null;
  has_pr: boolean;
};

type Props = {
  workouts: WorkoutDay[];
  /** How many weeks back to show. Default 14 (3 months ≈ 14 weeks) */
  weeks?: number;
};

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function WorkoutHeatmapCalendar({ workouts, weeks = 14 }: Props) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const workoutMap = useMemo(() => {
    const m = new Map<string, WorkoutDay[]>();
    for (const w of workouts) {
      const key = w.date.slice(0, 10);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(w);
    }
    return m;
  }, [workouts]);

  // Build grid: `weeks` columns × 7 rows (Sun-Sat)
  const today = new Date();
  const todayYMD = toYMD(today);

  // Start from Sunday of the week `weeks-1` weeks ago
  const gridStart = new Date(today);
  gridStart.setDate(today.getDate() - today.getDay() - 7 * (weeks - 1));

  const columns: Array<{ weekLabel: string; days: Array<{ ymd: string; isToday: boolean; isFuture: boolean }> }> = [];

  for (let w = 0; w < weeks; w++) {
    const colStart = new Date(gridStart);
    colStart.setDate(gridStart.getDate() + w * 7);
    const monthName = colStart.toLocaleDateString("en", { month: "short" });
    const days = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(colStart);
      day.setDate(colStart.getDate() + d);
      const ymd = toYMD(day);
      days.push({ ymd, isToday: ymd === todayYMD, isFuture: ymd > todayYMD });
    }
    // Only show month label on first week of month
    const prevColStart = new Date(colStart);
    prevColStart.setDate(colStart.getDate() - 7);
    const showLabel = colStart.getMonth() !== prevColStart.getMonth() || w === 0;
    columns.push({ weekLabel: showLabel ? monthName : "", days });
  }

  function cellClass(ymd: string, isFuture: boolean, isToday: boolean): string {
    if (isFuture) return "bg-muted/20 border border-border/30 rounded-sm";
    const days = workoutMap.get(ymd);
    if (!days || days.length === 0) return "bg-muted/40 border border-border/40 rounded-sm hover:bg-muted/70 cursor-default";
    const hasPr = days.some((d) => d.has_pr);
    if (hasPr) return "bg-amber-500/80 border border-amber-400 rounded-sm cursor-pointer hover:bg-amber-500";
    return "bg-primary/70 border border-primary/80 rounded-sm cursor-pointer hover:bg-primary/90";
  }

  function handleMouseEnter(e: React.MouseEvent, ymd: string) {
    const days = workoutMap.get(ymd);
    if (!days || days.length === 0) return;
    const date = new Date(ymd + "T12:00:00");
    const dateStr = date.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "short" });
    const lines = days.map((d) => {
      const dur = d.duration_minutes ? ` · ${d.duration_minutes}min` : "";
      const pr = d.has_pr ? " 🏆" : "";
      return `${d.title}${dur}${pr}`;
    });
    setTooltip({ text: [dateStr, ...lines].join("\n"), x: e.clientX, y: e.clientY });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <div className="relative select-none">
      {/* Month labels row */}
      <div className="flex gap-[3px] mb-1 ml-5">
        {columns.map((col, i) => (
          <div key={i} className="w-[14px] shrink-0 text-[9px] text-muted-foreground">
            {col.weekLabel}
          </div>
        ))}
      </div>

      <div className="flex gap-[3px]">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="h-[14px] w-4 text-[9px] text-muted-foreground flex items-center">
              {i % 2 === 1 ? l : ""}
            </div>
          ))}
        </div>

        {/* Grid */}
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.days.map((day) => (
              <div
                key={day.ymd}
                className={`h-[14px] w-[14px] transition-colors duration-100 ${cellClass(day.ymd, day.isFuture, day.isToday)} ${day.isToday ? "ring-1 ring-primary ring-offset-1" : ""}`}
                onMouseEnter={(e) => handleMouseEnter(e, day.ymd)}
                onMouseLeave={handleMouseLeave}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-popover border border-border shadow-lg rounded-lg px-3 py-2 text-xs max-w-[200px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          {tooltip.text.split("\n").map((line, i) => (
            <p key={i} className={i === 0 ? "font-semibold text-foreground mb-1" : "text-muted-foreground"}>{line}</p>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-sm bg-muted/40 border border-border/40" />
          Rest
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-sm bg-primary/70 border border-primary/80" />
          Workout
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-sm bg-amber-500/80 border border-amber-400" />
          PR day
        </span>
      </div>
    </div>
  );
}
