export interface Player {
  id: string;
  name: string;
}

/** Pair key format: "playerA_id::playerB_id" (sorted alphabetically) */
export type PairKey = string;

export interface PairHandicap {
  pairKey: PairKey;
  playerAId: string;
  playerBId: string;
  /** Positive = playerA gives strokes to playerB, Negative = playerB gives strokes to playerA */
  value: number;
  /** Which holes the handicap strokes are applied on */
  handicapHoles: number[];
}

export interface HoleStrokes {
  holeNumber: number;
  strokes: Record<string, number>; // playerId -> raw strokes
}

export interface PairHoleResult {
  pairKey: PairKey;
  holeNumber: number;
  playerAId: string;
  playerBId: string;
  playerAStrokes: number;
  playerBStrokes: number;
  playerAAdjusted: number;
  playerBAdjusted: number;
  /** +1, -1, or 0 for playerA (inverse for playerB) */
  playerAScore: number;
  playerBScore: number;
  isTurbo: boolean;
}

export interface PlayerHoleScore {
  playerId: string;
  holeNumber: number;
  holeScore: number;
  runningTotal: number;
}

export interface GameConfig {
  players: Player[];
  numberOfHoles: number;
  handicaps: Record<PairKey, PairHandicap>;
  turboHoles: number[];
}

export interface GameState {
  config: GameConfig | null;
  currentHole: number;
  holeStrokes: HoleStrokes[];
  pairResults: PairHoleResult[];
  playerScores: PlayerHoleScore[];
  isComplete: boolean;
  /** ID of the IndexedDB history record when viewing/editing a past game; null for live games */
  historyId: number | null;
}
