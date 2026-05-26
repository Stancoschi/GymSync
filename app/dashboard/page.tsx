import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function startOfLast7Days() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
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
      .select("username, full_name, goal")
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

  const workoutWeekStreak = calculateWorkoutWeekStreak(allWorkoutsForStreak);

  const prMap = new Map<string, {
    exerciseName: string;
    weight: number;
    reps: number;
    estimated1RM: number;
    workoutDate: string;
  }>();

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
        </div>
      </section>
    </main>
  );
}