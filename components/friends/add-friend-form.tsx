"use client";

import { sendFriendRequest } from "@/app/friends/actions";

type UserOption = {
  id: string;
  username: string | null;
  full_name: string | null;
};

export function AddFriendForm({ users }: { users: UserOption[] }) {
  return (
    <form action={sendFriendRequest} className="space-y-4 rounded-2xl border p-6">
      <h2 className="text-lg font-semibold">Add friend</h2>

      <div className="space-y-2">
        <label htmlFor="receiver_id" className="text-sm font-medium">
          Select user
        </label>
        <select
          id="receiver_id"
          name="receiver_id"
          required
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">Choose a user</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || u.username || u.id}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="rounded-md bg-black text-white px-4 py-2">
        Send request
      </button>
    </form>
  );
}