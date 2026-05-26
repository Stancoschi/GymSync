"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendFriendRequest(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const receiverId = formData.get("receiver_id") as string;

  if (!receiverId || receiverId === user.id) {
    redirect("/friends?message=Invalid%20friend%20request");
  }

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    status: "pending",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/friends?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/friends");
  redirect("/friends?message=Friend%20request%20sent");
}

export async function acceptFriendRequest(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const requestId = formData.get("request_id") as string;
  const senderId = formData.get("sender_id") as string;

  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("receiver_id", user.id);

  if (updateError) {
    redirect(`/friends?message=${encodeURIComponent(updateError.message)}`);
  }

  const userA = [user.id, senderId].sort()[0];
  const userB = [user.id, senderId].sort()[1];

  const { error: friendshipError } = await supabase.from("friendships").insert({
    user_a_id: userA,
    user_b_id: userB,
  });

  if (friendshipError) {
    redirect(`/friends?message=${encodeURIComponent(friendshipError.message)}`);
  }

  revalidatePath("/friends");
  redirect("/friends?message=Friend%20request%20accepted");
}

export async function rejectFriendRequest(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const requestId = formData.get("request_id") as string;

  const { error } = await supabase
    .from("friend_requests")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("receiver_id", user.id);

  if (error) {
    redirect(`/friends?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/friends");
  redirect("/friends?message=Request%20rejected");
}