"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/lib/i18n/language-context";

type ExerciseOption = {
  id: string;
  name: string;
  muscle_group: string | null;
};

interface ExerciseComboboxProps {
  exercises: ExerciseOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ExerciseCombobox({
  exercises,
  value,
  onChange,
  disabled,
}: ExerciseComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { t } = useLanguage();
  const w = t.workouts;

  const selected = exercises.find((e) => e.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selected ? (
            <span>
              {selected.name}
              {selected.muscle_group && (
                <span className="ml-1.5 text-muted-foreground text-xs capitalize">
                  ({selected.muscle_group})
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{w.selectExercise}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={w.searchExercise} />
          <CommandList>
            <CommandEmpty>{w.noExerciseFound}</CommandEmpty>
            <CommandGroup>
              {exercises.map((exercise) => (
                <CommandItem
                  key={exercise.id}
                  value={exercise.name}
                  onSelect={() => {
                    onChange(exercise.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === exercise.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">{exercise.name}</span>
                  {exercise.muscle_group && (
                    <span className="text-xs text-muted-foreground capitalize ml-2">
                      {exercise.muscle_group}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
