import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type LeaderboardEntry = {
  user_id: string;
  name: string;
  username: string | null;
  workouts_count: number;
  completed: boolean;
};

function getWeekRange(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  const start = new Date(current);
  start.setDate(current.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return {
    start,
    end,
  };
}

export default async function ChallengesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const weeklyTarget = 3;
  const { start, end } = getWeekRange();

  const { data: friendships, error: friendshipsError } = await supabase
    .from("friendships")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  if (friendshipsError) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">{friendshipsError.message}</p>
      </main>
    );
  }

  const friendIds =
    friendships?.map((f: any) =>
      f.user_a_id === user.id ? f.user_b_id : f.user_a_id
    ) ?? [];

  const participantIds = Array.from(new Set([user.id, ...friendIds]));

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", participantIds);

  if (profilesError) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">{profilesError.message}</p>
      </main>
    );
  }

  const { data: weeklyWorkouts, error: workoutsError } = await supabase
    .from("workouts")
    .select("id, user_id, created_at")
    .in("user_id", participantIds)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (workoutsError) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">{workoutsError.message}</p>
      </main>
    );
  }

  const workoutCountMap = new Map<string, number>();

  for (const workout of weeklyWorkouts ?? []) {
    const key = (workout as any).user_id;
    workoutCountMap.set(key, (workoutCountMap.get(key) ?? 0) + 1);
  }

  const leaderboard: LeaderboardEntry[] = (profiles ?? [])
    .map((profile: any) => {
      const workoutsCount = workoutCountMap.get(profile.id) ?? 0;

      return {
        user_id: profile.id,
        name: profile.full_name || profile.username || "Unknown user",
        username: profile.username || null,
        workouts_count: workoutsCount,
        completed: workoutsCount >= weeklyTarget,
      };
    })
    .sort((a, b) => {
      if (b.workouts_count !== a.workouts_count) {
        return b.workouts_count - a.workouts_count;
      }

      return a.name.localeCompare(b.name);
    });

  const me = leaderboard.find((entry) => entry.user_id === user.id);
  const myCount = me?.workouts_count ?? 0;
  const myProgressPercent = Math.min(
    100,
    Math.round((myCount / weeklyTarget) * 100)
  );

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Challenges
          </p>
          <h1 className="text-3xl font-semibold">Weekly workout challenge</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Complete {weeklyTarget} workouts this week and compete with your friends.
          </p>
        </div>

        <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm">
          Back to dashboard
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border p-5 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your progress</p>
              <h2 className="text-2xl font-semibold">
                {myCount}/{weeklyTarget} workouts
              </h2>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-sm font-medium">
                {myCount >= weeklyTarget ? "Completed" : "In progress"}
              </p>
            </div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{ width: `${myProgressPercent}%` }}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Week: {start.toLocaleDateString()} -{" "}
            {new Date(end.getTime() - 1).toLocaleDateString()}
          </p>
        </div>

        <div className="rounded-2xl border p-5 space-y-3">
          <p className="text-sm text-muted-foreground">Challenge details</p>
          <div className="space-y-2 text-sm">
            <p>Target: {weeklyTarget} workouts</p>
            <p>Scoring: 1 point per logged workout</p>
            <p>Participants: {leaderboard.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Leaderboard</h2>
            <p className="text-sm text-muted-foreground">
              Ranked by workouts completed this week.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                entry.user_id === user.id ? "bg-muted/40" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold">
                  #{index + 1}
                </div>

                <div>
                  <p className="font-medium">
                    {entry.name}
                    {entry.user_id === user.id ? " (You)" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.username ? `@${entry.username}` : "No username"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold">{entry.workouts_count} workouts</p>
                <p className="text-xs text-muted-foreground">
                  {entry.completed ? "Challenge completed" : "Still going"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}