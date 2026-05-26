"use client";

import { updateProfile } from "@/app/profile/actions";

type ProfileFormProps = {
  email: string;
  profile: {
    username: string;
    full_name: string;
    bio: string;
    city: string;
    goal: string;
  };
};

export function ProfileForm({ email, profile }: ProfileFormProps) {
  return (
    <form action={updateProfile} className="space-y-5 rounded-2xl border p-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <input
          value={email}
          disabled
          className="w-full rounded-md border px-3 py-2 bg-muted"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          defaultValue={profile.username}
          className="w-full rounded-md border px-3 py-2"
          placeholder="eduardfit"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="full_name" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name}
          className="w-full rounded-md border px-3 py-2"
          placeholder="Eduard Stancoschi"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="city" className="text-sm font-medium">
          City
        </label>
        <input
          id="city"
          name="city"
          defaultValue={profile.city}
          className="w-full rounded-md border px-3 py-2"
          placeholder="Iasi"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="goal" className="text-sm font-medium">
          Goal
        </label>
        <select
          id="goal"
          name="goal"
          defaultValue={profile.goal}
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">Select a goal</option>
          <option value="lose_weight">Lose weight</option>
          <option value="maintain">Maintain</option>
          <option value="gain_muscle">Gain muscle</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio}
          className="w-full rounded-md border px-3 py-2 min-h-[120px]"
          placeholder="Write something about your training style..."
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-black text-white px-4 py-2"
      >
        Save profile
      </button>
    </form>
  );
}