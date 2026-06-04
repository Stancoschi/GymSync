/**
 * Fatigue & Readiness Score
 * Score 0–100 based on training load, consecutive days, and rest gap.
 * Higher = more ready to train hard. Lower = recovery recommended.
 */

export interface FatigueInput {
  /** All workout dates for this user (ISO strings or YYYY-MM-DD) */
  workoutDates: string[];
  /** User's target workouts per week (from profile) */
  targetPerWeek: number | null | undefined;
  /** Days since last workout (computed externally or pass workoutDates and let us compute) */
}

export interface ReadinessResult {
  score: number;          // 0–100
  label: "Peak" | "Good" | "Moderate" | "Rest";  // human label
  color: "green" | "blue" | "yellow" | "red";    // for UI tinting
  advice: string;         // one-line coaching message
  breakdown: {
    volumeFatigue: number;       // 0–40 penalty from high weekly volume
    consecutivePenalty: number;  // 0–30 penalty from consecutive training days
    restBonus: number;           // 0–30 bonus from recent rest days
  };
}

/**
 * Returns YYYY-MM-DD string for a date offset by `offsetDays` from today.
 */
function offsetDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

/**
 * Calculate consecutive training days ending today (or yesterday).
 */
function getConsecutiveTrainingDays(uniqueSortedDesc: string[]): number {
  const today = offsetDay(0);
  const yesterday = offsetDay(-1);

  // Must have trained today or yesterday for streak to count
  if (!uniqueSortedDesc.length) return 0;
  if (uniqueSortedDesc[0] !== today && uniqueSortedDesc[0] !== yesterday) return 0;

  let count = 1;
  for (let i = 1; i < uniqueSortedDesc.length; i++) {
    const prev = new Date(uniqueSortedDesc[i - 1]);
    const curr = new Date(uniqueSortedDesc[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diff === 1) count++;
    else break;
  }
  return count;
}

/**
 * How many days since the last workout (0 = trained today, 1 = trained yesterday, etc.)
 */
function daysSinceLastWorkout(uniqueSortedDesc: string[]): number {
  if (!uniqueSortedDesc.length) return 99;
  const today = new Date(offsetDay(0));
  const last = new Date(uniqueSortedDesc[0]);
  return Math.round((today.getTime() - last.getTime()) / 86_400_000);
}

export function calculateReadiness(input: FatigueInput): ReadinessResult {
  const { workoutDates, targetPerWeek } = input;

  const uniqueSortedDesc = Array.from(
    new Set(workoutDates.map((d) => d.split("T")[0]))
  ).sort().reverse();

  const sevenDaysAgo = offsetDay(-7);
  const workoutsThisWeek = uniqueSortedDesc.filter((d) => d >= sevenDaysAgo).length;
  const target = targetPerWeek && targetPerWeek > 0 ? targetPerWeek : 4;

  // ── 1. Volume fatigue penalty (0–40) ─────────────────────────────────────
  // Ratio of workouts done vs target. Above target = more fatigue.
  const volumeRatio = workoutsThisWeek / target;
  const volumeFatigue = Math.min(40, Math.round(volumeRatio * 40));

  // ── 2. Consecutive day penalty (0–30) ────────────────────────────────────
  // 1 consecutive day  = 0 penalty
  // 2 consecutive days = 10 penalty
  // 3 consecutive days = 20 penalty
  // 4+ consecutive days = 30 penalty
  const consecutiveDays = getConsecutiveTrainingDays(uniqueSortedDesc);
  const consecutivePenalty = Math.min(30, Math.max(0, (consecutiveDays - 1) * 10));

  // ── 3. Rest bonus (0–30) ──────────────────────────────────────────────────
  // Days since last workout: 0 = 0 bonus, 1 = 15 bonus, 2+ = 30 bonus
  const daysSinceLast = daysSinceLastWorkout(uniqueSortedDesc);
  const restBonus = daysSinceLast === 0 ? 0 : daysSinceLast === 1 ? 15 : 30;

  // ── Final score ───────────────────────────────────────────────────────────
  const raw = 100 - volumeFatigue - consecutivePenalty + restBonus;
  const score = Math.max(0, Math.min(100, raw));

  // ── Label + advice ────────────────────────────────────────────────────────
  let label: ReadinessResult["label"];
  let color: ReadinessResult["color"];
  let advice: string;

  if (score >= 80) {
    label = "Peak";
    color = "green";
    advice = "You're fully recovered. Push hard today — great day for a PR attempt.";
  } else if (score >= 60) {
    label = "Good";
    color = "blue";
    advice = "Good readiness. Train as planned and listen to your body.";
  } else if (score >= 40) {
    label = "Moderate";
    color = "yellow";
    advice = "Some fatigue accumulated. Consider a lighter session or deload sets.";
  } else {
    label = "Rest";
    color = "red";
    advice = "High fatigue detected. A rest day or active recovery will serve you best.";
  }

  return {
    score,
    label,
    color,
    advice,
    breakdown: { volumeFatigue, consecutivePenalty, restBonus },
  };
}
