"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js on mount.
 * Mount this in app/layout.tsx inside the <body>.
 */
export function ServiceWorkerInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Registered:", reg.scope);

        // Check for updates every 60 minutes
        setInterval(() => reg.update(), 60 * 60 * 1000);

        // Notify when a new SW version is waiting
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available — show toast
              import("@/components/ui/toast-wrapper").then(({ showToast }) => {
                showToast("🔄 New version available — refresh to update", 8000);
              });
            }
          });
        });
      })
      .catch((err) => console.warn("[SW] Registration failed:", err));
  }, []);

  return null;
}
