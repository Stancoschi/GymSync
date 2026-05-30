"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

function getType(message: string): ToastType {
  const lower = message.toLowerCase();
  if (lower.includes("error") || lower.includes("full") || lower.includes("already") || lower.includes("invalid")) return "error";
  if (lower.includes("success") || lower.includes("created") || lower.includes("joined") || lower.includes("completed") || lower.includes("updated") || lower.includes("saved")) return "success";
  return "info";
}

export function ToastProvider() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const message = searchParams.get("message");
    if (!message) return;

    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type: getType(message) }]);

    // Remove the ?message= from URL without reload
    const params = new URLSearchParams(searchParams.toString());
    params.delete("message");
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);

    return () => clearTimeout(timer);
  }, [searchParams, router, pathname]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300 ${
            toast.type === "success"
              ? "bg-card border-primary/30 text-foreground"
              : toast.type === "error"
              ? "bg-card border-destructive/40 text-foreground"
              : "bg-card border-border text-foreground"
          }`}
        >
          <span className={`mt-0.5 shrink-0 text-base leading-none ${
            toast.type === "success" ? "text-primary" :
            toast.type === "error" ? "text-destructive" : "text-muted-foreground"
          }`}>
            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
          </span>
          <span className="leading-snug">{toast.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
