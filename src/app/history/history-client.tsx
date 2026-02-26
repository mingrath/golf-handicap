"use client";

import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Trophy, Calendar, Users, BarChart3, ChevronRight } from "lucide-react";
import { historyDb, type HistoryRecord } from "@/lib/history-db";
import { useGameStore } from "@/lib/game-store";

export default function HistoryClient() {
  const router = useRouter();
  const loadHistoryGame = useGameStore((s) => s.loadHistoryGame);

  const handleGameSelect = (game: HistoryRecord) => {
    loadHistoryGame(game);
    router.push("/results");
  };

  const games = useLiveQuery(
    () => historyDb.games.orderBy("completedAt").reverse().toArray(),
    [],
    [] as HistoryRecord[]
  );

  return (
    <div className="min-h-dvh bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => router.push("/")}
            className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Game History</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {games.length > 0 && (
          <button
            onClick={() => router.push("/stats")}
            className="w-full glass-card p-4 text-left active:scale-[0.97] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground">Player Stats</div>
                <div className="text-xs text-muted-foreground">
                  Win rates, averages, and trends
                </div>
              </div>
            </div>
          </button>
        )}

        {games.length === 0 ? (
          /* Empty state */
          <div className="glass-card p-8 text-center">
            <div className="text-5xl mb-4">&#9971;</div>
            <p className="text-muted-foreground text-sm mb-6">
              No games yet. Complete a round to see it here.
            </p>
            <button
              onClick={() => router.push("/setup")}
              className="h-12 px-6 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all"
            >
              Start a Game
            </button>
          </div>
        ) : (
          /* Game list */
          games.map((game) => {
            const winner = game.rankings[0];
            const dateObj = new Date(game.completedAt);
            const dateStr = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeStr = dateObj.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div
                key={game.id}
                className="glass-card p-4 hover:bg-muted/30 transition-colors cursor-pointer active:scale-[0.98]"
                onClick={() => handleGameSelect(game)}
              >
                {/* Date row */}
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {dateStr} at {timeStr}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {game.numberOfHoles} holes
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </div>

                {/* Winner row */}
                {winner && (
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">
                      {winner.playerName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({winner.totalScore > 0 ? "+" : ""}
                      {winner.totalScore})
                    </span>
                  </div>
                )}

                {/* Players row */}
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">
                    {game.players.map((p) => p.name).join(", ")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
