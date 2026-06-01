"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function sendFriendRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const receiverId = formData.get("receiver_id") as string;
  if (!receiverId) redirect("/friends?message=Invalid request");

  // Check duplicate
  const { data: existing } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("sender_id", user.id)
    .eq("receiver_id", receiverId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) redirect("/friends?message=Friend request already sent");

  const { error } = await supabase
    .from("friend_requests")
    .insert({ sender_id: user.id, receiver_id: receiverId, status: "pending" });

  if (error) redirect(`/friends?message=${encodeURIComponent(error.message)}`);

  // Notify receiver
  await createNotification({
    userId: receiverId,
    type: "friend_request",
    actorId: user.id,
  });

  revalidatePath("/friends");
  redirect("/friends?message=Friend request sent!");
}

export async function acceptFriendRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const requestId = formData.get("request_id") as string;
  const senderId = formData.get("sender_id") as string;

  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId)
    .eq("receiver_id", user.id);

  if (updateError)
    redirect(`/friends?message=${encodeURIComponent(updateError.message)}`);

  const { error: friendshipError } = await supabase
    .from("friendships")
    .insert({ user_a_id: user.id, user_b_id: senderId });

  if (friendshipError)
    redirect(`/friends?message=${encodeURIComponent(friendshipError.message)}`);

  // Notify original sender that their request was accepted
  await createNotification({
    userId: senderId,
    type: "friend_accepted",
    actorId: user.id,
  });

  revalidatePath("/friends");
  redirect("/friends?message=Friend request accepted!");
}

export async function declineFriendRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const requestId = formData.get("request_id") as string;

  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "declined" })
    .eq("id", requestId)
    .eq("receiver_id", user.id);

  if (error) redirect(`/friends?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/friends");
  redirect("/friends?message=Request declined");
}
