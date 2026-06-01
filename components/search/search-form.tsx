"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

export function SearchForm({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={initialQ}
        placeholder="Search users, sessions, exercises…"
        autoFocus
        className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-shadow"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-opacity disabled:opacity-60"
      >
        {isPending ? "…" : "Search"}
      </button>
    </form>
  );
}
