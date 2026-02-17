import type { HistoryRecord } from "./history-db";

export interface PlayerStats {
  displayName: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  avgScore: number;
  bestRound: { score: number; date: string } | null;
  worstRound: { score: number; date: string } | null;
  scoreTrend: { date: string; score: number }[];
}

/** Trim and lowercase for case-insensitive matching across games. */
export function normalizePlayerName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Collect unique player names across all games.
 * Uses a Map<normalizedName, displayName> -- first occurrence kept as display name.
 */
export function getUniquePlayerNames(games: HistoryRecord[]): string[] {
  const nameMap = new Map<string, string>();
  for (const game of games) {
    for (const r of game.rankings) {
      const key = normalizePlayerName(r.playerName);
      if (!nameMap.has(key)) {
        nameMap.set(key, r.playerName);
      }
    }
  }
  return Array.from(nameMap.values());
}

/**
 * Compute stats for a given player across all games.
 * Matches games via normalized player name.
 */
export function computePlayerStats(
  playerName: string,
  games: HistoryRecord[]
): PlayerStats {
  const normalized = normalizePlayerName(playerName);

  // Filter games where this player participated
  const playerGames = games.filter((g) =>
    g.rankings.some((r) => normalizePlayerName(r.playerName) === normalized)
  );

  const gamesPlayed = playerGames.length;

  if (gamesPlayed === 0) {
    return {
      displayName: playerName,
      gamesPlayed: 0,
      wins: 0,
      winRate: 0,
      avgScore: 0,
      bestRound: null,
      worstRound: null,
      scoreTrend: [],
    };
  }

  let wins = 0;
  let totalScore = 0;
  let bestRound: { score: number; date: string } | null = null;
  let worstRound: { score: number; date: string } | null = null;
  const scoreTrend: { date: string; score: number }[] = [];

  for (const game of playerGames) {
    const ranking = game.rankings.find(
      (r) => normalizePlayerName(r.playerName) === normalized
    )!;

    // Ties at rank 1 count as wins for all tied players
    if (ranking.rank === 1) {
      wins++;
    }

    totalScore += ranking.totalScore;

    // Track best (highest score) and worst (lowest score)
    if (bestRound === null || ranking.totalScore > bestRound.score) {
      bestRound = { score: ranking.totalScore, date: game.completedAt };
    }
    if (worstRound === null || ranking.totalScore < worstRound.score) {
      worstRound = { score: ranking.totalScore, date: game.completedAt };
    }

    scoreTrend.push({ date: game.completedAt, score: ranking.totalScore });
  }

  // Sort trend chronologically (oldest first)
  scoreTrend.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return {
    displayName: playerName,
    gamesPlayed,
    wins,
    winRate: wins / gamesPlayed,
    avgScore: totalScore / gamesPlayed,
    bestRound,
    worstRound,
    scoreTrend,
  };
}

/**
 * Compute stats for all unique players across all games.
 * Sorted by winRate desc, then gamesPlayed desc.
 */
export function computeAllPlayerStats(games: HistoryRecord[]): PlayerStats[] {
  const names = getUniquePlayerNames(games);
  const allStats = names.map((name) => computePlayerStats(name, games));

  allStats.sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return b.gamesPlayed - a.gamesPlayed;
  });

  return allStats;
}
