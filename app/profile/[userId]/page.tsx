import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, MapPin, Target, Dumbbell, UserCheck, Clock } from "lucide-react";
import { AddFriendButton } from "@/components/friends/add-friend-button";

type Props = { params: Promise<{ userId: string }> };

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose weight 📊",
  maintain: "Maintain ⚖️",
  gain_muscle: "Gain muscle 💪",
};

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
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, city, bio, goal, avatar_url")
    .eq("id", userId)
    .single();

  if (error || !profile) notFound();

  const isSelf = user?.id === userId;
  let isFriend = false;
  let hasPendingRequest = false;

  if (user && !isSelf) {
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id")
      .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${userId}),and(user_a_id.eq.${userId},user_b_id.eq.${user.id})`)
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

  const { count: workoutsCount } = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const avatarUrl: string | null = profile.avatar_url ?? null;
  const displayName = profile.full_name ?? profile.username ?? "Unknown user";

  return (
    <main className="mx-auto max-w-2xl p-4 md:p-6 space-y-6 page-enter">
      {/* Back */}
      <Link href="/friends" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to friends
      </Link>

      {/* Hero card */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted border border-border">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="80px" unoptimized />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {displayName[0].toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight truncate">{displayName}</h1>
            {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
            <div className="flex flex-wrap gap-3 pt-0.5">
              {profile.city && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {profile.city}
                </span>
              )}
              {profile.goal && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <Target className="w-3 h-3" /> {GOAL_LABELS[profile.goal] ?? profile.goal}
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className="shrink-0">
            {isSelf ? (
              <Link href="/profile" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">
                Edit profile
              </Link>
            ) : user && isFriend ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-500">
                <UserCheck className="w-4 h-4" /> Friends
              </span>
            ) : user && hasPendingRequest ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
                <Clock className="w-4 h-4" /> Sent
              </span>
            ) : user ? (
              <AddFriendButton targetUserId={userId} />
            ) : null}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Stats</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-0.5">
            <p className="text-2xl font-bold tabular-nums">{workoutsCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total workouts</p>
          </div>
        </div>
      </section>
    </main>
  );
}
