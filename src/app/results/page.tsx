"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, RotateCcw, RefreshCcw, Pencil, X, TableProperties, ArrowLeft } from "lucide-react";
import { NumberStepper } from "@/components/shared/number-stepper";
import { useGameStore } from "@/lib/game-store";
import { getFinalRankings } from "@/lib/scoring";
import { HoleStrokes } from "@/lib/types";
import { ScoreTrendChart } from "@/components/results/score-trend-chart";
import { PairBreakdown } from "@/components/results/pair-breakdown";
import { WinnerPodium } from "@/components/results/winner-podium";
import { ShareResultsCard } from "@/components/results/share-results-card";
import { useSaveGame } from "@/hooks/use-save-game";
import { useLiveQuery } from "dexie-react-hooks";
import { historyDb } from "@/lib/history-db";
import { usePlayAgain } from "@/hooks/use-play-again";
import { HandicapEditDialog } from "@/components/shared/handicap-edit-dialog";
import { ScoreAuditDialog } from "@/components/shared/score-audit-dialog";
import { StoryHighlights } from "@/components/results/story-highlights";

const MEDAL_COLORS = ["text-amber-400", "text-muted-foreground", "text-amber-700"];
const MEDAL_BG = [
  "bg-amber-400/10 border-amber-400/20",
  "bg-muted/30 border-border",
  "bg-amber-700/10 border-amber-700/20",
];

interface EditingCell {
  playerId: string;
  playerName: string;
  hole: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const { config, playerScores, pairResults, holeStrokes, submitHoleStrokes, resetGame, isComplete, historyId } =
    useGameStore();
  const isHistoryMode = historyId !== null && historyId !== undefined;
  // Auto-save completed game to history (IndexedDB)
  useSaveGame();

  const latestGame = useLiveQuery(
    () => historyDb.games.orderBy("completedAt").reverse().first(),
    [],
    null
  );
  const handlePlayAgain = usePlayAgain();

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  // Track whether the entrance animation has been triggered (once per mount)
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (!config?.players?.length) {
      router.replace("/");
    }
  }, [config, router]);

  useEffect(() => {
    // Trigger animation on first mount when game is complete; skip for history mode
    if (isComplete && !useGameStore.getState().historyId) {
      setShouldAnimate(true);
      const t = setTimeout(() => setShouldAnimate(false), 2000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

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

  const handleAuditHoleSelect = (hole: number) => {
    // Open edit overlay for first player of this hole
    const firstPlayer = config?.players[0];
    if (!firstPlayer) return;
    setEditingCell({ playerId: firstPlayer.id, playerName: firstPlayer.name, hole });
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
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border px-4 py-4 flex items-center">
        {isHistoryMode && (
          <button
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mr-2"
            onClick={() => {
              resetGame();
              router.push("/history");
            }}
            aria-label="Back to history"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-foreground flex-1">
          {isHistoryMode ? "Game Details" : "Final Results"}
        </h1>
        <ScoreAuditDialog
          trigger={
            <button
              className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Score audit"
            >
              <TableProperties className="h-5 w-5" />
            </button>
          }
          onHoleSelect={handleAuditHoleSelect}
          mode="results"
        />
        <HandicapEditDialog />
      </header>

      <div className="flex-1 px-4 py-6 space-y-5">
        {/* Winner Podium */}
        {rankings.length > 0 && (
          <WinnerPodium
            rankings={rankings}
            shouldAnimate={shouldAnimate}
          />
        )}

        {/* Rankings */}
        <div className="glass-card p-4">
          <h2 className="font-bold text-foreground mb-3">Rankings</h2>
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
                    : "bg-muted/30 border-border/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-2xl font-extrabold tabular-nums w-8 ${
                      MEDAL_COLORS[idx] ?? "text-muted-foreground"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="font-medium text-foreground">{entry.player.name}</span>
                </div>
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    entry.totalScore > 0
                      ? "text-emerald-400"
                      : entry.totalScore < 0
                      ? "text-rose-400"
                      : "text-muted-foreground"
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

        {/* Story Highlights */}
        <StoryHighlights
          players={config.players}
          playerScores={playerScores}
          pairResults={pairResults}
        />

        {/* Head-to-Head Pair Breakdowns */}
        <PairBreakdown
          players={config.players}
          pairResults={pairResults}
        />

        {/* Editable Scorecard */}
        <div className="glass-card p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">Scorecard</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Pencil className="h-3 w-3" />
              <span>Tap to edit</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Player</th>
                {Array.from(
                  { length: config.numberOfHoles },
                  (_, i) => i + 1
                ).map((hole) => (
                  <th key={hole} className="text-center px-1.5 py-2 tabular-nums text-muted-foreground font-medium">
                    {hole}
                  </th>
                ))}
                <th className="text-center px-2 py-2 font-bold text-foreground">Tot</th>
              </tr>
            </thead>
            <tbody>
              {config.players.map((player) => {
                let strokeTotal = 0;
                return (
                  <tr key={player.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium truncate max-w-[80px] text-foreground">
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
                              ? "text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded"
                              : "text-muted-foreground/30"
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
                    <td className="text-center px-2 py-2 font-bold tabular-nums text-foreground">
                      {strokeTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Share / Save Results */}
        <ShareResultsCard
          rankings={rankings}
          numberOfHoles={config.numberOfHoles}
        />
      </div>

      {/* Bottom actions */}
      {isHistoryMode ? (
        <div className="sticky bottom-0 p-4 pb-safe bg-background/90 backdrop-blur-xl border-t border-border">
          <button
            className="w-full h-14 rounded-xl text-lg font-bold bg-muted border border-border text-foreground hover:bg-muted/80 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            onClick={() => {
              resetGame();
              router.push("/history");
            }}
          >
            <ArrowLeft className="h-5 w-5" />
            Back to History
          </button>
        </div>
      ) : (
        <div className="sticky bottom-0 p-4 pb-safe bg-background/90 backdrop-blur-xl border-t border-border flex gap-3">
          <button
            className="h-14 w-14 rounded-xl text-lg font-semibold bg-muted border border-border text-muted-foreground hover:bg-muted/80 active:scale-[0.97] transition-all flex items-center justify-center"
            onClick={handleGoHome}
            aria-label="Home"
          >
            <Home className="h-5 w-5" />
          </button>
          <button
            className="flex-1 h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            onClick={() => handlePlayAgain(latestGame)}
          >
            <RefreshCcw className="h-5 w-5" />
            Play Again
          </button>
          <button
            className="flex-1 h-14 rounded-xl text-lg font-semibold bg-muted border border-border text-muted-foreground hover:bg-muted/80 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            onClick={handleNewGame}
          >
            <RotateCcw className="h-5 w-5" />
            New Game
          </button>
        </div>
      )}

      {/* Edit modal overlay */}
      {editingCell && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setEditingCell(null)}
        >
          <div
            className="w-full max-w-md bg-card border-t border-border rounded-t-2xl p-5 pb-safe animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  Edit Strokes
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {editingCell.playerName} &middot; Hole {editingCell.hole}
                </p>
              </div>
              <button
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
