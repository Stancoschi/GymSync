/**
 * Calculates daily streak and weekly consistency score from workout dates.
 * Exported and usable in both server components and API routes.
 */

export function calculateDailyStreak(workoutDates: string[]): number {
  if (!workoutDates.length) return 0;
  const unique = Array.from(new Set(workoutDates.map((d) => d.split("T")[0]))).sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Must have worked out today or yesterday to have an active streak
  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

/** Returns 0–100 based on workouts in the last 7 days vs target */
export function calculateConsistencyScore(
  workoutDates: string[],
  targetPerWeek: number | null | undefined
): number {
  if (!targetPerWeek || targetPerWeek <= 0) return 0;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const recent = workoutDates.filter((d) => d.split("T")[0] >= sevenDaysAgo);
  return Math.min(100, Math.round((recent.length / targetPerWeek) * 100));
}
