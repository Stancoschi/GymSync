/**
 * Volume Calendar helpers
 * Computes daily training volume (sets × reps × weight_kg) per day
 * from raw workout_set_logs rows for use in the Progress Calendar.
 */

export interface SetLogRow {
  completed_at: string | null;   // ISO timestamp from workout_sessions.completed_at
  reps: number | null;
  weight_kg: number | null;
  completed: boolean;
}

export interface DayVolume {
  date: string;   // YYYY-MM-DD
  volume: number; // total kg moved (sets × reps × weight)
  sets: number;   // number of completed sets
}

/** Groups set logs by calendar day and sums volume. */
export function buildDayVolumeMap(rows: SetLogRow[]): Map<string, DayVolume> {
  const map = new Map<string, DayVolume>();
  for (const row of rows) {
    if (!row.completed || !row.completed_at || !row.reps || !row.weight_kg) continue;
    const date = row.completed_at.split("T")[0];
    const vol = row.reps * row.weight_kg;
    const existing = map.get(date);
    if (existing) {
      existing.volume += vol;
      existing.sets += 1;
    } else {
      map.set(date, { date, volume: vol, sets: 1 });
    }
  }
  return map;
}

/**
 * Returns the intensity bucket (0–4) for a given volume relative to the
 * monthly max volume. Bucket 0 = rest day.
 */
export function volumeIntensity(volume: number, maxVolume: number): 0 | 1 | 2 | 3 | 4 {
  if (volume <= 0 || maxVolume <= 0) return 0;
  const ratio = volume / maxVolume;
  if (ratio < 0.2) return 1;
  if (ratio < 0.45) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

/** Returns all days in a given month as YYYY-MM-DD strings. */
export function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const total = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= total; d++) {
    days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

/** Returns the ISO weekday index (0 = Mon … 6 = Sun) for the first day of the month. */
export function firstDayOffset(year: number, month: number): number {
  const dow = new Date(year, month, 1).getDay(); // 0 = Sun
  return dow === 0 ? 6 : dow - 1;               // convert to Mon-based
}

/** Formats a number to a compact kg string, e.g. 12400 → "12.4k kg" */
export function fmtVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k kg`;
  return `${Math.round(v)} kg`;
}
