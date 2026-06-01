"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

// Alias used by onboarding-form.tsx in settings mode
export const updateProfileSettings = updateProfile;

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Double-check: user must type their email to confirm
  const confirmation = (formData.get("confirmation") as string)?.trim();
  if (confirmation !== user.email) {
    redirect("/settings?message=Email does not match. Account not deleted.");
  }

  // Delete user data in order (foreign key safe)
  // Supabase RLS allows users to delete their own rows;
  // cascade deletes handle child rows where FK+cascade is set.
  await supabase.from("notifications").delete().eq("user_id", user.id);
  await supabase.from("gym_session_participants").delete().eq("user_id", user.id);
  await supabase.from("friendships").delete().or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
  await supabase.from("friend_requests").delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
  await supabase.from("body_logs").delete().eq("user_id", user.id);
  await supabase.from("workouts").delete().eq("user_id", user.id);
  await supabase.from("gym_sessions").delete().eq("creator_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);

  // Sign the user out first so the cookie is cleared
  await supabase.auth.signOut();

  // Delete the auth user via service role (requires SUPABASE_SERVICE_ROLE_KEY env var)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (serviceRoleKey && supabaseUrl) {
    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await admin.auth.admin.deleteUser(user.id);
  }

  redirect("/");
}
