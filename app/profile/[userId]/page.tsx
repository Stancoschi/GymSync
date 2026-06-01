import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", userId)
    .single();

  const name = profile?.full_name ?? profile?.username ?? "User";
  return { title: name };
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, city, bio, goal, avatar_url")
    .eq("id", userId)
    .single();

  if (error || !profile) notFound();

  // Is viewer the same as profile owner?
  const isSelf = user?.id === userId;

  // Check if already friends
  let isFriend = false;
  let hasPendingRequest = false;

  if (user && !isSelf) {
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id")
      .or(
        `and(user_a_id.eq.${user.id},user_b_id.eq.${userId}),and(user_a_id.eq.${userId},user_b_id.eq.${user.id})`
      )
      .maybeSingle();
    isFriend = !!friendship;

    if (!isFriend) {
      const { data: pending } = await supabase
        .from("friend_requests")
        .select("id")
        .eq("sender_id", user.id)
        .eq("receiver_id", userId)
        .eq("status", "pending")
        .maybeSingle();
      hasPendingRequest = !!pending;
    }
  }

  // Recent workouts count (public stat)
  const { count: workoutsCount } = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const avatarUrl: string | null = profile.avatar_url ?? null;
  const displayName = profile.full_name ?? profile.username ?? "Unknown user";

  return (
    <main className="p-6 max-w-2xl space-y-8">
      {/* Back */}
      <Link
        href="/friends"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to friends
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted border border-border">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-muted-foreground">
              {displayName[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">{displayName}</h1>
          {profile.username && (
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          )}
          {profile.city && (
            <p className="text-sm text-muted-foreground">{profile.city}</p>
          )}
        </div>

        {/* Action */}
        {isSelf ? (
          <Link
            href="/profile"
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            Edit profile
          </Link>
        ) : user && isFriend ? (
          <span className="rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
            Friends ✓
          </span>
        ) : user && hasPendingRequest ? (
          <span className="rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
            Request sent
          </span>
        ) : user ? (
          <AddFriendButton targetUserId={userId} />
        ) : null}
      </div>

      {/* Bio */}
      {profile.bio && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
            About
          </h2>
          <p className="text-sm">{profile.bio}</p>
        </section>
      )}

      {/* Goal */}
      {profile.goal && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Goal
          </h2>
          <p className="text-sm">{profile.goal}</p>
        </section>
      )}

      {/* Stats */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Stats
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold tabular-nums">
              {workoutsCount ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Total workouts</p>
          </div>
        </div>
      </section>
    </main>
  );
}

// Client component for the Add Friend button (needs server action)
import { AddFriendButton } from "@/components/friends/add-friend-button";
