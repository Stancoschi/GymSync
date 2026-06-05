"use client";

import { useState, useTransition } from "react";
import { addExerciseToTemplate } from "@/app/workouts/templates/[id]/actions";
import { ExerciseCombobox } from "./exercise-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n/language-context";

type ExerciseOption = {
  id: string;
  name: string;
  muscle_group: string | null;
};

export function AddTemplateExerciseForm({
  templateId,
  exercises,
  onDone,
}: {
  templateId: string;
  exercises: ExerciseOption[];
  onDone?: () => void;
}) {
  const { t } = useLanguage();
  const w = t.workouts;
  const s = t.sessions;
  const c = t.common;

  const [exerciseId, setExerciseId] = useState("");
  const [targetSets, setTargetSets] = useState("3");
  const [minReps, setMinReps] = useState("8");
  const [maxReps, setMaxReps] = useState("12");
  const [targetRir, setTargetRir] = useState("2");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exerciseId) return;
    const fd = new FormData();
    fd.append("template_id", templateId);
    fd.append("exercise_library_id", exerciseId);
    fd.append("target_sets", targetSets);
    fd.append("min_reps", minReps);
    fd.append("max_reps", maxReps);
    fd.append("target_rir", targetRir);
    fd.append("notes", notes);
    startTransition(async () => {
      await addExerciseToTemplate(fd);
      setExerciseId("");
      setNotes("");
      onDone?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{w.selectExercise}</Label>
        <ExerciseCombobox
          exercises={exercises}
          value={exerciseId}
          onChange={setExerciseId}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{w.sets}</Label>
          <Input
            type="number"
            min={1}
            value={targetSets}
            onChange={(e) => setTargetSets(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">RIR</Label>
          <Input
            type="number"
            min={0}
            max={5}
            value={targetRir}
            onChange={(e) => setTargetRir(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Min {s.reps}</Label>
          <Input
            type="number"
            min={1}
            value={minReps}
            onChange={(e) => setMinReps(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Max {s.reps}</Label>
          <Input
            type="number"
            min={1}
            value={maxReps}
            onChange={(e) => setMaxReps(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{w.notes}</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !exerciseId}
      >
        {isPending ? c.loading : `+ ${w.addExercise}`}
      </Button>
    </form>
  );
}
