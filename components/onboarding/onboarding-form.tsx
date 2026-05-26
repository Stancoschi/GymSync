"use client";

import { completeOnboarding } from "@/app/onboarding/actions";
import { updateProfileSettings } from "@/app/settings/actions";

type Gym = {
  id: string;
  name: string;
  city: string | null;
};

type Profile = {
    goal: string | null;
    height_cm: number | null;
    body_fat_percent: number | null;
    target_weight_kg?: number | null;
    activity_level: string | null;
    training_days_per_week: number | null;
    experience_level: string | null;
    preferred_gym_id: string | null;
  };

  export function OnboardingForm({
    gyms,
    profile,
    mode = "onboarding",
  }: {
    gyms: Gym[];
    profile: Profile | null;
    mode?: "onboarding" | "settings";
  }) {
  return (
    <form action={mode === "onboarding" ? completeOnboarding : updateProfileSettings}
    className="space-y-8 rounded-3xl border p-8">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your goal</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { value: "lose_weight", label: "Lose weight" },
            { value: "maintain_weight", label: "Maintain" },
            { value: "gain_muscle", label: "Gain muscle" },
          ].map((item) => (
            <label key={item.value} className="rounded-2xl border p-4 cursor-pointer">
              <input
                type="radio"
                name="goal"
                value={item.value}
                defaultChecked={profile?.goal === item.value}
                className="mb-3"
                required
              />
              <div className="font-medium">{item.label}</div>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Body metrics</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="height_cm" className="text-sm font-medium">
              Height (cm)
            </label>
            <input
              id="height_cm"
              name="height_cm"
              type="number"
              step="0.1"
              min="50"
              max="300"
              defaultValue={profile?.height_cm ?? ""}
              className="w-full rounded-xl border px-3 py-2"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="body_fat_percent" className="text-sm font-medium">
              Body fat % (optional)
            </label>
            <input
              id="body_fat_percent"
              name="body_fat_percent"
              type="number"
              step="0.1"
              min="1"
              max="80"
              defaultValue={profile?.body_fat_percent ?? ""}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Activity</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="activity_level" className="text-sm font-medium">
              Daily activity level
            </label>
            <select
              id="activity_level"
              name="activity_level"
              defaultValue={profile?.activity_level ?? ""}
              className="w-full rounded-xl border px-3 py-2"
              required
            >
              <option value="">Select activity level</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly active</option>
              <option value="moderate">Moderately active</option>
              <option value="active">Active</option>
              <option value="very_active">Very active</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="training_days_per_week" className="text-sm font-medium">
              Training days per week
            </label>
            <input
              id="training_days_per_week"
              name="training_days_per_week"
              type="number"
              min="0"
              max="14"
              defaultValue={profile?.training_days_per_week ?? ""}
              className="w-full rounded-xl border px-3 py-2"
              required
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Experience</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
          ].map((item) => (
            <label key={item.value} className="rounded-2xl border p-4 cursor-pointer">
              <input
                type="radio"
                name="experience_level"
                value={item.value}
                defaultChecked={profile?.experience_level === item.value}
                className="mb-3"
                required
              />
              <div className="font-medium">{item.label}</div>
            </label>
          ))}
        </div>

        <div className="space-y-2">
  <label htmlFor="target_weight_kg" className="text-sm font-medium">
    Target weight (kg)
  </label>
  <input
    id="target_weight_kg"
    name="target_weight_kg"
    type="number"
    step="0.1"
    min="20"
    max="400"
    defaultValue={(profile as any)?.target_weight_kg ?? ""}
    className="w-full rounded-xl border px-3 py-2"
  />
</div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Preferences</h2>
        <div className="space-y-2">
          <label htmlFor="preferred_gym_id" className="text-sm font-medium">
            Preferred gym
          </label>
          <select
            id="preferred_gym_id"
            name="preferred_gym_id"
            defaultValue={profile?.preferred_gym_id ?? ""}
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="">No preferred gym</option>
            {gyms.map((gym) => (
              <option key={gym.id} value={gym.id}>
                {gym.name}{gym.city ? ` • ${gym.city}` : ""}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="flex items-center justify-end">
      <button
  type="submit"
  className="rounded-xl bg-black px-6 py-3 text-white"
>
  {mode === "onboarding" ? "Complete setup" : "Save changes"}
</button>
      </div>
    </form>
  );
}