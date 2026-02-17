"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowLeft } from "lucide-react";
import { GameHeader } from "@/components/shared/game-header";
import { useGameStore } from "@/lib/game-store";

export default function TurboPage() {
  const router = useRouter();
  const { config, toggleTurboHole } = useGameStore();

  useEffect(() => {
    if (!config?.players?.length) {
      router.replace("/setup");
    }
  }, [config, router]);

  if (!config?.players?.length) return null;

  const turboHoles = config.turboHoles;

  const handleDone = () => {
    router.push("/setup");
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <GameHeader title="Turbo Holes" backHref="/setup" />

      <div className="flex-1 px-4 pb-28 space-y-4 pt-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="font-bold text-foreground">Select Turbo Holes</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5 ml-10">
            Turbo holes score <span className="text-amber-400 font-bold">x2</span>. Tap to toggle.
          </p>

          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: config.numberOfHoles }, (_, i) => i + 1).map(
              (hole) => {
                const isTurbo = turboHoles.includes(hole);
                return (
                  <button
                    key={hole}
                    onClick={() => toggleTurboHole(hole)}
                    className={`h-12 rounded-xl text-sm font-bold transition-all active:scale-90 ${
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

          {turboHoles.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-sm text-amber-400/80">
                {turboHoles.length} turbo hole{turboHoles.length !== 1 ? "s" : ""}{" "}
                selected
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background/90 backdrop-blur-xl border-t border-border">
        <button
          className="w-full h-14 rounded-xl text-lg font-bold bg-muted border border-border text-muted-foreground active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          onClick={handleDone}
        >
          <ArrowLeft className="h-5 w-5" />
          Done — Back to Setup
        </button>
      </div>
    </div>
  );
}
