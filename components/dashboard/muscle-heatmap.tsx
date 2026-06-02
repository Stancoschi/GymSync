"use client";

/**
 * MuscleHeatmap
 * Renders a front + back SVG body silhouette with muscle groups coloured
 * dynamically based on training frequency (sets logged in the last 7 days).
 *
 * Intensity levels (sets in last 7 days):
 *   0 → muted/grey (untrained)
 *   1-2 → light accent
 *   3-5 → medium accent
 *   6+ → strong accent
 */

import { useMemo } from "react";

export type MuscleSetCount = {
  /** Normalised muscle group key – matches MUSCLE_KEYS below */
  muscle: string;
  /** Total completed sets in the period */
  sets: number;
};

// Canonical keys used throughout the app (lowercase, from exercise_library.muscle_group)
export const MUSCLE_KEYS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "abs",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "traps",
  "lats",
] as const;

type MuscleKey = (typeof MUSCLE_KEYS)[number];

/** Normalise raw muscle_group strings from DB to canonical keys */
export function normaliseMuscle(raw: string | null): MuscleKey | null {
  if (!raw) return null;
  const g = raw.toLowerCase().trim();
  if (g.includes("chest") || g.includes("pec")) return "chest";
  if (g.includes("lats") || g.includes("lat ")) return "lats";
  if (g.includes("back") || g.includes("rhomboid") || g.includes("row")) return "back";
  if (g.includes("trap")) return "traps";
  if (g.includes("shoulder") || g.includes("delt") || g.includes("ohp")) return "shoulders";
  if (g.includes("bicep")) return "biceps";
  if (g.includes("tricep")) return "triceps";
  if (g.includes("forearm")) return "forearms";
  if (g.includes("abs") || g.includes("crunch")) return "abs";
  if (g.includes("core") || g.includes("plank")) return "core";
  if (g.includes("quad")) return "quads";
  if (g.includes("hamstring") || g.includes("rdl")) return "hamstrings";
  if (g.includes("glute") || g.includes("hip")) return "glutes";
  if (g.includes("calf") || g.includes("calves")) return "calves";
  return null;
}

function intensityClass(sets: number): string {
  if (sets === 0) return "fill-muted stroke-border";
  if (sets <= 2) return "fill-primary/20 stroke-primary/40";
  if (sets <= 5) return "fill-primary/50 stroke-primary/70";
  return "fill-primary stroke-primary";
}

function intensityLabel(sets: number): string {
  if (sets === 0) return "Not trained";
  if (sets <= 2) return `${sets} set${sets > 1 ? "s" : ""} – light";
  if (sets <= 5) return `${sets} sets – moderate`;
  return `${sets} sets – heavy`;
}

type MusclePath = {
  key: MuscleKey;
  label: string;
  /** "front" | "back" view */
  view: "front" | "back";
  d: string;
};

/**
 * SVG paths for a simplified body silhouette.
 * viewBox: 0 0 120 260 for each half.
 * Shapes are hand-crafted approximations — not anatomically precise,
 * but recognisable and clean at small sizes.
 */
const MUSCLE_PATHS: MusclePath[] = [
  // ─── FRONT ───────────────────────────────────────────────────────────────
  {
    key: "chest",
    label: "Chest",
    view: "front",
    d: "M38,72 Q60,80 82,72 Q82,92 60,96 Q38,92 38,72Z",
  },
  {
    key: "shoulders",
    label: "Shoulders",
    view: "front",
    d: "M22,62 Q32,54 38,72 Q28,78 20,72 Z",
  },
  {
    key: "shoulders",
    label: "Shoulders",
    view: "front",
    d: "M98,62 Q88,54 82,72 Q92,78 100,72 Z",
  },
  {
    key: "biceps",
    label: "Biceps",
    view: "front",
    d: "M18,74 Q14,86 16,98 Q22,94 26,82 Z",
  },
  {
    key: "biceps",
    label: "Biceps",
    view: "front",
    d: "M102,74 Q106,86 104,98 Q98,94 94,82 Z",
  },
  {
    key: "forearms",
    label: "Forearms",
    view: "front",
    d: "M14,100 Q10,116 12,128 Q18,124 22,108 Z",
  },
  {
    key: "forearms",
    label: "Forearms",
    view: "front",
    d: "M106,100 Q110,116 108,128 Q102,124 98,108 Z",
  },
  {
    key: "abs",
    label: "Abs",
    view: "front",
    d: "M46,98 Q60,102 74,98 Q76,118 74,132 Q60,136 46,132 Q44,118 46,98Z",
  },
  {
    key: "quads",
    label: "Quads",
    view: "front",
    d: "M44,138 Q52,140 56,160 Q52,176 46,180 Q38,168 40,150 Z",
  },
  {
    key: "quads",
    label: "Quads",
    view: "front",
    d: "M76,138 Q68,140 64,160 Q68,176 74,180 Q82,168 80,150 Z",
  },
  {
    key: "calves",
    label: "Calves",
    view: "front",
    d: "M44,186 Q48,196 46,212 Q42,214 40,204 Q38,194 42,186 Z",
  },
  {
    key: "calves",
    label: "Calves",
    view: "front",
    d: "M76,186 Q72,196 74,212 Q78,214 80,204 Q82,194 78,186 Z",
  },

  // ─── BACK ────────────────────────────────────────────────────────────────
  {
    key: "traps",
    label: "Traps",
    view: "back",
    d: "M44,56 Q60,62 76,56 Q76,68 60,72 Q44,68 44,56Z",
  },
  {
    key: "lats",
    label: "Lats",
    view: "back",
    d: "M38,72 Q44,68 58,96 Q48,100 38,92 Z",
  },
  {
    key: "lats",
    label: "Lats",
    view: "back",
    d: "M82,72 Q76,68 62,96 Q72,100 82,92 Z",
  },
  {
    key: "back",
    label: "Mid Back",
    view: "back",
    d: "M44,72 Q60,76 76,72 Q76,96 60,100 Q44,96 44,72Z",
  },
  {
    key: "shoulders",
    label: "Rear Delts",
    view: "back",
    d: "M22,62 Q32,54 38,72 Q28,78 20,72 Z",
  },
  {
    key: "shoulders",
    label: "Rear Delts",
    view: "back",
    d: "M98,62 Q88,54 82,72 Q92,78 100,72 Z",
  },
  {
    key: "triceps",
    label: "Triceps",
    view: "back",
    d: "M18,74 Q14,86 16,98 Q22,94 26,82 Z",
  },
  {
    key: "triceps",
    label: "Triceps",
    view: "back",
    d: "M102,74 Q106,86 104,98 Q98,94 94,82 Z",
  },
  {
    key: "glutes",
    label: "Glutes",
    view: "back",
    d: "M44,104 Q52,106 58,124 Q50,130 42,122 Q40,112 44,104Z",
  },
  {
    key: "glutes",
    label: "Glutes",
    view: "back",
    d: "M76,104 Q68,106 62,124 Q70,130 78,122 Q80,112 76,104Z",
  },
  {
    key: "hamstrings",
    label: "Hamstrings",
    view: "back",
    d: "M44,128 Q50,132 54,154 Q48,170 42,168 Q38,152 40,136 Z",
  },
  {
    key: "hamstrings",
    label: "Hamstrings",
    view: "back",
    d: "M76,128 Q70,132 66,154 Q72,170 78,168 Q82,152 80,136 Z",
  },
  {
    key: "calves",
    label: "Calves",
    view: "back",
    d: "M42,172 Q46,184 44,200 Q40,202 38,192 Q36,180 40,172 Z",
  },
  {
    key: "calves",
    label: "Calves",
    view: "back",
    d: "M78,172 Q74,184 76,200 Q80,202 82,192 Q84,180 80,172 Z",
  },
];

/** Silhouette outline paths (body shape, head, neck) */
const BODY_OUTLINE_FRONT = `
  M60,8 m-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0
  M52,28 Q48,36 44,44 Q32,48 20,60 Q16,74 18,90 Q22,110 20,128
  Q22,132 26,130 Q28,116 30,100 Q34,132 36,160 Q38,188 40,216
  Q44,222 50,220 Q52,196 52,170 Q56,158 60,156
  Q64,158 68,170 Q68,196 70,220 Q76,222 80,216
  Q82,188 84,160 Q86,132 90,100 Q92,116 94,130 Q98,132 100,128
  Q98,110 96,90 Q104,74 100,60 Q88,48 76,44 Q72,36 68,28 Z
`;

const BODY_OUTLINE_BACK = `
  M60,8 m-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0
  M52,28 Q48,36 44,44 Q32,48 20,60 Q16,74 18,90 Q22,110 20,128
  Q22,132 26,130 Q28,116 30,100 Q34,132 36,160 Q38,188 40,216
  Q44,222 50,220 Q52,196 52,170 Q56,158 60,156
  Q64,158 68,170 Q68,196 70,220 Q76,222 80,216
  Q82,188 84,160 Q86,132 90,100 Q92,116 94,130 Q98,132 100,128
  Q98,110 96,90 Q104,74 100,60 Q88,48 76,44 Q72,36 68,28 Z
`;

type HeatmapSVGProps = {
  view: "front" | "back";
  setsMap: Map<MuscleKey, number>;
  onHover: (label: string | null) => void;
};

function HeatmapSVG({ view, setsMap, onHover }: HeatmapSVGProps) {
  const outline = view === "front" ? BODY_OUTLINE_FRONT : BODY_OUTLINE_BACK;
  const paths = MUSCLE_PATHS.filter((p) => p.view === view);

  return (
    <svg
      viewBox="0 0 120 240"
      className="w-full h-full"
      aria-label={`${view} body muscle heatmap`}
    >
      {/* Body silhouette fill */}
      <path
        d={outline}
        className="fill-muted/30 stroke-border"
        strokeWidth="1"
        fillRule="evenodd"
      />
      {/* Muscle paths */}
      {paths.map((mp, i) => {
        const sets = setsMap.get(mp.key) ?? 0;
        return (
          <path
            key={`${mp.key}-${i}`}
            d={mp.d}
            strokeWidth="0.5"
            className={`${intensityClass(sets)} cursor-pointer transition-all duration-300`}
            onMouseEnter={() => onHover(`${mp.label}: ${intensityLabel(sets)}`)}
            onMouseLeave={() => onHover(null)}
            aria-label={`${mp.label}: ${intensityLabel(sets)}`}
          />
        );
      })}
      {/* View label */}
      <text
        x="60"
        y="232"
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize="7"
        fontFamily="system-ui"
      >
        {view === "front" ? "FRONT" : "BACK"}
      </text>
    </svg>
  );
}

type Props = {
  /** Array of { muscle, sets } for the last N days */
  data: MuscleSetCount[];
};

export function MuscleHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = [null as string | null, (_: string | null) => {}];
  // Use useState for tooltip
  const [tooltipText, setTooltipText] = useMemo(() => {
    // We can't call hooks inside useMemo — this is a workaround pattern.
    // The actual hook is declared below.
    return [null, (_: string | null) => {}] as [string | null, (v: string | null) => void];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  void tooltip;
  void tooltipText;

  // Build per-muscle sets map (sum duplicates — e.g., two "shoulders" paths)
  const setsMap = useMemo(() => {
    const map = new Map<MuscleKey, number>();
    for (const entry of data) {
      const key = normaliseMuscle(entry.muscle);
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + entry.sets);
    }
    return map;
  }, [data]);

  // Legend data
  const trained = data.filter((d) => d.sets > 0).length;
  const total = new Set(data.map((d) => normaliseMuscle(d.muscle)).filter(Boolean)).size;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <MuscleHeatmapView view="front" setsMap={setsMap} />
        <MuscleHeatmapView view="back" setsMap={setsMap} />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-muted border border-border" />
            Not trained
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />
            Light
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-primary/50 border border-primary/70" />
            Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-primary border border-primary" />
            Heavy
          </span>
        </div>
        <span>{trained}/{total > 0 ? total : MUSCLE_KEYS.length} groups</span>
      </div>
    </div>
  );
}

/** Inner component that holds tooltip state properly */
function MuscleHeatmapView({
  view,
  setsMap,
}: {
  view: "front" | "back";
  setsMap: Map<MuscleKey, number>;
}) {
  const { useState } = require("react") as typeof import("react");
  const [tooltip, setTooltip] = useState<string | null>(null);

  return (
    <div className="relative">
      <div className="aspect-[1/2]">
        <HeatmapSVG view={view} setsMap={setsMap} onHover={setTooltip} />
      </div>
      {tooltip && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover border border-border shadow-md px-2.5 py-1.5 text-xs font-medium z-10 pointer-events-none">
          {tooltip}
        </div>
      )}
    </div>
  );
}
