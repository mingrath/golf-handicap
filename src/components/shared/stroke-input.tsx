"use client";

import { Minus, Plus } from "lucide-react";

interface StrokeInputProps {
  playerName: string;
  value: number;
  onChange: (value: number) => void;
}

const PRESETS = [3, 4, 5, 6, 7];
const MIN_STROKES = 1;
const MAX_STROKES = 20;

export function StrokeInput({ playerName, value, onChange }: StrokeInputProps) {
  const isPreset = PRESETS.includes(value);

  return (
    <div className="flex items-center gap-3">
      {/* Player name */}
      <div className="min-w-0 w-[80px] shrink-0">
        <span className="block text-sm font-medium text-foreground truncate">
          {playerName}
        </span>
        {!isPreset && (
          <span className="block text-xs font-bold text-amber-400 tabular-nums">
            {value}
          </span>
        )}
      </div>

      {/* Control row */}
      <div className="flex items-center gap-1.5 flex-1 justify-end">
        {/* Decrement button */}
        <button
          className={`min-h-[48px] min-w-[44px] rounded-xl flex items-center justify-center transition-all active:scale-95 ${
            value <= MIN_STROKES
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
              : "bg-muted text-muted-foreground border border-border hover:bg-muted/80 active:bg-muted/60"
          }`}
          onClick={() => onChange(Math.max(MIN_STROKES, value - 1))}
          disabled={value <= MIN_STROKES}
          aria-label={`Decrease ${playerName} strokes`}
        >
          <Minus className="h-5 w-5" />
        </button>

        {/* Preset number buttons */}
        {PRESETS.map((preset) => (
          <button
            key={preset}
            className={`min-h-[48px] min-w-[44px] rounded-xl text-lg font-bold transition-all active:scale-95 ${
              value === preset
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-105"
                : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
            }`}
            onClick={() => onChange(preset)}
            aria-label={`Set ${playerName} strokes to ${preset}`}
          >
            {preset}
          </button>
        ))}

        {/* Increment button */}
        <button
          className={`min-h-[48px] min-w-[44px] rounded-xl flex items-center justify-center transition-all active:scale-95 ${
            value >= MAX_STROKES
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
              : "bg-muted text-muted-foreground border border-border hover:bg-muted/80 active:bg-muted/60"
          }`}
          onClick={() => onChange(Math.min(MAX_STROKES, value + 1))}
          disabled={value >= MAX_STROKES}
          aria-label={`Increase ${playerName} strokes`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
