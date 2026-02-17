"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { usePlayerStats } from "@/hooks/use-player-stats";
import { PlayerStatCard } from "@/components/stats/player-stat-card";
import { WinRateChart } from "@/components/stats/win-rate-chart";

export default function StatsPage() {
  const router = useRouter();
  const stats = usePlayerStats();

  return (
    <div className="min-h-dvh bg-slate-950">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => router.push("/")}
            className="h-9 w-9 rounded-xl bg-slate-800/60 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4 w-4 text-slate-300" />
          </button>
          <h1 className="text-lg font-bold text-white">Player Stats</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* null = still loading (progressive enhancement) */}
        {stats === null ? null : stats.length === 0 ? (
          /* Empty state */
          <div className="glass-card p-8 text-center">
            <div className="text-5xl mb-4">&#9971;</div>
            <p className="text-slate-400 text-sm mb-6">
              No games yet. Complete a round to see your stats.
            </p>
            <button
              onClick={() => router.push("/setup")}
              className="h-12 px-6 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all"
            >
              Start a Game
            </button>
          </div>
        ) : (
          <>
            {/* Win Rate Chart */}
            <WinRateChart
              data={stats.map((s) => ({
                name: s.displayName,
                winRate: s.winRate,
                wins: s.wins,
                games: s.gamesPlayed,
              }))}
            />

            {/* Per-player stat cards */}
            {stats.map((s) => (
              <PlayerStatCard key={s.displayName} stats={s} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
