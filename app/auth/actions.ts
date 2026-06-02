"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect(`/auth/login?message=${encodeURIComponent(error.message)}`);
  }

  // Respect ?redirect= param so users land back where they were
  const redirectTo = (formData.get("redirect") as string | null)?.trim();
  const destination =
    redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect(`/auth/register?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

// Alias used by register-form.tsx
export const register = signup;

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
