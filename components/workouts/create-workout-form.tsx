"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorkout } from "@/app/workouts/actions";
import { ExerciseCombobox } from "./exercise-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/language-context";

type ExerciseOption = {
  id: string;
  name: string;
  muscle_group: string | null;
};

type WorkoutExercise = {
  exercise_library_id: string;
  sets: number;
  reps: string;
  weight_kg: string;
  notes: string;
};

export function CreateWorkoutForm({
  exercises,
}: {
  exercises: ExerciseOption[];
}) {
  const { t } = useLanguage();
  const w = t.workouts;
  const c = t.common;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    [{ exercise_library_id: "", sets: 3, reps: "8-12", weight_kg: "", notes: "" }]
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState("");

  function addExercise() {
    setWorkoutExercises((prev) => [
      ...prev,
      { exercise_library_id: "", sets: 3, reps: "8-12", weight_kg: "", notes: "" },
    ]);
  }

  function removeExercise(idx: number) {
    setWorkoutExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateExercise(
    idx: number,
    field: keyof WorkoutExercise,
    value: string | number
  ) {
    setWorkoutExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("date", date);
    if (duration) fd.append("duration_minutes", duration);
    fd.append("exercises_json", JSON.stringify(workoutExercises));
    startTransition(async () => {
      await createWorkout(fd);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{w.workoutDate}</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>{w.duration} ({w.minutes})</Label>
          <Input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="60"
          />
        </div>
      </div>

      <div className="space-y-4">
        {workoutExercises.map((ex, idx) => (
          <div key={idx} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
              {workoutExercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExercise(idx)}
                  className="text-xs text-destructive hover:underline"
                >
                  {c.remove}
                </button>
              )}
            </div>
            <ExerciseCombobox
              exercises={exercises}
              value={ex.exercise_library_id}
              onChange={(v) => updateExercise(idx, "exercise_library_id", v)}
            />
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{w.sets}</Label>
                <Input
                  type="number"
                  min={1}
                  value={ex.sets}
                  onChange={(e) => updateExercise(idx, "sets", parseInt(e.target.value))}
                  placeholder="3"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{w.repsRange}</Label>
                <Input
                  value={ex.reps}
                  onChange={(e) => updateExercise(idx, "reps", e.target.value)}
                  placeholder="8-12"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{w.kg}</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={ex.weight_kg}
                  onChange={(e) => updateExercise(idx, "weight_kg", e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{w.notes}</Label>
              <textarea
                value={ex.notes}
                onChange={(e) => updateExercise(idx, "notes", e.target.value)}
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addExercise} className="w-full">
        + {w.addExercise}
      </Button>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? c.loading : w.newWorkout}
      </Button>
    </form>
  );
}
