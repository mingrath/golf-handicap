"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Zap,
  Trophy,
} from "lucide-react";
import { StrokeInput } from "@/components/shared/stroke-input";
import { MiniLeaderboard } from "@/components/shared/mini-leaderboard";
import { UndoBanner } from "@/components/shared/undo-banner";
import { useGameStore } from "@/lib/game-store";
import { useSwipe } from "@/hooks/use-swipe";
import { HoleStrokes } from "@/lib/types";
import { getPlayerName } from "@/lib/pairs";
import { vibrate } from "@/lib/vibrate";

function getInitialStrokes(
  config: { players: { id: string }[] } | null,
  holeStrokes: HoleStrokes[],
  currentHole: number
): Record<string, number> {
  if (!config) return {};
  const existing = holeStrokes.find((s) => s.holeNumber === currentHole);
  if (existing) return existing.strokes;
  const initial: Record<string, number> = {};
  config.players.forEach((p) => (initial[p.id] = 4));
  return initial;
}

export default function PlayPage() {
  const router = useRouter();
  const {
    config,
    currentHole,
    holeStrokes,
    pairResults,
    playerScores,
    goToHole,
    goToNextHole,
    goToPreviousHole,
    submitHoleStrokes,
    completeGame,
    _undoSnapshot,
    undoLastSubmission,
    clearUndoSnapshot,
  } = useGameStore();

  // Derive initial strokes from store state (replaces setState-in-effect)
  const initialStrokes = useMemo(
    () => getInitialStrokes(config, holeStrokes, currentHole),
    [config, holeStrokes, currentHole]
  );
  const [strokeOverrides, setStrokeOverrides] = useState<Record<string, number>>({});
  const [overrideHole, setOverrideHole] = useState(currentHole);

  // Reset overrides when hole changes
  if (overrideHole !== currentHole) {
    setStrokeOverrides({});
    setOverrideHole(currentHole);
  }

  const strokes = useMemo(
    () => ({ ...initialStrokes, ...strokeOverrides }),
    [initialStrokes, strokeOverrides]
  );
  const setStrokes = useCallback(
    (updater: (prev: Record<string, number>) => Record<string, number>) => {
      setStrokeOverrides((prev) => {
        const merged = { ...initialStrokes, ...prev };
        const next = updater(merged);
        return next;
      });
    },
    [initialStrokes]
  );

  const [showConfirmation, setShowConfirmation] = useState(false);
  const confirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [undoKey, setUndoKey] = useState(0);

  // Swipe navigation: left = next hole, right = previous hole
  const swipeHandlers = useSwipe(
    () => {
      if (config && currentHole < config.numberOfHoles) {
        goToNextHole();
      }
    },
    () => {
      goToPreviousHole();
    }
  );

  useEffect(() => {
    if (!config?.players?.length) {
      router.replace("/setup");
      return;
    }
  }, [config, router]);

  // Clean up confirmation timer on unmount
  useEffect(() => {
    return () => {
      if (confirmationTimerRef.current) {
        clearTimeout(confirmationTimerRef.current);
      }
    };
  }, []);

  const handleSubmitAndAdvance = useCallback(() => {
    if (!config) return;
    const holeData: HoleStrokes = {
      holeNumber: currentHole,
      strokes: { ...strokes },
    };
    submitHoleStrokes(holeData);
    setUndoKey((k) => k + 1);
    vibrate(50);
    setShowConfirmation(true);

    if (confirmationTimerRef.current) {
      clearTimeout(confirmationTimerRef.current);
    }

    confirmationTimerRef.current = setTimeout(() => {
      setShowConfirmation(false);
      goToNextHole();
      confirmationTimerRef.current = null;
    }, 1000);
  }, [config, currentHole, strokes, submitHoleStrokes, goToNextHole]);

  const handleSubmitLastHole = useCallback(() => {
    if (!config) return;
    const holeData: HoleStrokes = {
      holeNumber: currentHole,
      strokes: { ...strokes },
    };
    submitHoleStrokes(holeData);
    setUndoKey((k) => k + 1);
    vibrate(50);
    setShowConfirmation(true);

    if (confirmationTimerRef.current) {
      clearTimeout(confirmationTimerRef.current);
    }

    confirmationTimerRef.current = setTimeout(() => {
      setShowConfirmation(false);
      confirmationTimerRef.current = null;
    }, 1000);
  }, [config, currentHole, strokes, submitHoleStrokes]);

  const handleViewResults = useCallback(() => {
    completeGame();
    router.push("/results");
  }, [completeGame, router]);

  const handleUndo = useCallback(() => {
    undoLastSubmission();
    vibrate(30);
  }, [undoLastSubmission]);

  if (!config?.players?.length) return null;

  const isTurbo = config.turboHoles.includes(currentHole);
  const holeAlreadyScored = holeStrokes.some(
    (s) => s.holeNumber === currentHole
  );
  const isLastHole = currentHole === config.numberOfHoles;

  const currentPairResults = pairResults.filter(
    (r) => r.holeNumber === currentHole
  );

  return (
    <div
      className="min-h-dvh bg-background flex flex-col"
      {...swipeHandlers}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-bold flex-1 truncate text-foreground">
          Hole {currentHole}
          <span className="text-muted-foreground font-normal text-sm ml-1">
            / {config.numberOfHoles}
          </span>
        </h1>
      </header>

      {/* Hole navigator */}
      <div className="bg-card/50 border-b border-border px-2 py-2.5 flex items-center gap-1">
        <button
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
          onClick={() => goToHole(Math.max(1, currentHole - 1))}
          disabled={currentHole <= 1}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 px-1 w-max">
            {Array.from({ length: config.numberOfHoles }, (_, i) => i + 1).map(
              (hole) => {
                const scored = holeStrokes.some((s) => s.holeNumber === hole);
                const isCurrent = hole === currentHole;
                const holeTurbo = config.turboHoles.includes(hole);
                return (
                  <button
                    key={hole}
                    onClick={() => goToHole(hole)}
                    className={`w-9 h-9 rounded-full text-xs font-bold shrink-0 transition-all active:scale-90 ${
                      isCurrent
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110"
                        : scored
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                    } ${holeTurbo && !isCurrent ? "ring-2 ring-amber-400/40" : ""}`}
                  >
                    {hole}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <button
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
          onClick={() =>
            goToHole(Math.min(config.numberOfHoles, currentHole + 1))
          }
          disabled={currentHole >= config.numberOfHoles}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Turbo badge */}
      {isTurbo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-center gap-2">
          <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
          <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">
            Turbo Hole x2
          </span>
          <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
        </div>
      )}

      {/* Confirmation flash overlay */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-in fade-in zoom-in duration-200 bg-emerald-500/20 backdrop-blur-sm rounded-3xl px-8 py-6 flex flex-col items-center gap-2">
            <Check className="h-10 w-10 text-emerald-400" />
            <span className="text-lg font-bold text-emerald-400">
              Hole {currentHole} saved
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 px-4 pb-28 pt-4 space-y-4">
        {/* Stroke entry */}
        <div className="glass-card p-4">
          <h2 className="font-bold text-foreground mb-4">Enter Strokes</h2>
          <div className="space-y-4">
            {config.players.map((player) => (
              <StrokeInput
                key={player.id}
                playerName={player.name}
                value={strokes[player.id] ?? 4}
                onChange={(v) =>
                  setStrokes((prev) => ({ ...prev, [player.id]: v }))
                }
              />
            ))}
          </div>
        </div>

        {/* Mini Leaderboard - always visible */}
        <MiniLeaderboard
          players={config.players}
          playerScores={playerScores}
          currentHole={holeAlreadyScored ? currentHole : currentHole - 1}
        />

        {/* Pair results for this hole */}
        {holeAlreadyScored && currentPairResults.length > 0 && (
          <div className="glass-card p-4">
            <h2 className="font-bold text-foreground mb-3">Hole Results</h2>
            <div className="space-y-2">
              {currentPairResults.map((result) => {
                const aName = getPlayerName(
                  config.players,
                  result.playerAId
                );
                const bName = getPlayerName(
                  config.players,
                  result.playerBId
                );
                return (
                  <div
                    key={result.pairKey}
                    className="flex items-center justify-between text-sm bg-muted/50 rounded-xl px-3 py-2.5 border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold tabular-nums ${
                          result.playerAScore > 0
                            ? "text-emerald-400"
                            : result.playerAScore < 0
                            ? "text-rose-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {result.playerAScore > 0
                          ? `+${result.playerAScore}`
                          : result.playerAScore}
                      </span>
                      <span className="text-muted-foreground">{aName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {result.playerAAdjusted} vs {result.playerBAdjusted}
                      {result.isTurbo ? " x2" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{bName}</span>
                      <span
                        className={`font-bold tabular-nums ${
                          result.playerBScore > 0
                            ? "text-emerald-400"
                            : result.playerBScore < 0
                            ? "text-rose-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {result.playerBScore > 0
                          ? `+${result.playerBScore}`
                          : result.playerBScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar - always visible */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background/90 backdrop-blur-xl border-t border-border">
        {isLastHole && holeAlreadyScored ? (
          /* Last hole already scored: View Results */
          <button
            className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            onClick={handleViewResults}
          >
            <Trophy className="h-5 w-5" />
            View Results
          </button>
        ) : isLastHole ? (
          /* Last hole not yet scored: Submit & Finish */
          <button
            className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            onClick={handleSubmitLastHole}
          >
            <Trophy className="h-5 w-5" />
            Submit &amp; Finish
          </button>
        ) : (
          /* Non-last hole: Submit (or Update) + auto-advance */
          <button
            className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            onClick={handleSubmitAndAdvance}
          >
            {holeAlreadyScored ? "Update Scores" : "Submit Scores"}
          </button>
        )}
      </div>

      {/* Undo banner - appears after score submission for 10 seconds */}
      {_undoSnapshot && (
        <UndoBanner
          key={undoKey}
          onUndo={handleUndo}
          onExpire={clearUndoSnapshot}
          durationMs={10000}
        />
      )}
    </div>
  );
}
