"use client";

import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { Player, PlayerHoleScore } from "@/lib/types";
import { getRunningTotals } from "@/lib/scoring";
import { Sparkline } from "./sparkline";

interface MiniLeaderboardProps {
  players: Player[];
  playerScores: PlayerHoleScore[];
  currentHole: number;
}

export function MiniLeaderboard({
  players,
  playerScores,
  currentHole,
}: MiniLeaderboardProps) {
  const leaderboard = useMemo(() => {
    const totals = getRunningTotals(playerScores, currentHole);

    const entries = players.map((player) => {
      const total = totals[player.id] ?? 0;

      // Build sparkline data: cumulative running total at each of the last 5 holes
      const startHole = Math.max(1, currentHole - 4);
      const sparklineData: number[] = [];
      for (let h = startHole; h <= currentHole; h++) {
        const runningAtH = playerScores
          .filter((s) => s.playerId === player.id && s.holeNumber <= h)
          .reduce((sum, s) => sum + s.holeScore, 0);
        // Only include if there is actually a score recorded for this hole
        const hasScore = playerScores.some(
          (s) => s.playerId === player.id && s.holeNumber === h
        );
        if (hasScore) {
          sparklineData.push(runningAtH);
        }
      }

      return { player, total, sparklineData };
    });

    // Sort by total descending (highest = rank 1)
    entries.sort((a, b) => b.total - a.total);

    // Assign ranks with tie handling
    let currentRank = 1;
    return entries.map((entry, i) => {
      if (i > 0 && entry.total < entries[i - 1].total) {
        currentRank = i + 1;
      }
      return { ...entry, rank: currentRank };
    });
  }, [players, playerScores, currentHole]);

  if (players.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Trophy className="h-3.5 w-3.5 text-amber-400" />
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Leaderboard
        </h3>
      </div>
      <div className="space-y-0.5">
        {leaderboard.map((entry, idx) => (
          <div
            key={entry.player.id}
            className={`flex items-center gap-2 py-2 px-3 rounded-xl ${
              idx === 0 && entry.total > 0
                ? "bg-emerald-500/10"
                : ""
            }`}
          >
            {/* Rank */}
            <span className="w-6 shrink-0 text-center">
              {entry.rank === 1 ? (
                <Trophy className="h-4 w-4 text-amber-400 inline-block" />
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  #{entry.rank}
                </span>
              )}
            </span>

            {/* Name */}
            <span className="text-sm font-medium text-slate-200 truncate flex-1 min-w-0">
              {entry.player.name}
            </span>

            {/* Sparkline */}
            <Sparkline
              data={entry.sparklineData}
              color={entry.total >= 0 ? "#34d399" : "#fb7185"}
            />

            {/* Total */}
            <span
              className={`text-base font-bold tabular-nums shrink-0 ${
                entry.total > 0
                  ? "text-emerald-400"
                  : entry.total < 0
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {entry.total > 0 ? `+${entry.total}` : entry.total === 0 ? "E" : entry.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
