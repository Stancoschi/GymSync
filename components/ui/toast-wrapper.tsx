"use client";

import { Suspense } from "react";
import { ToastProvider } from "./toast";

export function ToastWrapper() {
  return (
    <Suspense fallback={null}>
      <ToastProvider />
    </Suspense>
  );
}
