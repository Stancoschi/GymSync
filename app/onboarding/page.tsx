import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage({
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
      activity_level,
      training_days_per_week,
      experience_level,
      preferred_gym_id,
      onboarding_completed
    `)
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  const { data: gyms } = await supabase
    .from("gyms")
    .select("id, name, city")
    .order("name", { ascending: true });

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            GymSync setup
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Build your fitness profile
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Tell us a bit about your goal, activity level, and training style so
            the app can personalize your experience.
          </p>
        </div>

        {params?.message ? (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.message}
          </div>
        ) : null}

        <OnboardingForm gyms={gyms ?? []} profile={profile ?? null} />
      </div>
    </main>
  );
}