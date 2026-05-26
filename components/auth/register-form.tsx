"use client";

import Link from "next/link";
import { register } from "@/app/auth/actions";

export function RegisterForm() {
  return (
    <form action={register} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          className="w-full rounded-md border px-3 py-2"
          placeholder="eduardfit"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="full_name" className="text-sm font-medium">
          Nume complet
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          className="w-full rounded-md border px-3 py-2"
          placeholder="Eduard Stancoschi"
        />
      </div>

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
        Create account
      </button>

      <p className="text-sm text-muted-foreground">
        Ai deja cont?{" "}
        <Link href="/auth/login" className="underline">
          Login
        </Link>
      </p>
    </form>
  );
}