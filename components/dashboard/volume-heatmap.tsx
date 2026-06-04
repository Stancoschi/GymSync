"use client";

import { useMemo, useRef, useState } from "react";
import type { VolumeDayEntry } from "@/lib/volume-heatmap-data";

interface VolumeHeatmapProps {
  data: VolumeDayEntry[];
  weeks?: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CELL = 13;
const GAP = 3;
const STEP = CELL + GAP;

function toYMD(date: Date): string {
  return date.toISOString().split("T")[0];
}

// 5 intensity levels based on percentile of volume across all trained days
function computeIntensityMap(
  data: VolumeDayEntry[]
): Map<string, 0 | 1 | 2 | 3 | 4> {
  const trained = data.filter((d) => d.volumeKg > 0);
  if (trained.length === 0) return new Map();

  const sorted = [...trained].sort((a, b) => a.volumeKg - b.volumeKg);
  const len = sorted.length;

  const result = new Map<string, 0 | 1 | 2 | 3 | 4>();
  for (let i = 0; i < len; i++) {
    const pct = (i + 1) / len;
    let level: 1 | 2 | 3 | 4;
    if (pct <= 0.25) level = 1;
    else if (pct <= 0.5) level = 2;
    else if (pct <= 0.75) level = 3;
    else level = 4;
    result.set(sorted[i].date, level);
  }
  return result;
}

const CELL_CLS: Record<number, string> = {
  0: "bg-muted",
  1: "bg-orange-400/25",
  2: "bg-orange-400/50",
  3: "bg-orange-500/75",
  4: "bg-orange-500",
};

function formatTooltipDate(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg.toLocaleString()} kg`;
}

export function VolumeHeatmap({ data, weeks = 16 }: VolumeHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    date: string;
    volumeKg: number;
    sets: number;
    x: number;
    y: number;
  } | null>(null);

  // Build lookup maps
  const dataMap = useMemo(() => {
    const m = new Map<string, VolumeDayEntry>();
    for (const d of data) m.set(d.date, d);
    return m;
  }, [data]);

  const intensityMap = useMemo(() => computeIntensityMap(data), [data]);

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayYMD = toYMD(today);

    const dow = today.getDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    const startMonday = new Date(today);
    startMonday.setDate(today.getDate() - mondayOffset - (weeks - 1) * 7);

    const cols: Array<{
      monthLabel: string;
      days: Array<{
        date: string;
        volumeKg: number;
        sets: number;
        isFuture: boolean;
        isToday: boolean;
        intensity: 0 | 1 | 2 | 3 | 4;
      }>;
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
        const entry = dataMap.get(ymd);
        days.push({
          date: ymd,
          volumeKg: entry?.volumeKg ?? 0,
          sets: entry?.sets ?? 0,
          isFuture: ymd > todayYMD,
          isToday: ymd === todayYMD,
          intensity: (ymd > todayYMD ? 0 : (intensityMap.get(ymd) ?? 0)) as 0 | 1 | 2 | 3 | 4,
        });
      }
      cols.push({ monthLabel, days });
    }

    const mLabels: Array<{ col: number; label: string }> = [];
    let lastMonth = "";
    cols.forEach((col, i) => {
      if (col.monthLabel !== lastMonth) {
        mLabels.push({ col: i, label: col.monthLabel });
        lastMonth = col.monthLabel;
      }
    });

    return { grid: cols, monthLabels: mLabels };
  }, [dataMap, intensityMap, weeks]);

  // Summary stats
  const totalVolume = useMemo(() => data.reduce((s, d) => s + d.volumeKg, 0), [data]);
  const totalSets = useMemo(() => data.reduce((s, d) => s + d.sets, 0), [data]);
  const daysWithVolume = useMemo(() => data.filter((d) => d.volumeKg > 0).length, [data]);
  const peakDay = useMemo(() => [...data].sort((a, b) => b.volumeKg - a.volumeKg)[0], [data]);

  const gridWidth = grid.length * STEP - GAP;

  function handleEnter(
    e: React.MouseEvent,
    day: { date: string; volumeKg: number; sets: number; isFuture: boolean }
  ) {
    if (day.isFuture) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const parentRect = containerRef.current!.getBoundingClientRect();
    setTooltip({
      date: day.date,
      volumeKg: day.volumeKg,
      sets: day.sets,
      x: rect.left - parentRect.left + CELL / 2,
      y: rect.top - parentRect.top,
    });
  }

  return (
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{formatVolume(totalVolume)}</span> total volume
        </span>
        <span>
          <span className="font-semibold text-foreground">{totalSets.toLocaleString()}</span> sets
        </span>
        <span>
          <span className="font-semibold text-foreground">{daysWithVolume}</span> days trained
        </span>
        {peakDay && peakDay.volumeKg > 0 && (
          <span>
            Peak: <span className="font-semibold text-foreground">{formatVolume(peakDay.volumeKg)}</span>
          </span>
        )}
      </div>

      {/* Heatmap scroll wrapper */}
      <div ref={containerRef} className="relative overflow-x-auto pb-1 select-none">
        <div className="inline-flex gap-1">
          {/* Day axis */}
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

          {/* Grid */}
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

            {/* Cells */}
            <div className="flex" style={{ gap: GAP }}>
              {grid.map((col, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {col.days.map((day) => (
                    <div
                      key={day.date}
                      role="img"
                      aria-label={`${
                        day.date
                      }: ${
                        day.volumeKg > 0 ? `${day.volumeKg} kg volume` : "Rest day"
                      }`}
                      style={{ width: CELL, height: CELL }}
                      className={[
                        "rounded-[3px] cursor-default transition-colors",
                        CELL_CLS[day.intensity],
                        day.isFuture ? "opacity-20" : "hover:ring-1 hover:ring-orange-400/60",
                        day.isToday ? "ring-2 ring-orange-500 ring-offset-1 ring-offset-card" : "",
                      ].join(" ")}
                      onMouseEnter={(e) => handleEnter(e, day)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-lg whitespace-nowrap"
            style={{ left: tooltip.x, top: tooltip.y - 6 }}
          >
            <p className="font-medium text-foreground">{formatTooltipDate(tooltip.date)}</p>
            {tooltip.volumeKg > 0 ? (
              <>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-orange-500">{formatVolume(tooltip.volumeKg)}</span> volume
                </p>
                <p className="text-muted-foreground">{tooltip.sets} set{tooltip.sets !== 1 ? "s" : ""} completed</p>
              </>
            ) : (
              <p className="text-muted-foreground">Rest day</p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Lower</span>
        {([0, 1, 2, 3, 4] as const).map((lvl) => (
          <div
            key={lvl}
            style={{ width: 11, height: 11 }}
            className={`rounded-[2px] ${CELL_CLS[lvl]}`}
          />
        ))}
        <span>Higher volume</span>
      </div>
    </div>
  );
}
