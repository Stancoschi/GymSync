import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddFriendForm } from "@/components/friends/add-friend-form";
import { RespondFriendRequestForm } from "@/components/friends/respond-friend-request-form";
import type { FriendshipRow, FriendRequestRow, ProfileRow } from "@/types/database";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .neq("id", user.id)
    .order("full_name", { ascending: true });

  const { data: incomingRequests } = await supabase
    .from("friend_requests")
    .select("id, sender_id, status, created_at")
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, user_a_id, user_b_id, created_at")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const friendIds = ((friendships as FriendshipRow[]) ?? []).map((f) =>
    f.user_a_id === user.id ? f.user_b_id : f.user_a_id
  );

  const { data: friendProfiles } =
    friendIds.length > 0
      ? await supabase.from("profiles").select("id, username, full_name, city").in("id", friendIds)
      : { data: [] };

  const senderIds = ((incomingRequests as FriendRequestRow[]) ?? []).map((r) => r.sender_id);
  const { data: senderProfiles } =
    senderIds.length > 0
      ? await supabase.from("profiles").select("id, username, full_name, city").in("id", senderIds)
      : { data: [] };

  const senderMap = new Map(((senderProfiles as ProfileRow[]) ?? []).map((p) => [p.id, p]));

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Friends</h1>
          <p className="text-sm text-muted-foreground">Manage connections and build your training circle.</p>
        </div>
        <Link href="/dashboard" className="rounded-lg border px-4 py-2 text-sm">← Dashboard</Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AddFriendForm users={users ?? []} />

        <section className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold">Incoming requests</h2>
          {incomingRequests && incomingRequests.length > 0 ? (
            <div className="space-y-3">
              {((incomingRequests as FriendRequestRow[])).map((request) => {
                const sender = senderMap.get(request.sender_id);
                return (
                  <div key={request.id} className="rounded-xl bg-muted/40 p-4 space-y-3">
                    <div>
                      <p className="font-medium">{sender?.full_name || sender?.username || "Unknown user"}</p>
                      <p className="text-sm text-muted-foreground">{sender?.city || "No city set"}</p>
                    </div>
                    <RespondFriendRequestForm requestId={request.id} senderId={request.sender_id} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No incoming requests.</p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-bold">Your friends</h2>
        {friendProfiles && friendProfiles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {((friendProfiles as ProfileRow[])).map((friend) => (
              <div key={friend.id} className="rounded-xl bg-muted/40 p-4">
                <p className="font-medium">{friend.full_name || friend.username || friend.id}</p>
                <p className="text-sm text-muted-foreground">{friend.username ? `@${friend.username}` : "No username"}</p>
                <p className="text-sm text-muted-foreground">{friend.city || "No city set"}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No friends yet. Search for someone above!</p>
        )}
      </section>
    </main>
  );
}
