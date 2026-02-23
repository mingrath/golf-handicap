"use client";

import { useRouter } from "next/navigation";
import { makePairKey } from "@/lib/pairs";
import { useGameStore } from "@/lib/game-store";
import type { Player, PairKey, PairHandicap } from "@/lib/types";
import type { HistoryRecord } from "@/lib/history-db";

/**
 * Pure function — no React, no side effects, fully testable.
 *
 * Remaps handicap PairKeys from old player UUIDs to new player UUIDs by
 * matching players on name. Pairs where either player name has no match in
 * newPlayers are silently skipped.
 */
export function remapHandicaps(
  oldPlayers: Player[],
  newPlayers: Player[],
  handicaps: Record<PairKey, PairHandicap>
): Record<PairKey, PairHandicap> {
  // Build old-ID → new-ID map joined on player name
  const oldIdToNewId = new Map<string, string>();
  for (const oldP of oldPlayers) {
    const match = newPlayers.find((np) => np.name === oldP.name);
    if (match) oldIdToNewId.set(oldP.id, match.id);
  }

  const remapped: Record<PairKey, PairHandicap> = {};
  for (const ph of Object.values(handicaps)) {
    const newA = oldIdToNewId.get(ph.playerAId);
    const newB = oldIdToNewId.get(ph.playerBId);
    if (!newA || !newB) continue; // skip unresolvable pairs

    const newKey = makePairKey(newA, newB);
    // playerAId/playerBId must come from the sorted key, NOT from newA/newB directly,
    // because makePairKey sorts alphabetically — the assignment may be swapped.
    const [sortedA, sortedB] = newKey.split("::");
    remapped[newKey] = {
      ...ph,
      pairKey: newKey,
      playerAId: sortedA,
      playerBId: sortedB,
    };
  }
  return remapped;
}

/**
 * React hook — returns a handlePlayAgain function that resets the game store
 * and pre-populates it with the previous game's configuration (fresh UUIDs,
 * remapped handicaps), then navigates to /setup.
 */
export function usePlayAgain() {
  const router = useRouter();
  const {
    resetGame,
    setPlayers,
    setNumberOfHoles,
    setHandicap,
    setHandicapHoles,
    setTurboHoles,
  } = useGameStore();

  return function handlePlayAgain(
    latestGame: HistoryRecord | null | undefined
  ) {
    if (!latestGame) return;

    // Generate fresh UUIDs — NEVER reuse old player IDs
    const newPlayers = latestGame.players.map((p) => ({
      id: crypto.randomUUID(),
      name: p.name,
    }));

    // Remap handicap PairKeys from old UUIDs to new UUIDs
    const remapped = remapHandicaps(
      latestGame.players,
      newPlayers,
      latestGame.config.handicaps
    );

    resetGame();
    setPlayers(newPlayers);
    setNumberOfHoles(latestGame.numberOfHoles);

    // ORDER CRITICAL: setHandicap first (creates entry + resets handicapHoles to [])
    // then setHandicapHoles (patches handicapHoles onto the existing entry)
    for (const ph of Object.values(remapped)) {
      setHandicap(ph.pairKey, ph.value);
      setHandicapHoles(ph.pairKey, ph.handicapHoles);
    }

    setTurboHoles(latestGame.config.turboHoles);
    router.push("/setup");
  };
}
