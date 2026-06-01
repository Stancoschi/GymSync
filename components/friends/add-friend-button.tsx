"use client";

import { useState } from "react";
import { sendFriendRequest } from "@/app/friends/actions";

export function AddFriendButton({ targetUserId }: { targetUserId: string }) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("receiver_id", targetUserId);
      await sendFriendRequest(formData);
      setSent(true);
    } catch {
      // action redirects on success/error; if we're still here something went wrong
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <span className="rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
        Request sent
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      {pending ? "Sending…" : "Add friend"}
    </button>
  );
}
