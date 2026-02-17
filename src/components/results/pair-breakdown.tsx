"use client";

import { useMemo } from "react";
import { generatePairs, getPlayerName } from "@/lib/pairs";
import { Player, PairHoleResult } from "@/lib/types";

interface PairBreakdownProps {
  players: Player[];
  pairResults: PairHoleResult[];
}

interface PairData {
  pairKey: string;
  playerAName: string;
  playerBName: string;
  playerAWins: number;
  playerBWins: number;
  ties: number;
  playerATotal: number;
  playerBTotal: number;
  holeResults: PairHoleResult[];
}

export function PairBreakdown({ players, pairResults }: PairBreakdownProps) {
  const pairData = useMemo(() => {
    const pairs = generatePairs(players);
    return pairs.map((pair): PairData => {
      const results = pairResults.filter((r) => r.pairKey === pair.pairKey);
      let aWins = 0;
      let bWins = 0;
      let ties = 0;
      let aTotal = 0;
      let bTotal = 0;

      for (const r of results) {
        aTotal += r.playerAScore;
        bTotal += r.playerBScore;
        if (r.playerAScore > r.playerBScore) aWins++;
        else if (r.playerBScore > r.playerAScore) bWins++;
        else ties++;
      }

      return {
        pairKey: pair.pairKey,
        playerAName: getPlayerName(players, pair.playerAId),
        playerBName: getPlayerName(players, pair.playerBId),
        playerAWins: aWins,
        playerBWins: bWins,
        ties,
        playerATotal: aTotal,
        playerBTotal: bTotal,
        holeResults: results.sort((a, b) => a.holeNumber - b.holeNumber),
      };
    });
  }, [players, pairResults]);

  if (pairData.length === 0) return null;

  const showSectionHeader = pairData.length > 1;

  return (
    <div>
      {showSectionHeader && (
        <h2 className="font-bold text-white mb-3">Head to Head</h2>
      )}
      <div className="space-y-3">
        {pairData.map((pair) => (
          <PairCard key={pair.pairKey} pair={pair} />
        ))}
      </div>
    </div>
  );
}

function PairCard({ pair }: { pair: PairData }) {
  const totalHoles = pair.playerAWins + pair.playerBWins + pair.ties;
  const aPercent = totalHoles > 0 ? (pair.playerAWins / totalHoles) * 100 : 0;
  const tiePercent = totalHoles > 0 ? (pair.ties / totalHoles) * 100 : 0;
  const bPercent = totalHoles > 0 ? (pair.playerBWins / totalHoles) * 100 : 0;

  return (
    <div className="glass-card p-4">
      {/* Header: Player A vs Player B */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-slate-200 truncate flex-1 text-left">
          {pair.playerAName}
        </span>
        <span className="text-xs text-slate-500 px-3 shrink-0">vs</span>
        <span className="font-semibold text-slate-200 truncate flex-1 text-right">
          {pair.playerBName}
        </span>
      </div>

      {/* Score bar */}
      {totalHoles > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden mb-3 bg-slate-800/50">
          {aPercent > 0 && (
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${aPercent}%` }}
            />
          )}
          {tiePercent > 0 && (
            <div
              className="bg-slate-600 transition-all"
              style={{ width: `${tiePercent}%` }}
            />
          )}
          {bPercent > 0 && (
            <div
              className="bg-rose-500 transition-all"
              style={{ width: `${bPercent}%` }}
            />
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-center flex-1">
          <span className="text-sm font-bold text-emerald-400 tabular-nums">
            {pair.playerAWins}
          </span>
          <span className="text-xs text-emerald-400/70 ml-1">wins</span>
        </div>
        <div className="text-center flex-1">
          <span className="text-sm font-bold text-slate-500 tabular-nums">
            {pair.ties}
          </span>
          <span className="text-xs text-slate-600 ml-1">ties</span>
        </div>
        <div className="text-center flex-1">
          <span className="text-sm font-bold text-rose-400 tabular-nums">
            {pair.playerBWins}
          </span>
          <span className="text-xs text-rose-400/70 ml-1">wins</span>
        </div>
      </div>

      {/* Final scores */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-lg font-bold tabular-nums ${
            pair.playerATotal > 0
              ? "text-emerald-400"
              : pair.playerATotal < 0
              ? "text-rose-400"
              : "text-slate-500"
          }`}
        >
          {pair.playerATotal > 0
            ? `+${pair.playerATotal}`
            : pair.playerATotal}
        </span>
        <span
          className={`text-lg font-bold tabular-nums ${
            pair.playerBTotal > 0
              ? "text-emerald-400"
              : pair.playerBTotal < 0
              ? "text-rose-400"
              : "text-slate-500"
          }`}
        >
          {pair.playerBTotal > 0
            ? `+${pair.playerBTotal}`
            : pair.playerBTotal}
        </span>
      </div>

      {/* Hole details (collapsed) */}
      {pair.holeResults.length > 0 && (
        <details>
          <summary className="text-xs text-slate-500 cursor-pointer py-2">
            Hole details
          </summary>
          <div className="grid grid-cols-9 gap-1.5 pt-1">
            {pair.holeResults.map((result) => {
              const isAWin = result.playerAScore > result.playerBScore;
              const isBWin = result.playerBScore > result.playerAScore;
              return (
                <div
                  key={result.holeNumber}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span className="text-[10px] text-slate-600 tabular-nums">
                    {result.holeNumber}
                  </span>
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isAWin
                        ? "bg-emerald-500"
                        : isBWin
                        ? "bg-rose-500"
                        : "bg-slate-600"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
