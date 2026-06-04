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

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";

export function ProfileForm({ email, profile }: ProfileFormProps) {
  return (
    <form action={updateProfile} className="space-y-5 rounded-2xl border border-border bg-card p-5">
      {/* Email — read only */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">Email</label>
        <input value={email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="username" className="text-sm font-medium">Username</label>
          <input
            id="username" name="username"
            defaultValue={profile.username}
            className={inputClass}
            placeholder="eduardfit"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="full_name" className="text-sm font-medium">Full name</label>
          <input
            id="full_name" name="full_name"
            defaultValue={profile.full_name}
            className={inputClass}
            placeholder="Eduard Stancoschi"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="city" className="text-sm font-medium">City</label>
          <input
            id="city" name="city"
            defaultValue={profile.city}
            className={inputClass}
            placeholder="Iași"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="goal" className="text-sm font-medium">Goal</label>
          <select
            id="goal" name="goal"
            defaultValue={profile.goal}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Select a goal</option>
            <option value="lose_weight">Lose weight</option>
            <option value="maintain">Maintain</option>
            <option value="gain_muscle">Gain muscle</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="bio" name="bio"
          defaultValue={profile.bio}
          rows={4}
          className={`${inputClass} resize-none`}
          placeholder="Write something about your training style…"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Save profile
      </button>
    </form>
  );
}
