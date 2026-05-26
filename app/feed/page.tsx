import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type FeedItem =
  | {
      id: string;
      type: "workout";
      created_at: string;
      actor_name: string;
      actor_username: string | null;
      title: string;
      subtitle: string;
    }
  | {
      id: string;
      type: "session";
      created_at: string;
      actor_name: string;
      actor_username: string | null;
      title: string;
      subtitle: string;
    };

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: friendships, error: friendshipsError } = await supabase
    .from("friendships")
    .select("id, user_a_id, user_b_id")
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

  if (friendIds.length === 0) {
    return (
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Feed</h1>
            <p className="text-sm text-muted-foreground">
              Recent activity from your friends.
            </p>
          </div>

          <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm">
            Back to dashboard
          </Link>
        </div>

        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          No friends yet, so your feed is empty.
        </div>
      </main>
    );
  }

  const { data: friendProfiles, error: friendProfilesError } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", friendIds);

  if (friendProfilesError) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">{friendProfilesError.message}</p>
      </main>
    );
  }

  const profileMap = new Map(
    (friendProfiles ?? []).map((profile: any) => [profile.id, profile])
  );

  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select("id, user_id, title, workout_date, duration_minutes, created_at")
    .in("user_id", friendIds)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: sessions, error: sessionsError } = await supabase
    .from("gym_sessions")
    .select(`
      id,
      creator_id,
      title,
      scheduled_for,
      created_at,
      gyms (
        name,
        city
      )
    `)
    .in("creator_id", friendIds)
    .order("created_at", { ascending: false })
    .limit(20);

  if (workoutsError || sessionsError) {
    return (
      <main className="p-6 space-y-2">
        <p className="text-sm text-red-600">Failed to load feed.</p>
        {workoutsError ? (
          <pre className="text-xs text-red-500 whitespace-pre-wrap">
            workoutsError: {workoutsError.message}
          </pre>
        ) : null}
        {sessionsError ? (
          <pre className="text-xs text-red-500 whitespace-pre-wrap">
            sessionsError: {sessionsError.message}
          </pre>
        ) : null}
      </main>
    );
  }

  const workoutItems: FeedItem[] = (workouts ?? []).map((workout: any) => {
    const actor = profileMap.get(workout.user_id);

    return {
      id: workout.id,
      type: "workout",
      created_at: workout.created_at,
      actor_name: actor?.full_name || actor?.username || "Unknown user",
      actor_username: actor?.username || null,
      title: `${actor?.full_name || actor?.username || "A friend"} logged a workout`,
      subtitle: `${workout.title} • ${workout.workout_date}${
        workout.duration_minutes ? ` • ${workout.duration_minutes} min` : ""
      }`,
    };
  });

  const sessionItems: FeedItem[] = (sessions ?? []).map((session: any) => {
    const actor = profileMap.get(session.creator_id);

    return {
      id: session.id,
      type: "session",
      created_at: session.created_at,
      actor_name: actor?.full_name || actor?.username || "Unknown user",
      actor_username: actor?.username || null,
      title: `${actor?.full_name || actor?.username || "A friend"} created a gym session`,
      subtitle: `${session.title} • ${session.gyms?.name || "Gym"}${
        session.gyms?.city ? ` • ${session.gyms.city}` : ""
      } • ${new Date(session.scheduled_for).toLocaleString()}`,
    };
  });

  const feedItems = [...workoutItems, ...sessionItems].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feed</h1>
          <p className="text-sm text-muted-foreground">
            Recent activity from your friends.
          </p>
        </div>

        <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm">
          Back to dashboard
        </Link>
      </div>

      <section className="space-y-4">
        {feedItems.length > 0 ? (
          <div className="grid gap-4">
            {feedItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="rounded-2xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.actor_username ? `@${item.actor_username}` : item.actor_name}
                    </p>
                  </div>

                  <span className="text-xs rounded-md bg-muted px-2 py-1">
                    {item.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
            No friend activity yet.
          </div>
        )}
      </section>
    </main>
  );
}