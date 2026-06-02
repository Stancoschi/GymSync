/**
 * muscle-utils.ts — NO directive. Safe to import on server and client.
 */

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

export type MuscleKey = (typeof MUSCLE_KEYS)[number];

/** Normalise raw muscle_group string from DB to canonical key */
export function normaliseMuscle(raw: string | null): MuscleKey | null {
  if (!raw) return null;
  const g = raw.toLowerCase().trim();
  if (g.includes("chest") || g.includes("pec")) return "chest";
  if (g.includes("lats") || g.includes("lat ") || g === "lat") return "lats";
  if (g.includes("trap")) return "traps";
  if (g.includes("back") || g.includes("rhomboid") || g.includes("row")) return "back";
  if (g.includes("shoulder") || g.includes("delt")) return "shoulders";
  if (g.includes("bicep")) return "biceps";
  if (g.includes("tricep")) return "triceps";
  if (g.includes("forearm")) return "forearms";
  if (g.includes("abs") || g.includes("crunch") || g.includes("situp") || g.includes("sit-up")) return "abs";
  if (g.includes("core") || g.includes("plank")) return "core";
  if (g.includes("quad")) return "quads";
  if (g.includes("hamstring") || g.includes("rdl")) return "hamstrings";
  if (g.includes("glute") || g.includes("hip")) return "glutes";
  if (g.includes("calf") || g.includes("calves")) return "calves";
  return null;
}

/**
 * Secondary muscle groups activated by compound exercises.
 * Key = primary muscle_group from DB (lowercase).
 * Value = secondary MuscleKey[] with weight multiplier [0..1].
 */
export const COMPOUND_SECONDARIES: Record<string, Array<{ muscle: MuscleKey; weight: number }>> = {
  // PUSH
  chest:      [{ muscle: "shoulders", weight: 0.5 }, { muscle: "triceps", weight: 0.4 }],
  shoulders:  [{ muscle: "triceps", weight: 0.4 }, { muscle: "traps", weight: 0.3 }],
  triceps:    [{ muscle: "chest", weight: 0.2 }, { muscle: "shoulders", weight: 0.2 }],
  // PULL
  back:       [{ muscle: "biceps", weight: 0.5 }, { muscle: "lats", weight: 0.5 }, { muscle: "traps", weight: 0.3 }],
  lats:       [{ muscle: "biceps", weight: 0.5 }, { muscle: "back", weight: 0.4 }],
  traps:      [{ muscle: "back", weight: 0.4 }, { muscle: "shoulders", weight: 0.3 }],
  biceps:     [{ muscle: "forearms", weight: 0.4 }],
  // LEGS
  quads:      [{ muscle: "glutes", weight: 0.4 }, { muscle: "hamstrings", weight: 0.3 }, { muscle: "calves", weight: 0.2 }],
  hamstrings: [{ muscle: "glutes", weight: 0.5 }, { muscle: "calves", weight: 0.3 }],
  glutes:     [{ muscle: "hamstrings", weight: 0.4 }, { muscle: "quads", weight: 0.3 }],
  // CORE
  core:       [{ muscle: "abs", weight: 0.6 }],
  abs:        [{ muscle: "core", weight: 0.4 }],
};

/**
 * Returns secondary muscle contributions for a given primary muscle key.
 * Each entry has muscle key + fractional sets contribution (0..1 of primarySets).
 */
export function getSecondaryContributions(
  primaryKey: MuscleKey,
  primarySets: number
): Array<{ muscle: MuscleKey; sets: number }> {
  const secondaries = COMPOUND_SECONDARIES[primaryKey] ?? [];
  return secondaries.map(({ muscle, weight }) => ({
    muscle,
    sets: primarySets * weight,
  }));
}
