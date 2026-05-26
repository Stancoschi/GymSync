"use client";

import { joinSession } from "@/app/sessions/actions";

export function JoinSessionButton({ sessionId }: { sessionId: string }) {
  return (
    <form action={joinSession}>
      <input type="hidden" name="session_id" value={sessionId} />
      <button
        type="submit"
        className="rounded-md border px-4 py-2 text-sm"
      >
        Join
      </button>
    </form>
  );
}