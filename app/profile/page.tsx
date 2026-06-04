import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUploadForm } from "@/components/profile/avatar-upload-form";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Settings, User } from "lucide-react";

export const metadata: Metadata = { title: "Profile" };

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose weight",
  maintain: "Maintain",
  gain_muscle: "Gain muscle",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return (
      <main className="p-6">
        <p className="text-sm text-destructive">Failed to load profile: {error.message}</p>
      </main>
    );
  }

  const avatarUrl: string | null = profile.avatar_url ?? null;
  const displayName = profile.full_name ?? profile.username ?? "You";
  const initials = displayName[0].toUpperCase();

  return (
    <main className="mx-auto max-w-2xl p-4 md:p-6 space-y-8 page-enter pb-24 md:pb-6">
      {params?.message && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {params.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Account</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Profile</h1>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </div>

      {/* Avatar card */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted border border-border">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="80px" unoptimized />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {initials}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="font-semibold truncate">{displayName}</p>
            {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
            {profile.city && <p className="text-xs text-muted-foreground">{profile.city}</p>}
            {profile.goal && (
              <span className="inline-block mt-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {GOAL_LABELS[profile.goal] ?? profile.goal}
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Change avatar</p>
          <AvatarUploadForm />
        </div>
      </section>

      {/* Profile details form */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Personal details</h2>
        </div>
        <ProfileForm
          email={user.email ?? ""}
          profile={{
            username: profile.username ?? "",
            full_name: profile.full_name ?? "",
            bio: profile.bio ?? "",
            city: profile.city ?? "",
            goal: profile.goal ?? "",
          }}
        />
      </section>
    </main>
  );
}
