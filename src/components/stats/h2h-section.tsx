"use client";

import { Swords } from "lucide-react";
import type { H2HRecord } from "@/lib/stats";

interface H2HSectionProps {
  records: H2HRecord[];
}

export function H2HSection({ records }: H2HSectionProps) {
  if (records.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Swords className="h-4 w-4 text-rose-400" />
        <h2 className="font-bold text-foreground">Head to Head</h2>
      </div>
      <div className="space-y-2">
        {records.map((r) => {
          const total = r.gamesPlayed;
          const aPercent = total > 0 ? (r.playerAWins / total) * 100 : 0;
          const tiePercent = total > 0 ? (r.ties / total) * 100 : 0;
          const bPercent = total > 0 ? (r.playerBWins / total) * 100 : 0;

          return (
            <div
              key={`${r.playerAName}::${r.playerBName}`}
              className="bg-muted/40 rounded-xl p-3"
            >
              {/* Names */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground text-sm truncate flex-1 text-left">
                  {r.playerAName}
                </span>
                <span className="text-[10px] text-muted-foreground px-2 shrink-0">
                  vs
                </span>
                <span className="font-semibold text-foreground text-sm truncate flex-1 text-right">
                  {r.playerBName}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex h-1.5 rounded-full overflow-hidden mb-2 bg-muted/50">
                {aPercent > 0 && (
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${aPercent}%` }}
                  />
                )}
                {tiePercent > 0 && (
                  <div
                    className="bg-muted-foreground"
                    style={{ width: `${tiePercent}%` }}
                  />
                )}
                {bPercent > 0 && (
                  <div
                    className="bg-rose-500"
                    style={{ width: `${bPercent}%` }}
                  />
                )}
              </div>

              {/* Record line */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold tabular-nums">
                  {r.playerAWins}W
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {r.ties}T
                </span>
                <span className="text-rose-400 font-bold tabular-nums">
                  {r.playerBWins}W
                </span>
              </div>
              <div className="text-center text-[10px] text-muted-foreground mt-1">
                {r.gamesPlayed} game{r.gamesPlayed !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
