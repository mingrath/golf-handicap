"use client";

import { useRef, useCallback } from "react";
import { Minus, Plus } from "lucide-react";

interface StrokeInputProps {
  playerName: string;
  value: number;
  onChange: (value: number) => void;
}

const MIN_STROKES = 1;
const MAX_STROKES = 20;
const DEFAULT_STROKES = 4;

function clamp(v: number): number {
  return Math.max(MIN_STROKES, Math.min(MAX_STROKES, v));
}

export { DEFAULT_STROKES };

export function StrokeInput({ playerName, value, onChange }: StrokeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow empty while typing
      if (raw === "") return;
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) {
        onChange(clamp(parsed));
      }
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    // Ensure a valid value when leaving the field
    if (inputRef.current) {
      const raw = inputRef.current.value;
      const parsed = parseInt(raw, 10);
      if (isNaN(parsed) || parsed < MIN_STROKES) {
        onChange(DEFAULT_STROKES);
      }
    }
  }, [onChange]);

  const handleFocus = useCallback(() => {
    // Select all text on focus for easy replacement
    inputRef.current?.select();
  }, []);

  return (
    <div className="flex items-center gap-3">
      {/* Player name */}
      <div className="min-w-0 w-[80px] shrink-0">
        <span className="block text-sm font-medium text-foreground truncate">
          {playerName}
        </span>
      </div>

      {/* Control row */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        {/* Decrement button */}
        <button
          className={`min-h-[48px] min-w-[48px] rounded-xl flex items-center justify-center transition-all active:scale-95 ${
            value <= MIN_STROKES
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
              : "bg-muted text-muted-foreground border border-border hover:bg-muted/80 active:bg-muted/60"
          }`}
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= MIN_STROKES}
          aria-label={`Decrease ${playerName} strokes`}
        >
          <Minus className="h-5 w-5" />
        </button>

        {/* Numeric input */}
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={MIN_STROKES}
          max={MAX_STROKES}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="min-h-[48px] w-[64px] rounded-xl text-center text-xl font-bold tabular-nums bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 border-0 outline-none focus:ring-2 focus:ring-emerald-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={`${playerName} strokes`}
        />

        {/* Increment button */}
        <button
          className={`min-h-[48px] min-w-[48px] rounded-xl flex items-center justify-center transition-all active:scale-95 ${
            value >= MAX_STROKES
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
              : "bg-muted text-muted-foreground border border-border hover:bg-muted/80 active:bg-muted/60"
          }`}
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= MAX_STROKES}
          aria-label={`Increase ${playerName} strokes`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
