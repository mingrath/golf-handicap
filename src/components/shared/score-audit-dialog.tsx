"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGameStore } from "@/lib/game-store";
import { generatePairs, getPlayerName } from "@/lib/pairs";

interface ScoreAuditDialogProps {
  trigger: React.ReactNode;
  onHoleSelect: (holeNumber: number) => void;
  mode: "play" | "results";
}

export function ScoreAuditDialog({ trigger, onHoleSelect }: ScoreAuditDialogProps) {
  const [open, setOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const { config, holeStrokes } = useGameStore();

  if (!config?.players?.length) return null;

  const pairs = generatePairs(config.players);
  const pairsWithHandicap = pairs.filter((pair) => {
    const h = config.handicaps[pair.pairKey];
    return h && h.handicapHoles.length > 0;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-full h-[90dvh] top-[10dvh] translate-y-0 flex flex-col p-0 gap-0 rounded-t-2xl rounded-b-none left-0 translate-x-0"
        showCloseButton={false}
      >
        <DialogHeader className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-base font-bold text-foreground">Score Audit</DialogTitle>
          <DialogDescription className="sr-only">
            Raw stroke entries per hole per player. Tap a hole to navigate or edit.
          </DialogDescription>
          <button
            onClick={() => setOpen(false)}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Part A — Stroke grid */}
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-muted-foreground font-medium w-10">Hole</th>
                  {config.players.map((p) => (
                    <th
                      key={p.id}
                      className="text-center px-1.5 py-2 text-muted-foreground font-medium max-w-[48px] truncate"
                    >
                      {p.name.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: config.numberOfHoles }, (_, i) => i + 1).map((hole) => {
                  const holeData = holeStrokes.find((s) => s.holeNumber === hole);
                  const scored = !!holeData;
                  return (
                    <tr
                      key={hole}
                      className={`border-b border-border/50 last:border-0 transition-colors ${
                        scored ? "cursor-pointer active:bg-muted/50" : "opacity-50"
                      }`}
                      onClick={() => {
                        if (!scored) return;
                        onHoleSelect(hole);
                        setOpen(false);
                      }}
                    >
                      <td className="py-2.5 pr-3 font-bold tabular-nums text-foreground">{hole}</td>
                      {config.players.map((p) => {
                        const val = holeData?.strokes[p.id];
                        return (
                          <td key={p.id} className="text-center px-1.5 py-2.5 tabular-nums text-foreground">
                            {val != null ? val : <span className="text-muted-foreground/30">&#8212;</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Part B — Handicap legend (collapsible) */}
          {pairsWithHandicap.length > 0 && (
            <div className="glass-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
                onClick={() => setLegendOpen((v) => !v)}
              >
                <span>Handicap Holes by Pair</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    legendOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {legendOpen && (
                <div className="px-4 pb-4 space-y-2 border-t border-border">
                  {pairsWithHandicap.map((pair) => {
                    const h = config.handicaps[pair.pairKey];
                    const aName = getPlayerName(config.players, pair.playerAId);
                    const bName = getPlayerName(config.players, pair.playerBId);
                    return (
                      <div key={pair.pairKey} className="text-sm">
                        <span className="font-medium text-foreground">
                          {aName} vs {bName}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          Holes: {h.handicapHoles.sort((a, b) => a - b).join(", ")}
                        </span>
                        <span className="text-muted-foreground/60 text-xs ml-2">
                          ({h.value > 0 ? aName : bName} gives {Math.abs(h.value)})
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
