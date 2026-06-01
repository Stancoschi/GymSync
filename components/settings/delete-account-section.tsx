"use client";

import { useRef, useState, useTransition } from "react";
import { deleteAccount } from "@/app/settings/actions";

export function DeleteAccountSection({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const confirmed = inputValue.trim() === email;

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleCancel() {
    setOpen(false);
    setInputValue("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirmed) { e.preventDefault(); return; }
    startTransition(() => {
      const fd = new FormData(e.currentTarget);
      deleteAccount(fd);
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold border-b border-border pb-2 text-destructive">
        Danger zone
      </h2>

      {!open ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpen}
            className="shrink-0 rounded-xl border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            Delete account
          </button>
        </div>
      ) : (
        /* Confirmation dialog (inline, no JS modal library needed) */
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">Are you absolutely sure?</p>
            <p className="text-xs text-muted-foreground">
              This will permanently delete your account, workouts, body logs, sessions, friendships, and all other data.
              <strong className="text-foreground"> This cannot be undone.</strong>
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="delete-confirm" className="text-xs text-muted-foreground">
              Type your email <span className="font-mono text-foreground">{email}</span> to confirm:
            </label>
            <input
              ref={inputRef}
              id="delete-confirm"
              type="email"
              autoComplete="off"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={email}
              className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
            />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            {/* Hidden field carries the typed confirmation to the server action */}
            <input type="hidden" name="confirmation" value={inputValue} />

            <button
              type="submit"
              disabled={!confirmed || isPending}
              className="rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
            >
              {isPending ? "Deleting…" : "Yes, delete my account"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
