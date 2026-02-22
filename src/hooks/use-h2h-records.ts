import { useLiveQuery } from "dexie-react-hooks";
import { historyDb } from "@/lib/history-db";
import { computeH2HRecords, type H2HRecord } from "@/lib/stats";

/**
 * Reactive hook that computes lifetime H2H records from all saved games.
 * Returns null while loading, empty array if no games.
 */
export function useH2HRecords(): H2HRecord[] | null {
  return useLiveQuery(
    async () => {
      const games = await historyDb.games.toArray();
      if (games.length === 0) return [];
      return computeH2HRecords(games);
    },
    [],
    null
  );
}
