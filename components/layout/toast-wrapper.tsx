"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/**
 * ToastWrapper — reads ?message=... from the URL and shows a toast.
 * Rendered globally in app/layout.tsx.
 * After displaying, removes the query param from the URL without a full reload.
 */
export function ToastWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const message = searchParams.get("message");
    if (!message) return;

    // Show toast
    showToast(decodeURIComponent(message));

    // Remove ?message from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("message");
    const newUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router, pathname]);

  return null;
}

// ─── Toast renderer ────────────────────────────────────────────────────────

let toastContainer: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement("div");
    toastContainer.setAttribute("aria-live", "polite");
    toastContainer.setAttribute("aria-atomic", "false");
    toastContainer.style.cssText = [
      "position:fixed",
      "bottom:1.25rem",
      "left:50%",
      "transform:translateX(-50%)",
      "z-index:9999",
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "gap:0.5rem",
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message: string, durationMs = 3500) {
  const container = getContainer();

  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = [
    "background:hsl(var(--popover))",
    "color:hsl(var(--popover-foreground))",
    "border:1px solid hsl(var(--border))",
    "border-radius:0.75rem",
    "padding:0.625rem 1rem",
    "font-size:0.875rem",
    "font-weight:500",
    "box-shadow:0 4px 16px rgba(0,0,0,0.12)",
    "pointer-events:auto",
    "opacity:0",
    "transform:translateY(8px)",
    "transition:opacity 200ms ease, transform 200ms ease",
    "max-width:min(90vw, 420px)",
    "text-align:center",
    "white-space:pre-wrap",
    "word-break:break-word",
  ].join(";");

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  });

  // Animate out + remove
  const timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, durationMs);

  // Click to dismiss early
  toast.addEventListener("click", () => {
    clearTimeout(timer);
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  });
}
