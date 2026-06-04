"use client";

import { useMemo, useState } from "react";
import { buildDayVolumeMap, volumeIntensity, getDaysInMonth, firstDayOffset, fmtVolume } from "@/lib/volume-calendar";
import type { SetLogRow } from "@/lib/volume-calendar";

const DAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const INTENSITY_CLS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted text-muted-foreground/40",
  1: "bg-primary/15 text-primary/50",
  2: "bg-primary/35 text-primary/70",
  3: "bg-primary/60 text-primary/90",
  4: "bg-primary text-primary-foreground",
};

interface Props {
  /** Raw set log rows passed from the Server Component */
  rows: SetLogRow[];
  /** Initial year/month to display (defaults to current month) */
  initialYear?: number;
  initialMonth?: number; // 0-based
}

export function ProgressCalendar({ rows, initialYear, initialMonth }: Props) {
  const now = new Date();
  const [year, setYear]   = useState(initialYear  ?? now.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? now.getMonth());
  const [tooltip, setTooltip] = useState<{ date: string; volume: number; sets: number } | null>(null);

  const todayYMD = now.toISOString().split("T")[0];

  // Build volume map once from all rows
  const volumeMap = useMemo(() => buildDayVolumeMap(rows), [rows]);

  // Days in current view month
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const offset = useMemo(() => firstDayOffset(year, month), [year, month]);

  // Max volume in this month for relative intensity
  const monthMax = useMemo(() => {
    let max = 0;
    for (const d of days) {
      const v = volumeMap.get(d)?.volume ?? 0;
      if (v > max) max = v;
    }
    return max;
  }, [days, volumeMap]);

  // Monthly totals
  const monthTotals = useMemo(() => {
    let totalVol = 0, totalSets = 0, activeDays = 0;
    for (const d of days) {
      const entry = volumeMap.get(d);
      if (entry) { totalVol += entry.volume; totalSets += entry.sets; activeDays++; }
    }
    return { totalVol, totalSets, activeDays };
  }, [days, volumeMap]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    const n = new Date();
    if (year > n.getFullYear() || (year === n.getFullYear() && month >= n.getMonth())) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const isNextDisabled = year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth());

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Progress calendar</h2>
          <p className="text-xs text-muted-foreground">Daily training volume · sets × reps × kg</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Previous month"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="text-xs font-medium w-32 text-center tabular-nums">{monthLabel}</span>
          <button
            onClick={nextMonth}
            disabled={isNextDisabled}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Next month"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Monthly summary chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Volume", value: fmtVolume(monthTotals.totalVol) },
          { label: "Sets",   value: monthTotals.totalSets.toString() },
          { label: "Days",   value: monthTotals.activeDays.toString() },
        ].map((chip) => (
          <div key={chip.label} className="rounded-xl bg-muted px-3 py-1.5 flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{chip.label}</span>
            <span className="text-xs font-semibold tabular-nums">{chip.value}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div>
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((h) => (
            <div key={h} className="text-center text-[10px] font-medium text-muted-foreground py-1">{h}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-1">
          {/* Offset empty cells */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((date) => {
            const entry   = volumeMap.get(date);
            const volume  = entry?.volume ?? 0;
            const sets    = entry?.sets ?? 0;
            const isFuture = date > todayYMD;
            const isToday  = date === todayYMD;
            const bucket   = isFuture ? 0 : volumeIntensity(volume, monthMax);
            const dayNum   = parseInt(date.split("-")[2], 10);

            return (
              <div
                key={date}
                role="img"
                aria-label={`${date}: ${volume > 0 ? fmtVolume(volume) : "rest day"}`}
                className={[
                  "relative aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium",
                  "transition-all duration-150 cursor-default select-none",
                  INTENSITY_CLS[bucket],
                  isFuture ? "opacity-20" : "hover:ring-2 hover:ring-primary/40 hover:ring-offset-1 hover:ring-offset-card",
                  isToday  ? "ring-2 ring-primary ring-offset-1 ring-offset-card font-bold" : "",
                ].join(" ")}
                onMouseEnter={() => !isFuture && setTooltip({ date, volume, sets })}
                onMouseLeave={() => setTooltip(null)}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="pointer-events-none rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-md space-y-0.5 w-fit">
          <p className="font-semibold text-foreground">
            {new Date(tooltip.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </p>
          {tooltip.volume > 0 ? (
            <>
              <p className="text-muted-foreground">{fmtVolume(tooltip.volume)} total volume</p>
              <p className="text-muted-foreground">{tooltip.sets} sets completed</p>
            </>
          ) : (
            <p className="text-muted-foreground">Rest day</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Low</span>
        {([0, 1, 2, 3, 4] as const).map((lvl) => (
          <div key={lvl} className={`w-3 h-3 rounded-sm ${INTENSITY_CLS[lvl].split(" ")[0]}`} />
        ))}
        <span>Peak</span>
      </div>
    </div>
  );
}
