"use client";

import type { ReadinessResult } from "@/lib/fatigue";

const COLOR_MAP = {
  green:  { ring: "stroke-emerald-500",  text: "text-emerald-600 dark:text-emerald-400",  bg: "bg-emerald-500/10 border-emerald-500/20" },
  blue:   { ring: "stroke-blue-500",     text: "text-blue-600 dark:text-blue-400",         bg: "bg-blue-500/10 border-blue-500/20" },
  yellow: { ring: "stroke-yellow-500",   text: "text-yellow-600 dark:text-yellow-400",    bg: "bg-yellow-500/10 border-yellow-500/20" },
  red:    { ring: "stroke-rose-500",     text: "text-rose-600 dark:text-rose-400",         bg: "bg-rose-500/10 border-rose-500/20" },
} as const;

const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40

interface Props {
  result: ReadinessResult;
  workoutsThisWeek: number;
  targetPerWeek: number | null | undefined;
}

export function ReadinessScore({ result, workoutsThisWeek, targetPerWeek }: Props) {
  const { score, label, color, advice, breakdown } = result;
  const c = COLOR_MAP[color];
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);

  const bars = [
    {
      label: "Weekly volume",
      value: breakdown.volumeFatigue,
      max: 40,
      description: `${workoutsThisWeek}${targetPerWeek ? `/${targetPerWeek}` : ""} workouts this week`,
      inverted: true, // higher = more fatigue = bad
    },
    {
      label: "Consecutive days",
      value: breakdown.consecutivePenalty,
      max: 30,
      description: breakdown.consecutivePenalty === 0 ? "No back-to-back fatigue" : `${breakdown.consecutivePenalty / 10 + 1} days in a row`,
      inverted: true,
    },
    {
      label: "Recovery bonus",
      value: breakdown.restBonus,
      max: 30,
      description: breakdown.restBonus === 30 ? "2+ days since last session" : breakdown.restBonus === 15 ? "1 day rest" : "Trained today",
      inverted: false, // higher = more rest = good
    },
  ];

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${c.bg}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Readiness score</h2>
        <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${c.bg} ${c.text}`}>
          {label}
        </span>
      </div>

      {/* Ring + score */}
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90" aria-label={`Readiness score: ${score}`}>
            {/* Track */}
            <circle cx="48" cy="48" r="40" fill="none" className="stroke-muted" strokeWidth="8" />
            {/* Progress */}
            <circle
              cx="48" cy="48" r="40"
              fill="none"
              className={c.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold tabular-nums leading-none ${c.text}`}>{score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed flex-1">{advice}</p>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2.5">
        {bars.map((bar) => {
          const pct = Math.round((bar.value / bar.max) * 100);
          const barColor = bar.inverted
            ? pct > 75 ? "bg-rose-500" : pct > 40 ? "bg-yellow-500" : "bg-emerald-500"
            : pct > 60 ? "bg-emerald-500" : pct > 30 ? "bg-yellow-500" : "bg-rose-500";
          return (
            <div key={bar.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{bar.label}</span>
                <span className="text-xs text-muted-foreground">{bar.description}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
