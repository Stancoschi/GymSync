import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeEntry, FriendshipRow, ProfileRow } from "@/types/database";

function getWeekRange(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(current);
  start.setDate(current.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export default async function ChallengesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const weeklyTarget = 3;
  const { start, end } = getWeekRange();

  const { data: friendships, error: friendshipsError } = await supabase
    .from("friendships")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  if (friendshipsError) {
    return <main className="p-6"><p className="text-sm text-destructive">{friendshipsError.message}</p></main>;
  }

  const friendIds = (friendships as FriendshipRow[] ?? []).map((f) =>
    f.user_a_id === user.id ? f.user_b_id : f.user_a_id
  );

  const participantIds = Array.from(new Set([user.id, ...friendIds]));

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", participantIds);

  if (profilesError) {
    return <main className="p-6"><p className="text-sm text-destructive">{profilesError.message}</p></main>;
  }

  const { data: weeklyWorkouts, error: workoutsError } = await supabase
    .from("workouts")
    .select("id, user_id, created_at")
    .in("user_id", participantIds)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (workoutsError) {
    return <main className="p-6"><p className="text-sm text-destructive">{workoutsError.message}</p></main>;
  }

  const workoutCountMap = new Map<string, number>();
  for (const workout of (weeklyWorkouts ?? []) as Array<{ user_id: string }>) {
    workoutCountMap.set(workout.user_id, (workoutCountMap.get(workout.user_id) ?? 0) + 1);
  }

  const leaderboard: ChallengeEntry[] = ((profiles ?? []) as ProfileRow[])
    .map((profile) => {
      const workoutsCount = workoutCountMap.get(profile.id) ?? 0;
      return {
        user_id: profile.id,
        name: profile.full_name || profile.username || "Unknown user",
        username: profile.username,
        workouts_count: workoutsCount,
        completed: workoutsCount >= weeklyTarget,
      };
    })
    .sort((a, b) => b.workouts_count !== a.workouts_count ? b.workouts_count - a.workouts_count : a.name.localeCompare(b.name));

  const me = leaderboard.find((e) => e.user_id === user.id);
  const myCount = me?.workouts_count ?? 0;
  const myProgressPercent = Math.min(100, Math.round((myCount / weeklyTarget) * 100));

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Challenges</p>
          <h1 className="text-2xl font-bold">Weekly workout challenge</h1>
          <p className="text-sm text-muted-foreground">Complete {weeklyTarget} workouts this week and compete with friends.</p>
        </div>
        <Link href="/dashboard" className="rounded-lg border px-4 py-2 text-sm shrink-0">← Dashboard</Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your progress</p>
              <h2 className="text-2xl font-bold tabular-nums">{myCount}/{weeklyTarget} workouts</h2>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
              myCount >= weeklyTarget ? "border-primary/30 text-primary bg-primary/10" : "border-border text-muted-foreground"
            }`}>
              {myCount >= weeklyTarget ? "Completed ✓" : "In progress"}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${myProgressPercent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            Week: {start.toLocaleDateString("ro-RO")} – {new Date(end.getTime() - 1).toLocaleDateString("ro-RO")}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <p className="text-sm text-muted-foreground font-medium">Challenge details</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span className="font-medium">{weeklyTarget} workouts</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Scoring</span><span className="font-medium">1 pt / workout</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Participants</span><span className="font-medium">{leaderboard.length}</span></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Leaderboard</h2>
          <p className="text-sm text-muted-foreground">Ranked by workouts this week.</p>
        </div>
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                entry.user_id === user.id ? "border-primary/20 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                  index === 1 ? "bg-muted text-foreground" :
                  index === 2 ? "bg-orange-500/10 text-orange-400" : "bg-muted text-muted-foreground"
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {entry.name}{entry.user_id === user.id ? " (You)" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.username ? `@${entry.username}` : "No username"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums text-sm">{entry.workouts_count}</p>
                <p className="text-xs text-muted-foreground">{entry.completed ? "✓ Done" : "going"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
