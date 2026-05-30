"use client";

import { completeWorkoutSession } from "@/app/sessions/actions";

export function CompleteSessionForm({ sessionId }: { sessionId: string }) {
  return (
    <form action={completeWorkoutSession}>
      <input type="hidden" name="session_id" value={sessionId} />
      <button
        type="submit"
        className="rounded-xl bg-black px-6 py-3 text-white"
      >
        Complete workout
      </button>
    </form>
  );
}