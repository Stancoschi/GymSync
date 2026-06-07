"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function startWorkoutFromTemplate(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const templateId = formData.get("template_id") as string;
  if (!templateId) redirect("/workouts?message=Missing+template");

  // Verify template exists and is accessible (own or public)
  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .select("id, name")
    .eq("id", templateId)
    .or(`user_id.eq.${user.id},is_public.eq.true`)
    .single();

  if (templateError || !template) {
    redirect("/workouts?message=Template+not+found");
  }

  // LiveSessionClient handles session creation internally.
  // We just redirect to the live session page with the template ID.
  redirect(`/workouts/${templateId}/session`);
}
