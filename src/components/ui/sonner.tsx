"use client";

import { Toaster as SonnerToaster } from "sonner";

/** Sonner toasts — use with toast() from "sonner". Renders in root layout. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "bg-background text-foreground border border-border shadow-lg",
          success: "border-primary/30",
        },
      }}
    />
  );
}
