import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function ProfileSettingsPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      goal,
      height_cm,
      body_fat_percent,
      target_weight_kg,
      activity_level,
      training_days_per_week,
      experience_level,
      preferred_gym_id,
      onboarding_completed
    `)
    .eq("id", user.id)
    .single();

  const { data: gyms } = await supabase
    .from("gyms")
    .select("id, name, city")
    .order("name", { ascending: true });

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Settings
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold">
              Edit profile and goals
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Update your fitness goals, activity preferences, and training setup.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Back to dashboard
          </Link>
        </div>

        {params?.message ? (
          <div className="rounded-xl border px-4 py-3 text-sm">
            {params.message}
          </div>
        ) : null}

        <OnboardingForm
          gyms={gyms ?? []}
          profile={profile ?? null}
          mode="settings"
        />
      </div>
    </main>
  );
}