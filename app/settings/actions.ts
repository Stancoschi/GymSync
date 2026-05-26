"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileSettings(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const goal = formData.get("goal") as string;
  const height_cm = formData.get("height_cm") as string;
  const body_fat_percent = formData.get("body_fat_percent") as string;
  const target_weight_kg = formData.get("target_weight_kg") as string;
  const activity_level = formData.get("activity_level") as string;
  const training_days_per_week = formData.get("training_days_per_week") as string;
  const experience_level = formData.get("experience_level") as string;
  const preferred_gym_id = formData.get("preferred_gym_id") as string;

  const { error } = await supabase
    .from("profiles")
    .update({
      goal,
      height_cm: height_cm ? Number(height_cm) : null,
      body_fat_percent: body_fat_percent ? Number(body_fat_percent) : null,
      target_weight_kg: target_weight_kg ? Number(target_weight_kg) : null,
      activity_level,
      training_days_per_week: training_days_per_week
        ? Number(training_days_per_week)
        : null,
      experience_level,
      preferred_gym_id: preferred_gym_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/settings?message=${encodeURIComponent(error.message)}`);

  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/settings/profile");
  redirect("/settings?message=Profile%20updated%20successfully");
}