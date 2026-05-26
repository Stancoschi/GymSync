"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createSession(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const gymId = formData.get("gym_id") as string;
  const title = formData.get("title") as string;
  const notes = formData.get("notes") as string;
  const scheduledFor = formData.get("scheduled_for") as string;
  const maxParticipantsRaw = formData.get("max_participants") as string;

  const maxParticipants = maxParticipantsRaw
    ? Number(maxParticipantsRaw)
    : null;

  const { error } = await supabase.from("gym_sessions").insert({
    creator_id: user.id,
    gym_id: gymId,
    title,
    notes: notes || null,
    scheduled_for: scheduledFor,
    max_participants: maxParticipants,
  });

  if (error) {
    redirect(`/sessions?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/sessions");
  redirect("/sessions?message=Session%20created");
}

export async function joinSession(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const sessionId = formData.get("session_id") as string;

  const { error } = await supabase.from("gym_session_participants").insert({
    session_id: sessionId,
    user_id: user.id,
  });

  if (error) {
    redirect(`/sessions?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/sessions");
  redirect("/sessions?message=Joined%20session");
}