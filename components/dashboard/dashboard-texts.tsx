"use client";

/**
 * Thin client wrappers that inject translated strings into the
 * otherwise-static Server Component dashboard page.
 */

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { TrendingUp, Dumbbell, Scale, CalendarDays, ArrowRight, Trophy } from "lucide-react";
import type { PrHighlight, WorkoutRow, BodyLogRow, GymSessionRow } from "@/types/database";
import { getSessionGym } from "@/types/database";

export function DashboardGreeting({ name }: { name?: string }) {
  const { t, lang } = useLanguage();
  const date = new Date().toLocaleDateString(lang === "ro" ? "ro-RO" : "en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight">
        {t.dashboard.greeting}{name ? `, ${name.split(" ")[0]}` : ""} 👋
      </h1>
      <p className="text-sm text-muted-foreground mt-1">{date}</p>
    </div>
  );
}

export function DashboardChallengeBanner() {
  const { t } = useLanguage();
  return (
    <Link
      href="/challenges"
      className="animate-fade-up group flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4 hover:bg-primary/10 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Trophy size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
            {t.challenges.title}
          </p>
          <p className="font-bold text-foreground">{t.dashboard.weeklyGoal}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.dashboard.viewAll} &amp; {t.friends.title.toLowerCase()}
          </p>
        </div>
      </div>
      <ArrowRight size={18} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
    </Link>
  );
}

export function GoalProgressCard({
  goalLabel, currentWeight, targetWeight, goalProgressPercent,
}: {
  goalLabel: string;
  currentWeight: number | null;
  targetWeight: number | null;
  goalProgressPercent: number | null;
}) {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-up rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t.onboarding.goal}</h2>
        <span className="text-xs rounded-lg bg-muted px-2.5 py-1 text-muted-foreground font-medium">{goalLabel}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {currentWeight && targetWeight
          ? `${currentWeight} kg → ${targetWeight} kg`
          : t.dashboard.noRecentActivity}
      </p>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${goalProgressPercent ?? 0}%` }} />
      </div>
      <p className="text-xs font-semibold text-primary">
        {goalProgressPercent !== null ? `${goalProgressPercent}%` : t.common.noData}
      </p>
    </div>
  );
}

export function AdherenceCard({
  recentCount, targetPerWeek, adherencePercent,
}: {
  recentCount: number;
  targetPerWeek: number | null | undefined;
  adherencePercent: number | null;
}) {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-up rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t.dashboard.weeklyGoal}</h2>
        <span className="text-xs rounded-lg bg-muted px-2.5 py-1 text-muted-foreground font-medium">
          {targetPerWeek ?? "—"} {t.onboarding.trainingDays.split("/")[0].trim()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {targetPerWeek
          ? `${recentCount} / ${targetPerWeek} ${t.dashboard.workoutsThisWeek}`
          : t.common.noData}
      </p>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${adherencePercent ?? 0}%` }} />
      </div>
      <p className="text-xs font-semibold text-primary">
        {adherencePercent !== null ? `${adherencePercent}%` : t.common.noData}
      </p>
    </div>
  );
}

export function CoachCard({
  message, gymName, gymCity, experienceLevel,
}: {
  message: string;
  gymName?: string;
  gymCity?: string;
  experienceLevel?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-up rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t.dashboard.coachTip}</h2>
        <span className="text-xs rounded-lg bg-muted px-2.5 py-1 text-muted-foreground font-medium capitalize">
          {experienceLevel ?? "general"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
      <div className="rounded-xl bg-muted/50 px-3 py-2.5">
        <p className="text-xs font-semibold">{gymName ?? t.onboarding.preferredGym}</p>
        <p className="text-xs text-muted-foreground">{gymCity ?? t.common.noData}</p>
      </div>
    </div>
  );
}

export function PrCard({ highlights }: { highlights: PrHighlight[] }) {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-up rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp size={15} className="text-primary" /> PR highlights
        </h2>
        <Link href="/workouts" className="text-xs text-primary hover:underline font-medium">
          {t.dashboard.viewAll} →
        </Link>
      </div>
      {highlights.length > 0 ? (
        <div className="space-y-2">
          {highlights.map((pr) => (
            <div key={pr.exerciseName} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5 hover:bg-muted/60 transition-colors">
              <div>
                <p className="text-sm font-semibold">{pr.exerciseName}</p>
                <p className="text-xs text-muted-foreground">{pr.weight} kg × {pr.reps} reps</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary tabular">{pr.estimated1RM.toFixed(1)} kg</p>
                <p className="text-xs text-muted-foreground">est. 1RM</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-6 text-center">{t.workouts.noWorkouts}</p>
      )}
    </div>
  );
}

export function RecentWorkoutsCard({ workouts }: { workouts: WorkoutRow[] }) {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-up rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Dumbbell size={15} className="text-primary" /> {t.dashboard.recentActivity}
        </h2>
        <Link href="/workouts" className="text-xs text-primary hover:underline font-medium">
          {t.dashboard.viewAll} →
        </Link>
      </div>
      {workouts.length > 0 ? (
        <div className="space-y-2">
          {workouts.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5 hover:bg-muted/60 transition-colors">
              <div>
                <p className="text-sm font-semibold">{w.title}</p>
                <p className="text-xs text-muted-foreground">{w.workout_date}</p>
              </div>
              {w.duration_minutes && (
                <span className="text-xs text-muted-foreground bg-muted rounded-lg px-2 py-1 font-medium">
                  {w.duration_minutes} {t.workouts.minutes}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-6 text-center">{t.workouts.noWorkouts}</p>
      )}
    </div>
  );
}

export function BodyLogsCard({ logs }: { logs: BodyLogRow[] }) {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-up rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Scale size={15} className="text-primary" /> Body logs
        </h2>
        <Link href="/nutrition" className="text-xs text-primary hover:underline font-medium">
          {t.dashboard.viewAll} →
        </Link>
      </div>
      {logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5 hover:bg-muted/60 transition-colors">
              <div>
                <p className="text-sm font-semibold">{log.weight_kg} kg</p>
                <p className="text-xs text-muted-foreground">{log.log_date}</p>
              </div>
              {log.body_fat_percent && (
                <span className="text-xs text-muted-foreground bg-muted rounded-lg px-2 py-1 font-medium">
                  {log.body_fat_percent}% BF
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-6 text-center">{t.common.noData}</p>
      )}
    </div>
  );
}

export function UpcomingSessionsCard({ sessions }: { sessions: GymSessionRow[] }) {
  const { t, lang } = useLanguage();
  return (
    <div className="animate-fade-up rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <CalendarDays size={15} className="text-primary" /> {t.sessions.title}
        </h2>
        <Link href="/sessions" className="text-xs text-primary hover:underline font-medium">
          {t.dashboard.viewAll} →
        </Link>
      </div>
      {sessions.length > 0 ? (
        <div className="space-y-2">
          {sessions.map((session) => {
            const gym = getSessionGym(session.gyms);
            return (
              <div key={session.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5 hover:bg-muted/60 transition-colors">
                <div>
                  <p className="text-sm font-semibold">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.scheduled_for).toLocaleDateString(
                      lang === "ro" ? "ro-RO" : "en-GB",
                      { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted rounded-lg px-2 py-1 font-medium shrink-0">
                  {gym?.name ?? "Gym"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-6 text-center">{t.sessions.noSessions}</p>
      )}
    </div>
  );
}

export function DashboardSectionLabel({ label }: { label: string }) {
  return <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>;
}
