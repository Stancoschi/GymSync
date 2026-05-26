"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const username = formData.get("username") as string;
  const fullName = formData.get("full_name") as string;
  const bio = formData.get("bio") as string;
  const city = formData.get("city") as string;
  const goal = formData.get("goal") as string;

  const { error } = await supabase
    .from("profiles")
    .update({
      username: username || null,
      full_name: fullName || null,
      bio: bio || null,
      city: city || null,
      goal: goal || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/profile?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/profile?message=Profile%20updated");
}