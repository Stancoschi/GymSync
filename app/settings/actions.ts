"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!newPassword || newPassword.length < 8) {
    redirect("/settings?message=Password must be at least 8 characters");
  }

  if (newPassword !== confirmPassword) {
    redirect("/settings?message=Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) redirect(`/settings?message=${encodeURIComponent(error.message)}`);

  redirect("/settings?message=Password updated successfully");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const goal = formData.get("goal") as string | null;
  const height_cm = formData.get("height_cm") ? Number(formData.get("height_cm")) : null;
  const body_fat_percent = formData.get("body_fat_percent") ? Number(formData.get("body_fat_percent")) : null;
  const target_weight_kg = formData.get("target_weight_kg") ? Number(formData.get("target_weight_kg")) : null;
  const activity_level = formData.get("activity_level") as string | null;
  const training_days_per_week = formData.get("training_days_per_week") ? Number(formData.get("training_days_per_week")) : null;
  const experience_level = formData.get("experience_level") as string | null;
  const preferred_gym_id = formData.get("preferred_gym_id") as string | null;

  const { error } = await supabase
    .from("profiles")
    .update({ goal, height_cm, body_fat_percent, target_weight_kg, activity_level, training_days_per_week, experience_level, preferred_gym_id })
    .eq("id", user.id);

  if (error) redirect(`/settings?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect("/settings?message=Profile updated successfully");
}
