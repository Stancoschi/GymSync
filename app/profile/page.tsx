import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import Link from "next/link";

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

  return (
    <main className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your public and personal details.
        </p>
        <Link href="/settings" className="rounded-md border px-4 py-2"> 
        Settings
        </Link>
      </div>

      {params?.message ? (
        <p className="mb-4 rounded-md bg-muted p-3 text-sm">
          {params.message}
        </p>
      ) : null}
  
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