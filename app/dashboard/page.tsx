import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutRow, BodyLogRow, GymSessionRow, PrHighlight } from "@/types/database";
import { getSessionGym } from "@/types/database";
import { WeightChart } from "@/components/dashboard/weight-chart";
import { WorkoutVolumeChart } from "@/components/dashboard/workout-volume-chart";
import { WorkoutHeatmap } from "@/components/dashboard/workout-heatmap";

function startOfLast7Days() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
}
function startOfLastNWeeks(n: number) {
  const date = new Date();
  date.setDate(date.getDate() - n * 7);
  return date.toISOString().split("T")[0];
}
function getGoalLabel(goal: string | null | undefined) {
  switch (goal) {
    case "lose_weight": return "Lose weight";
    case "maintain_weight": return "Maintain";
    case "gain_muscle": return "Gain muscle";
    default: return "Not set";
  }
}
function getGoalProgressPercent(currentWeight: number | null, targetWeight: number | null, goal: string | null) {
  if (!currentWeight || !targetWeight || !goal) return null;
  if (goal === "maintain_weight") { const diff = Math.abs(currentWeight - targetWeight); return Math.max(0, Math.min(100, 100 - diff * 20)); }
  if (goal === "lose_weight") { if (currentWeight <= targetWeight) return 100; return Math.max(0, Math.min(100, 100 - (currentWeight - targetWeight) * 10)); }
  if (goal === "gain_muscle") { if (currentWeight >= targetWeight) return 100; return Math.max(0, Math.min(100, 100 - (targetWeight - currentWeight) * 10)); }
  return null;
}
function getAdherencePercent(completedWorkouts: number, targetWorkouts: number | null | undefined) {
  if (!targetWorkouts || targetWorkouts <= 0) return null;
  return Math.min(100, Math.round((completedWorkouts / targetWorkouts) * 100));
}
function getCoachMessage({ goal, experienceLevel, recentWorkoutsCount, targetPerWeek }: { goal: string | null; experienceLevel: string | null; recentWorkoutsCount: number; targetPerWeek: number | null | undefined; }) {
  if (!goal) return "Complete your profile goals to unlock personalized insights.";
  if (targetPerWeek && recentWorkoutsCount < targetPerWeek) return `${targetPerWeek - recentWorkoutsCount} workout(s) left to hit your weekly target.`;
  if (goal === "gain_muscle" && experienceLevel === "beginner") return "Focus on progressive overload and enough food to support growth.";
  if (goal === "lose_weight") return "Consistency beats intensity — keep training regular and track nutrition.";
  if (goal === "maintain_weight") return "You're in maintenance mode. Aim for stable habits and steady frequency.";
  return "You're on track. Keep building consistency this week.";
}
function getWeekKey(dateString: string) {
  const date = new Date(dateString);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)}`;
}
function getWeekLabel(dateString: string) {
  const date = new Date(dateString);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (dayNum - 1));
  return monday.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}
function calculateWorkoutWeekStreak(workouts: Array<{ workout_date: string }>) {
  if (!workouts.length) return 0;
  const uniqueWeeks = Array.from(new Set(workouts.map((w) => getWeekKey(w.workout_date)))).sort();
  let streak = 0;
  let cursor = new Date();
  for (let i = 0; i < 52; i++) {
    if (uniqueWeeks.includes(getWeekKey(cursor.toISOString()))) { streak++; cursor.setDate(cursor.getDate() - 7); } else break;
  }
  return streak;
}
function calculateEstimated1RM(weight: number, reps: number) { return weight * (1 + reps / 30); }

function buildWeightChartData(logs: Array<{ log_date: string; weight_kg: number | null }>) {
  return logs
    .filter((l) => l.weight_kg !== null)
    .map((l) => ({
      date: new Date(l.log_date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" }),
      weight: Number(l.weight_kg),
    }))
    .reverse();
}

function buildVolumeChartData(workouts: Array<{ workout_date: string }>) {
  const weekMap = new Map<string, { label: string; count: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const key = getWeekKey(d.toISOString());
    const label = getWeekLabel(d.toISOString());
    if (!weekMap.has(key)) weekMap.set(key, { label, count: 0 });
  }
  for (const w of workouts) {
    const key = getWeekKey(w.workout_date);
    const entry = weekMap.get(key);
    if (entry) entry.count++;
  }
  return Array.from(weekMap.values()).map(({ label, count }) => ({ week: label, count }));
}

function buildHeatmapData(
  workouts: Array<{ workout_date: string }>,
  weeks: number
): Array<{ date: string; count: number }> {
  void weeks;
  const dayMap = new Map<string, number>();
  for (const w of workouts) {
    const ymd = w.workout_date.split("T")[0];
    dayMap.set(ymd, (dayMap.get(ymd) ?? 0) + 1);
  }
  return Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const last7Days = startOfLast7Days();
  const last8Weeks = startOfLastNWeeks(8);
  const last6Weeks = startOfLastNWeeks(6);
  const last16Weeks = startOfLastNWeeks(16);

  const [
    profileResult, latestWeightResult, workoutsCountResult,
    recentWorkoutsCountResult, mealsCountResult, sessionsCreatedCountResult,
    sessionsJoinedCountResult, recentWorkoutsResult, recentBodyLogsResult,
    recentSessionsResult, allWorkoutsForStreakResult,
    weightLogsForChartResult, workoutsForVolumeResult, workoutsForHeatmapResult,
  ] = await Promise.all([
    supabase.from("profiles").select(`username, full_name, goal, onboarding_completed, activity_level, training_days_per_week, experience_level, preferred_gym_id, target_weight_kg`).eq("id", user.id).single(),
    supabase.from("body_logs").select("weight_kg, log_date").order("log_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("workouts").select("*", { count: "exact", head: true }),
    supabase.from("workouts").select("*", { count: "exact", head: true }).gte("workout_date", last7Days),
    supabase.from("meals").select("*", { count: "exact", head: true }),
    supabase.from("gym_sessions").select("*", { count: "exact", head: true }).eq("creator_id", user.id),
    supabase.from("gym_session_participants").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("workouts").select("id, title, workout_date, duration_minutes").order("workout_date", { ascending: false }).limit(5),
    supabase.from("body_logs").select("id, log_date, weight_kg, body_fat_percent").order("log_date", { ascending: false }).limit(5),
    supabase.from("gym_sessions").select(`id, title, scheduled_for, max_participants, gyms ( name, city )`).order("scheduled_for", { ascending: true }).limit(5),
    supabase.from("workouts").select("workout_date").order("workout_date", { ascending: false }),
    supabase.from("body_logs").select("log_date, weight_kg").gte("log_date", last8Weeks).order("log_date", { ascending: false }).limit(30),
    supabase.from("workouts").select("workout_date").gte("workout_date", last6Weeks),
    supabase.from("workouts").select("workout_date").gte("workout_date", last16Weeks),
  ]);

  const profile = profileResult.data;
  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  const latestWeight = latestWeightResult.data;
  const workoutsCount = workoutsCountResult.count ?? 0;
  const recentWorkoutsCount = recentWorkoutsCountResult.count ?? 0;
  const mealsCount = mealsCountResult.count ?? 0;
  const sessionsCreatedCount = sessionsCreatedCountResult.count ?? 0;
  const sessionsJoinedCount = sessionsJoinedCountResult.count ?? 0;
  const recentWorkouts = (recentWorkoutsResult.data ?? []) as WorkoutRow[];
  const recentBodyLogs = (recentBodyLogsResult.data ?? []) as BodyLogRow[];
  const recentSessions = (recentSessionsResult.data ?? []) as unknown as GymSessionRow[];
  const allWorkoutsForStreak = allWorkoutsForStreakResult.data ?? [];

  const weightChartData = buildWeightChartData(weightLogsForChartResult.data ?? []);
  const volumeChartData = buildVolumeChartData(workoutsForVolumeResult.data ?? []);
  const heatmapData = buildHeatmapData(workoutsForHeatmapResult.data ?? [], 16);

  const preferredGymResult = profile?.preferred_gym_id
    ? await supabase.from("gyms").select("id, name, city").eq("id", profile.preferred_gym_id).maybeSingle()
    : { data: null };

  const workoutWeekStreak = calculateWorkoutWeekStreak(allWorkoutsForStreak);

  // ─── PR Highlights: 3 separate queries ───────────────────────────────────────────────────────
  // PostgREST silently returns 0 rows when filtering on nested join columns
  // (e.g. .eq("workout_session_exercises.workout_sessions.user_id", id)).
  // Solution: resolve user session IDs first, then chain two more queries.
  // workout_session_exercises.exercise_id → exercise_library (not exercises).
  // ────────────────────────────────────────────────────────────────────────────────
  const prHighlights: PrHighlight[] = await (async () => {
    // Step 1: get this user's completed workout_session IDs
    const { data: userSessions } = await supabase
      .from("workout_sessions")
      .select("id, completed_at")
      .eq("user_id", user.id)
      .eq("status", "completed");

    if (!userSessions || userSessions.length === 0) return [];

    const sessionIds = userSessions.map((s) => s.id);
    const sessionDateMap = new Map<string, string>(
      userSessions.map((s) => [s.id, s.completed_at as string])
    );

    // Step 2: get workout_session_exercises + exercise name.
    // FK is exercise_library, NOT exercises.
    const { data: wseRows } = await supabase
      .from("workout_session_exercises")
      .select("id, workout_session_id, exercise_id, exercise_library ( name )")
      .in("workout_session_id", sessionIds);

    if (!wseRows || wseRows.length === 0) return [];

    const wseIds = wseRows.map((w) => w.id);
    const wseMetaMap = new Map<string, { exerciseName: string; completedAt: string }>();
    for (const wse of wseRows) {
      const exerciseName = Array.isArray(wse.exercise_library)
        ? (wse.exercise_library[0] as { name: string } | undefined)?.name
        : (wse.exercise_library as { name: string } | null)?.name;
      const completedAt = sessionDateMap.get(wse.workout_session_id as string);
      if (exerciseName && completedAt) {
        wseMetaMap.set(wse.id, { exerciseName, completedAt });
      }
    }

    if (wseMetaMap.size === 0) return [];

    // Step 3: get completed set logs with weight + reps
    const { data: setLogs } = await supabase
      .from("workout_set_logs")
      .select("reps, weight_kg, workout_session_exercise_id")
      .in("workout_session_exercise_id", wseIds)
      .eq("completed", true)
      .not("weight_kg", "is", null)
      .not("reps", "is", null)
      .limit(500);

    if (!setLogs || setLogs.length === 0) return [];

    // Build per-exercise best estimated 1RM (Epley formula)
    const prMap = new Map<string, PrHighlight>();
    for (const set of setLogs) {
      const meta = wseMetaMap.get(set.workout_session_exercise_id as string);
      if (!meta) continue;
      const reps = Number(set.reps);
      const weight = Number(set.weight_kg);
      if (!reps || !weight) continue;
      const estimated1RM = calculateEstimated1RM(weight, reps);
      const existing = prMap.get(meta.exerciseName);
      if (!existing || estimated1RM > existing.estimated1RM) {
        prMap.set(meta.exerciseName, {
          exerciseName: meta.exerciseName,
          weight,
          reps,
          estimated1RM,
          workoutDate: meta.completedAt,
        });
      }
    }

    return Array.from(prMap.values())
      .sort((a, b) => b.estimated1RM - a.estimated1RM)
      .slice(0, 5);
  })();

  const preferredGym = preferredGymResult.data;
  const currentWeightValue = latestWeight?.weight_kg ? Number(latestWeight.weight_kg) : null;
  const targetWeightValue = profile?.target_weight_kg ? Number(profile.target_weight_kg) : null;
  const goalProgressPercent = getGoalProgressPercent(currentWeightValue, targetWeightValue, profile?.goal ?? null);
  const adherencePercent = getAdherencePercent(recentWorkoutsCount, profile?.training_days_per_week);
  const coachMessage = getCoachMessage({ goal: profile?.goal ?? null, experienceLevel: profile?.experience_level ?? null, recentWorkoutsCount, targetPerWeek: profile?.training_days_per_week });

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s your GymSync overview.</p>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {([
          { label: "Latest weight", value: latestWeight?.weight_kg ? `${latestWeight.weight_kg} kg` : "—", sub: latestWeight?.log_date ?? "No logs yet" },
          { label: "Week streak", value: `${workoutWeekStreak} wk`, sub: "Consecutive active weeks", accent: workoutWeekStreak > 0 },
          { label: "Last 7 days", value: `${recentWorkoutsCount} workouts`, sub: "Consistency snapshot", accent: recentWorkoutsCount > 0 },
          { label: "Meals logged", value: `${mealsCount}`, sub: "Nutrition entries" },
          { label: "Total workouts", value: `${workoutsCount}`, sub: "All time" },
          { label: "Sessions created", value: `${sessionsCreatedCount}`, sub: "Gym meetups posted" },
          { label: "Sessions joined", value: `${sessionsJoinedCount}`, sub: "Social participation" },
          { label: "Goal", value: getGoalLabel(profile?.goal), sub: profile?.experience_level ?? "Set in profile" },
        ] as Array<{ label: string; value: string; sub: string; accent?: boolean }>).map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-4 space-y-1 transition-colors ${
              stat.accent ? "border-primary/30 bg-accent" : "border-border bg-card"
            }`}
          >
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${stat.accent ? "text-primary" : ""}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </section>

      {/* Challenge banner */}
      <Link
        href="/challenges"
        className="flex items-center justify-between rounded-2xl border border-primary/30 bg-accent px-5 py-4 hover:bg-accent/80 transition-colors group"
      >
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Weekly challenge</p>
          <p className="font-semibold text-foreground">Complete 3 workouts this week</p>
          <p className="text-sm text-muted-foreground mt-0.5">View progress &amp; compare with friends</p>
        </div>
        <span className="text-primary text-xl group-hover:translate-x-1 transition-transform">→</span>
      </Link>

      {/* Progress bars */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Goal progress</h2>
            <span className="text-xs rounded-md bg-muted px-2 py-1 text-muted-foreground">{getGoalLabel(profile?.goal)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {currentWeightValue && targetWeightValue ? `${currentWeightValue} kg → ${targetWeightValue} kg` : "Add weight & target to track progress"}
          </p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${goalProgressPercent ?? 0}%` }} />
          </div>
          <p className="text-xs font-medium text-primary">{goalProgressPercent !== null ? `${goalProgressPercent}% toward goal` : "Not available yet"}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Weekly adherence</h2>
            <span className="text-xs rounded-md bg-muted px-2 py-1 text-muted-foreground">{profile?.training_days_per_week ?? "—"} days target</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {profile?.training_days_per_week ? `${recentWorkoutsCount} of ${profile.training_days_per_week} sessions done` : "Set weekly target in onboarding"}
          </p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${adherencePercent ?? 0}%` }} />
          </div>
          <p className="text-xs font-medium text-primary">{adherencePercent !== null ? `${adherencePercent}% adherence` : "Not available yet"}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Coach note</h2>
            <span className="text-xs rounded-md bg-muted px-2 py-1 text-muted-foreground">{profile?.experience_level ?? "general"}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{coachMessage}</p>
          <div className="rounded-xl bg-muted/50 px-3 py-2.5">
            <p className="text-xs font-medium">{preferredGym?.name ?? "No preferred gym"}</p>
            <p className="text-xs text-muted-foreground">{preferredGym?.city ?? "Set one in profile settings"}</p>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Weight evolution</h2>
            <span className="text-xs text-muted-foreground">Last 8 weeks</span>
          </div>
          <WeightChart data={weightChartData} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Workout volume</h2>
            <span className="text-xs text-muted-foreground">Last 6 weeks</span>
          </div>
          <WorkoutVolumeChart data={volumeChartData} />
        </div>
      </section>

      {/* Workout Consistency Heatmap */}
      <section>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Workout consistency</h2>
            <span className="text-xs text-muted-foreground">Last 16 weeks</span>
          </div>
          <WorkoutHeatmap data={heatmapData} weeks={16} />
        </div>
      </section>

      {/* Lists */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">PR highlights</h2>
            <Link href="/workouts" className="text-xs text-primary hover:underline">View workouts →</Link>
          </div>
          {prHighlights.length > 0 ? (
            <div className="space-y-2">
              {prHighlights.map((pr: PrHighlight) => (
                <div key={pr.exerciseName} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{pr.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">{pr.weight} kg × {pr.reps} reps</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{pr.estimated1RM.toFixed(1)} kg</p>
                    <p className="text-xs text-muted-foreground">est. 1RM</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Log weighted sets to see your PRs.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent workouts</h2>
            <Link href="/workouts" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {recentWorkouts.length > 0 ? (
            <div className="space-y-2">
              {recentWorkouts.map((workout: WorkoutRow) => (
                <div key={workout.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{workout.title}</p>
                    <p className="text-xs text-muted-foreground">{workout.workout_date}</p>
                  </div>
                  {workout.duration_minutes && (
                    <span className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-1">{workout.duration_minutes} min</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No workouts yet. Start logging!</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Body logs</h2>
            <Link href="/nutrition" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {recentBodyLogs.length > 0 ? (
            <div className="space-y-2">
              {recentBodyLogs.map((log: BodyLogRow) => (
                <div key={log.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{log.weight_kg} kg</p>
                    <p className="text-xs text-muted-foreground">{log.log_date}</p>
                  </div>
                  {log.body_fat_percent && (
                    <span className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-1">{log.body_fat_percent}% BF</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No body logs yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Upcoming sessions</h2>
            <Link href="/sessions" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {recentSessions.length > 0 ? (
            <div className="space-y-2">
              {recentSessions.map((session: GymSessionRow) => {
                const gym = getSessionGym(session.gyms);
                return (
                  <div key={session.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.scheduled_for).toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-1 shrink-0">
                      {gym?.name ?? "Gym"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming sessions.</p>
          )}
        </div>
      </section>
    </div>
  );
}
