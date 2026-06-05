"use client";

import { useTransition } from "react";
import { startWorkoutFromTemplate } from "@/app/workouts/templates/actions";
import { useLanguage } from "@/lib/i18n/language-context";

export function StartWorkoutFromTemplateForm({ templateId }: { templateId: string }) {
  const { t } = useLanguage();
  const w = t.workouts;
  const c = t.common;

  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => startWorkoutFromTemplate(formData));
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="template_id" value={templateId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50 shrink-0"
      >
        {isPending ? c.loading : (w.startWorkout ?? "Start Workout")}
      </button>
    </form>
  );
}
