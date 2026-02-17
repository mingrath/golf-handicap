"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { GameHeader } from "@/components/shared/game-header";
import { StepIndicator } from "@/components/shared/step-indicator";
import { NumberStepper } from "@/components/shared/number-stepper";
import { useGameStore } from "@/lib/game-store";
import { generatePairs, getPlayerName } from "@/lib/pairs";

const STEPS = ["Setup", "Handicap", "Turbo", "Play"];

export default function HandicapPage() {
  const router = useRouter();
  const { config, initializeHandicaps, setHandicap, setHandicapHoles } =
    useGameStore();

  useEffect(() => {
    if (!config?.players?.length) {
      router.replace("/setup");
      return;
    }
    initializeHandicaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!config?.players?.length) return null;

  const pairs = generatePairs(config.players);

  const incompletePairs = pairs.filter((pair) => {
    const handicap = config.handicaps[pair.pairKey];
    const value = handicap?.value ?? 0;
    const selected = handicap?.handicapHoles?.length ?? 0;
    return Math.abs(value) > 0 && selected < Math.abs(value);
  });

  const allComplete = incompletePairs.length === 0;

  const handleNext = () => {
    if (!allComplete) return;
    router.push("/turbo");
  };

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      <GameHeader title="Handicaps" backHref="/setup" />
      <StepIndicator steps={STEPS} currentStep={1} />

      <div className="flex-1 px-4 pb-28 space-y-4 pt-4">
        <p className="text-sm text-slate-400 text-center">
          Who gives strokes to whom?
        </p>

        {pairs.map((pair) => {
          const handicap = config.handicaps[pair.pairKey];
          const value = handicap?.value ?? 0;
          const handicapHoles = handicap?.handicapHoles ?? [];
          const playerAName = getPlayerName(config.players, pair.playerAId);
          const playerBName = getPlayerName(config.players, pair.playerBId);

          const isIncomplete =
            Math.abs(value) > 0 && handicapHoles.length < Math.abs(value);

          return (
            <div key={pair.pairKey} className={`glass-card p-4 ${isIncomplete ? "ring-1 ring-rose-500/50" : ""}`}>
              {value === 0 ? (
                <div className="text-center mb-2">
                  <h3 className="font-semibold text-sm text-white mb-1">
                    {playerAName} vs {playerBName}
                  </h3>
                  <p className="text-xs text-slate-500">No handicap — equal match</p>
                </div>
              ) : (
                <div className={`rounded-xl px-3 py-2.5 mb-2 ${value > 0 ? "bg-sky-500/10 border border-sky-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <div className="text-center">
                      <span className={value > 0 ? "text-sky-400" : "text-white"}>{value > 0 ? playerAName : playerBName}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">(better)</span>
                    </div>
                    <span className="text-xs text-slate-400">gives {Math.abs(value)} stroke{Math.abs(value) > 1 ? "s" : ""} to</span>
                    <span className={value > 0 ? "text-white" : "text-amber-400"}>{value > 0 ? playerBName : playerAName}</span>
                  </div>
                </div>
              )}

              <NumberStepper
                value={value}
                onChange={(v) => setHandicap(pair.pairKey, v)}
                min={-18}
                max={18}
                size="sm"
              />

              {Math.abs(value) > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">
                    Handicap holes (tap to toggle):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(
                      { length: config.numberOfHoles },
                      (_, i) => i + 1
                    ).map((hole) => {
                      const isSelected = handicapHoles.includes(hole);
                      const maxSelectable = Math.abs(value);
                      const atMax =
                        handicapHoles.length >= maxSelectable && !isSelected;

                      return (
                        <button
                          key={hole}
                          onClick={() => {
                            if (isSelected) {
                              setHandicapHoles(
                                pair.pairKey,
                                handicapHoles.filter((h) => h !== hole)
                              );
                            } else if (!atMax) {
                              setHandicapHoles(pair.pairKey, [
                                ...handicapHoles,
                                hole,
                              ]);
                            }
                          }}
                          disabled={atMax}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all active:scale-90 ${
                            isSelected
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                              : atMax
                              ? "bg-slate-800/30 text-slate-700"
                              : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 border border-slate-700/50"
                          }`}
                        >
                          {hole}
                        </button>
                      );
                    })}
                  </div>
                  <p className={`text-xs mt-1.5 ${isIncomplete ? "text-rose-400 font-medium" : "text-slate-500"}`}>
                    {handicapHoles.length}/{Math.abs(value)} selected
                    {isIncomplete && ` — select ${Math.abs(value) - handicapHoles.length} more`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50">
        <button
          className={`w-full h-14 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${
            allComplete
              ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97]"
              : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
          }`}
          onClick={handleNext}
          disabled={!allComplete}
        >
          {allComplete ? (
            <>
              Next: Turbo Holes
              <ArrowRight className="h-5 w-5" />
            </>
          ) : (
            `Select handicap holes (${incompletePairs.length} pair${incompletePairs.length > 1 ? "s" : ""} incomplete)`
          )}
        </button>
      </div>
    </div>
  );
}
