"use client";

import { logout } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md border px-3 py-2 text-sm"
      >
        Logout
      </button>
    </form>
  );
}