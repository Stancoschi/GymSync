"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";

type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
};

interface ExerciseComboboxProps {
  exercises?: Exercise[];
  inputName?: string;
  defaultValue?: string;
}

export function ExerciseCombobox({
  exercises = [],
  inputName = "exercise_id",
  defaultValue = "",
}: ExerciseComboboxProps) {
  const { t } = useLanguage();
  const w = t.workouts;

  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(() => {
    if (!defaultValue) return "";
    return exercises.find((e) => e.id === defaultValue)?.name ?? "";
  });
  const [selectedId, setSelectedId] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filtered =
    query.trim() === ""
      ? exercises
      : exercises.filter((e) =>
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          (e.muscle_group ?? "").toLowerCase().includes(query.toLowerCase())
        );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(exercise: Exercise) {
    setSelectedId(exercise.id);
    setQuery(exercise.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      setActiveIndex(0);
      return;
    }
    if (!open) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          handleSelect(filtered[activeIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const selectedExercise = exercises.find((e) => e.id === selectedId);

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={inputName} value={selectedId} />
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          value={query}
          placeholder={w.searchExercise ?? "Search exercises…"}
          autoComplete="off"
          required={!selectedId}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId("");
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <span
          aria-hidden
          onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>

      {selectedExercise && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{selectedExercise.name}</span>
          {selectedExercise.muscle_group && ` • ${selectedExercise.muscle_group}`}
          {selectedExercise.equipment && ` • ${selectedExercise.equipment}`}
        </p>
      )}

      {exercises.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {w.noExercisesYet ?? "No exercises in library yet."}
        </p>
      )}

      {open && exercises.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Exercises"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              {w.noExerciseFound ?? "No exercises found"}
            </li>
          ) : (
            filtered.map((exercise, i) => (
              <li
                key={exercise.id}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={exercise.id === selectedId}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(exercise);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-primary/10 text-primary"
                    : exercise.id === selectedId
                    ? "bg-muted"
                    : "hover:bg-muted"
                }`}
              >
                <span className="font-medium">{exercise.name}</span>
                {(exercise.muscle_group || exercise.equipment) && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {[exercise.muscle_group, exercise.equipment].filter(Boolean).join(" • ")}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
