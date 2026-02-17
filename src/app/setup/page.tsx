"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { GameHeader } from "@/components/shared/game-header";
import { StepIndicator } from "@/components/shared/step-indicator";
import { NumberStepper } from "@/components/shared/number-stepper";
import { useGameStore } from "@/lib/game-store";
import { Player } from "@/lib/types";

const STEPS = ["Setup", "Handicap", "Turbo", "Play"];

export default function SetupPage() {
  const router = useRouter();
  const { config, setPlayers, setNumberOfHoles } = useGameStore();

  const [players, setLocalPlayers] = useState<Player[]>(() =>
    config?.players?.length
      ? config.players
      : [
          { id: crypto.randomUUID(), name: "" },
          { id: crypto.randomUUID(), name: "" },
        ]
  );
  const [numberOfHoles, setLocalHoles] = useState(
    () => config?.numberOfHoles ?? 18
  );

  const addPlayer = () => {
    if (players.length < 6) {
      setLocalPlayers([...players, { id: crypto.randomUUID(), name: "" }]);
    }
  };

  const removePlayer = (id: string) => {
    if (players.length > 2) {
      setLocalPlayers(players.filter((p) => p.id !== id));
    }
  };

  const updateName = (id: string, name: string) => {
    setLocalPlayers(players.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const canContinue =
    players.length >= 2 &&
    players.every((p) => p.name.trim().length > 0) &&
    numberOfHoles > 0;

  const handleNext = () => {
    const finalPlayers = players.map((p, i) => ({
      ...p,
      name: p.name.trim() || `Player ${i + 1}`,
    }));
    setPlayers(finalPlayers);
    setNumberOfHoles(numberOfHoles);
    router.push("/handicap");
  };

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      <GameHeader title="Game Setup" backHref="/" />
      <StepIndicator steps={STEPS} currentStep={0} />

      <div className="flex-1 px-4 pb-28 space-y-4 pt-4">
        {/* Number of holes */}
        <div className="glass-card p-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Number of Holes
          </h2>
          <NumberStepper
            value={numberOfHoles}
            onChange={setLocalHoles}
            min={1}
            max={36}
            size="md"
          />
        </div>

        {/* Players */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Players ({players.length})
            </h2>
            {players.length < 6 && (
              <button
                onClick={addPlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            )}
          </div>

          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-2">
                <span className="text-sm text-slate-500 w-6 shrink-0 font-mono">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updateName(player.id, e.target.value)}
                  placeholder={`Player ${index + 1}`}
                  className="flex-1 h-12 px-4 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white text-base placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  style={{ fontSize: "16px" }}
                />
                {players.length > 2 && (
                  <button
                    className="h-10 w-10 flex items-center justify-center rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                    onClick={() => removePlayer(player.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50">
        <button
          className={`w-full h-14 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${
            canContinue
              ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97]"
              : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
          }`}
          onClick={handleNext}
          disabled={!canContinue}
        >
          Next: Set Handicaps
          {canContinue && <ArrowRight className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
