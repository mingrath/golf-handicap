"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, Settings2, Zap, Rocket } from "lucide-react";
import { GameHeader } from "@/components/shared/game-header";
import { NumberStepper } from "@/components/shared/number-stepper";
import { useGameStore } from "@/lib/game-store";
import { Player } from "@/lib/types";
import { generatePairs, getPlayerName } from "@/lib/pairs";

export default function SetupClient() {
  const router = useRouter();
  const {
    config,
    setPlayers,
    setNumberOfHoles,
    initializeHandicaps,
    setHandicap,
    setHandicapHoles,
    toggleTurboHole,
  } = useGameStore();

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
  const [showHandicaps, setShowHandicaps] = useState(false);
  const [showTurbo, setShowTurbo] = useState(false);

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

  /** Commit local players/holes to the store so pair-based sections work */
  const commitToStore = () => {
    const finalPlayers = players.map((p, i) => ({
      ...p,
      name: p.name.trim() || `Player ${i + 1}`,
    }));
    setPlayers(finalPlayers);
    setNumberOfHoles(numberOfHoles);
    return finalPlayers;
  };

  const handleStartGame = () => {
    commitToStore();
    initializeHandicaps();
    router.push("/play");
  };

  const handleToggleHandicaps = () => {
    if (!showHandicaps) {
      // Expanding: commit players/holes to store, initialize handicaps if needed
      commitToStore();
      if (!Object.keys(config?.handicaps ?? {}).length) {
        initializeHandicaps();
      }
    }
    setShowHandicaps(!showHandicaps);
  };

  const handleToggleTurbo = () => {
    if (!showTurbo) {
      // Expanding: commit players/holes to store
      commitToStore();
    }
    setShowTurbo(!showTurbo);
  };

  // Derive handicap/turbo summaries from store
  const configuredHandicaps = Object.values(config?.handicaps ?? {}).filter(
    (h) => Math.abs(h.value) > 0
  ).length;
  const turboCount = config?.turboHoles?.length ?? 0;

  // Generate pairs from store (for expanded sections)
  const pairs = config?.players?.length ? generatePairs(config.players) : [];

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <GameHeader title="Game Setup" backHref="/" />

      <div className="flex-1 px-4 pb-28 space-y-4 pt-4">
        {/* Number of holes */}
        <div className="glass-card p-5">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
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
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
                <span className="text-sm text-muted-foreground w-6 shrink-0 font-mono">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updateName(player.id, e.target.value)}
                  placeholder={`Player ${index + 1}`}
                  className="flex-1 h-12 px-4 rounded-xl bg-muted border border-border text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
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

        {/* Collapsible Handicap Section */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={handleToggleHandicaps}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center">
                <Settings2 className="h-4 w-4 text-sky-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">Handicaps</h3>
                <p className="text-xs text-muted-foreground">
                  {configuredHandicaps > 0
                    ? `${configuredHandicaps} pair${configuredHandicaps > 1 ? "s" : ""} configured`
                    : "No handicaps \u2014 equal match"}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${showHandicaps ? "rotate-180" : ""}`}
            />
          </button>

          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: showHandicaps ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  Who gives strokes to whom?
                </p>

                {pairs.map((pair) => {
                  const handicap = config?.handicaps[pair.pairKey];
                  const value = handicap?.value ?? 0;
                  const handicapHoles = handicap?.handicapHoles ?? [];
                  const playerAName = getPlayerName(
                    config!.players,
                    pair.playerAId
                  );
                  const playerBName = getPlayerName(
                    config!.players,
                    pair.playerBId
                  );

                  const isIncomplete =
                    Math.abs(value) > 0 &&
                    handicapHoles.length < Math.abs(value);

                  return (
                    <div
                      key={pair.pairKey}
                      className={`rounded-xl bg-muted/40 p-3 ${isIncomplete ? "ring-1 ring-rose-500/50" : ""}`}
                    >
                      {value === 0 ? (
                        <div className="text-center mb-2">
                          <h4 className="font-semibold text-xs text-foreground mb-0.5">
                            {playerAName} vs {playerBName}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            No handicap
                          </p>
                        </div>
                      ) : (
                        <div
                          className={`rounded-lg px-2.5 py-2 mb-2 ${value > 0 ? "bg-sky-500/10 border border-sky-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}
                        >
                          <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                            <div className="text-center">
                              <span
                                className={
                                  value > 0 ? "text-sky-400" : "text-foreground"
                                }
                              >
                                {value > 0 ? playerAName : playerBName}
                              </span>
                              <span className="text-[9px] text-muted-foreground block leading-tight">
                                (better)
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              gives {Math.abs(value)} stroke
                              {Math.abs(value) > 1 ? "s" : ""} to
                            </span>
                            <span
                              className={
                                value > 0 ? "text-foreground" : "text-amber-400"
                              }
                            >
                              {value > 0 ? playerBName : playerAName}
                            </span>
                          </div>
                        </div>
                      )}

                      <NumberStepper
                        value={value}
                        onChange={(v) => setHandicap(pair.pairKey, v)}
                        min={-(config?.numberOfHoles ?? 18)}
                        max={config?.numberOfHoles ?? 18}
                        size="sm"
                      />

                      {Math.abs(value) > 0 && (
                        <div className="mt-2">
                          <p className="text-[10px] text-muted-foreground mb-1.5">
                            Handicap holes (tap to toggle):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(
                              { length: config?.numberOfHoles ?? 18 },
                              (_, i) => i + 1
                            ).map((hole) => {
                              const isSelected = handicapHoles.includes(hole);
                              const maxSelectable = Math.abs(value);
                              const atMax =
                                handicapHoles.length >= maxSelectable &&
                                !isSelected;

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
                                  className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all active:scale-90 ${
                                    isSelected
                                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                                      : atMax
                                        ? "bg-muted/30 text-muted-foreground/40"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                                  }`}
                                >
                                  {hole}
                                </button>
                              );
                            })}
                          </div>
                          <p
                            className={`text-[10px] mt-1 ${isIncomplete ? "text-rose-400 font-medium" : "text-muted-foreground"}`}
                          >
                            {handicapHoles.length}/{Math.abs(value)} selected
                            {isIncomplete &&
                              ` \u2014 select ${Math.abs(value) - handicapHoles.length} more`}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Turbo Section */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={handleToggleTurbo}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">
                  Turbo Holes
                </h3>
                <p className="text-xs text-muted-foreground">
                  {turboCount > 0
                    ? `${turboCount} turbo hole${turboCount > 1 ? "s" : ""} selected`
                    : "No turbo holes"}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${showTurbo ? "rotate-180" : ""}`}
            />
          </button>

          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: showTurbo ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Turbo holes score{" "}
                  <span className="text-amber-400 font-bold">x2</span>. Tap to
                  toggle.
                </p>

                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: numberOfHoles }, (_, i) => i + 1).map(
                    (hole) => {
                      const isTurbo =
                        config?.turboHoles?.includes(hole) ?? false;
                      return (
                        <button
                          key={hole}
                          onClick={() => toggleTurboHole(hole)}
                          className={`h-11 rounded-xl text-xs font-bold transition-all active:scale-90 ${
                            isTurbo
                              ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                              : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                          }`}
                        >
                          {hole}
                        </button>
                      );
                    }
                  )}
                </div>

                {turboCount > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <p className="text-xs text-amber-400/80">
                      {turboCount} turbo hole{turboCount !== 1 ? "s" : ""}{" "}
                      selected
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background/90 backdrop-blur-xl border-t border-border">
        <button
          className={`w-full h-14 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${
            canContinue
              ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97]"
              : "bg-muted/50 text-muted-foreground cursor-not-allowed"
          }`}
          onClick={handleStartGame}
          disabled={!canContinue}
        >
          <Rocket className="h-5 w-5" />
          Start Game
        </button>
      </div>
    </div>
  );
}
