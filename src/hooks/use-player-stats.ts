import { useLiveQuery } from "dexie-react-hooks";
import { historyDb } from "@/lib/history-db";
import { computeAllPlayerStats, type PlayerStats } from "@/lib/stats";

/**
 * Reactive hook that computes per-player stats from all saved games.
 * Returns null while loading (progressive enhancement), empty array if no games.
 */
export function usePlayerStats(): PlayerStats[] | null {
  return useLiveQuery(
    async () => {
      const games = await historyDb.games
        .orderBy("completedAt")
        .reverse()
        .toArray();
      if (games.length === 0) return [];
      return computeAllPlayerStats(games);
    },
    [],
    null
  );
}
