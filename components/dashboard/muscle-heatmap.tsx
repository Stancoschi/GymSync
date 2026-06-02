"use client";

import { useState, useMemo } from "react";
import { normaliseMuscle, MUSCLE_KEYS } from "@/lib/muscle-utils";
import type { MuscleKey } from "@/lib/muscle-utils";
import type { MuscleSetCount } from "@/lib/muscle-heatmap-data";

export type { MuscleSetCount };

// Combined score for colour intensity
function totalScore(sets: number, secondarySets: number) {
  return sets + secondarySets * 0.5;
}

function intensityClass(sets: number, secondarySets: number): string {
  const score = totalScore(sets, secondarySets);
  if (score === 0) return "fill-muted/40 stroke-border/60";
  if (sets > 0 && score <= 3) return "fill-primary/25 stroke-primary/50";
  if (sets > 0 && score <= 7) return "fill-primary/55 stroke-primary/75";
  if (sets > 0) return "fill-primary/90 stroke-primary";
  // secondary only (no direct sets)
  if (score <= 2) return "fill-primary/10 stroke-primary/25";
  return "fill-primary/20 stroke-primary/35";
}

function intensityLabel(sets: number, secondarySets: number): string {
  if (sets === 0 && secondarySets === 0) return "Not trained";
  const parts: string[] = [];
  if (sets > 0) parts.push(`${sets} direct set${sets !== 1 ? "s" : ""}`);
  if (secondarySets > 0) parts.push(`${secondarySets.toFixed(1)} secondary`);
  return parts.join(" + ");
}

type MusclePath = { key: MuscleKey; label: string; view: "front" | "back"; d: string };

/**
 * SVG body map — viewBox 0 0 100 220.
 * Paths derived from standard anatomical front/back diagrams.
 * Each group is a single closed path; bilateral muscles have two paths.
 */
const MUSCLE_PATHS: MusclePath[] = [
  // ─── FRONT ────────────────────────────────────────────────────────────────────────────
  // Chest — pec region
  { key: "chest", label: "Chest", view: "front",
    d: "M36,62 C36,58 40,55 50,55 L50,68 C44,70 36,70 36,62Z M64,62 C64,58 60,55 50,55 L50,68 C56,70 64,70 64,62Z" },
  // Front delts / shoulders
  { key: "shoulders", label: "Front Delts", view: "front",
    d: "M28,55 C24,52 22,58 24,64 C26,68 30,68 32,65 C34,60 32,56 28,55Z" },
  { key: "shoulders", label: "Front Delts", view: "front",
    d: "M72,55 C76,52 78,58 76,64 C74,68 70,68 68,65 C66,60 68,56 72,55Z" },
  // Biceps
  { key: "biceps", label: "Biceps", view: "front",
    d: "M22,66 C18,70 17,78 19,86 C21,90 25,90 27,86 C29,78 28,68 24,65 Z" },
  { key: "biceps", label: "Biceps", view: "front",
    d: "M78,66 C82,70 83,78 81,86 C79,90 75,90 73,86 C71,78 72,68 76,65 Z" },
  // Forearms
  { key: "forearms", label: "Forearms", view: "front",
    d: "M18,88 C14,94 14,104 17,110 C19,113 23,112 25,108 C27,100 27,90 23,87 Z" },
  { key: "forearms", label: "Forearms", view: "front",
    d: "M82,88 C86,94 86,104 83,110 C81,113 77,112 75,108 C73,100 73,90 77,87 Z" },
  // Abs — 4 segments
  { key: "abs", label: "Abs", view: "front",
    d: "M40,70 L60,70 L60,76 L40,76Z M40,77 L60,77 L60,83 L40,83Z M40,84 L60,84 L60,90 L40,90Z M41,91 L59,91 L58,97 L42,97Z" },
  // Hip flexors / lower core — below abs
  { key: "core", label: "Core", view: "front",
    d: "M42,97 L58,97 L57,104 L43,104Z" },
  // Quads — left
  { key: "quads", label: "Quads", view: "front",
    d: "M35,110 C32,112 30,120 31,132 C32,140 36,144 40,143 C44,142 46,136 45,126 C44,116 40,108 35,110Z" },
  // Quads — right
  { key: "quads", label: "Quads", view: "front",
    d: "M65,110 C68,112 70,120 69,132 C68,140 64,144 60,143 C56,142 54,136 55,126 C56,116 60,108 65,110Z" },
  // Calves — front shin (tibialis)
  { key: "calves", label: "Shins / Calves", view: "front",
    d: "M32,148 C30,154 30,164 32,172 C34,176 38,175 39,170 C40,162 40,152 37,147 Z" },
  { key: "calves", label: "Shins / Calves", view: "front",
    d: "M68,148 C70,154 70,164 68,172 C66,176 62,175 61,170 C60,162 60,152 63,147 Z" },

  // ─── BACK ────────────────────────────────────────────────────────────────────────────
  // Traps — upper trapezius
  { key: "traps", label: "Traps", view: "back",
    d: "M38,50 C38,46 50,44 50,50 L50,60 C44,60 38,58 38,50Z M62,50 C62,46 50,44 50,50 L50,60 C56,60 62,58 62,50Z" },
  // Rear delts
  { key: "shoulders", label: "Rear Delts", view: "back",
    d: "M28,52 C24,50 21,56 23,63 C25,67 29,67 31,63 C33,58 32,53 28,52Z" },
  { key: "shoulders", label: "Rear Delts", view: "back",
    d: "M72,52 C76,50 79,56 77,63 C75,67 71,67 69,63 C67,58 68,53 72,52Z" },
  // Lats
  { key: "lats", label: "Lats", view: "back",
    d: "M30,64 C26,68 26,82 30,90 C34,96 40,96 42,88 C44,80 42,68 38,63 Z" },
  { key: "lats", label: "Lats", view: "back",
    d: "M70,64 C74,68 74,82 70,90 C66,96 60,96 58,88 C56,80 58,68 62,63 Z" },
  // Mid/lower back (erectors + rhomboids)
  { key: "back", label: "Mid Back", view: "back",
    d: "M38,64 C38,62 44,60 50,60 L50,96 C44,96 38,92 38,64Z M62,64 C62,62 56,60 50,60 L50,96 C56,96 62,92 62,64Z" },
  // Triceps
  { key: "triceps", label: "Triceps", view: "back",
    d: "M22,64 C18,70 17,80 20,88 C22,92 26,91 28,87 C30,79 29,67 25,64 Z" },
  { key: "triceps", label: "Triceps", view: "back",
    d: "M78,64 C82,70 83,80 80,88 C78,92 74,91 72,87 C70,79 71,67 75,64 Z" },
  // Forearms back
  { key: "forearms", label: "Forearms", view: "back",
    d: "M18,90 C14,96 14,106 17,112 C19,115 23,114 25,110 C27,102 27,92 23,89 Z" },
  { key: "forearms", label: "Forearms", view: "back",
    d: "M82,90 C86,96 86,106 83,112 C81,115 77,114 75,110 C73,102 73,92 77,89 Z" },
  // Glutes
  { key: "glutes", label: "Glutes", view: "back",
    d: "M34,98 C32,102 32,112 36,118 C40,122 46,120 48,114 C50,108 48,100 44,97 Z" },
  { key: "glutes", label: "Glutes", view: "back",
    d: "M66,98 C68,102 68,112 64,118 C60,122 54,120 52,114 C50,108 52,100 56,97 Z" },
  // Hamstrings
  { key: "hamstrings", label: "Hamstrings", view: "back",
    d: "M33,120 C30,126 30,138 33,148 C36,154 41,153 43,147 C45,138 44,126 40,120 Z" },
  { key: "hamstrings", label: "Hamstrings", view: "back",
    d: "M67,120 C70,126 70,138 67,148 C64,154 59,153 57,147 C55,138 56,126 60,120 Z" },
  // Calves — back gastrocnemius
  { key: "calves", label: "Calves", view: "back",
    d: "M31,152 C28,158 28,170 32,178 C34,182 39,181 41,176 C43,168 42,156 38,151 Z" },
  { key: "calves", label: "Calves", view: "back",
    d: "M69,152 C72,158 72,170 68,178 C66,182 61,181 59,176 C57,168 58,156 62,151 Z" },
];

// Simplified body silhouette — viewBox 0 0 100 220
const BODY_OUTLINE = [
  // Head
  "M50,6 m-9,0 a9,9 0 1,0 18,0 a9,9 0 1,0 -18,0",
  // Neck + torso + legs + arms
  "M44,24 C40,30 36,36 32,42 C22,46 14,54 13,66 C12,80 15,98 15,112 C15,116 17,118 19,116 C21,110 21,98 23,88 C24,108 26,130 28,152 C28,168 30,182 32,200 C36,206 44,206 46,196 C47,184 48,172 50,164 C52,172 53,184 54,196 C56,206 64,206 68,200 C70,182 72,168 72,152 C74,130 76,108 77,88 C79,98 79,110 81,116 C83,118 85,116 85,112 C85,98 88,80 87,66 C86,54 78,46 68,42 C64,36 60,30 56,24 C53,22 47,22 44,24Z",
].join(" ");

function HeatmapSVG({
  view,
  setsMap,
  secondaryMap,
  onHover,
}: {
  view: "front" | "back";
  setsMap: Map<MuscleKey, number>;
  secondaryMap: Map<MuscleKey, number>;
  onHover: (label: string | null) => void;
}) {
  const paths = MUSCLE_PATHS.filter((p) => p.view === view);
  return (
    <svg viewBox="0 0 100 210" className="w-full h-full" aria-label={`${view} body muscle map`}>
      {/* Body silhouette */}
      <path d={BODY_OUTLINE} className="fill-muted/20 stroke-border" strokeWidth="0.8" fillRule="evenodd" />
      {/* Muscle group overlays */}
      {paths.map((mp, i) => {
        const sets = setsMap.get(mp.key) ?? 0;
        const sec = secondaryMap.get(mp.key) ?? 0;
        return (
          <path
            key={`${mp.key}-${view}-${i}`}
            d={mp.d}
            strokeWidth="0.4"
            className={`${intensityClass(sets, sec)} cursor-pointer transition-colors duration-200`}
            onMouseEnter={() => onHover(`${mp.label}: ${intensityLabel(sets, sec)}`)}
            onMouseLeave={() => onHover(null)}
            aria-label={`${mp.label}: ${intensityLabel(sets, sec)}`}
          />
        );
      })}
      {/* View label */}
      <text x="50" y="206" textAnchor="middle" className="fill-muted-foreground" fontSize="6" fontFamily="system-ui" fontWeight="500">
        {view === "front" ? "FRONT" : "BACK"}
      </text>
    </svg>
  );
}

function MuscleHeatmapView({
  view,
  setsMap,
  secondaryMap,
}: {
  view: "front" | "back";
  setsMap: Map<MuscleKey, number>;
  secondaryMap: Map<MuscleKey, number>;
}) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  return (
    <div className="relative">
      <div className="aspect-[100/210]">
        <HeatmapSVG view={view} setsMap={setsMap} secondaryMap={secondaryMap} onHover={setTooltip} />
      </div>
      {tooltip && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover border border-border shadow px-2 py-1 text-xs font-medium z-10 pointer-events-none">
          {tooltip}
        </div>
      )}
    </div>
  );
}

export function MuscleHeatmap({ data }: { data: MuscleSetCount[] }) {
  const { setsMap, secondaryMap } = useMemo(() => {
    const setsMap = new Map<MuscleKey, number>();
    const secondaryMap = new Map<MuscleKey, number>();
    for (const entry of data) {
      const key = normaliseMuscle(entry.muscle);
      if (!key) continue;
      setsMap.set(key, (setsMap.get(key) ?? 0) + entry.sets);
      if (entry.secondarySets > 0) {
        secondaryMap.set(key, (secondaryMap.get(key) ?? 0) + entry.secondarySets);
      }
    }
    return { setsMap, secondaryMap };
  }, [data]);

  const directGroups = Array.from(setsMap.values()).filter((v) => v > 0).length;
  const totalGroups = MUSCLE_KEYS.length;

  return (
    <div className="space-y-4">
      {/* SVG views side by side — constrained width */}
      <div className="grid grid-cols-2 gap-6 max-w-[280px] mx-auto">
        <MuscleHeatmapView view="front" setsMap={setsMap} secondaryMap={secondaryMap} />
        <MuscleHeatmapView view="back" setsMap={setsMap} secondaryMap={secondaryMap} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted/40 border border-border/60" />
            Not trained
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/10 border border-primary/25" />
            Secondary
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/25 border border-primary/50" />
            Light
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/55 border border-primary/75" />
            Moderate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/90 border border-primary" />
            Heavy
          </span>
        </div>
        <span className="font-medium">{directGroups}/{totalGroups} groups direct</span>
      </div>
    </div>
  );
}
