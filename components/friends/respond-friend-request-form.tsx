"use client";

import {
  acceptFriendRequest,
  declineFriendRequest,
} from "@/app/friends/actions";

export function RespondFriendRequestForm({
  requestId,
  senderId,
}: {
  requestId: string;
  senderId: string;
}) {
  return (
    <div className="flex gap-2">
      <form action={acceptFriendRequest}>
        <input type="hidden" name="request_id" value={requestId} />
        <input type="hidden" name="sender_id" value={senderId} />
        <button type="submit" className="rounded-md bg-black text-white px-4 py-2 text-sm">
          Accept
        </button>
      </form>

      <form action={declineFriendRequest}>
        <input type="hidden" name="request_id" value={requestId} />
        <button type="submit" className="rounded-md border px-4 py-2 text-sm">
          Decline
        </button>
      </form>
    </div>
  );
}
