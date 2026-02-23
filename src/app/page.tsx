"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Plus, Download, RotateCcw, History, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLiveQuery } from "dexie-react-hooks";
import { useGameStore } from "@/lib/game-store";
import { historyDb } from "@/lib/history-db";
import { usePlayAgain } from "@/hooks/use-play-again";

export default function HomePage() {
  const router = useRouter();
  const {
    config,
    holeStrokes,
    currentHole,
    isComplete,
    resetGame,
  } = useGameStore();

  const latestGame = useLiveQuery(
    () => historyDb.games.orderBy("completedAt").reverse().first(),
    [],
    null
  );

  const [installReady, setInstallReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const check = () => {
      if ((window as any).__pwaInstallPrompt) setInstallReady(true);
    };
    check();
    window.addEventListener("pwa-install-available", check);
    return () => window.removeEventListener("pwa-install-available", check);
  }, []);

  const handleInstall = async () => {
    const prompt = (window as any).__pwaInstallPrompt;
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      setInstallReady(false);
      (window as any).__pwaInstallPrompt = null;
    }
  };

  const hasActiveGame =
    config !== null && holeStrokes.length > 0 && !isComplete;

  const handleNewGame = () => {
    resetGame();
    router.push("/setup");
  };

  const handleResumeGame = () => {
    router.push("/play");
  };

  const handlePlayAgain = usePlayAgain();

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-teal-500/8 blur-[100px]" />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-cyan-500/5 blur-[80px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="text-center mb-12 relative z-10 animate-fade-up">
        <div className="text-8xl mb-6 drop-shadow-2xl">&#9971;</div>
        <h1 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">
          Golf Handicap
        </h1>
        <p className="text-emerald-400/80 text-sm font-medium tracking-wide uppercase">
          Pairwise scoring with handicaps
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4 relative z-10">
        {hasActiveGame && (
          <div className="glass-card p-5 animate-scale-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Game in progress
              </span>
            </div>
            <div className="text-sm mb-4">
              <span className="font-semibold text-foreground">
                {config!.players.map((p) => p.name).join(", ")}
              </span>
              <br />
              <span className="text-muted-foreground">
                Hole {currentHole} of {config!.numberOfHoles} &middot;{" "}
                {holeStrokes.length} hole{holeStrokes.length !== 1 ? "s" : ""}{" "}
                scored
              </span>
            </div>
            <button
              className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              onClick={handleResumeGame}
            >
              <Play className="h-5 w-5" />
              Resume Game
            </button>
          </div>
        )}

        <button
          className={`w-full h-14 rounded-xl text-lg font-bold active:scale-[0.97] transition-all flex items-center justify-center gap-2 ${
            !hasActiveGame
              ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25"
              : "bg-muted text-foreground border border-border hover:bg-muted/80"
          }`}
          onClick={handleNewGame}
        >
          <Plus className="h-5 w-5" />
          New Game
        </button>

        {latestGame && !hasActiveGame && (
          <button
            className="w-full glass-card p-4 text-left active:scale-[0.97] transition-all group"
            onClick={() => handlePlayAgain(latestGame)}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground">Play Again</div>
                <div className="text-xs text-muted-foreground truncate">
                  {latestGame.players.map((p) => p.name).join(", ")} &middot;{" "}
                  {latestGame.numberOfHoles} holes
                </div>
              </div>
            </div>
          </button>
        )}

        {latestGame && (
          <button
            className="w-full h-12 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
            onClick={() => router.push("/history")}
          >
            <History className="h-4 w-4" />
            View Game History
          </button>
        )}

        {latestGame && (
          <button
            className="w-full h-12 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
            onClick={() => router.push("/stats")}
          >
            <BarChart3 className="h-4 w-4" />
            View Stats
          </button>
        )}

        {installReady && (
          <button
            className="w-full h-12 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
            onClick={handleInstall}
          >
            <Download className="h-4 w-4" />
            Install App for Offline Use
          </button>
        )}
      </div>
    </div>
  );
}
