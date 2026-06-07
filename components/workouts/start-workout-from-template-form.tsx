"use client";

import { useTransition } from "react";
import { Play, Loader2 } from "lucide-react";
import { startWorkoutFromTemplate } from "@/app/workouts/templates/actions";

export function StartWorkoutFromTemplateForm({ templateId }: { templateId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => startWorkoutFromTemplate(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0">
      <input type="hidden" name="template_id" value={templateId} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {isPending ? "Starting..." : "Start"}
      </button>
    </form>
  );
}
