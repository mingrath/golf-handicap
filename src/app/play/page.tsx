"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Zap,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { NumberStepper } from "@/components/shared/number-stepper";
import { useGameStore } from "@/lib/game-store";
import { HoleStrokes } from "@/lib/types";
import { getRunningTotals } from "@/lib/scoring";
import { generatePairs, getPlayerName } from "@/lib/pairs";

export default function PlayPage() {
  const router = useRouter();
  const {
    config,
    currentHole,
    holeStrokes,
    pairResults,
    playerScores,
    goToHole,
    submitHoleStrokes,
    completeGame,
  } = useGameStore();

  const [strokes, setStrokes] = useState<Record<string, number>>({});
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showSubmitFlash, setShowSubmitFlash] = useState(false);

  useEffect(() => {
    if (!config?.players?.length) {
      router.replace("/setup");
      return;
    }
  }, [config, router]);

  useEffect(() => {
    if (!config) return;
    const existing = holeStrokes.find((s) => s.holeNumber === currentHole);
    if (existing) {
      setStrokes(existing.strokes);
    } else {
      const initial: Record<string, number> = {};
      config.players.forEach((p) => (initial[p.id] = 4));
      setStrokes(initial);
    }
  }, [currentHole, config, holeStrokes]);

  const handleSubmit = useCallback(() => {
    if (!config) return;
    const holeData: HoleStrokes = {
      holeNumber: currentHole,
      strokes: { ...strokes },
    };
    submitHoleStrokes(holeData);
    setShowSubmitFlash(true);
    setTimeout(() => setShowSubmitFlash(false), 1200);
  }, [config, currentHole, strokes, submitHoleStrokes]);

  const handleFinish = () => {
    if (!config) return;
    const holeData: HoleStrokes = {
      holeNumber: currentHole,
      strokes: { ...strokes },
    };
    submitHoleStrokes(holeData);
    completeGame();
    router.push("/results");
  };

  if (!config?.players?.length) return null;

  const isTurbo = config.turboHoles.includes(currentHole);
  const holeAlreadyScored = holeStrokes.some(
    (s) => s.holeNumber === currentHole
  );
  const isLastHole = currentHole === config.numberOfHoles;
  const allHolesScored = holeStrokes.length === config.numberOfHoles;

  const runningTotals = getRunningTotals(playerScores, currentHole - 1);

  const currentPairResults = pairResults.filter(
    (r) => r.holeNumber === currentHole
  );

  const currentHoleScores = playerScores.filter(
    (s) => s.holeNumber === currentHole
  );

  const totalUpToCurrent = getRunningTotals(playerScores, currentHole);

  const pairs = generatePairs(config.players);

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-bold flex-1 truncate text-white">
          Hole {currentHole}
          <span className="text-slate-500 font-normal text-sm ml-1">
            / {config.numberOfHoles}
          </span>
        </h1>
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            showScoreboard
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-slate-800 text-slate-400 border border-slate-700/50 hover:text-slate-200"
          }`}
          onClick={() => setShowScoreboard(!showScoreboard)}
        >
          {showScoreboard ? "Entry" : "Board"}
        </button>
      </header>

      {/* Hole navigator */}
      <div className="bg-slate-900/50 border-b border-slate-800/50 px-2 py-2.5 flex items-center gap-1">
        <button
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-30"
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
                        : "bg-slate-800/80 text-slate-500 hover:bg-slate-700 border border-slate-700/50"
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
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-30"
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

      {/* Submit feedback flash */}
      {showSubmitFlash && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-center gap-2 animate-fade-up">
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">Scores saved!</span>
        </div>
      )}

      <div className="flex-1 px-4 pb-28 pt-4 space-y-4">
        {showScoreboard ? (
          /* Scoreboard view */
          <div className="glass-card p-4 overflow-x-auto">
            <h2 className="font-bold text-white mb-3">Scoreboard</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-2 pr-3 text-slate-400 font-medium">Player</th>
                  {Array.from(
                    { length: config.numberOfHoles },
                    (_, i) => i + 1
                  ).map((hole) => (
                    <th
                      key={hole}
                      className={`text-center px-1.5 py-2 tabular-nums text-slate-400 font-medium ${
                        hole === currentHole ? "bg-emerald-500/10 text-emerald-400 rounded" : ""
                      }`}
                    >
                      {hole}
                    </th>
                  ))}
                  <th className="text-center px-2 py-2 font-bold text-white">Tot</th>
                </tr>
              </thead>
              <tbody>
                {config.players.map((player) => {
                  const total = totalUpToCurrent[player.id] ?? 0;
                  return (
                    <tr key={player.id} className="border-b border-slate-800/50 last:border-0">
                      <td className="py-2 pr-3 font-medium truncate max-w-[80px] text-slate-200">
                        {player.name}
                      </td>
                      {Array.from(
                        { length: config.numberOfHoles },
                        (_, i) => i + 1
                      ).map((hole) => {
                        const score = playerScores.find(
                          (s) =>
                            s.playerId === player.id && s.holeNumber === hole
                        );
                        return (
                          <td
                            key={hole}
                            className={`text-center px-1.5 py-2 tabular-nums ${
                              hole === currentHole ? "bg-emerald-500/5 rounded" : ""
                            } ${
                              score
                                ? score.holeScore > 0
                                  ? "text-emerald-400 font-bold"
                                  : score.holeScore < 0
                                  ? "text-rose-400 font-bold"
                                  : "text-slate-600"
                                : "text-slate-700"
                            }`}
                          >
                            {score
                              ? score.holeScore > 0
                                ? `+${score.holeScore}`
                                : score.holeScore
                              : "-"}
                          </td>
                        );
                      })}
                      <td
                        className={`text-center px-2 py-2 font-bold tabular-nums ${
                          total > 0
                            ? "text-emerald-400"
                            : total < 0
                            ? "text-rose-400"
                            : "text-slate-400"
                        }`}
                      >
                        {total > 0 ? `+${total}` : total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            {/* Stroke entry */}
            <div className="glass-card p-4">
              <h2 className="font-bold text-white mb-4">Enter Strokes</h2>
              <div className="space-y-4">
                {config.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-sm text-slate-200 truncate max-w-[100px]">
                      {player.name}
                    </span>
                    <NumberStepper
                      value={strokes[player.id] ?? 0}
                      onChange={(v) =>
                        setStrokes((prev) => ({ ...prev, [player.id]: v }))
                      }
                      min={0}
                      max={20}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Pair results for this hole */}
            {holeAlreadyScored && currentPairResults.length > 0 && (
              <div className="glass-card p-4">
                <h2 className="font-bold text-white mb-3">Hole Results</h2>
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
                        className="flex items-center justify-between text-sm bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/30"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold tabular-nums ${
                              result.playerAScore > 0
                                ? "text-emerald-400"
                                : result.playerAScore < 0
                                ? "text-rose-400"
                                : "text-slate-500"
                            }`}
                          >
                            {result.playerAScore > 0
                              ? `+${result.playerAScore}`
                              : result.playerAScore}
                          </span>
                          <span className="text-slate-300">{aName}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {result.playerAAdjusted} vs {result.playerBAdjusted}
                          {result.isTurbo ? " x2" : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300">{bName}</span>
                          <span
                            className={`font-bold tabular-nums ${
                              result.playerBScore > 0
                                ? "text-emerald-400"
                                : result.playerBScore < 0
                                ? "text-rose-400"
                                : "text-slate-500"
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

            {/* Hole Rankings */}
            {holeAlreadyScored && currentHoleScores.length > 0 && (
              <div className="glass-card p-4">
                <h2 className="font-bold text-white mb-3">Hole Rankings</h2>
                <div className="space-y-1.5">
                  {[...currentHoleScores]
                    .sort((a, b) => b.holeScore - a.holeScore)
                    .map((score, idx) => {
                      const name = getPlayerName(
                        config.players,
                        score.playerId
                      );
                      return (
                        <div
                          key={score.playerId}
                          className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${
                            score.holeScore > 0
                              ? "bg-emerald-500/10 border border-emerald-500/15"
                              : score.holeScore < 0
                              ? "bg-rose-500/10 border border-rose-500/15"
                              : "bg-slate-800/30 border border-slate-700/20"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {idx === 0 && score.holeScore > 0 && (
                              <Trophy className="h-4 w-4 text-amber-400" />
                            )}
                            <span className="font-medium text-sm text-slate-200">{name}</span>
                          </div>
                          <span
                            className={`text-lg font-bold tabular-nums ${
                              score.holeScore > 0
                                ? "text-emerald-400"
                                : score.holeScore < 0
                                ? "text-rose-400"
                                : "text-slate-600"
                            }`}
                          >
                            {score.holeScore > 0
                              ? `+${score.holeScore}`
                              : score.holeScore}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Running totals */}
            {holeAlreadyScored && currentHoleScores.length > 0 && (
              <div className="glass-card p-4">
                <h2 className="font-bold text-white mb-3">Running Total</h2>
                <div className="space-y-1.5">
                  {[...currentHoleScores]
                    .sort(
                      (a, b) =>
                        (totalUpToCurrent[b.playerId] ?? 0) -
                        (totalUpToCurrent[a.playerId] ?? 0)
                    )
                    .map((score, idx) => {
                      const name = getPlayerName(
                        config.players,
                        score.playerId
                      );
                      const total = totalUpToCurrent[score.playerId] ?? 0;
                      return (
                        <div
                          key={score.playerId}
                          className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${
                            idx === 0 && total > 0
                              ? "bg-emerald-500/10 border border-emerald-500/15"
                              : total < 0
                              ? "bg-rose-500/5 border border-rose-500/10"
                              : "bg-slate-800/30 border border-slate-700/20"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {idx === 0 && total > 0 && (
                              <Trophy className="h-4 w-4 text-amber-400" />
                            )}
                            <span className="font-medium text-sm text-slate-200">{name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs ${
                                score.holeScore > 0
                                  ? "text-emerald-400"
                                  : score.holeScore < 0
                                  ? "text-rose-400"
                                  : "text-slate-600"
                              }`}
                            >
                              {score.holeScore > 0
                                ? `+${score.holeScore}`
                                : score.holeScore}
                            </span>
                            <span
                              className={`text-lg font-bold tabular-nums ${
                                total > 0
                                  ? "text-emerald-400"
                                  : total < 0
                                  ? "text-rose-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {total > 0 ? `+${total}` : total}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom action bar */}
      {!showScoreboard && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50 flex gap-2">
          {holeAlreadyScored && (
            <button
              className="h-14 w-14 rounded-xl flex items-center justify-center bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95"
              onClick={() => {
                const holeData: HoleStrokes = {
                  holeNumber: currentHole,
                  strokes: { ...strokes },
                };
                submitHoleStrokes(holeData);
              }}
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          )}

          {isLastHole ? (
            <button
              className="flex-1 h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              onClick={handleFinish}
            >
              <Trophy className="h-5 w-5" />
              Finish Game
            </button>
          ) : holeAlreadyScored ? (
            <button
              className="flex-1 h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              onClick={() => goToHole(currentHole + 1)}
            >
              Next Hole
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              className="flex-1 h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              onClick={handleSubmit}
            >
              Submit Scores
            </button>
          )}
        </div>
      )}

      {/* Finish button when on scoreboard and all holes done */}
      {showScoreboard && allHolesScored && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50">
          <button
            className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            onClick={() => {
              completeGame();
              router.push("/results");
            }}
          >
            <Trophy className="h-5 w-5" />
            View Results
          </button>
        </div>
      )}
    </div>
  );
}
