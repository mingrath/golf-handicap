import type { Player, PlayerHoleScore, PairHoleResult } from "./types";

// ── Types ────────────────────────────────────────────────────────────

export interface NarrativeHighlight {
  type: string;
  title: string;
  description: string;
  icon: string;
}

// ── Detectors ────────────────────────────────────────────────────────

/**
 * Detect biggest comeback: player who was furthest behind at any point
 * but finished with the highest (or improved) position.
 */
function detectComeback(
  players: Player[],
  playerScores: PlayerHoleScore[]
): NarrativeHighlight | null {
  if (playerScores.length === 0) return null;

  const holes = [...new Set(playerScores.map((s) => s.holeNumber))].sort(
    (a, b) => a - b
  );
  if (holes.length < 2) return null;

  let bestComeback: { player: Player; deficit: number; finalScore: number } | null = null;

  for (const player of players) {
    const scores = playerScores
      .filter((s) => s.playerId === player.id)
      .sort((a, b) => a.holeNumber - b.holeNumber);

    if (scores.length < 2) continue;

    const worstRunningTotal = Math.min(...scores.map((s) => s.runningTotal));
    const finalScore = scores[scores.length - 1].runningTotal;
    const recovery = finalScore - worstRunningTotal;

    if (
      recovery > 0 &&
      finalScore > 0 &&
      (!bestComeback || recovery > bestComeback.deficit)
    ) {
      bestComeback = { player, deficit: recovery, finalScore };
    }
  }

  if (!bestComeback || bestComeback.deficit < 2) return null;

  return {
    type: "comeback",
    title: "Comeback King",
    description: `${bestComeback.player.name} recovered ${bestComeback.deficit} points to finish at +${bestComeback.finalScore}`,
    icon: "crown",
  };
}

/**
 * Detect domination: player who won the most holes (had positive holeScore).
 */
function detectDomination(
  players: Player[],
  playerScores: PlayerHoleScore[]
): NarrativeHighlight | null {
  if (playerScores.length === 0) return null;

  const holes = [...new Set(playerScores.map((s) => s.holeNumber))];
  if (holes.length < 3) return null;

  let bestPlayer: Player | null = null;
  let bestWins = 0;

  for (const player of players) {
    const wins = playerScores.filter(
      (s) => s.playerId === player.id && s.holeScore > 0
    ).length;
    if (wins > bestWins) {
      bestWins = wins;
      bestPlayer = player;
    }
  }

  if (!bestPlayer || bestWins < Math.ceil(holes.length * 0.6)) return null;

  return {
    type: "domination",
    title: "Dominant Performance",
    description: `${bestPlayer.name} won ${bestWins} of ${holes.length} holes`,
    icon: "flame",
  };
}

/**
 * Detect winning streak: longest consecutive run of positive hole scores.
 */
function detectStreak(
  players: Player[],
  playerScores: PlayerHoleScore[]
): NarrativeHighlight | null {
  if (playerScores.length === 0) return null;

  let bestStreak = 0;
  let bestPlayer: Player | null = null;

  for (const player of players) {
    const scores = playerScores
      .filter((s) => s.playerId === player.id)
      .sort((a, b) => a.holeNumber - b.holeNumber);

    let streak = 0;
    let maxStreak = 0;
    for (const score of scores) {
      if (score.holeScore > 0) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }

    if (maxStreak > bestStreak) {
      bestStreak = maxStreak;
      bestPlayer = player;
    }
  }

  if (!bestPlayer || bestStreak < 3) return null;

  return {
    type: "streak",
    title: "Hot Streak",
    description: `${bestPlayer.name} won ${bestStreak} holes in a row`,
    icon: "zap",
  };
}

/**
 * Detect photo finish: top two players separated by 1 point or less.
 */
function detectPhotoFinish(
  players: Player[],
  playerScores: PlayerHoleScore[]
): NarrativeHighlight | null {
  if (players.length < 2 || playerScores.length === 0) return null;

  const lastHole = Math.max(...playerScores.map((s) => s.holeNumber));
  const finalScores = players
    .map((p) => {
      const score = playerScores.find(
        (s) => s.playerId === p.id && s.holeNumber === lastHole
      );
      return { player: p, total: score?.runningTotal ?? 0 };
    })
    .sort((a, b) => b.total - a.total);

  if (finalScores.length < 2) return null;

  const gap = finalScores[0].total - finalScores[1].total;
  if (gap > 1 || gap < 0) return null;

  if (gap === 0) {
    return {
      type: "photo_finish",
      title: "Dead Heat",
      description: `${finalScores[0].player.name} and ${finalScores[1].player.name} tied at ${finalScores[0].total > 0 ? "+" : ""}${finalScores[0].total}`,
      icon: "equal",
    };
  }

  return {
    type: "photo_finish",
    title: "Photo Finish",
    description: `${finalScores[0].player.name} edged out ${finalScores[1].player.name} by just 1 point`,
    icon: "target",
  };
}

/**
 * Detect rivalry: pair with the most lead changes.
 */
function detectRivalry(
  players: Player[],
  pairResults: PairHoleResult[]
): NarrativeHighlight | null {
  if (pairResults.length === 0) return null;

  const pairKeys = [...new Set(pairResults.map((r) => r.pairKey))];
  let bestPair: { aName: string; bName: string; changes: number } | null = null;

  for (const pk of pairKeys) {
    const results = pairResults
      .filter((r) => r.pairKey === pk)
      .sort((a, b) => a.holeNumber - b.holeNumber);

    if (results.length < 3) continue;

    let aTotal = 0;
    let changes = 0;
    let lastNonZeroLeader = 0; // 0=no leader yet, 1=a, -1=b

    for (const r of results) {
      aTotal += r.playerAScore;
      const leader = aTotal > 0 ? 1 : aTotal < 0 ? -1 : 0;
      if (leader !== 0 && lastNonZeroLeader !== 0 && leader !== lastNonZeroLeader) {
        changes++;
      }
      if (leader !== 0) {
        lastNonZeroLeader = leader;
      }
    }

    const aName =
      players.find((p) => p.id === results[0].playerAId)?.name ?? "Player A";
    const bName =
      players.find((p) => p.id === results[0].playerBId)?.name ?? "Player B";

    if (!bestPair || changes > bestPair.changes) {
      bestPair = { aName, bName, changes };
    }
  }

  if (!bestPair || bestPair.changes < 2) return null;

  return {
    type: "rivalry",
    title: "Fierce Rivalry",
    description: `${bestPair.aName} vs ${bestPair.bName} — ${bestPair.changes} lead changes`,
    icon: "swords",
  };
}

/**
 * Detect collapse: player who had the biggest lead then lost it.
 */
function detectCollapse(
  players: Player[],
  playerScores: PlayerHoleScore[]
): NarrativeHighlight | null {
  if (playerScores.length === 0) return null;

  const holes = [...new Set(playerScores.map((s) => s.holeNumber))].sort(
    (a, b) => a - b
  );
  if (holes.length < 3) return null;

  let worstCollapse: { player: Player; peak: number; final: number } | null =
    null;

  for (const player of players) {
    const scores = playerScores
      .filter((s) => s.playerId === player.id)
      .sort((a, b) => a.holeNumber - b.holeNumber);

    if (scores.length < 3) continue;

    const peakTotal = Math.max(...scores.map((s) => s.runningTotal));
    const finalTotal = scores[scores.length - 1].runningTotal;
    const drop = peakTotal - finalTotal;

    if (
      drop >= 3 &&
      finalTotal <= 0 &&
      (!worstCollapse || drop > worstCollapse.peak - worstCollapse.final)
    ) {
      worstCollapse = { player, peak: peakTotal, final: finalTotal };
    }
  }

  if (!worstCollapse) return null;

  return {
    type: "collapse",
    title: "Meltdown",
    description: `${worstCollapse.player.name} was at +${worstCollapse.peak} then fell to ${worstCollapse.final}`,
    icon: "trending-down",
  };
}

// ── Main Analyzer ────────────────────────────────────────────────────

/**
 * Analyze a completed game and generate narrative highlights.
 * Returns 0-6 highlights depending on what patterns are detected.
 */
export function analyzeGame(
  players: Player[],
  playerScores: PlayerHoleScore[],
  pairResults: PairHoleResult[]
): NarrativeHighlight[] {
  if (players.length < 2 || playerScores.length === 0) return [];

  const detectors = [
    () => detectComeback(players, playerScores),
    () => detectDomination(players, playerScores),
    () => detectStreak(players, playerScores),
    () => detectPhotoFinish(players, playerScores),
    () => detectRivalry(players, pairResults),
    () => detectCollapse(players, playerScores),
  ];

  return detectors
    .map((detect) => detect())
    .filter((h): h is NarrativeHighlight => h !== null);
}
