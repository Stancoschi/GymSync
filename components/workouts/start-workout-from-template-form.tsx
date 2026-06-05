"use client";

import { useTransition } from "react";
import { startWorkoutFromTemplate } from "@/app/workouts/templates/[id]/actions";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";

export function StartWorkoutFromTemplateForm({
  templateId,
}: {
  templateId: string;
}) {
  const { t } = useLanguage();
  const w = t.workouts;
  const c = t.common;
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("template_id", templateId);
    startTransition(async () => {
      await startWorkoutFromTemplate(fd);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? c.loading : w.startFromTemplate}
      </Button>
    </form>
  );
}
