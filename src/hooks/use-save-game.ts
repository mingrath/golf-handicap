"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/game-store";
import { historyDb, type HistoryRecord } from "@/lib/history-db";
import { getFinalRankings } from "@/lib/scoring";

/**
 * Saves the completed game to IndexedDB when isComplete becomes true.
 * On subsequent edits (score/HC changes on results page), updates the saved record.
 */
export function useSaveGame() {
  const savedIdRef = useRef<number | null>(null);
  const { isComplete, config, holeStrokes, pairResults, playerScores } =
    useGameStore();

  useEffect(() => {
    if (!isComplete || !config) return;

    const rankings = getFinalRankings(config.players, playerScores);
    const record: Omit<HistoryRecord, "id"> = {
      completedAt: savedIdRef.current
        ? undefined as unknown as string // preserve original timestamp on update
        : new Date().toISOString(),
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

    if (savedIdRef.current) {
      // Update existing record (preserving completedAt and id)
      historyDb.games
        .update(savedIdRef.current, {
          ...record,
          completedAt: undefined, // don't overwrite original timestamp
        })
        .catch(console.error);
    } else {
      // First save
      record.completedAt = new Date().toISOString();
      historyDb.games
        .add(record as HistoryRecord)
        .then((id) => {
          savedIdRef.current = id as number;
        })
        .catch(console.error);
    }
  }, [isComplete, config, holeStrokes, pairResults, playerScores]);
}
