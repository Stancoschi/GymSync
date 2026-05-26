import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddFriendForm } from "@/components/friends/add-friend-form";
import { RespondFriendRequestForm } from "@/components/friends/respond-friend-request-form";

export default async function FriendsPage({
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

  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .neq("id", user.id)
    .order("full_name", { ascending: true });

  const { data: incomingRequests } = await supabase
    .from("friend_requests")
    .select(`
      id,
      sender_id,
      status,
      created_at
    `)
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, user_a_id, user_b_id, created_at")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const friendIds =
    friendships?.map((f: any) => (f.user_a_id === user.id ? f.user_b_id : f.user_a_id)) ?? [];

  const { data: friendProfiles } =
    friendIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, full_name, city")
          .in("id", friendIds)
      : { data: [] };

  const { data: senderProfiles } =
    incomingRequests && incomingRequests.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, full_name, city")
          .in(
            "id",
            incomingRequests.map((r: any) => r.sender_id)
          )
      : { data: [] };

  const senderMap = new Map((senderProfiles ?? []).map((p: any) => [p.id, p]));

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Friends</h1>
          <p className="text-sm text-muted-foreground">
            Manage connections and build your training circle.
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

      <div className="grid gap-6 xl:grid-cols-2">
        <AddFriendForm users={users ?? []} />

        <section className="rounded-2xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Incoming requests</h2>

          {incomingRequests && incomingRequests.length > 0 ? (
            <div className="space-y-3">
              {incomingRequests.map((request: any) => {
                const sender = senderMap.get(request.sender_id);
                return (
                  <div key={request.id} className="rounded-xl bg-muted/40 p-4 space-y-3">
                    <div>
                      <p className="font-medium">
                        {sender?.full_name || sender?.username || "Unknown user"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sender?.city || "No city set"}
                      </p>
                    </div>

                    <RespondFriendRequestForm
                      requestId={request.id}
                      senderId={request.sender_id}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No incoming requests.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Your friends</h2>

        {friendProfiles && friendProfiles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {friendProfiles.map((friend: any) => (
              <div key={friend.id} className="rounded-xl bg-muted/40 p-4">
                <p className="font-medium">
                  {friend.full_name || friend.username || friend.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  {friend.username ? `@${friend.username}` : "No username"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {friend.city || "No city set"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No friends yet.
          </p>
        )}
      </section>
    </main>
  );
}