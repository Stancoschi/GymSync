"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { finishWorkoutSession } from "@/app/workouts/[id]/session/actions";
import { useLanguage } from "@/lib/i18n/language-context";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

type ExLib = { id: string; name: string; muscle_group: string | null };

type Exercise = {
  id: string;
  order_index: number;
  target_sets: number;
  min_reps: number;
  max_reps: number;
  target_rir: number | null;
  notes: string | null;
  load_increment: number | null;
  exercise_library: ExLib | ExLib[];
};

// A local exercise row that may have been swapped
type LiveExercise = Exercise & { _swappedLib?: ExLib };

type LoggedSet = {
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rir: number | null;
  is_pr: boolean;
};

type LastSet = { set_number: number; reps: number; weight_kg: number };
export type LastSessionMap = Record<string, LastSet[]>;

// Superset: a set of exercise indices grouped together
type SupersetGroup = number[]; // indices into liveExercises

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getExLib(ex: LiveExercise): ExLib {
  if (ex._swappedLib) return ex._swappedLib;
  return Array.isArray(ex.exercise_library)
    ? ex.exercise_library[0]
    : ex.exercise_library;
}

function calc1RM(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function smartRestSeconds(
  weight: number,
  reps: number,
  rir: number | null,
  prBaseline: { weight_kg: number; reps: number } | null
): number {
  if (rir !== null && rir <= 1) return 180;
  if (rir !== null && rir <= 3) return 120;
  if (prBaseline) {
    const max1rm = calc1RM(prBaseline.weight_kg, prBaseline.reps);
    const intensity = weight / (max1rm / (1 + 1 / 30));
    if (intensity >= 0.85) return 180;
    if (intensity >= 0.70) return 120;
  }
  if (reps >= 15) return 90;
  return 120;
}

type SetDelta = "pr" | "better" | "same" | "worse" | "first";

function getSetDelta(
  weight: number,
  reps: number,
  lastSet: LastSet | null,
  isPr: boolean
): SetDelta {
  if (isPr) return "pr";
  if (!lastSet) return "first";
  const diff = calc1RM(weight, reps) - calc1RM(lastSet.weight_kg, lastSet.reps);
  if (diff > 0.5) return "better";
  if (diff < -0.5) return "worse";
  return "same";
}

const DELTA_STYLES: Record<SetDelta, string> = {
  pr: "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300/40",
  better: "bg-green-50 dark:bg-green-950/20 border border-green-300/30",
  same: "bg-muted/40",
  worse: "bg-red-50/60 dark:bg-red-950/10 border border-red-300/20",
  first: "bg-muted/40",
};

const REST_PRESETS = [60, 90, 120, 180];

// ─── Swap Modal ───────────────────────────────────────────────────────────────

function SwapExerciseModal({
  currentName,
  onSwap,
  onClose,
}: {
  currentName: string;
  onSwap: (ex: ExLib) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExLib[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("exercise_library")
        .select("id, name, muscle_group")
        .ilike("name", `%${query.trim()}%`)
        .order("name")
        .limit(30);
      setResults(data ?? []);
      setLoading(false);
    }, 300);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Swap exercise</p>
              <p className="text-sm font-semibold text-muted-foreground line-through">{currentName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any exercise..."
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">No exercises found.</div>
          )}
          {!loading && query.length < 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">Type at least 2 characters to search.</div>
          )}
          {results.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSwap(ex)}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 flex items-center justify-between gap-3"
            >
              <span className="text-sm font-medium">{ex.name}</span>
              {ex.muscle_group && (
                <span className="text-xs text-muted-foreground capitalize shrink-0">{ex.muscle_group}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Superset Badge ───────────────────────────────────────────────────────────

const SUPERSET_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-300/40",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-300/40",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-300/40",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300/40",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300/40",
];

function getSupersetInfo(
  exIdx: number,
  supersets: SupersetGroup[]
): { groupIdx: number; posInGroup: number; groupSize: number } | null {
  for (let g = 0; g < supersets.length; g++) {
    const pos = supersets[g].indexOf(exIdx);
    if (pos !== -1) return { groupIdx: g, posInGroup: pos, groupSize: supersets[g].length };
  }
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LiveSessionClient({
  templateId,
  templateName,
  exercises: initialExercises,
  prMap,
  lastSessionMap,
}: {
  templateId: string;
  templateName: string;
  exercises: Exercise[];
  prMap: Record<string, { weight_kg: number; reps: number }>;
  lastSessionMap: LastSessionMap;
  userId: string;
}) {
  const { t } = useLanguage();
  const s = t.sessions;

  // Live exercises — mutable (swap changes this)
  const [liveExercises, setLiveExercises] = useState<LiveExercise[]>(initialExercises);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("");

  // Supersets: array of groups, each group is an array of exercise indices
  const [supersets, setSupersets] = useState<SupersetGroup[]>([]);
  const [supersetMode, setSupersetMode] = useState(false); // selection mode
  const [supersetSelection, setSupersetSelection] = useState<number[]>([]);

  // Swap modal
  const [swapModalOpen, setSwapModalOpen] = useState(false);

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Rest timer
  const [restSeconds, setRestSeconds] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restTotal, setRestTotal] = useState(90);
  const restRef = useRef(0);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRest = useCallback((seconds: number) => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restRef.current = seconds;
    setRestSeconds(seconds);
    setRestTotal(seconds);
    setRestActive(true);
    restIntervalRef.current = setInterval(() => {
      restRef.current -= 1;
      setRestSeconds(restRef.current);
      if (restRef.current <= 0) {
        clearInterval(restIntervalRef.current!);
        setRestActive(false);
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch {}
      }
    }, 1000);
  }, []);

  const cancelRest = () => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestActive(false);
    setRestSeconds(0);
  };

  // ── Derived state ──
  const currentEx = liveExercises[currentExIdx];
  const exLib = currentEx ? getExLib(currentEx) : null;
  const currentExSets = loggedSets.filter((ls) => ls.exercise_id === exLib?.id);
  const targetSets = currentEx?.target_sets ?? 3;
  const setsLeft = Math.max(0, targetSets - currentExSets.length);
  const prBaseline = exLib ? prMap[exLib.id] ?? null : null;
  const lastSets: LastSet[] = exLib ? (lastSessionMap[exLib.id] ?? []) : [];
  const nextSetIdx = currentExSets.length;
  const lastSetRef: LastSet | null = lastSets[nextSetIdx] ?? null;
  const suggestedWeight =
    lastSetRef !== null ? lastSetRef.weight_kg + (currentEx?.load_increment ?? 0) : null;

  // Superset info for current exercise
  const currentSSInfo = getSupersetInfo(currentExIdx, supersets);

  // ── Swap handler ──
  function handleSwap(newEx: ExLib) {
    setLiveExercises((prev) =>
      prev.map((ex, i) =>
        i === currentExIdx ? { ...ex, _swappedLib: newEx } : ex
      )
    );
    setSwapModalOpen(false);
  }

  // ── Superset handlers ──
  function toggleSupersetSelection(idx: number) {
    setSupersetSelection((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  function confirmSuperset() {
    if (supersetSelection.length < 2) return;
    const sorted = [...supersetSelection].sort((a, b) => a - b);
    // Remove any existing superset membership for these indices
    setSupersets((prev) => {
      const filtered = prev
        .map((g) => g.filter((i) => !sorted.includes(i)))
        .filter((g) => g.length >= 2);
      return [...filtered, sorted];
    });
    setSupersetMode(false);
    setSupersetSelection([]);
  }

  function removeFromSuperset(exIdx: number) {
    setSupersets((prev) =>
      prev
        .map((g) => g.filter((i) => i !== exIdx))
        .filter((g) => g.length >= 2)
    );
  }

  // After logging a set in a superset, auto-advance to next exercise in the group
  function advanceInSuperset() {
    if (!currentSSInfo) return;
    const group = supersets[currentSSInfo.groupIdx];
    const nextPosInGroup = (currentSSInfo.posInGroup + 1) % group.length;
    setCurrentExIdx(group[nextPosInGroup]);
  }

  // ── Log set ──
  function logSet() {
    if (!exLib) return;
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return;
    const rirVal = rir !== "" ? parseInt(rir, 10) : null;
    const setNumber = currentExSets.length + 1;

    let is_pr = false;
    if (prBaseline) {
      if (calc1RM(w, r) > calc1RM(prBaseline.weight_kg, prBaseline.reps)) is_pr = true;
    } else {
      is_pr = true;
    }

    setLoggedSets((prev) => [
      ...prev,
      { exercise_id: exLib.id, exercise_name: exLib.name, set_number: setNumber, reps: r, weight_kg: w, rir: rirVal, is_pr },
    ]);

    startRest(smartRestSeconds(w, r, rirVal, prBaseline));
    setWeight(String(w));
    setReps(String(r));

    // Auto-advance to superset partner
    if (currentSSInfo) advanceInSuperset();
  }

  const newPrs = Array.from(
    new Set(loggedSets.filter((ls) => ls.is_pr).map((ls) => ls.exercise_name))
  );

  const [submitting, setSubmitting] = useState(false);

  async function handleFinish() {
    setSubmitting(true);
    const fd = new FormData();
    fd.append("template_id", templateId);
    fd.append("sets_json", JSON.stringify(loggedSets));
    fd.append("duration_seconds", String(elapsedRef.current));
    fd.append("new_prs_json", JSON.stringify(newPrs));
    await finishWorkoutSession(fd);
  }

  // ── Render ──
  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{s.liveSession}</p>
          <p className="font-semibold truncate">{templateName}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {newPrs.length > 0 && (
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 rounded-full px-2.5 py-1">
              🏆 {newPrs.length} {s.prBadge}{newPrs.length > 1 ? "s" : ""}
            </span>
          )}
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {formatTime(elapsed)}
          </span>
          {/* Superset mode toggle */}
          <button
            onClick={() => {
              setSupersetMode((m) => !m);
              setSupersetSelection([]);
            }}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
              supersetMode
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-300/40"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
            title="Create superset"
          >
            SS
          </button>
        </div>
      </div>

      {/* Superset selection banner */}
      {supersetMode && (
        <div className="bg-violet-50 dark:bg-violet-950/20 border-b border-violet-300/30 px-5 py-2.5 flex items-center justify-between gap-3">
          <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">
            {supersetSelection.length < 2
              ? `Select 2+ exercises to create a superset (${supersetSelection.length} selected)`
              : `${supersetSelection.length} exercises selected`}
          </p>
          <div className="flex gap-2">
            {supersetSelection.length >= 2 && (
              <button
                onClick={confirmSuperset}
                className="text-xs font-semibold bg-violet-600 text-white px-3 py-1 rounded-full hover:bg-violet-700 transition-colors"
              >
                Create superset
              </button>
            )}
            <button
              onClick={() => { setSupersetMode(false); setSupersetSelection([]); }}
              className="text-xs text-violet-600 dark:text-violet-300 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 p-5 space-y-5 max-w-lg mx-auto w-full pb-32">
        {/* Exercise navigator */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {liveExercises.map((ex, i) => {
            const lib = getExLib(ex);
            const done = loggedSets.filter((ls) => ls.exercise_id === lib?.id).length >= ex.target_sets;
            const ssInfo = getSupersetInfo(i, supersets);
            const isSelected = supersetSelection.includes(i);
            const ssColor = ssInfo ? SUPERSET_COLORS[ssInfo.groupIdx % SUPERSET_COLORS.length] : null;

            return (
              <button
                key={ex.id}
                onClick={() => {
                  if (supersetMode) {
                    toggleSupersetSelection(i);
                  } else {
                    setCurrentExIdx(i);
                  }
                }}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors border ${
                  supersetMode
                    ? isSelected
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-400"
                      : "border-border text-foreground hover:bg-muted/40"
                    : i === currentExIdx
                    ? "bg-primary text-primary-foreground border-primary"
                    : done
                    ? "bg-muted text-muted-foreground border-transparent"
                    : ssColor
                    ? `${ssColor} border`
                    : "border-border text-foreground hover:bg-muted/40"
                }`}
              >
                {done && !supersetMode ? "✓ " : ""}
                {isSelected ? "● " : ""}
                {lib?.name ?? `Ex ${i + 1}`}
                {ssInfo && !supersetMode && (
                  <span className="ml-1 opacity-70">SS{ssInfo.groupIdx + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current exercise card */}
        {currentEx && exLib && (
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            {/* Header: name + action buttons */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold">{exLib.name}</h2>
                  {currentEx._swappedLib && (
                    <span className="text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">
                      swapped
                    </span>
                  )}
                  {currentSSInfo && (
                    <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${
                      SUPERSET_COLORS[currentSSInfo.groupIdx % SUPERSET_COLORS.length]
                    }`}>
                      Superset {currentSSInfo.groupIdx + 1}
                      {" · "}{String.fromCharCode(65 + currentSSInfo.posInGroup)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">{exLib.muscle_group ?? ""}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {/* Swap button */}
                <button
                  onClick={() => setSwapModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted/40 transition-colors"
                  title="Swap exercise"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
                  </svg>
                  Swap
                </button>
                {/* Remove from superset button */}
                {currentSSInfo && (
                  <button
                    onClick={() => removeFromSuperset(currentExIdx)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted/40 transition-colors"
                    title="Remove from superset"
                  >
                    – SS
                  </button>
                )}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{s.target}</p>
                  <p className="text-sm font-medium">
                    {currentEx.target_sets} × {currentEx.min_reps}–{currentEx.max_reps} {s.reps}
                    {currentEx.target_rir !== null ? ` · RIR ${currentEx.target_rir}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Superset flow indicator */}
            {currentSSInfo && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {supersets[currentSSInfo.groupIdx].map((idx, pos) => {
                  const pEx = liveExercises[idx];
                  const pLib = getExLib(pEx);
                  const isCurrent = idx === currentExIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentExIdx(idx)}
                      className={`shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        SUPERSET_COLORS[currentSSInfo.groupIdx % SUPERSET_COLORS.length]
                      } ${
                        isCurrent ? "ring-2 ring-offset-1 ring-current" : "opacity-60 hover:opacity-80"
                      }`}
                    >
                      <span className="font-bold">{String.fromCharCode(65 + pos)}</span>
                      <span>{pLib?.name ?? `Ex ${idx + 1}`}</span>
                    </button>
                  );
                })}
                <span className="text-xs text-muted-foreground ml-1">↺ alternating</span>
              </div>
            )}

            {/* Baseline row */}
            <div className="grid grid-cols-2 gap-2">
              {prBaseline && (
                <div className="rounded-xl bg-muted/50 px-3 py-2 space-y-0.5">
                  <p className="text-xs text-muted-foreground">{s.allTimeBest}</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {prBaseline.weight_kg} kg × {prBaseline.reps} {s.reps}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {calc1RM(prBaseline.weight_kg, prBaseline.reps).toFixed(1)} {s.estOneRM}
                  </p>
                </div>
              )}
              {lastSetRef && (
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2 space-y-0.5">
                  <p className="text-xs text-primary/70">{s.lastSessionSet} {nextSetIdx + 1}</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {lastSetRef.weight_kg} kg × {lastSetRef.reps} {s.reps}
                  </p>
                  {suggestedWeight !== null && suggestedWeight !== lastSetRef.weight_kg && (
                    <p className="text-xs text-primary font-medium">
                      {s.suggested}: {suggestedWeight} kg
                    </p>
                  )}
                </div>
              )}
            </div>

            {currentEx.notes && (
              <p className="text-xs text-muted-foreground italic">{currentEx.notes}</p>
            )}

            {/* Sets logged so far */}
            {currentExSets.length > 0 && (
              <div className="space-y-1.5">
                {currentExSets.map((ls, i) => {
                  const ref = lastSets[i] ?? null;
                  const delta = getSetDelta(ls.weight_kg, ls.reps, ref, ls.is_pr);
                  const weightDiff = ref !== null ? ls.weight_kg - ref.weight_kg : null;
                  const repsDiff = ref !== null ? ls.reps - ref.reps : null;
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${DELTA_STYLES[delta]}`}>
                      <span className="w-6 text-center text-xs font-mono text-muted-foreground">#{ls.set_number}</span>
                      <span className="flex-1 tabular-nums">
                        {ls.weight_kg} kg × {ls.reps} {s.reps}
                        {ls.rir !== null ? ` · RIR ${ls.rir}` : ""}
                      </span>
                      {ref !== null && delta !== "pr" && delta !== "first" && (
                        <span className={`text-xs font-medium ${
                          delta === "better" ? "text-green-600 dark:text-green-400"
                          : delta === "worse" ? "text-red-500 dark:text-red-400"
                          : "text-muted-foreground"
                        }`}>
                          {weightDiff !== null && weightDiff !== 0
                            ? `${weightDiff > 0 ? "+" : ""}${weightDiff}kg`
                            : repsDiff !== null && repsDiff !== 0
                            ? `${repsDiff > 0 ? "+" : ""}${repsDiff}r`
                            : "="}
                        </span>
                      )}
                      {delta === "pr" && <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">🏆 {s.prBadge}</span>}
                      {delta === "first" && <span className="text-xs font-bold text-primary">{s.firstBadge}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Input row */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                {s.setOf} {currentExSets.length + 1} {s.of} {targetSets}
                {setsLeft > 0 ? ` · ${setsLeft} ${s.setsLeft}` : ` · ${s.allSetsDone}`}
                {lastSetRef && (
                  <span className="ml-2 text-primary/70">
                    ({s.last}: {lastSetRef.weight_kg}kg × {lastSetRef.reps}r)
                  </span>
                )}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: s.weight, value: weight, setter: setWeight,
                    placeholder: suggestedWeight !== null ? String(suggestedWeight) : lastSetRef ? String(lastSetRef.weight_kg) : "60" },
                  { label: s.reps, value: reps, setter: setReps,
                    placeholder: lastSetRef ? String(lastSetRef.reps) : "8" },
                  { label: "RIR", value: rir, setter: setRir,
                    placeholder: currentEx.target_rir !== null ? String(currentEx.target_rir) : "2" },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-xs text-muted-foreground">{label}</label>
                    <input
                      type="number" inputMode="decimal" value={value}
                      onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                      className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-medium tabular-nums text-center outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={logSet}
                disabled={!weight || !reps}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold disabled:opacity-40 transition-opacity active:scale-[0.98]"
              >
                {currentSSInfo
                  ? `${s.addSet} ＋ → ${String.fromCharCode(65 + (currentSSInfo.posInGroup + 1) % currentSSInfo.groupSize)}`
                  : `${s.addSet} ＋`}
              </button>
            </div>
          </div>
        )}

        {/* Rest timer */}
        {restActive && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">{s.restTimer}</p>
                <p className="text-xs text-muted-foreground">
                  {restTotal === 180 ? s.restHeavy : restTotal === 120 ? s.restModerate : s.restLight}
                </p>
              </div>
              <button onClick={cancelRest} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {s.skip}
              </button>
            </div>
            <p className="text-4xl font-bold tabular-nums text-center text-primary">{formatTime(restSeconds)}</p>
            <div className="h-1.5 rounded-full bg-primary/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000"
                style={{ width: `${Math.max(0, (restSeconds / restTotal) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {!restActive && (
          <div className="flex gap-2">
            {REST_PRESETS.map((sec) => (
              <button
                key={sec}
                onClick={() => startRest(sec)}
                className="flex-1 rounded-xl border px-2 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
              >
                {sec}s
              </button>
            ))}
          </div>
        )}

        {/* Exercise navigation */}
        <div className="flex gap-2">
          {currentExIdx > 0 && (
            <button
              onClick={() => setCurrentExIdx((i) => i - 1)}
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors"
            >
              {s.previous}
            </button>
          )}
          {currentExIdx < liveExercises.length - 1 && (
            <button
              onClick={() => setCurrentExIdx((i) => i + 1)}
              className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm font-medium hover:bg-muted/60 transition-colors"
            >
              {s.nextExercise}
            </button>
          )}
        </div>
      </div>

      {/* Sticky finish button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <button
          onClick={handleFinish}
          disabled={submitting || loggedSets.length === 0}
          className="w-full max-w-lg mx-auto block rounded-2xl bg-primary text-primary-foreground py-4 text-base font-bold disabled:opacity-40 transition-opacity active:scale-[0.98]"
        >
          {submitting ? s.finishSaving : `${s.finishSession} ${newPrs.length > 0 ? "🏆" : "✓"}`}
        </button>
      </div>

      {/* Swap modal */}
      {swapModalOpen && exLib && (
        <SwapExerciseModal
          currentName={exLib.name}
          onSwap={handleSwap}
          onClose={() => setSwapModalOpen(false)}
        />
      )}
    </div>
  );
}
