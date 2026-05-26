"use client";

import {
  addSessionComment,
  addWorkoutComment,
} from "@/app/feed/actions";

type Props =
  | {
      itemType: "workout";
      itemId: string;
    }
  | {
      itemType: "session";
      itemId: string;
    };

export function CommentForm(props: Props) {
  const action =
    props.itemType === "workout"
      ? addWorkoutComment
      : addSessionComment;

  return (
    <form action={action} className="flex gap-2">
      <input
        type="hidden"
        name={props.itemType === "workout" ? "workout_id" : "session_id"}
        value={props.itemId}
      />
      <input
        type="text"
        name="content"
        placeholder="Write a comment..."
        maxLength={300}
        className="flex-1 rounded-xl border px-3 py-2 text-sm"
        required
      />
      <button
        type="submit"
        className="rounded-xl border px-4 py-2 text-sm"
      >
        Send
      </button>
    </form>
  );
}