"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createBodyLog(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const logDate = formData.get("log_date") as string;
  const weightKg = formData.get("weight_kg") as string;
  const bodyFatPercent = formData.get("body_fat_percent") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("body_logs").insert({
    user_id: user.id,
    log_date: logDate,
    weight_kg: Number(weightKg),
    body_fat_percent: bodyFatPercent ? Number(bodyFatPercent) : null,
    notes: notes || null,
  });

  if (error) {
    redirect(`/nutrition?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/nutrition");
  redirect("/nutrition?message=Body%20log%20added");
}

export async function createMeal(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const logDate = formData.get("log_date") as string;
  const mealName = formData.get("food_name") as string;
  const calories = formData.get("calories") as string;
  const proteinG = formData.get("protein_g") as string;
  const carbsG = formData.get("carbs_g") as string;
  const fatG = formData.get("fat_g") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("meals").insert({
    user_id: user.id,
    log_date: logDate,
    food_name: mealName,
    calories: calories ? Number(calories) : null,
    protein_g: proteinG ? Number(proteinG) : null,
    carbs_g: carbsG ? Number(carbsG) : null,
    fat_g: fatG ? Number(fatG) : null,
    notes: notes || null,
  });

  if (error) {
    redirect(`/nutrition?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/nutrition");
  redirect("/nutrition?message=Meal%20added");
}