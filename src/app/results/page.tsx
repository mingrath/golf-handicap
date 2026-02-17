"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, RotateCcw, Crown, Pencil, X } from "lucide-react";
import { NumberStepper } from "@/components/shared/number-stepper";
import { useGameStore } from "@/lib/game-store";
import { getFinalRankings } from "@/lib/scoring";
import { HoleStrokes } from "@/lib/types";
import { ScoreTrendChart } from "@/components/results/score-trend-chart";
import { PairBreakdown } from "@/components/results/pair-breakdown";

const MEDAL_COLORS = ["text-amber-400", "text-slate-400", "text-amber-700"];
const MEDAL_BG = [
  "bg-amber-400/10 border-amber-400/20",
  "bg-slate-400/10 border-slate-600/20",
  "bg-amber-700/10 border-amber-700/20",
];

interface EditingCell {
  playerId: string;
  playerName: string;
  hole: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const { config, playerScores, pairResults, holeStrokes, submitHoleStrokes, resetGame } =
    useGameStore();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  useEffect(() => {
    if (!config?.players?.length) {
      router.replace("/");
    }
  }, [config, router]);

  if (!config?.players?.length) return null;

  const rankings = getFinalRankings(config.players, playerScores);

  const handleNewGame = () => {
    resetGame();
    router.push("/setup");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleEditStroke = (playerId: string, playerName: string, hole: number) => {
    setEditingCell({ playerId, playerName, hole });
  };

  const getStrokeValue = (playerId: string, hole: number): number => {
    const holeData = holeStrokes.find((s) => s.holeNumber === hole);
    return holeData?.strokes[playerId] ?? 0;
  };

  const handleStrokeChange = (value: number) => {
    if (!editingCell) return;
    const { playerId, hole } = editingCell;

    // Get existing strokes for this hole
    const existing = holeStrokes.find((s) => s.holeNumber === hole);
    const updatedStrokes: Record<string, number> = existing
      ? { ...existing.strokes }
      : {};
    updatedStrokes[playerId] = value;

    // Resubmit hole — this triggers full recalculation in the store
    const holeData: HoleStrokes = {
      holeNumber: hole,
      strokes: updatedStrokes,
    };
    submitHoleStrokes(holeData);
  };

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 px-4 py-4 flex items-center">
        <h1 className="text-lg font-bold text-white">Final Results</h1>
      </header>

      <div className="flex-1 px-4 py-6 space-y-5">
        {/* Winner celebration */}
        {rankings.length > 0 && (
          <div className="text-center py-10 relative">
            {/* Ambient glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-amber-400/10 blur-[60px]" />
            </div>

            <div className="relative z-10">
              <div className="animate-bounce-slow mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mx-auto flex items-center justify-center shadow-xl shadow-amber-500/30">
                  <Crown className="h-10 w-10 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {rankings[0].player.name}
              </h2>
              <p className="text-2xl font-bold text-emerald-400 mt-2 tabular-nums">
                {rankings[0].totalScore > 0
                  ? `+${rankings[0].totalScore}`
                  : rankings[0].totalScore}{" "}
                points
              </p>
              <p className="text-sm text-amber-400/80 mt-1 font-semibold uppercase tracking-wider">
                Champion
              </p>
            </div>
          </div>
        )}

        {/* Rankings */}
        <div className="glass-card p-4">
          <h2 className="font-bold text-white mb-3">Rankings</h2>
          <div className="space-y-2">
            {rankings.map((entry, idx) => (
              <div
                key={entry.player.id}
                className={`flex items-center justify-between py-3 px-4 rounded-xl border transition-all ${
                  idx < 3
                    ? MEDAL_BG[idx]
                    : entry.totalScore > 0
                    ? "bg-emerald-500/5 border-emerald-500/10"
                    : entry.totalScore < 0
                    ? "bg-rose-500/5 border-rose-500/10"
                    : "bg-slate-800/30 border-slate-700/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-2xl font-extrabold tabular-nums w-8 ${
                      MEDAL_COLORS[idx] ?? "text-slate-500"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="font-medium text-slate-200">{entry.player.name}</span>
                </div>
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    entry.totalScore > 0
                      ? "text-emerald-400"
                      : entry.totalScore < 0
                      ? "text-rose-400"
                      : "text-slate-500"
                  }`}
                >
                  {entry.totalScore > 0
                    ? `+${entry.totalScore}`
                    : entry.totalScore}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Score Trend Chart */}
        <ScoreTrendChart
          players={config.players}
          playerScores={playerScores}
          numberOfHoles={config.numberOfHoles}
        />

        {/* Head-to-Head Pair Breakdowns */}
        <PairBreakdown
          players={config.players}
          pairResults={pairResults}
        />

        {/* Editable Scorecard */}
        <div className="glass-card p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">Scorecard</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Pencil className="h-3 w-3" />
              <span>Tap to edit</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-2 pr-3 text-slate-400 font-medium">Player</th>
                {Array.from(
                  { length: config.numberOfHoles },
                  (_, i) => i + 1
                ).map((hole) => (
                  <th key={hole} className="text-center px-1.5 py-2 tabular-nums text-slate-400 font-medium">
                    {hole}
                  </th>
                ))}
                <th className="text-center px-2 py-2 font-bold text-white">Tot</th>
              </tr>
            </thead>
            <tbody>
              {config.players.map((player) => {
                let strokeTotal = 0;
                return (
                  <tr key={player.id} className="border-b border-slate-800/50 last:border-0">
                    <td className="py-2 pr-3 font-medium truncate max-w-[80px] text-slate-200">
                      {player.name}
                    </td>
                    {Array.from(
                      { length: config.numberOfHoles },
                      (_, i) => i + 1
                    ).map((hole) => {
                      const holeData = holeStrokes.find(
                        (s) => s.holeNumber === hole
                      );
                      const rawStrokes = holeData?.strokes[player.id];
                      if (rawStrokes != null) strokeTotal += rawStrokes;
                      const isEditing =
                        editingCell?.playerId === player.id &&
                        editingCell?.hole === hole;
                      return (
                        <td
                          key={hole}
                          className={`text-center px-1.5 py-2 tabular-nums cursor-pointer transition-colors ${
                            isEditing
                              ? "bg-emerald-500/20 text-emerald-300 font-bold rounded"
                              : rawStrokes != null
                              ? "text-slate-300 hover:bg-slate-700/50 hover:text-white rounded"
                              : "text-slate-700"
                          }`}
                          onClick={() => {
                            if (rawStrokes != null) {
                              handleEditStroke(player.id, player.name, hole);
                            }
                          }}
                        >
                          {rawStrokes != null ? rawStrokes : "-"}
                        </td>
                      );
                    })}
                    <td className="text-center px-2 py-2 font-bold tabular-nums text-white">
                      {strokeTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="sticky bottom-0 p-4 pb-safe bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50 flex gap-3">
        <button
          className="flex-1 h-14 rounded-xl text-lg font-semibold bg-slate-800 border border-slate-700/50 text-slate-300 hover:bg-slate-700 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          onClick={handleGoHome}
        >
          <Home className="h-5 w-5" />
          Home
        </button>
        <button
          className="flex-1 h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          onClick={handleNewGame}
        >
          <RotateCcw className="h-5 w-5" />
          New Game
        </button>
      </div>

      {/* Edit modal overlay */}
      {editingCell && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setEditingCell(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border-t border-slate-700/50 rounded-t-2xl p-5 pb-safe animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-white text-lg">
                  Edit Strokes
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {editingCell.playerName} &middot; Hole {editingCell.hole}
                </p>
              </div>
              <button
                className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                onClick={() => setEditingCell(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-center py-4">
              <NumberStepper
                value={getStrokeValue(editingCell.playerId, editingCell.hole)}
                onChange={handleStrokeChange}
                min={0}
                max={20}
                size="lg"
              />
            </div>

            <button
              className="w-full h-12 mt-3 rounded-xl text-base font-bold bg-emerald-600 text-white active:scale-[0.97] transition-all"
              onClick={() => setEditingCell(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
