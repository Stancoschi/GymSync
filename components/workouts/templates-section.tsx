"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LayoutTemplate, Pin, PinOff, Trash2, Edit3, Play, Plus, Loader2, MoreHorizontal } from "lucide-react";
import { deleteTemplate, togglePinTemplate } from "@/app/workouts/actions";
import { startWorkoutFromTemplate } from "@/app/workouts/templates/actions";

type Template = {
  id: string;
  name: string;
  description: string | null;
  is_pinned: boolean | null;
};

function StartButton({ templateId }: { templateId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        const fd = new FormData();
        fd.append("template_id", templateId);
        startTransition(() => startWorkoutFromTemplate(fd));
      }}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 shrink-0"
      aria-label="Start session"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
      {isPending ? "Loading..." : "Start"}
    </button>
  );
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: "bg-orange-500/15 text-orange-500",
  back: "bg-blue-500/15 text-blue-500",
  legs: "bg-emerald-500/15 text-emerald-500",
  shoulders: "bg-purple-500/15 text-purple-500",
  arms: "bg-yellow-500/15 text-yellow-600",
  core: "bg-rose-500/15 text-rose-500",
  glutes: "bg-emerald-500/15 text-emerald-500",
  hamstrings: "bg-emerald-500/15 text-emerald-500",
  quads: "bg-teal-500/15 text-teal-500",
  calves: "bg-teal-500/15 text-teal-500",
};

function getMuscleChipClass(group: string) {
  return MUSCLE_COLORS[group.toLowerCase()] ?? "bg-muted text-muted-foreground";
}

function TemplateCard({ t, onDelete, onTogglePin }: {
  t: Template;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pinned = t.is_pinned ?? false;

  return (
    <div
      className={`group relative rounded-2xl border transition-all ${
        pinned
          ? "border-primary/25 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:shadow-sm hover:border-border/80"
      }`}
    >
      {/* Pinned pill */}
      {pinned && (
        <div className="absolute -top-2.5 left-4 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
            <Pin className="w-2.5 h-2.5" /> Pinned
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-4">
        {/* Icon */}
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          pinned ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground"
        }`}>
          <LayoutTemplate className="w-4.5 h-4.5" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-semibold truncate leading-snug">{t.name}</p>
          {t.description ? (
            <p className="text-xs text-muted-foreground truncate">{t.description}</p>
          ) : (
            <p className="text-xs text-muted-foreground/40 italic">Fără descriere</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <StartButton templateId={t.id} />

          {/* ··· menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-20 min-w-[170px] rounded-xl border border-border bg-card shadow-xl py-1">
                  <Link
                    href={`/workouts/${t.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" /> View template
                  </Link>
                  <Link
                    href={`/workouts/templates/${t.id}/edit`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit template
                  </Link>
                  <button
                    onClick={() => { onTogglePin(t.id, pinned); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors"
                  >
                    {pinned
                      ? <><PinOff className="w-3.5 h-3.5" /> Unpin</>
                      : <><Pin className="w-3.5 h-3.5" /> Pin to top</>}
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => { onDelete(t.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplatesSection({ templates }: { templates: Template[] }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pinned = templates.filter((t) => t.is_pinned);
  const unpinned = templates.filter((t) => !t.is_pinned);

  function confirmDelete() {
    if (!confirmDeleteId) return;
    startTransition(() => deleteTemplate(confirmDeleteId));
    setConfirmDeleteId(null);
  }

  function handleTogglePin(id: string, currentPinned: boolean) {
    startTransition(() => togglePinTemplate(id, currentPinned));
  }

  const deletingName = templates.find((t) => t.id === confirmDeleteId)?.name;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Templates
          </h2>
          {templates.length > 0 && (
            <span className="text-xs font-semibold bg-muted text-muted-foreground rounded-full px-2 py-0.5 tabular-nums">
              {templates.length}
            </span>
          )}
        </div>
        <Link
          href="/workouts/templates/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <Plus className="w-3 h-3" /> New
        </Link>
      </div>

      {templates.length > 0 ? (
        <div className="space-y-5">
          {/* Pinned group */}
          {pinned.length > 0 && (
            <div className="space-y-3">
              {pinned.map((t) => (
                <TemplateCard key={t.id} t={t} onDelete={setConfirmDeleteId} onTogglePin={handleTogglePin} />
              ))}
            </div>
          )}

          {/* Separator */}
          {pinned.length > 0 && unpinned.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
                Altele
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>
          )}

          {/* Unpinned group */}
          {unpinned.length > 0 && (
            <div className="space-y-2.5">
              {unpinned.map((t) => (
                <TemplateCard key={t.id} t={t} onDelete={setConfirmDeleteId} onTogglePin={handleTogglePin} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 flex flex-col items-center gap-3 text-center bg-muted/10">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
            <LayoutTemplate className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Niciun template</p>
            <p className="text-xs text-muted-foreground">Creează un template pentru a porni mai rapid sesiunile.</p>
          </div>
          <Link
            href="/workouts/templates/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Crează template
          </Link>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <p className="font-semibold">Ștergi templateul?</p>
              <p className="text-sm text-muted-foreground">
                &ldquo;{deletingName}&rdquo; va fi șters definitiv.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isPending ? "Se șterge..." : "Șterge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
