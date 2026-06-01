import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUploadForm } from "@/components/profile/avatar-upload-form";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage({
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">
          Failed to load profile: {error.message}
        </p>
      </main>
    );
  }

  const avatarUrl: string | null = profile.avatar_url ?? null;

  return (
    <main className="p-6 max-w-2xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your public and personal details.
          </p>
        </div>
        <Link
          href="/settings"
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
        >
          Settings
        </Link>
      </div>

      {params?.message ? (
        <p className="rounded-md bg-muted p-3 text-sm">{params.message}</p>
      ) : null}

      {/* Avatar section */}
      <section className="flex items-center gap-6">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted border border-border">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={profile.full_name ?? "Avatar"}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-muted-foreground">
              {(profile.full_name ?? profile.username ?? "U")[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium mb-2">
            {profile.full_name ?? profile.username ?? "Your name"}
          </p>
          <AvatarUploadForm />
        </div>
      </section>

      {/* Profile details form */}
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
    </main>
  );
}
