"use client";

import { useMemo } from "react";
import {
  Crown,
  Flame,
  Zap,
  Target,
  Equal,
  Swords,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import type { Player, PlayerHoleScore, PairHoleResult } from "@/lib/types";
import { analyzeGame, type NarrativeHighlight } from "@/lib/storytelling";

const ICON_MAP: Record<string, React.ElementType> = {
  crown: Crown,
  flame: Flame,
  zap: Zap,
  target: Target,
  equal: Equal,
  swords: Swords,
  "trending-down": TrendingDown,
};

const COLOR_MAP: Record<string, string> = {
  comeback: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  domination: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  streak: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  photo_finish: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  rivalry: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  collapse: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

interface StoryHighlightsProps {
  players: Player[];
  playerScores: PlayerHoleScore[];
  pairResults: PairHoleResult[];
}

export function StoryHighlights({
  players,
  playerScores,
  pairResults,
}: StoryHighlightsProps) {
  const highlights = useMemo(
    () => analyzeGame(players, playerScores, pairResults),
    [players, playerScores, pairResults]
  );

  if (highlights.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <h2 className="font-bold text-foreground">Round Highlights</h2>
      </div>
      <div className="space-y-2">
        {highlights.map((highlight, i) => {
          const Icon = ICON_MAP[highlight.icon] ?? Sparkles;
          const colors =
            COLOR_MAP[highlight.type] ??
            "text-muted-foreground bg-muted/30 border-border";
          return (
            <div
              key={i}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border ${colors}`}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{highlight.title}</p>
                <p className="text-xs opacity-80">{highlight.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
