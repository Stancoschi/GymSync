import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { updatePassword } from "./actions";

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(`goal, height_cm, body_fat_percent, target_weight_kg, activity_level, training_days_per_week, experience_level, preferred_gym_id, onboarding_completed`)
    .eq("id", user.id)
    .single();

  const { data: gyms } = await supabase
    .from("gyms")
    .select("id, name, city")
    .order("name", { ascending: true });

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Settings</p>
            <h1 className="text-3xl font-bold">Profile &amp; account</h1>
            <p className="text-muted-foreground">Update your fitness goals, preferences, and password.</p>
          </div>
          <Link href="/dashboard" className="rounded-xl border px-4 py-2 text-sm shrink-0">← Dashboard</Link>
        </div>

        {params?.message && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            params.message.toLowerCase().includes("success") ? "border-primary/30 text-primary" : "border-destructive/40 text-destructive"
          }`}>
            {params.message}
          </div>
        )}

        {/* Fitness goals */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Fitness goals</h2>
          <OnboardingForm gyms={gyms ?? []} profile={profile ?? null} mode="settings" />
        </section>

        {/* Change password */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Change password</h2>
          <form action={updatePassword} className="space-y-4 max-w-md">
            <div className="space-y-1">
              <label htmlFor="new_password" className="text-sm font-medium">New password</label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm_password" className="text-sm font-medium">Confirm new password</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
                placeholder="Repeat password"
                className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Update password
            </button>
          </form>
        </section>

        {/* Account info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Account</h2>
          <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-1">
            <p className="text-muted-foreground">Signed in as</p>
            <p className="font-medium">{user.email}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
