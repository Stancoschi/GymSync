"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  // Validate file type
  if (!file.type.startsWith("image/")) {
    redirect("/profile?message=Please upload an image file");
  }

  // Max 2 MB
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
