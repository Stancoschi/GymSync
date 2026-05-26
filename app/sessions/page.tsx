import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateSessionForm } from "@/components/sessions/create-session-form";
import { JoinSessionButton } from "@/components/sessions/join-session-button";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: gyms, error: gymsError } = await supabase
    .from("gyms")
    .select("id, name, city")
    .order("name");

  const { data: sessions, error: sessionsError } = await supabase
    .from("gym_sessions")
    .select(`
      id,
      title,
      notes,
      scheduled_for,
      max_participants,
      created_at,
      gyms (
        id,
        name,
        city
      ),
      profiles (
        id,
        username,
        full_name
      ),
      gym_session_participants (
        user_id
      )
    `)
    .order("scheduled_for", { ascending: true });

  if (gymsError || sessionsError) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">
          Failed to load sessions data.
        </p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gym sessions</h1>
          <p className="text-sm text-muted-foreground">
            Create a session and let others join you.
          </p>
        </div>

        <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm">
          Back to dashboard
        </Link>
      </div>

      {params?.message ? (
        <p className="rounded-md bg-muted p-3 text-sm">
          {params.message}
        </p>
      ) : null}

      <CreateSessionForm gyms={gyms ?? []} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming sessions</h2>

        {sessions && sessions.length > 0 ? (
          <div className="grid gap-4">
            {sessions.map((session: any) => {
              const joinedUsers = session.gym_session_participants ?? [];
              const hasJoined = joinedUsers.some(
                (participant: { user_id: string }) => participant.user_id === user.id
              );

              return (
                <div key={session.id} className="rounded-2xl border p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.gyms?.name} {session.gyms?.city ? `- ${session.gyms.city}` : ""}
                      </p>
                    </div>

                    {!hasJoined ? (
                      <JoinSessionButton sessionId={session.id} />
                    ) : (
                      <span className="text-sm rounded-md bg-muted px-3 py-2">
                        Joined
                      </span>
                    )}
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">When:</span>{" "}
                      {new Date(session.scheduled_for).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-medium">Created by:</span>{" "}
                      {session.profiles?.full_name || session.profiles?.username || "Unknown"}
                    </p>
                    <p>
                      <span className="font-medium">Participants:</span>{" "}
                      {joinedUsers.length}
                      {session.max_participants ? ` / ${session.max_participants}` : ""}
                    </p>
                  </div>

                  {session.notes ? (
                    <p className="text-sm text-muted-foreground">{session.notes}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
            No sessions yet.
          </div>
        )}
      </section>
    </main>
  );
}