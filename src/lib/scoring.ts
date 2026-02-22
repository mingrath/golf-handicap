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
    playerBScore: -(playerAScore * multiplier) || 0,
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
 * Rebuild running totals for all player scores from scratch.
 * Re-derives runningTotal for each hole based on holeScore sums.
 * Used after editing a non-latest hole to fix stale intermediate values.
 */
export function rebuildRunningTotals(
  playerScores: PlayerHoleScore[]
): PlayerHoleScore[] {
  // Group by player
  const byPlayer: Record<string, PlayerHoleScore[]> = {};
  for (const score of playerScores) {
    if (!byPlayer[score.playerId]) byPlayer[score.playerId] = [];
    byPlayer[score.playerId].push(score);
  }

  const result: PlayerHoleScore[] = [];
  for (const playerId of Object.keys(byPlayer)) {
    // Sort by hole number
    const sorted = byPlayer[playerId].sort(
      (a, b) => a.holeNumber - b.holeNumber
    );
    let total = 0;
    for (const score of sorted) {
      total += score.holeScore;
      result.push({ ...score, runningTotal: total });
    }
  }
  return result;
}

/**
 * Recalculate ALL pair results and player scores from raw strokes.
 * This replays the entire scoring engine from scratch — use after editing
 * any hole's strokes or after changing handicap/turbo settings.
 */
export function recalculateAllResults(
  players: Player[],
  holeStrokes: HoleStrokes[],
  handicaps: Record<string, PairHandicap>,
  turboHoles: number[],
  pairs: { pairKey: PairKey; playerAId: string; playerBId: string }[]
): { pairResults: PairHoleResult[]; playerScores: PlayerHoleScore[] } {
  const allPairResults: PairHoleResult[] = [];
  const allPlayerScores: PlayerHoleScore[] = [];

  // Sort strokes by hole number to process in order
  const sortedStrokes = [...holeStrokes].sort(
    (a, b) => a.holeNumber - b.holeNumber
  );

  for (const strokes of sortedStrokes) {
    const holeNumber = strokes.holeNumber;
    const isTurbo = turboHoles.includes(holeNumber);

    // Calculate pair results for this hole
    const holePairResults: PairHoleResult[] = pairs.map((pair) => {
      const handicap = handicaps[pair.pairKey] ?? {
        pairKey: pair.pairKey,
        playerAId: pair.playerAId,
        playerBId: pair.playerBId,
        value: 0,
        handicapHoles: [],
      };
      return calculatePairHoleResult(
        pair.pairKey,
        pair.playerAId,
        pair.playerBId,
        holeNumber,
        strokes,
        handicap,
        isTurbo
      );
    });

    allPairResults.push(...holePairResults);

    // Get running totals from previously processed holes
    const previousTotals = getRunningTotals(allPlayerScores, holeNumber - 1);

    // Calculate player scores for this hole
    const holePlayerScores = calculatePlayerHoleScores(
      players,
      allPairResults,
      holeNumber,
      previousTotals
    );

    allPlayerScores.push(...holePlayerScores);
  }

  return { pairResults: allPairResults, playerScores: allPlayerScores };
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
