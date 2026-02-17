"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/game-store";
import { historyDb, type HistoryRecord } from "@/lib/history-db";
import { getFinalRankings } from "@/lib/scoring";

/**
 * Saves the completed game to IndexedDB exactly once when isComplete becomes true.
 * Uses a ref guard to prevent double-save on React strict-mode double-mount or re-renders.
 * Fire-and-forget — failure does not block the results page.
 */
export function useSaveGame() {
  const savedRef = useRef(false);
  const { isComplete, config, holeStrokes, pairResults, playerScores } =
    useGameStore();

  useEffect(() => {
    if (!isComplete || !config || savedRef.current) return;
    savedRef.current = true;

    const rankings = getFinalRankings(config.players, playerScores);
    const record: HistoryRecord = {
      completedAt: new Date().toISOString(),
      players: config.players.map((p) => ({ id: p.id, name: p.name })),
      numberOfHoles: config.numberOfHoles,
      rankings: rankings.map((r) => ({
        playerId: r.player.id,
        playerName: r.player.name,
        totalScore: r.totalScore,
        rank: r.rank,
      })),
      winnerId: rankings[0]?.player.id ?? "",
      winnerName: rankings[0]?.player.name ?? "",
      config,
      holeStrokes,
      pairResults,
      playerScores,
    };

    historyDb.games.add(record).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only depend on isComplete.
    // Do NOT add config/holeStrokes/pairResults/playerScores to deps — they change
    // on score edits, which would re-trigger the save. The useRef guard provides the
    // primary protection, but keeping deps minimal is defense-in-depth.
  }, [isComplete]);
}
