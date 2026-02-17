import { Player, PairKey } from "./types";

/** Generate a consistent pair key by sorting player IDs */
export function makePairKey(playerAId: string, playerBId: string): PairKey {
  return [playerAId, playerBId].sort().join("::");
}

/** Parse a pair key back into player IDs */
export function parsePairKey(pairKey: PairKey): [string, string] {
  const [a, b] = pairKey.split("::");
  return [a, b];
}

/** Generate all C(n,2) pairs from a list of players */
export function generatePairs(players: Player[]): { pairKey: PairKey; playerAId: string; playerBId: string }[] {
  const pairs: { pairKey: PairKey; playerAId: string; playerBId: string }[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const pairKey = makePairKey(players[i].id, players[j].id);
      const [sortedA, sortedB] = parsePairKey(pairKey);
      pairs.push({
        pairKey,
        playerAId: sortedA,
        playerBId: sortedB,
      });
    }
  }
  return pairs;
}

/** Get player name by ID */
export function getPlayerName(players: Player[], playerId: string): string {
  return players.find((p) => p.id === playerId)?.name ?? playerId;
}

/** Distribute handicap strokes across holes.
 *  For N handicap strokes over H holes, distribute evenly starting from hole 1.
 *  Returns which hole numbers get a stroke.
 */
export function distributeHandicapHoles(
  handicapValue: number,
  numberOfHoles: number
): number[] {
  const absValue = Math.abs(handicapValue);
  if (absValue === 0 || numberOfHoles === 0) return [];

  const holes: number[] = [];
  if (absValue >= numberOfHoles) {
    // Every hole gets at least one stroke
    for (let i = 1; i <= numberOfHoles; i++) holes.push(i);
  } else {
    // Distribute evenly across holes
    const spacing = numberOfHoles / absValue;
    for (let i = 0; i < absValue; i++) {
      holes.push(Math.floor(i * spacing) + 1);
    }
  }
  return holes;
}
