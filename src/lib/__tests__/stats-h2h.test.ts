import { describe, it, expect } from "vitest";
import {
  computeH2HRecords,
  getH2HForPair,
  normalizePlayerName,
  type H2HRecord,
} from "@/lib/stats";
import type { HistoryRecord } from "@/lib/history-db";

function makeGame(
  rankings: { playerName: string; totalScore: number; rank: number }[],
  completedAt = "2026-01-01T00:00:00Z"
): HistoryRecord {
  return {
    completedAt,
    players: rankings.map((r, i) => ({ id: String(i), name: r.playerName })),
    numberOfHoles: 9,
    rankings: rankings.map((r, i) => ({
      playerId: String(i),
      playerName: r.playerName,
      totalScore: r.totalScore,
      rank: r.rank,
    })),
    winnerId: "0",
    winnerName: rankings[0]?.playerName ?? "",
    config: {} as HistoryRecord["config"],
    holeStrokes: [],
    pairResults: [],
    playerScores: [],
  };
}

describe("computeH2HRecords", () => {
  it("returns empty for no games", () => {
    expect(computeH2HRecords([])).toEqual([]);
  });

  it("computes basic 2-player H2H", () => {
    const games = [
      makeGame([
        { playerName: "Alice", totalScore: 5, rank: 1 },
        { playerName: "Bob", totalScore: -5, rank: 2 },
      ]),
      makeGame([
        { playerName: "Alice", totalScore: 3, rank: 1 },
        { playerName: "Bob", totalScore: -3, rank: 2 },
      ]),
      makeGame([
        { playerName: "Bob", totalScore: 2, rank: 1 },
        { playerName: "Alice", totalScore: -2, rank: 2 },
      ]),
    ];

    const records = computeH2HRecords(games);
    expect(records).toHaveLength(1);
    expect(records[0].gamesPlayed).toBe(3);

    // Alice vs Bob: Alice won 2, Bob won 1
    const rec = getH2HForPair(records, "Alice", "Bob")!;
    expect(rec.playerAWins).toBe(2); // Alice
    expect(rec.playerBWins).toBe(1); // Bob
    expect(rec.ties).toBe(0);
  });

  it("handles ties correctly", () => {
    const games = [
      makeGame([
        { playerName: "Alice", totalScore: 0, rank: 1 },
        { playerName: "Bob", totalScore: 0, rank: 1 },
      ]),
    ];

    const records = computeH2HRecords(games);
    const rec = getH2HForPair(records, "Alice", "Bob")!;
    expect(rec.ties).toBe(1);
    expect(rec.playerAWins).toBe(0);
    expect(rec.playerBWins).toBe(0);
  });

  it("handles case-insensitive name matching", () => {
    const games = [
      makeGame([
        { playerName: "Alice", totalScore: 5, rank: 1 },
        { playerName: "Bob", totalScore: -5, rank: 2 },
      ]),
      makeGame([
        { playerName: "alice", totalScore: 3, rank: 1 },
        { playerName: "BOB", totalScore: -3, rank: 2 },
      ]),
    ];

    const records = computeH2HRecords(games);
    expect(records).toHaveLength(1);
    expect(records[0].gamesPlayed).toBe(2);
  });

  it("computes multi-player pairs", () => {
    const games = [
      makeGame([
        { playerName: "Alice", totalScore: 5, rank: 1 },
        { playerName: "Bob", totalScore: 0, rank: 2 },
        { playerName: "Carol", totalScore: -5, rank: 3 },
      ]),
    ];

    const records = computeH2HRecords(games);
    // 3 players = 3 pairs: A-B, A-C, B-C
    expect(records).toHaveLength(3);

    const ab = getH2HForPair(records, "Alice", "Bob")!;
    expect(ab.playerAWins).toBe(1);
    expect(ab.playerBWins).toBe(0);

    const ac = getH2HForPair(records, "Alice", "Carol")!;
    expect(ac.playerAWins).toBe(1);
    expect(ac.playerBWins).toBe(0);

    const bc = getH2HForPair(records, "Bob", "Carol")!;
    expect(bc.playerAWins).toBe(1);
    expect(bc.playerBWins).toBe(0);
  });

  it("sorts by gamesPlayed descending", () => {
    const games = [
      makeGame([
        { playerName: "Alice", totalScore: 5, rank: 1 },
        { playerName: "Bob", totalScore: -5, rank: 2 },
      ]),
      makeGame([
        { playerName: "Alice", totalScore: 3, rank: 1 },
        { playerName: "Bob", totalScore: -3, rank: 2 },
      ]),
      makeGame([
        { playerName: "Alice", totalScore: 1, rank: 1 },
        { playerName: "Carol", totalScore: -1, rank: 2 },
      ]),
    ];

    const records = computeH2HRecords(games);
    expect(records[0].gamesPlayed).toBe(2); // Alice vs Bob
    expect(records[1].gamesPlayed).toBe(1); // Alice vs Carol
  });
});

describe("getH2HForPair", () => {
  const records: H2HRecord[] = [
    {
      playerAName: "Alice",
      playerBName: "Bob",
      playerAWins: 3,
      playerBWins: 1,
      ties: 0,
      gamesPlayed: 4,
    },
  ];

  it("returns oriented record for playerA first", () => {
    const rec = getH2HForPair(records, "Alice", "Bob")!;
    expect(rec.playerAName).toBe("Alice");
    expect(rec.playerAWins).toBe(3);
  });

  it("flips orientation when reversed", () => {
    const rec = getH2HForPair(records, "Bob", "Alice")!;
    expect(rec.playerAName).toBe("Bob");
    expect(rec.playerAWins).toBe(1);
    expect(rec.playerBWins).toBe(3);
  });

  it("returns null for unknown pair", () => {
    expect(getH2HForPair(records, "Alice", "Carol")).toBeNull();
  });

  it("matches case-insensitively", () => {
    const rec = getH2HForPair(records, "alice", "bob")!;
    expect(rec).not.toBeNull();
    expect(rec.gamesPlayed).toBe(4);
  });
});
