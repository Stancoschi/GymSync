"use client";

import Link from "next/link";
import { login } from "@/app/auth/actions";

export function LoginForm() {
  return (
    <form action={login} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border px-3 py-2"
          placeholder="eduard@email.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Parolă
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-md border px-3 py-2"
          placeholder="********"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-black text-white px-4 py-2"
      >
        Login
      </button>

      <p className="text-sm text-muted-foreground">
        Nu ai cont?{" "}
        <Link href="/auth/register" className="underline">
          Creează unul
        </Link>
      </p>
    </form>
  );
}