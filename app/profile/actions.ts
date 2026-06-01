"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const username = formData.get("username") as string | null;
  const full_name = formData.get("full_name") as string | null;
  const bio = formData.get("bio") as string | null;
  const city = formData.get("city") as string | null;
  const goal = formData.get("goal") as string | null;

  const { error } = await supabase
    .from("profiles")
    .update({ username, full_name, bio, city, goal })
    .eq("id", user.id);

  if (error) {
    redirect(`/profile?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile");
  redirect("/profile?message=Profile saved successfully");
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    redirect("/profile?message=No file selected");
  }

  if (!file.type.startsWith("image/")) {
    redirect("/profile?message=Please upload an image file");
  }

  if (file.size > 2 * 1024 * 1024) {
    redirect("/profile?message=Image must be under 2 MB");
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    redirect(`/profile?message=${encodeURIComponent(uploadError.message)}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    redirect(`/profile?message=${encodeURIComponent(updateError.message)}`);
  }

  revalidatePath("/profile");
  redirect("/profile?message=Avatar updated successfully");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const username = formData.get("username") as string;
  const full_name = formData.get("full_name") as string;
  const bio = formData.get("bio") as string;
  const city = formData.get("city") as string;
  const goal = formData.get("goal") as string;

  const { error } = await supabase
    .from("profiles")
    .update({ username, full_name, bio, city, goal })
    .eq("id", user.id);

  if (error) redirect(`/profile?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/profile");
  redirect("/profile?message=Profile updated successfully");
}
