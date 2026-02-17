import {
  PairHandicap,
  PairHoleResult,
  PlayerHoleScore,
  HoleStrokes,
  Player,
  PairKey,
} from "./types";

/**
 * Get the handicap adjustment for a specific hole in a pair.
 * Returns: { playerAAdj: number, playerBAdj: number }
 * The player who receives strokes gets -1 on their adjusted score.
 */
export function getHandicapAdjustment(
  handicap: PairHandicap,
  holeNumber: number
): { playerAAdj: number; playerBAdj: number } {
  if (!handicap.handicapHoles.includes(holeNumber)) {
    return { playerAAdj: 0, playerBAdj: 0 };
  }

  // Positive value = playerA is better = playerA gives strokes = playerB gets -1
  // Negative value = playerB is better = playerB gives strokes = playerA gets -1
  if (handicap.value > 0) {
    return { playerAAdj: 0, playerBAdj: -1 };
  } else if (handicap.value < 0) {
    return { playerAAdj: -1, playerBAdj: 0 };
  }
  return { playerAAdj: 0, playerBAdj: 0 };
}

/**
 * Calculate the result for one pair on one hole.
 * Returns +1/-1/0 scores (multiplied by 2 if turbo).
 */
export function calculatePairHoleResult(
  pairKey: PairKey,
  playerAId: string,
  playerBId: string,
  holeNumber: number,
  strokes: HoleStrokes,
  handicap: PairHandicap,
  isTurbo: boolean
): PairHoleResult {
  const playerAStrokes = strokes.strokes[playerAId] ?? 0;
  const playerBStrokes = strokes.strokes[playerBId] ?? 0;

  const adj = getHandicapAdjustment(handicap, holeNumber);
  const playerAAdjusted = playerAStrokes + adj.playerAAdj;
  const playerBAdjusted = playerBStrokes + adj.playerBAdj;

  let playerAScore = 0;
  if (playerAAdjusted < playerBAdjusted) {
    playerAScore = 1;
  } else if (playerAAdjusted > playerBAdjusted) {
    playerAScore = -1;
  }

  const multiplier = isTurbo ? 2 : 1;

  return {
    pairKey,
    holeNumber,
    playerAId,
    playerBId,
    playerAStrokes,
    playerBStrokes,
    playerAAdjusted,
    playerBAdjusted,
    playerAScore: playerAScore * multiplier,
    playerBScore: -playerAScore * multiplier,
    isTurbo,
  };
}

/**
 * Calculate each player's score for a hole by summing their pair results.
 * Each player accumulates scores from all pairs they're in.
 */
export function calculatePlayerHoleScores(
  players: Player[],
  pairResults: PairHoleResult[],
  holeNumber: number,
  previousTotals: Record<string, number>
): PlayerHoleScore[] {
  return players.map((player) => {
    // Sum this player's scores across all pairs for this hole
    let holeScore = 0;
    for (const result of pairResults) {
      if (result.holeNumber !== holeNumber) continue;
      if (result.playerAId === player.id) {
        holeScore += result.playerAScore;
      } else if (result.playerBId === player.id) {
        holeScore += result.playerBScore;
      }
    }

    return {
      playerId: player.id,
      holeNumber,
      holeScore,
      runningTotal: (previousTotals[player.id] ?? 0) + holeScore,
    };
  });
}

/**
 * Verify that all player scores for a hole sum to zero (zero-sum check).
 */
export function verifyZeroSum(scores: PlayerHoleScore[]): boolean {
  const total = scores.reduce((sum, s) => sum + s.holeScore, 0);
  return total === 0;
}

/**
 * Get running totals for all players up to a given hole.
 */
export function getRunningTotals(
  playerScores: PlayerHoleScore[],
  upToHole: number
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const score of playerScores) {
    if (score.holeNumber <= upToHole) {
      totals[score.playerId] = (totals[score.playerId] ?? 0) + score.holeScore;
    }
  }
  return totals;
}

/**
 * Get final rankings sorted by total score (highest first).
 */
export function getFinalRankings(
  players: Player[],
  playerScores: PlayerHoleScore[]
): { player: Player; totalScore: number; rank: number }[] {
  const totals = getRunningTotals(playerScores, Infinity);

  const ranked = players
    .map((player) => ({
      player,
      totalScore: totals[player.id] ?? 0,
      rank: 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < ranked.length; i++) {
    if (i > 0 && ranked[i].totalScore < ranked[i - 1].totalScore) {
      currentRank = i + 1;
    }
    ranked[i].rank = currentRank;
  }

  return ranked;
}
