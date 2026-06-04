"use client";

import { useMemo, useState } from "react";

export interface OneRMEntry {
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  epley1RM: number;
  brzycki1RM: number;
  totalSets: number;
  lastPerformed: string;
}

const FORMULAS = [
  { key: "epley", label: "Epley", fn: (w: number, r: number) => w * (1 + r / 30) },
  { key: "brzycki", label: "Brzycki", fn: (w: number, r: number) => w * (36 / (37 - r)) },
  { key: "lander", label: "Lander", fn: (w: number, r: number) => (100 * w) / (101.3 - 2.67123 * r) },
  { key: "lombardi", label: "Lombardi", fn: (w: number, r: number) => w * Math.pow(r, 0.1) },
] as const;

type FormulaKey = (typeof FORMULAS)[number]["key"];

interface Props {
  entries: OneRMEntry[];
}

export function OneRMTable({ entries }: Props) {
  const [formula, setFormula] = useState<FormulaKey>("epley");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"1rm" | "name" | "date">("1rm");

  const formulaFn = FORMULAS.find((f) => f.key === formula)!.fn;

  const rows = useMemo(() => {
    const filtered = entries.filter((e) =>
      e.exerciseName.toLowerCase().includes(search.toLowerCase())
    );
    const withCalc = filtered.map((e) => ({
      ...e,
      calc1RM: formulaFn(e.bestWeight, e.bestReps),
    }));
    return withCalc.sort((a, b) => {
      if (sortBy === "1rm") return b.calc1RM - a.calc1RM;
      if (sortBy === "name") return a.exerciseName.localeCompare(b.exerciseName);
      return new Date(b.lastPerformed).getTime() - new Date(a.lastPerformed).getTime();
    });
  }, [entries, formula, search, sortBy, formulaFn]);

  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60] as const;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search exercise…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="flex gap-2 flex-wrap">
          {FORMULAS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFormula(f.key as FormulaKey)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                formula === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="1rm">Sort: 1RM</option>
          <option value="name">Sort: Name</option>
          <option value="date">Sort: Recent</option>
        </select>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No weighted sets found. Log some sets to see your 1RM estimates.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <details
              key={row.exerciseName}
              className="group rounded-2xl border border-border bg-card overflow-hidden"
            >
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none hover:bg-muted/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{row.exerciseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.bestWeight} kg × {row.bestReps} reps &nbsp;·&nbsp; {row.totalSets} sets logged
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary tabular-nums">{row.calc1RM.toFixed(1)} kg</p>
                    <p className="text-xs text-muted-foreground">est. 1RM</p>
                  </div>
                  <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>

              {/* Percentage breakdown */}
              <div className="border-t border-border bg-muted/20 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Training percentages</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {percentages.map((pct) => (
                    <div key={pct} className="rounded-xl bg-background border border-border px-2 py-2 text-center">
                      <p className="text-xs text-muted-foreground">{pct}%</p>
                      <p className="text-sm font-semibold tabular-nums">{((row.calc1RM * pct) / 100).toFixed(1)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Last performed: {new Date(row.lastPerformed).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
