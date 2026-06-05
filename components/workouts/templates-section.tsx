"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LayoutTemplate, Pin, PinOff, Trash2, Edit3, Play, ChevronRight, Plus } from "lucide-react";
import { deleteTemplate, togglePinTemplate } from "@/app/workouts/actions";

type Template = {
  id: string;
  name: string;
  description: string | null;
  is_pinned: boolean | null;
};

function TemplateCard({ t, onDelete, onTogglePin }: {
  t: Template;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pinned = t.is_pinned ?? false;

  return (
    <div className={`group relative rounded-2xl border bg-card transition-all ${
      pinned
        ? "border-primary/30 bg-primary/5 shadow-sm"
        : "border-border hover:border-border/80 hover:shadow-sm"
    }`}>
      {/* Pinned badge */}
      {pinned && (
        <div className="absolute -top-2 left-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
            <Pin className="w-2.5 h-2.5" />
            Pinned
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
          pinned ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          <LayoutTemplate className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{t.name}</p>
          {t.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Start session */}
          <Link
            href={`/sessions/new?template=${t.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Play className="w-3 h-3" />
            Start
          </Link>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="More options"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-xl border border-border bg-card shadow-lg py-1">
                  <Link
                    href={`/workouts/templates/${t.id}/edit`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit template
                  </Link>
                  <button
                    onClick={() => { onTogglePin(t.id, pinned); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors"
                  >
                    {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    {pinned ? "Unpin" : "Pin to top"}
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => { onDelete(t.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
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

  function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

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
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Templates</h2>
          {templates.length > 0 && (
            <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {templates.length}
            </span>
          )}
        </div>
        <Link
          href="/workouts/templates/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Plus className="w-3 h-3" />
          New
        </Link>
      </div>

      {templates.length > 0 ? (
        <div className="space-y-4">
          {/* Pinned group */}
          {pinned.length > 0 && (
            <div className="space-y-2">
              {pinned.map((t) => (
                <TemplateCard
                  key={t.id}
                  t={t}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          )}

          {/* Divider when both groups present */}
          {pinned.length > 0 && unpinned.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">Others</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {/* Unpinned group */}
          {unpinned.length > 0 && (
            <div className="space-y-2">
              {unpinned.map((t) => (
                <TemplateCard
                  key={t.id}
                  t={t}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-8 flex flex-col items-center gap-3 text-center">
          <LayoutTemplate className="w-8 h-8 text-muted-foreground/30" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No templates yet</p>
            <p className="text-sm text-muted-foreground">Create one to speed up your workouts.</p>
          </div>
          <Link
            href="/workouts/templates/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create template
          </Link>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <p className="font-semibold">Delete template?</p>
              <p className="text-sm text-muted-foreground">
                &ldquo;{deletingName}&rdquo; will be permanently removed.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
