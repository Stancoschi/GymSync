"use client";

import {
  toggleSessionReaction,
  toggleWorkoutReaction,
} from "@/app/feed/actions";

type Props =
  | {
      itemType: "workout";
      itemId: string;
      count: number;
      reacted: boolean;
    }
  | {
      itemType: "session";
      itemId: string;
      count: number;
      reacted: boolean;
    };

export function ReactionButton(props: Props) {
  const action =
    props.itemType === "workout"
      ? toggleWorkoutReaction
      : toggleSessionReaction;

  return (
    <form action={action}>
      <input
        type="hidden"
        name={props.itemType === "workout" ? "workout_id" : "session_id"}
        value={props.itemId}
      />
      <button
        type="submit"
        className={`rounded-xl border px-3 py-2 text-sm transition ${
          props.reacted ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        🔥 {props.count}
      </button>
    </form>
  );
}