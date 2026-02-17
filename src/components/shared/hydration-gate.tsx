"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";

export function HydrationGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if already hydrated (handles fast or synchronous hydration)
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    // Subscribe to hydration completion
    const unsub = useGameStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Safety timeout — if hydration hasn't completed after 200ms, show recovery
    const timeout = setTimeout(() => {
      if (!useGameStore.persist.hasHydrated()) {
        setError(true);
      }
    }, 200);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  if (error && !hydrated) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center">
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="text-muted-foreground text-sm px-6 py-3 rounded-xl bg-muted/50 border border-border active:scale-95 transition-transform"
        >
          Something went wrong — tap to reset
        </button>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-6">
        <span className="text-6xl" role="img" aria-label="Golf flag">
          &#9971;
        </span>
        <div className="h-8 w-8 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
