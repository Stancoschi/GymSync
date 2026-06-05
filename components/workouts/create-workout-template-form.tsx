"use client";

import { useTransition } from "react";
import { createWorkoutTemplate } from "@/app/workouts/templates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/language-context";

export function CreateWorkoutTemplateForm() {
  const { t } = useLanguage();
  const w = t.workouts;
  const c = t.common;
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createWorkoutTemplate(fd);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="template-name">{w.templateName}</Label>
        <Input
          id="template-name"
          name="name"
          placeholder={w.templateName}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? c.loading : w.createTemplate}
      </Button>
    </form>
  );
}
