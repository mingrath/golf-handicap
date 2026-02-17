import Dexie, { type EntityTable } from "dexie";
import type {
  GameConfig,
  HoleStrokes,
  PairHoleResult,
  PlayerHoleScore,
} from "./types";

export interface HistoryRecord {
  id?: number; // Auto-incremented primary key
  completedAt: string; // ISO 8601 date string
  players: { id: string; name: string }[];
  numberOfHoles: number;
  rankings: {
    playerId: string;
    playerName: string;
    totalScore: number;
    rank: number;
  }[];
  winnerId: string;
  winnerName: string;
  // Full state snapshot for future detail view / stats phase
  config: GameConfig;
  holeStrokes: HoleStrokes[];
  pairResults: PairHoleResult[];
  playerScores: PlayerHoleScore[];
}

export const historyDb = new Dexie("golf-handicap-history") as Dexie & {
  games: EntityTable<HistoryRecord, "id">;
};

historyDb.version(1).stores({
  games: "++id, completedAt",
});
