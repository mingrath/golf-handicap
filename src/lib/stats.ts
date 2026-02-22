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

// ── Head-to-Head ────────────────────────────────────────────────────

export interface H2HRecord {
  playerAName: string;
  playerBName: string;
  playerAWins: number;
  playerBWins: number;
  ties: number;
  gamesPlayed: number;
}

/** Canonical pair key for H2H: alphabetically sorted normalized names. */
function h2hPairKey(a: string, b: string): string {
  const na = normalizePlayerName(a);
  const nb = normalizePlayerName(b);
  return na < nb ? `${na}::${nb}` : `${nb}::${na}`;
}

/**
 * Compute lifetime head-to-head records for all player pairs across saved games.
 * A "win" means the player had a higher totalScore in that game's rankings.
 * Sorted by gamesPlayed desc.
 */
export function computeH2HRecords(games: HistoryRecord[]): H2HRecord[] {
  const pairMap = new Map<
    string,
    { aName: string; bName: string; aWins: number; bWins: number; ties: number }
  >();

  for (const game of games) {
    const rankings = game.rankings;
    for (let i = 0; i < rankings.length; i++) {
      for (let j = i + 1; j < rankings.length; j++) {
        const rA = rankings[i];
        const rB = rankings[j];
        const pk = h2hPairKey(rA.playerName, rB.playerName);

        if (!pairMap.has(pk)) {
          // Determine display order: alphabetical by normalized name
          const nA = normalizePlayerName(rA.playerName);
          const nB = normalizePlayerName(rB.playerName);
          pairMap.set(pk, {
            aName: nA < nB ? rA.playerName : rB.playerName,
            bName: nA < nB ? rB.playerName : rA.playerName,
            aWins: 0,
            bWins: 0,
            ties: 0,
          });
        }

        const rec = pairMap.get(pk)!;
        const nA = normalizePlayerName(rA.playerName);
        const isRaPlayerA = normalizePlayerName(rec.aName) === nA;

        if (rA.totalScore > rB.totalScore) {
          if (isRaPlayerA) rec.aWins++;
          else rec.bWins++;
        } else if (rB.totalScore > rA.totalScore) {
          if (isRaPlayerA) rec.bWins++;
          else rec.aWins++;
        } else {
          rec.ties++;
        }
      }
    }
  }

  return Array.from(pairMap.values())
    .map((r) => ({
      playerAName: r.aName,
      playerBName: r.bName,
      playerAWins: r.aWins,
      playerBWins: r.bWins,
      ties: r.ties,
      gamesPlayed: r.aWins + r.bWins + r.ties,
    }))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);
}

/**
 * Look up a specific pair's H2H record.
 * Returns the record oriented so playerAName matches the first name provided.
 */
export function getH2HForPair(
  records: H2HRecord[],
  nameA: string,
  nameB: string
): H2HRecord | null {
  const nA = normalizePlayerName(nameA);
  const nB = normalizePlayerName(nameB);

  for (const r of records) {
    const rNA = normalizePlayerName(r.playerAName);
    const rNB = normalizePlayerName(r.playerBName);
    if ((rNA === nA && rNB === nB) || (rNA === nB && rNB === nA)) {
      // Orient the record so nameA is playerA
      if (rNA === nA) return r;
      return {
        playerAName: r.playerBName,
        playerBName: r.playerAName,
        playerAWins: r.playerBWins,
        playerBWins: r.playerAWins,
        ties: r.ties,
        gamesPlayed: r.gamesPlayed,
      };
    }
  }
  return null;
}
