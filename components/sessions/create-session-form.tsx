"use client";

import { createSession } from "@/app/sessions/actions";

type Gym = {
  id: string;
  name: string;
  city: string | null;
};

export function CreateSessionForm({ gyms }: { gyms: Gym[] }) {
  return (
    <form action={createSession} className="space-y-4 rounded-2xl border p-6">
      <h2 className="text-lg font-semibold">Create gym session</h2>

      <div className="space-y-2">
        <label htmlFor="gym_id" className="text-sm font-medium">
          Gym
        </label>
        <select
          id="gym_id"
          name="gym_id"
          required
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">Select a gym</option>
          {gyms.map((gym) => (
            <option key={gym.id} value={gym.id}>
              {gym.name} {gym.city ? `- ${gym.city}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded-md border px-3 py-2"
          placeholder="Push workout after work"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="scheduled_for" className="text-sm font-medium">
          Scheduled for
        </label>
        <input
          id="scheduled_for"
          name="scheduled_for"
          type="datetime-local"
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="max_participants" className="text-sm font-medium">
          Max participants
        </label>
        <input
          id="max_participants"
          name="max_participants"
          type="number"
          min="1"
          className="w-full rounded-md border px-3 py-2"
          placeholder="4"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
          placeholder="Leg day, medium intensity, anyone welcome."
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-black text-white px-4 py-2"
      >
        Create session
      </button>
    </form>
  );
}