/**
 * muscle-utils.ts — NO "use client" / "use server" directive.
 * Pure utility functions shared between Server Components and Client Components.
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
