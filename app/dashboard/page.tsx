import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function startOfLast7Days() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
}
function getGoalLabel(goal: string | null | undefined) {
  switch (goal) {
    case "lose_weight":
      return "Lose weight";
    case "maintain_weight":
      return "Maintain";
    case "gain_muscle":
      return "Gain muscle";
    default:
      return "Not set";
  }
}

function getGoalProgressPercent(
  currentWeight: number | null,
  targetWeight: number | null,
  goal: string | null
) {
  if (!currentWeight || !targetWeight || !goal) return null;

  if (goal === "maintain_weight") {
    const diff = Math.abs(currentWeight - targetWeight);
    return Math.max(0, Math.min(100, 100 - diff * 20));
  }

  if (goal === "lose_weight") {
    if (currentWeight <= targetWeight) return 100;
    const distance = currentWeight - targetWeight;
    return Math.max(0, Math.min(100, 100 - distance * 10));
  }

  if (goal === "gain_muscle") {
    if (currentWeight >= targetWeight) return 100;
    const distance = targetWeight - currentWeight;
    return Math.max(0, Math.min(100, 100 - distance * 10));
  }

  return null;
}

function getAdherencePercent(
  completedWorkouts: number,
  targetWorkouts: number | null | undefined
) {
  if (!targetWorkouts || targetWorkouts <= 0) return null;
  return Math.min(100, Math.round((completedWorkouts / targetWorkouts) * 100));
}

function getCoachMessage({
  goal,
  experienceLevel,
  recentWorkoutsCount,
  targetPerWeek,
}: {
  goal: string | null;
  experienceLevel: string | null;
  recentWorkoutsCount: number;
  targetPerWeek: number | null | undefined;
}) {
  if (!goal) {
    return "Complete your profile goals to unlock more personalized insights.";
  }

  if (targetPerWeek && recentWorkoutsCount < targetPerWeek) {
    return `You are ${targetPerWeek - recentWorkoutsCount} workout(s) away from your weekly target.`;
  }

  if (goal === "gain_muscle" && experienceLevel === "beginner") {
    return "Focus on consistent training, progressive overload, and enough food to support growth.";
  }

  if (goal === "lose_weight") {
    return "Consistency beats intensity. Keep your training regular and monitor your nutrition trend.";
  }

  if (goal === "maintain_weight") {
    return "You are in maintenance mode. Aim for stable habits and steady training frequency.";
  }

  return "You are on track. Keep building consistency this week.";
}

function getWeekKey(dateString: string) {
  const date = new Date(dateString);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNum}`;
}

function calculateWorkoutWeekStreak(workouts: Array<{ workout_date: string }>) {
  if (!workouts.length) return 0;

  const uniqueWeeks = Array.from(
    new Set(workouts.map((w) => getWeekKey(w.workout_date)))
  ).sort();

  if (!uniqueWeeks.length) return 0;

  let streak = 0;
  let cursor = new Date();
  for (let i = 0; i < 52; i++) {
    const weekKey = getWeekKey(cursor.toISOString());
    if (uniqueWeeks.includes(weekKey)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 7);
    } else {
      break;
    }
  }

  return streak;
}

function calculateEstimated1RM(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  

  const last7Days = startOfLast7Days();

  const [
    profileResult,
    latestWeightResult,
    workoutsCountResult,
    recentWorkoutsCountResult,
    mealsCountResult,
    sessionsCreatedCountResult,
    sessionsJoinedCountResult,
    recentWorkoutsResult,
    recentBodyLogsResult,
    recentSessionsResult,
    allWorkoutsForStreakResult,
    performanceSetsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        username,
        full_name,
        goal,
        onboarding_completed,
        activity_level,
        training_days_per_week,
        experience_level,
        preferred_gym_id,
        target_weight_kg
      `)
      .eq("id", user.id)
      .single(),

    supabase
      .from("body_logs")
      .select("weight_kg, log_date")
      .order("log_date", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("workouts")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .gte("workout_date", last7Days),

    supabase
      .from("meals")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("gym_sessions")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id),

    supabase
      .from("gym_session_participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),

    supabase
      .from("workouts")
      .select("id, title, workout_date, duration_minutes")
      .order("workout_date", { ascending: false })
      .limit(5),

    supabase
      .from("body_logs")
      .select("id, log_date, weight_kg, body_fat_percent")
      .order("log_date", { ascending: false })
      .limit(5),

    supabase
      .from("gym_sessions")
      .select(`
        id,
        title,
        scheduled_for,
        gyms (
          name,
          city
        )
      `)
      .order("scheduled_for", { ascending: true })
      .limit(5),

    supabase
      .from("workouts")
      .select("workout_date")
      .order("workout_date", { ascending: false }),

    supabase
      .from("exercise_sets")
      .select(`
        id,
        reps,
        weight_kg,
        workout_exercises (
          id,
          exercises (
            id,
            name
          ),
          workouts (
            id,
            workout_date
          )
        )
      `)
      .not("weight_kg", "is", null)
      .not("reps", "is", null)
      .limit(200),
  ]);

  const profile = profileResult.data;
  const latestWeight = latestWeightResult.data;
  const workoutsCount = workoutsCountResult.count ?? 0;
  const recentWorkoutsCount = recentWorkoutsCountResult.count ?? 0;
  const mealsCount = mealsCountResult.count ?? 0;
  const sessionsCreatedCount = sessionsCreatedCountResult.count ?? 0;
  const sessionsJoinedCount = sessionsJoinedCountResult.count ?? 0;
  const recentWorkouts = recentWorkoutsResult.data ?? [];
  const recentBodyLogs = recentBodyLogsResult.data ?? [];
  const recentSessions = recentSessionsResult.data ?? [];
  const allWorkoutsForStreak = allWorkoutsForStreakResult.data ?? [];
  const performanceSets = performanceSetsResult.data ?? [];
  const preferredGymResult = profile?.preferred_gym_id
  ? await supabase
      .from("gyms")
      .select("id, name, city")
      .eq("id", profile.preferred_gym_id)
      .maybeSingle()
  : { data: null };
  const workoutWeekStreak = calculateWorkoutWeekStreak(allWorkoutsForStreak);

  const prMap = new Map<string, {
    exerciseName: string;
    weight: number;
    reps: number;
    estimated1RM: number;
    workoutDate: string;
  }>();
  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }
  for (const set of performanceSets as any[]) {
    const exerciseName = set.workout_exercises?.exercises?.name;
    const workoutDate = set.workout_exercises?.workouts?.workout_date;
    const reps = Number(set.reps);
    const weight = Number(set.weight_kg);

    if (!exerciseName || !workoutDate || !reps || !weight) continue;

    const estimated1RM = calculateEstimated1RM(weight, reps);
    const existing = prMap.get(exerciseName);

    if (!existing || estimated1RM > existing.estimated1RM) {
      prMap.set(exerciseName, {
        exerciseName,
        weight,
        reps,
        estimated1RM,
        workoutDate,
      });
    }
  }

  const prHighlights = Array.from(prMap.values())
    .sort((a, b) => b.estimated1RM - a.estimated1RM)
    .slice(0, 5);

    const preferredGym = preferredGymResult.data;
    const currentWeightValue = latestWeight?.weight_kg ? Number(latestWeight.weight_kg) : null;
    const targetWeightValue = profile?.target_weight_kg ? Number(profile.target_weight_kg) : null;
    
    const goalProgressPercent = getGoalProgressPercent(
      currentWeightValue,
      targetWeightValue,
      profile?.goal ?? null
    );
    
    const adherencePercent = getAdherencePercent(
      recentWorkoutsCount,
      profile?.training_days_per_week
    );
    
    const coachMessage = getCoachMessage({
      goal: profile?.goal ?? null,
      experienceLevel: profile?.experience_level ?? null,
      recentWorkoutsCount,
      targetPerWeek: profile?.training_days_per_week,
    });


  return (
    <main className="p-6 space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold">
          Welcome back
          {profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here is your GymSync overview.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Latest weight</p>
          <p className="mt-2 text-2xl font-semibold">
            {latestWeight?.weight_kg ? `${latestWeight.weight_kg} kg` : "-"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {latestWeight?.log_date ?? "No body logs yet"}
          </p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Workout streak</p>
          <p className="mt-2 text-2xl font-semibold">{workoutWeekStreak}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Consecutive active weeks
          </p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Workouts last 7 days</p>
          <p className="mt-2 text-2xl font-semibold">{recentWorkoutsCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Consistency snapshot
          </p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Meals logged</p>
          <p className="mt-2 text-2xl font-semibold">{mealsCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nutrition entries saved
          </p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Total workouts</p>
          <p className="mt-2 text-2xl font-semibold">{workoutsCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Logged workouts overall
          </p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Sessions created</p>
          <p className="mt-2 text-2xl font-semibold">{sessionsCreatedCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Gym meetups posted by you
          </p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Sessions joined</p>
          <p className="mt-2 text-2xl font-semibold">{sessionsJoinedCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Social participation count
          </p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Goal</p>
          <p className="mt-2 text-2xl font-semibold">
            {profile?.goal ? profile.goal.replaceAll("_", " ") : "-"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Current profile target
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">PR highlights</h2>
            <Link href="/workouts" className="text-sm underline">
              View workouts
            </Link>
          </div>

          {prHighlights.length > 0 ? (
            <div className="space-y-3">
              {prHighlights.map((pr) => (
                <div key={pr.exerciseName} className="rounded-xl bg-muted/40 p-3">
                  <p className="font-medium">{pr.exerciseName}</p>
                  <p className="text-sm text-muted-foreground">
                    Best set: {pr.weight} kg × {pr.reps}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Est. 1RM: {pr.estimated1RM.toFixed(1)} kg • {pr.workoutDate}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No PR data yet. Log more weighted sets.
            </p>
          )}
        </div>

        <div className="rounded-2xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent workouts</h2>
            <Link href="/workouts" className="text-sm underline">
              View all
            </Link>
          </div>

          {recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.map((workout: any) => (
                <div key={workout.id} className="rounded-xl bg-muted/40 p-3">
                  <p className="font-medium">{workout.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {workout.workout_date}
                    {workout.duration_minutes
                      ? ` • ${workout.duration_minutes} min`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No workouts yet.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent body logs</h2>
            <Link href="/nutrition" className="text-sm underline">
              View all
            </Link>
          </div>

          {recentBodyLogs.length > 0 ? (
            <div className="space-y-3">
              {recentBodyLogs.map((log: any) => (
                <div key={log.id} className="rounded-xl bg-muted/40 p-3">
                  <p className="font-medium">{log.weight_kg} kg</p>
                  <p className="text-sm text-muted-foreground">
                    {log.log_date}
                    {log.body_fat_percent
                      ? ` • ${log.body_fat_percent}% body fat`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No body logs yet.</p>
          )}
        </div>

        <div className="rounded-2xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming sessions</h2>
            <Link href="/sessions" className="text-sm underline">
              View all
            </Link>
          </div>

          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session: any) => (
                <div key={session.id} className="rounded-xl bg-muted/40 p-3">
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.scheduled_for).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.gyms?.name ?? "Gym"}
                    {session.gyms?.city ? ` • ${session.gyms.city}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sessions yet.</p>
          )}
        </div>

        <section className="grid gap-6 xl:grid-cols-3">
  <div className="rounded-2xl border p-5 space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Goal progress</h2>
      <span className="text-xs rounded-md bg-muted px-2 py-1">
        {getGoalLabel(profile?.goal)}
      </span>
    </div>

    <p className="text-sm text-muted-foreground">
      {currentWeightValue && targetWeightValue
        ? `Current: ${currentWeightValue} kg • Target: ${targetWeightValue} kg`
        : "Add your current and target weight to unlock progress tracking."}
    </p>

    <div className="h-3 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-black transition-all"
        style={{ width: `${goalProgressPercent ?? 0}%` }}
      />
    </div>

    <p className="text-sm font-medium">
      {goalProgressPercent !== null
        ? `${goalProgressPercent}% toward your goal`
        : "Progress not available yet"}
    </p>
  </div>

  <div className="rounded-2xl border p-5 space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Weekly adherence</h2>
      <span className="text-xs rounded-md bg-muted px-2 py-1">
        {profile?.training_days_per_week ?? "-"} days target
      </span>
    </div>

    <p className="text-sm text-muted-foreground">
      {profile?.training_days_per_week
        ? `${recentWorkoutsCount} of ${profile.training_days_per_week} planned sessions completed in the last 7 days`
        : "Set your weekly training target in onboarding."}
    </p>

    <div className="h-3 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-black transition-all"
        style={{ width: `${adherencePercent ?? 0}%` }}
      />
    </div>

    <p className="text-sm font-medium">
      {adherencePercent !== null
        ? `${adherencePercent}% target adherence`
        : "Adherence not available yet"}
    </p>
  </div>

  <div className="rounded-2xl border p-5 space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Coach note</h2>
      <span className="text-xs rounded-md bg-muted px-2 py-1">
        {profile?.experience_level ?? "general"}
      </span>
    </div>

    <p className="text-sm text-muted-foreground">{coachMessage}</p>

    {preferredGym ? (
      <div className="rounded-xl bg-muted/40 p-3">
        <p className="font-medium">{preferredGym.name}</p>
        <p className="text-sm text-muted-foreground">
          {preferredGym.city || "Preferred gym selected"}
        </p>
      </div>
    ) : (
      <div className="rounded-xl bg-muted/40 p-3">
        <p className="font-medium">No preferred gym yet</p>
        <p className="text-sm text-muted-foreground">
          Add one in onboarding or profile settings.
        </p>
      </div>
    )}
  </div>
</section>
      </section>

      <section className="rounded-2xl border p-5">
        <h2 className="text-lg font-semibold mb-3">Quick navigation</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/profile" className="rounded-md border px-4 py-2">
            Profile
          </Link>
          <Link href="/workouts" className="rounded-md border px-4 py-2">
            Workouts
          </Link>
          <Link href="/sessions" className="rounded-md border px-4 py-2">
            Sessions
          </Link>
          <Link href="/nutrition" className="rounded-md border px-4 py-2">
            Nutrition
          </Link>
          <Link href="/friends" className="rounded-md border px-4 py-2">
  Friends
</Link>
<Link href="/feed" className="rounded-md border px-4 py-2">
  Feed
</Link>
<Link href="/settings/profile" className="rounded-md border px-4 py-2">
  Settings
</Link>
        </div>
      </section>
    </main>
  );
}