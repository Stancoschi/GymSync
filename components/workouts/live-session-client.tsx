"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { finishWorkoutSession } from "@/app/workouts/[id]/session/actions";

type Exercise = {
  id: string;
  order_index: number;
  target_sets: number;
  min_reps: number;
  max_reps: number;
  target_rir: number | null;
  notes: string | null;
  exercise_library: { id: string; name: string; muscle_group: string | null } | Array<{ id: string; name: string; muscle_group: string | null }>;
};

type LoggedSet = {
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rir: number | null;
  is_pr: boolean;
};

function getExLib(ex: Exercise) {
  return Array.isArray(ex.exercise_library) ? ex.exercise_library[0] : ex.exercise_library;
}

function calc1RM(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const REST_PRESETS = [60, 90, 120, 180];

export function LiveSessionClient({
  templateId,
  templateName,
  exercises,
  prMap,
}: {
  templateId: string;
  templateName: string;
  exercises: Exercise[];
  prMap: Record<string, { weight_kg: number; reps: number }>;
  userId: string;
}) {
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("");

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
  const restRef = useRef(0);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRest = useCallback((seconds: number) => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restRef.current = seconds;
    setRestSeconds(seconds);
    setRestActive(true);
    restIntervalRef.current = setInterval(() => {
      restRef.current -= 1;
      setRestSeconds(restRef.current);
      if (restRef.current <= 0) {
        clearInterval(restIntervalRef.current!);
        setRestActive(false);
        // Play a soft beep via Web Audio API
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

  const currentEx = exercises[currentExIdx];
  const exLib = currentEx ? getExLib(currentEx) : null;

  // Sets logged for current exercise
  const currentExSets = loggedSets.filter(
    (s) => s.exercise_id === exLib?.id
  );
  const targetSets = currentEx?.target_sets ?? 3;
  const setsLeft = Math.max(0, targetSets - currentExSets.length);

  // PR baseline for current exercise
  const prBaseline = exLib ? prMap[exLib.id] : null;

  function logSet() {
    if (!exLib) return;
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return;
    const rirVal = rir !== "" ? parseInt(rir, 10) : null;
    const setNumber = currentExSets.length + 1;

    // PR check
    let is_pr = false;
    if (prBaseline) {
      const new1rm = calc1RM(w, r);
      const old1rm = calc1RM(prBaseline.weight_kg, prBaseline.reps);
      if (new1rm > old1rm) is_pr = true;
    } else {
      // First time doing this exercise — it's a PR by default
      is_pr = true;
    }

    setLoggedSets((prev) => [
      ...prev,
      { exercise_id: exLib.id, exercise_name: exLib.name, set_number: setNumber, reps: r, weight_kg: w, rir: rirVal, is_pr },
    ]);

    // Auto-start rest timer (90s default)
    startRest(90);
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

  return (
    <div className="min-h-screen flex flex-col">
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
            return (
              <button
                key={ex.id}
                onClick={() => setCurrentExIdx(i)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors border ${
                  i === currentExIdx
                    ? "bg-primary text-primary-foreground border-primary"
                    : done
                    ? "bg-muted text-muted-foreground border-transparent"
                    : "border-border text-foreground hover:bg-muted/40"
                }`}
              >
                {done ? "✓ " : ""}{lib?.name ?? `Ex ${i + 1}`}
              </button>
            );
          })}
        </div>

        {/* Current exercise card */}
        {currentEx && exLib && (
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{exLib.name}</h2>
                <p className="text-xs text-muted-foreground capitalize">{exLib.muscle_group ?? ""}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-sm font-medium">
                  {currentEx.target_sets} × {currentEx.min_reps}–{currentEx.max_reps} reps
                  {currentEx.target_rir !== null ? ` · RIR ${currentEx.target_rir}` : ""}
                </p>
              </div>
            </div>

            {/* PR baseline */}
            {prBaseline && (
              <div className="rounded-xl bg-muted/50 px-3 py-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Previous best</span>
                <span className="font-medium">{prBaseline.weight_kg} kg × {prBaseline.reps} reps</span>
              </div>
            )}

            {currentEx.notes && (
              <p className="text-xs text-muted-foreground italic">{currentEx.notes}</p>
            )}

            {/* Sets logged so far for this exercise */}
            {currentExSets.length > 0 && (
              <div className="space-y-1.5">
                {currentExSets.map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    s.is_pr ? "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300/40" : "bg-muted/40"
                  }`}>
                    <span className="w-6 text-center text-xs font-mono text-muted-foreground">#{s.set_number}</span>
                    <span className="flex-1">{s.weight_kg} kg × {s.reps} reps{s.rir !== null ? ` · RIR ${s.rir}` : ""}</span>
                    {s.is_pr && <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">🏆 PR</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Input row */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                Set {currentExSets.length + 1} of {targetSets}
                {setsLeft > 0 ? ` · ${setsLeft} left` : " · All sets done"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Weight (kg)", value: weight, setter: setWeight, placeholder: "60" },
                  { label: "Reps", value: reps, setter: setReps, placeholder: "8" },
                  { label: "RIR", value: rir, setter: setRir, placeholder: "2" },
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
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold disabled:opacity-40 transition-opacity active:scale-[0.98]"
              >
                Log set ＋
              </button>
            </div>
          </div>
        )}

        {/* Rest timer */}
        {restActive && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">Rest timer</p>
              <button onClick={cancelRest} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Skip</button>
            </div>
            <p className="text-4xl font-bold tabular-nums text-center text-primary">{formatTime(restSeconds)}</p>
            <div className="h-1.5 rounded-full bg-primary/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000"
                style={{ width: `${Math.max(0, (restSeconds / (REST_PRESETS[1])) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {!restActive && (
          <div className="flex gap-2">
            {REST_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => startRest(s)}
                className="flex-1 rounded-xl border px-2 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
              >
                {s}s
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
              ← Previous
            </button>
          )}
          {currentExIdx < exercises.length - 1 && (
            <button
              onClick={() => setCurrentExIdx((i) => i + 1)}
              className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm font-medium hover:bg-muted/60 transition-colors"
            >
              Next exercise →
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
          {submitting ? "Saving…" : `Finish workout ${newPrs.length > 0 ? "🏆" : "✓"}`}
        </button>
      </div>
    </div>
  );
}
