"use client";

import { useMemo, useRef, useState } from "react";

interface WorkoutDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface WorkoutHeatmapProps {
  data: WorkoutDay[];
  weeks?: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CELL = 13;
const GAP = 3;
const STEP = CELL + GAP;

function toYMD(date: Date): string {
  return date.toISOString().split("T")[0];
}

function intensityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

const CELL_CLS: Record<number, string> = {
  0: "bg-muted",
  1: "bg-primary/20",
  2: "bg-primary/40",
  3: "bg-primary/65",
  4: "bg-primary",
};

const LEGEND_CLS: Record<number, string> = {
  0: "bg-muted",
  1: "bg-primary/20",
  2: "bg-primary/40",
  3: "bg-primary/65",
  4: "bg-primary",
};

function formatTooltipDate(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function WorkoutHeatmap({ data, weeks = 16 }: WorkoutHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const countMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) m.set(d.date, d.count);
    return m;
  }, [data]);

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayYMD = toYMD(today);

    // Monday of the current week
    const dow = today.getDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    const startMonday = new Date(today);
    startMonday.setDate(today.getDate() - mondayOffset - (weeks - 1) * 7);

    const cols: Array<{
      monthLabel: string;
      days: Array<{ date: string; count: number; isFuture: boolean; isToday: boolean }>;
    }> = [];

    for (let w = 0; w < weeks; w++) {
      const weekStart = new Date(startMonday);
      weekStart.setDate(startMonday.getDate() + w * 7);
      const monthLabel = weekStart.toLocaleDateString("en-GB", { month: "short" });
      const days = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + d);
        const ymd = toYMD(day);
        days.push({
          date: ymd,
          count: countMap.get(ymd) ?? 0,
          isFuture: ymd > todayYMD,
          isToday: ymd === todayYMD,
        });
      }
      cols.push({ monthLabel, days });
    }

    // Month label positions — show when month changes
    const mLabels: Array<{ col: number; label: string }> = [];
    let lastMonth = "";
    cols.forEach((col, i) => {
      if (col.monthLabel !== lastMonth) {
        mLabels.push({ col: i, label: col.monthLabel });
        lastMonth = col.monthLabel;
      }
    });

    return { grid: cols, monthLabels: mLabels };
  }, [countMap, weeks]);

  const totalWorkouts = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);
  const totalDays = useMemo(() => data.filter((d) => d.count > 0).length, [data]);
  const gridWidth = grid.length * STEP - GAP;

  function handleEnter(e: React.MouseEvent, day: { date: string; count: number; isFuture: boolean }) {
    if (day.isFuture) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const parentRect = containerRef.current!.getBoundingClientRect();
    setTooltip({
      date: day.date,
      count: day.count,
      x: rect.left - parentRect.left + CELL / 2,
      y: rect.top - parentRect.top,
    });
  }

  return (
    <div className="space-y-3">
      {/* Mini stats */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span><span className="font-semibold text-foreground">{totalWorkouts}</span> workouts</span>
        <span><span className="font-semibold text-foreground">{totalDays}</span> days trained</span>
        <span>last <span className="font-semibold text-foreground">{weeks}</span> weeks</span>
      </div>

      {/* Heatmap scroll container */}
      <div ref={containerRef} className="relative overflow-x-auto pb-1 select-none">
        <div className="inline-flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col shrink-0 mr-1" style={{ marginTop: 20 }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={label}
                className="text-[10px] text-muted-foreground text-right pr-1 w-7"
                style={{ height: CELL, lineHeight: `${CELL}px`, marginBottom: i < 6 ? GAP : 0 }}
              >
                {[0, 2, 4, 6].includes(i) ? label : ""}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          <div>
            {/* Month labels */}
            <div className="relative h-5" style={{ width: gridWidth }}>
              {monthLabels.map(({ col, label }) => (
                <span
                  key={`${col}-${label}`}
                  className="absolute text-[10px] text-muted-foreground"
                  style={{ left: col * STEP }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Day cells */}
            <div className="flex" style={{ gap: GAP }}>
              {grid.map((col, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {col.days.map((day) => {
                    const lvl = day.isFuture ? 0 : intensityLevel(day.count);
                    return (
                      <div
                        key={day.date}
                        role="img"
                        aria-label={`${day.date}: ${day.count} workout${day.count !== 1 ? "s" : ""}`}
                        style={{ width: CELL, height: CELL }}
                        className={[
                          "rounded-[3px] cursor-default transition-colors",
                          CELL_CLS[lvl],
                          day.isFuture ? "opacity-25" : "hover:ring-1 hover:ring-primary/50",
                          day.isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : "",
                        ].join(" ")}
                        onMouseEnter={(e) => handleEnter(e, day)}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tooltip — positioned relative to containerRef */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-lg whitespace-nowrap"
            style={{ left: tooltip.x, top: tooltip.y - 6 }}
          >
            <p className="font-medium text-foreground">{formatTooltipDate(tooltip.date)}</p>
            <p className="text-muted-foreground">
              {tooltip.count === 0 ? "No workouts" : `${tooltip.count} workout${tooltip.count !== 1 ? "s" : ""}`}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((lvl) => (
          <div
            key={lvl}
            style={{ width: 11, height: 11 }}
            className={`rounded-[2px] ${LEGEND_CLS[lvl]}`}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
