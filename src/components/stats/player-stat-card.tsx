"use client";

import { Trophy, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import type { PlayerStats } from "@/lib/stats";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatScore(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

export function PlayerStatCard({ stats }: { stats: PlayerStats }) {
  return (
    <div className="glass-card p-4">
      <h3 className="text-lg font-bold text-foreground mb-3">
        {stats.displayName}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {/* Win Rate */}
        <div className="bg-muted/40 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-muted-foreground">Win Rate</span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {Math.round(stats.winRate * 100)}%
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {stats.wins} win{stats.wins !== 1 ? "s" : ""} in{" "}
            {stats.gamesPlayed} game{stats.gamesPlayed !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Avg Score */}
        <div className="bg-muted/40 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Avg Score</span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {stats.avgScore.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">per round</div>
        </div>

        {/* Best Round */}
        <div className="bg-muted/40 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Best Round</span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {stats.bestRound ? formatScore(stats.bestRound.score) : "--"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {stats.bestRound ? formatDate(stats.bestRound.date) : "--"}
          </div>
        </div>

        {/* Worst Round */}
        <div className="bg-muted/40 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDown className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-xs text-muted-foreground">Worst Round</span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {stats.worstRound ? formatScore(stats.worstRound.score) : "--"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {stats.worstRound ? formatDate(stats.worstRound.date) : "--"}
          </div>
        </div>
      </div>
    </div>
  );
}
