"use client";

import type { ReadinessResult } from "@/lib/fatigue";

const SCORE_CONFIG = {
  green: {
    ring: "#22c55e",
    trackOpacity: "oklch(0.72 0.21 148 / 0.12)",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    scoreText: "text-emerald-400",
    label: "Ready",
  },
  blue: {
    ring: "#60a5fa",
    trackOpacity: "oklch(0.65 0.17 258 / 0.12)",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    scoreText: "text-blue-400",
    label: "Good",
  },
  yellow: {
    ring: "#facc15",
    trackOpacity: "oklch(0.70 0.19 88 / 0.12)",
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    scoreText: "text-yellow-400",
    label: "Moderate",
  },
  red: {
    ring: "#f87171",
    trackOpacity: "oklch(0.63 0.21 25 / 0.12)",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    scoreText: "text-rose-400",
    label: "Rest",
  },
} as const;

const R = 40;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface Props {
  result: ReadinessResult;
  workoutsThisWeek: number;
  targetPerWeek: number | null | undefined;
}

export function ReadinessScore({ result, workoutsThisWeek, targetPerWeek }: Props) {
  const { score, label, color, advice, breakdown } = result;
  const cfg = SCORE_CONFIG[color];
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);

  const bars = [
    {
      key: "volume",
      label: "Weekly volume",
      value: breakdown.volumeFatigue,
      max: 40,
      description: `${workoutsThisWeek}${targetPerWeek ? `/${targetPerWeek}` : ""} workouts this week`,
      inverted: true,
    },
    {
      key: "consecutive",
      label: "Consecutive days",
      value: breakdown.consecutivePenalty,
      max: 30,
      description:
        breakdown.consecutivePenalty === 0
          ? "No back-to-back fatigue"
          : `${breakdown.consecutivePenalty / 10 + 1} days in a row`,
      inverted: true,
    },
    {
      key: "recovery",
      label: "Recovery bonus",
      value: breakdown.restBonus,
      max: 30,
      description:
        breakdown.restBonus === 30
          ? "2+ days rest"
          : breakdown.restBonus === 15
          ? "1 day rest"
          : "Trained today",
      inverted: false,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Readiness score</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.badge}`}>
          {label}
        </span>
      </div>

      {/* Arc + score + advice */}
      <div className="flex items-center gap-6">
        {/* SVG arc */}
        <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            style={{ transform: "rotate(-90deg)" }}
            aria-label={`Readiness: ${score}/100`}
          >
            {/* Glow filter */}
            <defs>
              <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle
              cx="50" cy="50" r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            {/* Arc */}
            <circle
              cx="50" cy="50" r={R}
              fill="none"
              stroke={cfg.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              filter="url(#ring-glow)"
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </svg>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className={`text-2xl font-extrabold tabular-nums leading-none ${cfg.scoreText}`}>
              {score}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">/ 100</span>
          </div>
        </div>

        {/* Advice */}
        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">{advice}</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.ring }} />
            <span className="text-xs font-medium" style={{ color: cfg.ring }}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-3 pt-1 border-t border-border">
        {bars.map((bar) => {
          const pct = Math.round((bar.value / bar.max) * 100);
          const barColor = bar.inverted
            ? pct > 75 ? "#f87171" : pct > 40 ? "#facc15" : "#22c55e"
            : pct > 60 ? "#22c55e" : pct > 30 ? "#facc15" : "#f87171";
          return (
            <div key={bar.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{bar.label}</span>
                <span className="text-xs text-muted-foreground">{bar.description}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
