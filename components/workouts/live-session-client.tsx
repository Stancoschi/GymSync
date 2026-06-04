"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { finishWorkoutSession } from "@/app/workouts/[id]/session/actions";

// ─── Types ──────────────────────────────────────────────────────────────────────
export type LibraryExercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
};

type Exercise = {
  id: string; // template exercise id
  order_index: number;
  target_sets: number;
  min_reps: number;
  max_reps: number;
  target_rir: number | null;
  notes: string | null;
  load_increment: number | null;
  exercise_library:
    | LibraryExercise
    | LibraryExercise[];
};

type LoggedSet = {
  exercise_id: string; // library id
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rir: number | null;
  is_pr: boolean;
};

type LastSet = { set_number: number; reps: number; weight_kg: number };
export type LastSessionMap = Record<string, LastSet[]>;

type SupersetPair = [string, string]; // template exercise ids

// ─── Helpers ────────────────────────────────────────────────────────────────────
function getExLib(ex: Exercise): LibraryExercise {
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
    const intensity = weight / (calc1RM(prBaseline.weight_kg, prBaseline.reps) / (1 + 1 / 30));
    if (intensity >= 0.85) return 180;
    if (intensity >= 0.70) return 120;
  }
  if (reps >= 15) return 90;
  return 120;
}

type SetDelta = "pr" | "better" | "same" | "worse" | "first";

function getSetDelta(weight: number, reps: number, lastSet: LastSet | null, isPr: boolean): SetDelta {
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

const DELTA_BADGE: Record<SetDelta, string | null> = {
  pr: "🏆 PR", better: null, same: null, worse: null, first: "★ First",
};

const REST_PRESETS = [60, 90, 120, 180];
const SET_FLASH_MS = 700;

/** Build a synthetic Exercise shell from a library entry (used when user swaps to a non-template exercise) */
function makeExerciseFromLibrary(lib: LibraryExercise, orderIndex: number): Exercise {
  return {
    id: `adhoc-${lib.id}`, // synthetic template-exercise id
    order_index: orderIndex,
    target_sets: 3,
    min_reps: 8,
    max_reps: 12,
    target_rir: 2,
    notes: null,
    load_increment: 0,
    exercise_library: lib,
  };
}

// ─── Swap / Superset Picker Modal ─────────────────────────────────────────────────
function ExercisePicker({
  allExercises,
  currentLibId,
  loggedSets,
  title,
  onPick,
  onClose,
}: {
  allExercises: LibraryExercise[];
  currentLibId: string;
  loggedSets: LoggedSet[];
  title: string;
  onPick: (lib: LibraryExercise) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = allExercises.filter((lib) => {
    if (lib.id === currentLibId) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      lib.name.toLowerCase().includes(q) ||
      (lib.muscle_group ?? "").toLowerCase().includes(q) ||
      (lib.equipment ?? "").toLowerCase().includes(q)
    );
  });

  // Group by muscle_group
  const grouped = filtered.reduce<Record<string, LibraryExercise[]>>((acc, lib) => {
    const key = lib.muscle_group ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(lib);
    return acc;
  }, {});
  const groups = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 mb-4 sm:mb-0 rounded-2xl bg-background border border-border shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
        </div>
        {/* Search */}
        <div className="p-3 border-b border-border shrink-0">
          <input
            autoFocus
            type="text"
            placeholder="Search by name, muscle, equipment…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border bg-muted/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>
        {/* List */}
        <div className="overflow-y-auto flex-1">
          {groups.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">No exercises found.</p>
          )}
          {groups.map(([group, libs]) => (
            <div key={group}>
              <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 sticky top-0">
                {group}
              </p>
              {libs.map((lib) => {
                const alreadyLogged = loggedSets.some((s) => s.exercise_id === lib.id);
                return (
                  <button
                    key={lib.id}
                    onClick={() => onPick(lib)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border/40 last:border-0 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{lib.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[lib.muscle_group, lib.equipment].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {alreadyLogged && (
                      <span className="text-xs text-primary font-medium">✓ logged</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LiveSessionClient({
  templateId,
  templateName,
  exercises: initialExercises,
  allExercises,
  prMap,
  lastSessionMap,
}: {
  templateId: string;
  templateName: string;
  exercises: Exercise[];
  allExercises: LibraryExercise[];
  prMap: Record<string, { weight_kg: number; reps: number }>;
  lastSessionMap: LastSessionMap;
  userId: string;
}) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("");

  // Modals
  const [swapOpen, setSwapOpen] = useState(false);
  const [supersetPickOpen, setSupersetPickOpen] = useState(false);

  // Supersets
  const [supersets, setSupersets] = useState<SupersetPair[]>([]);

  // Flash
  const [flashSet, setFlashSet] = useState(false);

  // Elapsed
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  useEffect(() => {
    const id = setInterval(() => { elapsedRef.current += 1; setElapsed(elapsedRef.current); }, 1000);
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
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start(); osc.stop(ctx.currentTime + 0.4);
          if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
        } catch {}
      }
    }, 1000);
  }, []);

  const cancelRest = () => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestActive(false); setRestSeconds(0);
  };

  // Derived
  const currentEx = exercises[currentExIdx];
  const exLib = currentEx ? getExLib(currentEx) : null;
  const currentExSets = loggedSets.filter((s) => s.exercise_id === exLib?.id);
  const targetSets = currentEx?.target_sets ?? 3;
  const setsLeft = Math.max(0, targetSets - currentExSets.length);
  const prBaseline = exLib ? prMap[exLib.id] ?? null : null;
  const lastSets: LastSet[] = exLib ? (lastSessionMap[exLib.id] ?? []) : [];
  const nextSetIdx = currentExSets.length;
  const lastSetRef: LastSet | null = lastSets[nextSetIdx] ?? null;
  const suggestedWeight = lastSetRef !== null
    ? lastSetRef.weight_kg + (currentEx?.load_increment ?? 0)
    : null;

  // Superset helpers
  function getSupersetPartnerId(templateExId: string): string | null {
    for (const [a, b] of supersets) {
      if (a === templateExId) return b;
      if (b === templateExId) return a;
    }
    return null;
  }

  function getSupersetPartner(templateExId: string): Exercise | null {
    const pid = getSupersetPartnerId(templateExId);
    return pid ? exercises.find((e) => e.id === pid) ?? null : null;
  }

  function removeSuperset(exAId: string, exBId: string) {
    setSupersets((prev) =>
      prev.filter(
        ([a, b]) => !((a === exAId && b === exBId) || (a === exBId && b === exAId))
      )
    );
  }

  function addSuperset(exAId: string, exBId: string) {
    setSupersets((prev) => {
      // Remove any existing pair for either exercise
      const cleaned = prev.filter(
        ([a, b]) => a !== exAId && b !== exAId && a !== exBId && b !== exBId
      );
      return [...cleaned, [exAId, exBId]];
    });
  }

  // Pre-fill inputs for an exercise index
  function prefillInputs(exIdx: number, currentLoggedSets: LoggedSet[]) {
    const ex = exercises[exIdx];
    if (!ex) return;
    const lib = getExLib(ex);
    const lastS = lastSessionMap[lib.id] ?? [];
    const loggedCount = currentLoggedSets.filter((s) => s.exercise_id === lib.id).length;
    const ref = lastS[loggedCount] ?? null;
    setWeight(ref ? String(ref.weight_kg + (ex.load_increment ?? 0)) : "");
    setReps(ref ? String(ref.reps) : "");
    setRir("");
  }

  // Log set
  function logSet() {
    if (!exLib || !currentEx) return;
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return;
    const rirVal = rir !== "" ? parseInt(rir, 10) : null;
    const setNumber = currentExSets.length + 1;

    const isPr = prBaseline
      ? calc1RM(w, r) > calc1RM(prBaseline.weight_kg, prBaseline.reps)
      : true;

    const newSet: LoggedSet = {
      exercise_id: exLib.id,
      exercise_name: exLib.name,
      set_number: setNumber,
      reps: r,
      weight_kg: w,
      rir: rirVal,
      is_pr: isPr,
    };

    const newLoggedSets = [...loggedSets, newSet];
    setLoggedSets(newLoggedSets);

    // Flash
    setFlashSet(true);
    setTimeout(() => setFlashSet(false), SET_FLASH_MS);

    const partner = getSupersetPartner(currentEx.id);
    if (partner) {
      const partnerLib = getExLib(partner);
      const partnerIdx = exercises.indexOf(partner);
      const partnerLoggedCount = newLoggedSets.filter(
        (s) => s.exercise_id === partnerLib.id
      ).length;
      // Switch to partner
      setCurrentExIdx(partnerIdx);
      const partnerRef = (lastSessionMap[partnerLib.id] ?? [])[partnerLoggedCount] ?? null;
      setWeight(partnerRef ? String(partnerRef.weight_kg + (partner.load_increment ?? 0)) : "");
      setReps(partnerRef ? String(partnerRef.reps) : "");
      setRir("");
      // Rest only after partner has caught up (both did same number of sets)
      if (partnerLoggedCount >= setNumber) {
        startRest(smartRestSeconds(w, r, rirVal, prBaseline));
      }
    } else {
      startRest(smartRestSeconds(w, r, rirVal, prBaseline));
      setWeight(String(w));
      setReps(String(r));
    }
  }

  // Swap: replace current exercise with any library exercise
  function handleSwap(lib: LibraryExercise) {
    setSwapOpen(false);
    // Check if already in exercises list
    const existingIdx = exercises.findIndex((e) => getExLib(e).id === lib.id);
    if (existingIdx !== -1 && existingIdx !== currentExIdx) {
      setCurrentExIdx(existingIdx);
      prefillInputs(existingIdx, loggedSets);
      return;
    }
    // Build synthetic exercise
    const synthetic = makeExerciseFromLibrary(lib, currentEx?.order_index ?? 0);
    // Remove any superset involving current exercise before swap
    if (currentEx) {
      setSupersets((prev) => prev.filter(([a, b]) => a !== currentEx.id && b !== currentEx.id));
    }
    setExercises((prev) => {
      const next = [...prev];
      next[currentExIdx] = synthetic;
      return next;
    });
    // Pre-fill from last session if available
    const lastS = lastSessionMap[lib.id] ?? [];
    const ref = lastS[0] ?? null;
    setWeight(ref ? String(ref.weight_kg) : "");
    setReps(ref ? String(ref.reps) : "");
    setRir("");
  }

  // Superset: pair current exercise with any library exercise
  function handleSupersetPick(lib: LibraryExercise) {
    setSupersetPickOpen(false);
    if (!currentEx) return;
    // Check if lib is already an exercise in the session
    let partnerEx = exercises.find((e) => getExLib(e).id === lib.id && e.id !== currentEx.id);
    if (!partnerEx) {
      // Add as a new exercise at the end
      const synthetic = makeExerciseFromLibrary(lib, exercises.length);
      setExercises((prev) => [...prev, synthetic]);
      partnerEx = synthetic;
      // Need to use the synthetic directly since state hasn't updated yet
      addSuperset(currentEx.id, synthetic.id);
    } else {
      addSuperset(currentEx.id, partnerEx.id);
    }
  }

  const newPrs = Array.from(
    new Set(loggedSets.filter((s) => s.is_pr).map((s) => s.exercise_name))
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

  const supersetPartner = currentEx ? getSupersetPartner(currentEx.id) : null;
  const supersetPartnerLib = supersetPartner ? getExLib(supersetPartner) : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Swap modal */}
      {swapOpen && exLib && (
        <ExercisePicker
          allExercises={allExercises}
          currentLibId={exLib.id}
          loggedSets={loggedSets}
          title="Swap exercise"
          onPick={handleSwap}
          onClose={() => setSwapOpen(false)}
        />
      )}

      {/* Superset picker modal */}
      {supersetPickOpen && exLib && (
        <ExercisePicker
          allExercises={allExercises}
          currentLibId={exLib.id}
          loggedSets={loggedSets}
          title="Pair as superset with…"
          onPick={handleSupersetPick}
          onClose={() => setSupersetPickOpen(false)}
        />
      )}

      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Live session</p>
          <p className="font-semibold truncate">{templateName}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {newPrs.length > 0 && (
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 rounded-full px-2.5 py-1">
              🏆 {newPrs.length} PR{newPrs.length > 1 ? "s" : ""}
            </span>
          )}
          <span className="font-mono text-sm tabular-nums text-muted-foreground">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5 max-w-lg mx-auto w-full pb-32">
        {/* Exercise navigator */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {exercises.map((ex, i) => {
            const lib = getExLib(ex);
            const done = loggedSets.filter((s) => s.exercise_id === lib?.id).length >= ex.target_sets;
            const isSuper = !!getSupersetPartnerId(ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => { setCurrentExIdx(i); prefillInputs(i, loggedSets); }}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors border ${
                  i === currentExIdx
                    ? "bg-primary text-primary-foreground border-primary"
                    : done
                    ? "bg-muted text-muted-foreground border-transparent"
                    : "border-border text-foreground hover:bg-muted/40"
                }`}
              >
                {done ? "✓ " : ""}
                {isSuper && <span className="mr-1 text-primary/70">⇄</span>}
                {lib?.name ?? `Ex ${i + 1}`}
              </button>
            );
          })}
        </div>

        {/* Superset badge */}
        {supersetPartner && supersetPartnerLib && currentEx && (
          <div className="flex items-center gap-2 rounded-xl bg-primary/8 border border-primary/20 px-3 py-2">
            <span className="text-primary text-base">⇄</span>
            <p className="text-xs text-primary font-medium flex-1">
              Superset cu <span className="font-semibold">{supersetPartnerLib.name}</span>
            </p>
            <button
              onClick={() => removeSuperset(currentEx.id, supersetPartner.id)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Remove
            </button>
          </div>
        )}

        {/* Current exercise card */}
        {currentEx && exLib && (
          <div className={`rounded-2xl border bg-card p-5 space-y-4 transition-all duration-700 ${
            flashSet ? "ring-2 ring-green-400/60 shadow-[0_0_24px_4px_rgba(74,222,128,0.15)]" : ""
          }`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{exLib.name}</h2>
                <p className="text-xs text-muted-foreground capitalize">
                  {[exLib.muscle_group, exLib.equipment].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="text-sm font-medium">
                    {currentEx.target_sets} × {currentEx.min_reps}–{currentEx.max_reps} reps
                    {currentEx.target_rir !== null ? ` · RIR ${currentEx.target_rir}` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setSwapOpen(true)}
                    className="text-xs border border-border rounded-lg px-2 py-1 hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    ⇅ Swap
                  </button>
                  <button
                    onClick={() => {
                      if (supersetPartner) {
                        removeSuperset(currentEx.id, supersetPartner.id);
                      } else {
                        setSupersetPickOpen(true);
                      }
                    }}
                    className={`text-xs border rounded-lg px-2 py-1 transition-colors ${
                      supersetPartner
                        ? "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"
                        : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    ⇄ Super
                  </button>
                </div>
              </div>
            </div>

            {/* Baselines */}
            <div className="grid grid-cols-2 gap-2">
              {prBaseline && (
                <div className="rounded-xl bg-muted/50 px-3 py-2 space-y-0.5">
                  <p className="text-xs text-muted-foreground">All-time best</p>
                  <p className="text-sm font-semibold tabular-nums">{prBaseline.weight_kg} kg × {prBaseline.reps} reps</p>
                  <p className="text-xs text-muted-foreground">{calc1RM(prBaseline.weight_kg, prBaseline.reps).toFixed(1)} kg est. 1RM</p>
                </div>
              )}
              {lastSetRef && (
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2 space-y-0.5">
                  <p className="text-xs text-primary/70">Last session set {nextSetIdx + 1}</p>
                  <p className="text-sm font-semibold tabular-nums">{lastSetRef.weight_kg} kg × {lastSetRef.reps} reps</p>
                  {suggestedWeight !== null && suggestedWeight !== lastSetRef.weight_kg && (
                    <p className="text-xs text-primary font-medium">Suggested: {suggestedWeight} kg</p>
                  )}
                </div>
              )}
            </div>

            {currentEx.notes && (
              <p className="text-xs text-muted-foreground italic">{currentEx.notes}</p>
            )}

            {/* Logged sets */}
            {currentExSets.length > 0 && (
              <div className="space-y-1.5">
                {currentExSets.map((s, i) => {
                  const ref = lastSets[i] ?? null;
                  const delta = getSetDelta(s.weight_kg, s.reps, ref, s.is_pr);
                  const weightDiff = ref !== null ? s.weight_kg - ref.weight_kg : null;
                  const repsDiff = ref !== null ? s.reps - ref.reps : null;
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${DELTA_STYLES[delta]}`}>
                      <span className="w-6 text-center text-xs font-mono text-muted-foreground">#{s.set_number}</span>
                      <span className="flex-1 tabular-nums">
                        {s.weight_kg} kg × {s.reps} reps{s.rir !== null ? ` · RIR ${s.rir}` : ""}
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
                      {DELTA_BADGE[delta] && (
                        <span className={`text-xs font-bold ${
                          delta === "pr" ? "text-yellow-600 dark:text-yellow-400" : "text-primary"
                        }`}>{DELTA_BADGE[delta]}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                Set {currentExSets.length + 1} of {targetSets}
                {setsLeft > 0 ? ` · ${setsLeft} left` : " · All sets done"}
                {lastSetRef && (
                  <span className="ml-2 text-primary/70">(last: {lastSetRef.weight_kg}kg × {lastSetRef.reps}r)</span>
                )}
                {supersetPartnerLib && (
                  <span className="ml-2 text-primary font-semibold">→ then {supersetPartnerLib.name}</span>
                )}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Weight (kg)", value: weight, setter: setWeight, placeholder: suggestedWeight !== null ? String(suggestedWeight) : lastSetRef ? String(lastSetRef.weight_kg) : "60" },
                  { label: "Reps", value: reps, setter: setReps, placeholder: lastSetRef ? String(lastSetRef.reps) : "8" },
                  { label: "RIR", value: rir, setter: setRir, placeholder: currentEx.target_rir !== null ? String(currentEx.target_rir) : "2" },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-xs text-muted-foreground">{label}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-medium tabular-nums text-center outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={logSet}
                disabled={!weight || !reps}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold disabled:opacity-40 transition-all active:scale-[0.98]"
              >
                {supersetPartnerLib ? `Log set ＋ → ${supersetPartnerLib.name}` : "Log set ＋"}
              </button>
            </div>
          </div>
        )}

        {/* Set flash */}
        {flashSet && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-300/40 py-3 px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">Set logged!</span>
          </div>
        )}

        {/* Rest timer */}
        {restActive && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">Rest timer</p>
                <p className="text-xs text-muted-foreground">
                  {restTotal === 180 ? "Heavy set · 3 min rest" : restTotal === 120 ? "Moderate · 2 min rest" : "Light · 90s rest"}
                </p>
              </div>
              <button onClick={cancelRest} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Skip</button>
            </div>
            <p className="text-4xl font-bold tabular-nums text-center text-primary">{formatTime(restSeconds)}</p>
            <div className="h-1.5 rounded-full bg-primary/20 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${Math.max(0, (restSeconds / restTotal) * 100)}%` }} />
            </div>
          </div>
        )}

        {!restActive && (
          <div className="flex gap-2">
            {REST_PRESETS.map((s) => (
              <button key={s} onClick={() => startRest(s)} className="flex-1 rounded-xl border px-2 py-2 text-xs font-medium hover:bg-muted/40 transition-colors">{s}s</button>
            ))}
          </div>
        )}

        {/* Nav */}
        <div className="flex gap-2">
          {currentExIdx > 0 && (
            <button onClick={() => { setCurrentExIdx((i) => i - 1); prefillInputs(currentExIdx - 1, loggedSets); }} className="flex-1 rounded-xl border px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors">← Previous</button>
          )}
          {currentExIdx < exercises.length - 1 && (
            <button onClick={() => { setCurrentExIdx((i) => i + 1); prefillInputs(currentExIdx + 1, loggedSets); }} className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm font-medium hover:bg-muted/60 transition-colors">Next exercise →</button>
          )}
        </div>
      </div>

      {/* Finish */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <button
          onClick={handleFinish}
          disabled={submitting || loggedSets.length === 0}
          className="w-full max-w-lg mx-auto block rounded-2xl bg-primary text-primary-foreground py-4 text-base font-bold disabled:opacity-40 transition-opacity active:scale-[0.98]"
        >
          {submitting ? "Saving…" : `Finish workout ${newPrs.length > 0 ? "🏆" : "✓"}`}
        </button>
      </div>
    </div>
  );
}
