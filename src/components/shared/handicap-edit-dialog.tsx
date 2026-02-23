"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NumberStepper } from "@/components/shared/number-stepper";
import { useGameStore } from "@/lib/game-store";
import { generatePairs, getPlayerName } from "@/lib/pairs";
import { distributeHandicapHoles } from "@/lib/pairs";

export function HandicapEditDialog() {
  const [open, setOpen] = useState(false);
  const {
    config,
    setHandicap,
    setHandicapHoles,
    recalculateFromStrokes,
    holeStrokes,
  } = useGameStore();

  if (!config?.players?.length) return null;

  const pairs = generatePairs(config.players);
  const hasScores = holeStrokes.length > 0;

  const handleHandicapChange = (pairKey: string, newValue: number) => {
    const existing = config.handicaps[pairKey];
    const oldValue = existing?.value ?? 0;
    const oldHoles = existing?.handicapHoles ?? [];

    setHandicap(pairKey, newValue);
    // setHandicap resets handicapHoles to [] internally, so we must call setHandicapHoles after

    if (newValue === 0) {
      // No holes needed
      return;
    }

    const signChanged = (oldValue > 0 && newValue < 0) || (oldValue < 0 && newValue > 0);

    if (oldValue === 0 || signChanged) {
      // Fresh start: auto-distribute as default
      const holes = distributeHandicapHoles(newValue, config.numberOfHoles);
      setHandicapHoles(pairKey, holes);
    } else {
      // Same direction, value changed
      const absNew = Math.abs(newValue);
      if (oldHoles.length <= absNew) {
        // Value increased or same: keep all existing selections
        setHandicapHoles(pairKey, oldHoles);
      } else {
        // Value decreased: trim from highest hole numbers
        const trimmed = [...oldHoles].sort((a, b) => a - b).slice(0, absNew);
        setHandicapHoles(pairKey, trimmed);
      }
    }
  };

  const handleClose = () => {
    // Recalculate all scores after handicap changes
    if (hasScores) {
      recalculateFromStrokes();
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <button
          className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Edit handicaps"
        >
          <Settings2 className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Handicaps</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground text-center">
            Changes will recalculate all scores
          </p>
          {pairs.map((pair) => {
            const handicap = config.handicaps[pair.pairKey];
            const value = handicap?.value ?? 0;
            const handicapHoles = handicap?.handicapHoles ?? [];
            const playerAName = getPlayerName(config.players, pair.playerAId);
            const playerBName = getPlayerName(config.players, pair.playerBId);

            return (
              <div key={pair.pairKey} className="glass-card p-3">
                <div className="text-center mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {playerAName} vs {playerBName}
                  </span>
                  {value !== 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {value > 0 ? playerAName : playerBName} gives{" "}
                      {Math.abs(value)} stroke{Math.abs(value) > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <NumberStepper
                  value={value}
                  onChange={(v) => handleHandicapChange(pair.pairKey, v)}
                  min={-config.numberOfHoles}
                  max={config.numberOfHoles}
                  size="sm"
                />
                {Math.abs(value) > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      Handicap holes (tap to toggle):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(
                        { length: config.numberOfHoles },
                        (_, i) => i + 1
                      ).map((hole) => {
                        const isSelected = handicapHoles.includes(hole);
                        const maxSelectable = Math.abs(value);
                        const atMax =
                          handicapHoles.length >= maxSelectable && !isSelected;

                        return (
                          <button
                            key={hole}
                            onClick={() => {
                              if (isSelected) {
                                setHandicapHoles(
                                  pair.pairKey,
                                  handicapHoles.filter((h) => h !== hole)
                                );
                              } else if (!atMax) {
                                setHandicapHoles(pair.pairKey, [
                                  ...handicapHoles,
                                  hole,
                                ]);
                              }
                            }}
                            disabled={atMax}
                            className={`w-9 h-9 rounded-lg text-xs font-bold transition-all active:scale-90 ${
                              isSelected
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                                : atMax
                                ? "bg-muted/30 text-muted-foreground/40"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                            }`}
                          >
                            {hole}
                          </button>
                        );
                      })}
                    </div>
                    <p className={`text-xs mt-1.5 ${
                      handicapHoles.length < Math.abs(value)
                        ? "text-rose-400 font-medium"
                        : "text-muted-foreground"
                    }`}>
                      {handicapHoles.length}/{Math.abs(value)} selected
                      {handicapHoles.length < Math.abs(value) &&
                        ` — select ${Math.abs(value) - handicapHoles.length} more`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
