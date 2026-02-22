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

  const handleHandicapChange = (pairKey: string, value: number) => {
    setHandicap(pairKey, value);
    // Auto-distribute handicap holes when value changes
    if (value !== 0) {
      const holes = distributeHandicapHoles(value, config.numberOfHoles);
      setHandicapHoles(pairKey, holes);
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
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
