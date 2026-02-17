"use client";

import { useState, useEffect, useCallback } from "react";
import { Undo2 } from "lucide-react";

interface UndoBannerProps {
  onUndo: () => void;
  onExpire?: () => void;
  durationMs?: number;
}

export function UndoBanner({
  onUndo,
  onExpire,
  durationMs = 10000,
}: UndoBannerProps) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(prev - 100, 0));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const stableOnExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  useEffect(() => {
    if (remaining <= 0) {
      stableOnExpire();
    }
  }, [remaining, stableOnExpire]);

  if (remaining <= 0) return null;

  // Fade opacity in last 3 seconds
  const opacity = remaining <= 3000 ? 0.7 + 0.3 * (remaining / 3000) : 1;

  return (
    <button
      onClick={onUndo}
      style={{ opacity }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-destructive text-destructive-foreground text-sm font-bold shadow-lg shadow-destructive/25 active:scale-95 transition-transform"
    >
      <Undo2 className="h-4 w-4" />
      Undo ({Math.ceil(remaining / 1000)}s)
    </button>
  );
}
