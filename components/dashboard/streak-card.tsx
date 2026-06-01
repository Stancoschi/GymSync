"use client";

import { useEffect, useState } from "react";

interface StreakCardProps {
  dailyStreak: number;
  consistencyScore: number;
  targetPerWeek: number | null;
  workoutsThisWeek: number;
}

export function StreakCard({ dailyStreak, consistencyScore, targetPerWeek, workoutsThisWeek }: StreakCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isOnFire = dailyStreak >= 7;
  const barColor = consistencyScore >= 80 ? "bg-green-500" : consistencyScore >= 50 ? "bg-primary" : "bg-orange-400";

  return (
    <div className={`rounded-2xl border p-5 space-y-4 transition-colors ${
      isOnFire ? "border-orange-400/40 bg-orange-50/50 dark:bg-orange-950/10" : "border-border bg-card"
    }`}>
      {/* Streak */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Daily streak</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className={`text-3xl font-bold tabular-nums ${
              isOnFire ? "text-orange-500" : dailyStreak > 0 ? "text-primary" : "text-muted-foreground"
            }`}>
              {dailyStreak}d
            </p>
            {mounted && isOnFire && (
              <span
                className="text-2xl animate-bounce"
                style={{ animationDuration: "0.8s" }}
                title="On fire!"
              >
                🔥
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {dailyStreak === 0
              ? "Log a workout to start your streak"
              : dailyStreak === 1
              ? "1 day — keep going!"
              : `${dailyStreak} days in a row!`}
          </p>
        </div>

        {/* Mini fire dots */}
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < dailyStreak ? (isOnFire ? "bg-orange-400" : "bg-primary") : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Consistency score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Consistency score (7d)</span>
          <span className={`font-bold ${
            consistencyScore >= 80 ? "text-green-600 dark:text-green-400" :
            consistencyScore >= 50 ? "text-primary" : "text-orange-500"
          }`}>{consistencyScore}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: mounted ? `${consistencyScore}%` : "0%" }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {targetPerWeek
            ? `${workoutsThisWeek} of ${targetPerWeek} workouts this week`
            : "Set a weekly target in your profile"}
        </p>
      </div>
    </div>
  );
}
