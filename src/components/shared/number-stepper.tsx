"use client";

import { useRef, useCallback } from "react";
import { Minus, Plus } from "lucide-react";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function NumberStepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  label,
  size = "md",
}: NumberStepperProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sizeClasses = {
    sm: { button: "h-10 w-10", icon: "h-4 w-4", text: "text-lg min-w-[2.5rem]" },
    md: { button: "h-12 w-12", icon: "h-5 w-5", text: "text-2xl min-w-[3rem]" },
    lg: { button: "h-14 w-14", icon: "h-6 w-6", text: "text-4xl min-w-[4rem] font-bold" },
  };

  const s = sizeClasses[size];

  const stopRepeat = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const startRepeat = useCallback(
    (direction: "up" | "down") => {
      stopRepeat();
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          onChange(
            direction === "up"
              ? Math.min(max, value + step)
              : Math.max(min, value - step)
          );
        }, 100);
      }, 400);
    },
    [max, min, onChange, step, stopRepeat, value]
  );

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
      <div className="flex items-center gap-3">
        <button
          className={`${s.button} rounded-full shrink-0 flex items-center justify-center transition-all active:scale-90 ${
            value <= min
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
              : "bg-muted text-foreground hover:bg-muted/80 active:bg-muted/60 border border-border"
          }`}
          onClick={() => onChange(Math.max(min, value - step))}
          onPointerDown={() => startRepeat("down")}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          disabled={value <= min}
        >
          <Minus className={s.icon} />
        </button>
        <span
          className={`${s.text} text-center tabular-nums font-semibold text-foreground transition-all`}
        >
          {value}
        </span>
        <button
          className={`${s.button} rounded-full shrink-0 flex items-center justify-center transition-all active:scale-90 ${
            value >= max
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-400 shadow-lg shadow-emerald-600/20"
          }`}
          onClick={() => onChange(Math.min(max, value + step))}
          onPointerDown={() => startRepeat("up")}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          disabled={value >= max}
        >
          <Plus className={s.icon} />
        </button>
      </div>
    </div>
  );
}
