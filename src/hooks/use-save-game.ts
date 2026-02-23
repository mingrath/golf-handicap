"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/game-store";
import { historyDb, type HistoryRecord } from "@/lib/history-db";
import { getFinalRankings } from "@/lib/scoring";

/**
 * Saves the completed game to IndexedDB when isComplete becomes true.
 * On subsequent edits (score/HC changes on results page), updates the saved record.
 *
 * History mode: When historyId is set (viewing a past game), edits update the
 * original IndexedDB record and preserve the original completedAt timestamp.
 * Loading a history game does NOT trigger a redundant save.
 */
export function useSaveGame() {
  const savedIdRef = useRef<number | null>(null);
  const skipNextSaveRef = useRef(false);
  const prevHistoryIdRef = useRef<number | null>(null);
  const { isComplete, config, holeStrokes, pairResults, playerScores, historyId } =
    useGameStore();

  useEffect(() => {
    // Detect history game load (historyId changed from null to a number)
    if (historyId !== prevHistoryIdRef.current) {
      prevHistoryIdRef.current = historyId;
      if (historyId !== null) {
        // History game just loaded -- skip this save trigger
        skipNextSaveRef.current = true;
        return;
      }
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    if (!isComplete || !config) return;

    const rankings = getFinalRankings(config.players, playerScores);
    const record: Omit<HistoryRecord, "id"> = {
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

    if (historyId !== null) {
      // History mode: update existing record, preserve completedAt
      historyDb.games
        .update(historyId, {
          ...record,
          completedAt: undefined, // preserve original timestamp
        })
        .catch(console.error);
    } else if (savedIdRef.current) {
      // Normal mode: update existing record from this session
      historyDb.games
        .update(savedIdRef.current, {
          ...record,
          completedAt: undefined, // preserve original timestamp
        })
        .catch(console.error);
    } else {
      // Normal mode: first save
      record.completedAt = new Date().toISOString();
      historyDb.games
        .add(record as HistoryRecord)
        .then((id) => {
          savedIdRef.current = id as number;
        })
        .catch(console.error);
    }
  }, [isComplete, config, holeStrokes, pairResults, playerScores, historyId]);
}
