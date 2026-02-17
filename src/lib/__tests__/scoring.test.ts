import { describe, it, expect } from "vitest";
import {
  getHandicapAdjustment,
  calculatePairHoleResult,
  calculatePlayerHoleScores,
  verifyZeroSum,
  getRunningTotals,
  getFinalRankings,
} from "@/lib/scoring";
import type {
  PairHandicap,
  HoleStrokes,
  PairHoleResult,
  PlayerHoleScore,
  Player,
} from "@/lib/types";
import { generatePairs, makePairKey } from "@/lib/pairs";

// ── Helpers ──────────────────────────────────────────────────────────
function makeHandicap(
  value: number,
  handicapHoles: number[] = []
): PairHandicap {
  return {
    pairKey: "a::b",
    playerAId: "a",
    playerBId: "b",
    value,
    handicapHoles,
  };
}

function makeStrokes(
  holeNumber: number,
  strokes: Record<string, number>
): HoleStrokes {
  return { holeNumber, strokes };
}

// ── getHandicapAdjustment ────────────────────────────────────────────
describe("getHandicapAdjustment", () => {
  it("returns no adjustment when hole is not a handicap hole", () => {
    const h = makeHandicap(3, [1, 5, 10]);
    const adj = getHandicapAdjustment(h, 2);
    expect(adj).toEqual({ playerAAdj: 0, playerBAdj: 0 });
  });

  it("gives playerB -1 when handicap is positive and hole is a handicap hole", () => {
    const h = makeHandicap(3, [1, 5, 10]);
    const adj = getHandicapAdjustment(h, 5);
    expect(adj).toEqual({ playerAAdj: 0, playerBAdj: -1 });
  });

  it("gives playerA -1 when handicap is negative and hole is a handicap hole", () => {
    const h = makeHandicap(-2, [1, 5]);
    const adj = getHandicapAdjustment(h, 1);
    expect(adj).toEqual({ playerAAdj: -1, playerBAdj: 0 });
  });

  it("returns no adjustment when handicap value is 0 even if hole is listed", () => {
    const h = makeHandicap(0, [1, 2, 3]);
    const adj = getHandicapAdjustment(h, 2);
    expect(adj).toEqual({ playerAAdj: 0, playerBAdj: 0 });
  });
});

// ── calculatePairHoleResult ──────────────────────────────────────────
describe("calculatePairHoleResult", () => {
  it("awards +1 to lower scorer, -1 to higher scorer (no handicap)", () => {
    const h = makeHandicap(0);
    const s = makeStrokes(1, { a: 3, b: 5 });
    const result = calculatePairHoleResult("a::b", "a", "b", 1, s, h, false);
    expect(result.playerAScore).toBe(1);
    expect(result.playerBScore).toBe(-1);
  });

  it("returns 0/0 on a tie", () => {
    const h = makeHandicap(0);
    const s = makeStrokes(1, { a: 4, b: 4 });
    const result = calculatePairHoleResult("a::b", "a", "b", 1, s, h, false);
    expect(result.playerAScore).toBe(0);
    expect(result.playerBScore).toBe(0);
  });

  it("doubles scores on turbo hole (+2/-2)", () => {
    const h = makeHandicap(0);
    const s = makeStrokes(1, { a: 3, b: 5 });
    const result = calculatePairHoleResult("a::b", "a", "b", 1, s, h, true);
    expect(result.playerAScore).toBe(2);
    expect(result.playerBScore).toBe(-2);
    expect(result.isTurbo).toBe(true);
  });

  it("turbo tie is still 0/0", () => {
    const h = makeHandicap(0);
    const s = makeStrokes(1, { a: 4, b: 4 });
    const result = calculatePairHoleResult("a::b", "a", "b", 1, s, h, true);
    expect(result.playerAScore).toBe(0);
    expect(result.playerBScore).toBe(0);
  });

  it("handicap adjustment can flip the result to a tie", () => {
    // A scores 4, B scores 5, but B gets -1 adjustment -> 4 vs 4 -> tie
    const h = makeHandicap(3, [1]);
    const s = makeStrokes(1, { a: 4, b: 5 });
    const result = calculatePairHoleResult("a::b", "a", "b", 1, s, h, false);
    expect(result.playerAScore).toBe(0);
    expect(result.playerBScore).toBe(0);
    expect(result.playerBAdjusted).toBe(4);
  });

  it("defaults to 0 strokes when player ID is missing from strokes", () => {
    const h = makeHandicap(0);
    const s = makeStrokes(1, { a: 4 }); // b missing
    const result = calculatePairHoleResult("a::b", "a", "b", 1, s, h, false);
    expect(result.playerBStrokes).toBe(0);
    // A scored 4, B scored 0 -> B wins
    expect(result.playerAScore).toBe(-1);
    expect(result.playerBScore).toBe(1);
  });

  it("both players score 0 strokes results in a tie", () => {
    const h = makeHandicap(0);
    const s = makeStrokes(1, { a: 0, b: 0 });
    const result = calculatePairHoleResult("a::b", "a", "b", 1, s, h, false);
    expect(result.playerAScore).toBe(0);
    expect(result.playerBScore).toBe(0);
  });
});

// ── calculatePlayerHoleScores ────────────────────────────────────────
describe("calculatePlayerHoleScores", () => {
  const twoPlayers: Player[] = [
    { id: "a", name: "Alice" },
    { id: "b", name: "Bob" },
  ];

  it("two players: scores match pair result directly", () => {
    const pairResults: PairHoleResult[] = [
      {
        pairKey: "a::b",
        holeNumber: 1,
        playerAId: "a",
        playerBId: "b",
        playerAStrokes: 3,
        playerBStrokes: 5,
        playerAAdjusted: 3,
        playerBAdjusted: 5,
        playerAScore: 1,
        playerBScore: -1,
        isTurbo: false,
      },
    ];
    const scores = calculatePlayerHoleScores(twoPlayers, pairResults, 1, {});
    expect(scores.find((s) => s.playerId === "a")!.holeScore).toBe(1);
    expect(scores.find((s) => s.playerId === "b")!.holeScore).toBe(-1);
  });

  it("three players: each player's score is sum of their two pair results", () => {
    const players: Player[] = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
    ];
    // A beats B (+1), A beats C (+1), B ties C (0)
    const pairResults: PairHoleResult[] = [
      {
        pairKey: "a::b",
        holeNumber: 1,
        playerAId: "a",
        playerBId: "b",
        playerAStrokes: 3,
        playerBStrokes: 5,
        playerAAdjusted: 3,
        playerBAdjusted: 5,
        playerAScore: 1,
        playerBScore: -1,
        isTurbo: false,
      },
      {
        pairKey: "a::c",
        holeNumber: 1,
        playerAId: "a",
        playerBId: "c",
        playerAStrokes: 3,
        playerBStrokes: 4,
        playerAAdjusted: 3,
        playerBAdjusted: 4,
        playerAScore: 1,
        playerBScore: -1,
        isTurbo: false,
      },
      {
        pairKey: "b::c",
        holeNumber: 1,
        playerAId: "b",
        playerBId: "c",
        playerAStrokes: 4,
        playerBStrokes: 4,
        playerAAdjusted: 4,
        playerBAdjusted: 4,
        playerAScore: 0,
        playerBScore: 0,
        isTurbo: false,
      },
    ];
    const scores = calculatePlayerHoleScores(players, pairResults, 1, {});
    expect(scores.find((s) => s.playerId === "a")!.holeScore).toBe(2); // +1+1
    expect(scores.find((s) => s.playerId === "b")!.holeScore).toBe(-1); // -1+0
    expect(scores.find((s) => s.playerId === "c")!.holeScore).toBe(-1); // -1+0
  });

  it("four players: sum of all player scores is 0 (zero-sum)", () => {
    const players: Player[] = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
      { id: "d", name: "D" },
    ];
    // All 6 pairs: A<B, A<C, A<D, B<C, B<D, C<D
    // A beats everyone, B beats C&D, C beats D
    const pairResults: PairHoleResult[] = [
      {
        pairKey: "a::b",
        holeNumber: 1,
        playerAId: "a",
        playerBId: "b",
        playerAStrokes: 3,
        playerBStrokes: 4,
        playerAAdjusted: 3,
        playerBAdjusted: 4,
        playerAScore: 1,
        playerBScore: -1,
        isTurbo: false,
      },
      {
        pairKey: "a::c",
        holeNumber: 1,
        playerAId: "a",
        playerBId: "c",
        playerAStrokes: 3,
        playerBStrokes: 5,
        playerAAdjusted: 3,
        playerBAdjusted: 5,
        playerAScore: 1,
        playerBScore: -1,
        isTurbo: false,
      },
      {
        pairKey: "a::d",
        holeNumber: 1,
        playerAId: "a",
        playerBId: "d",
        playerAStrokes: 3,
        playerBStrokes: 6,
        playerAAdjusted: 3,
        playerBAdjusted: 6,
        playerAScore: 1,
        playerBScore: -1,
        isTurbo: false,
      },
      {
        pairKey: "b::c",
        holeNumber: 1,
        playerAId: "b",
        playerBId: "c",
        playerAStrokes: 4,
        playerBStrokes: 5,
        playerAAdjusted: 4,
        playerBAdjusted: 5,
        playerAScore: 1,
        playerBScore: -1,
        isTurbo: false,
      },
      {
        pairKey: "b::d",
        holeNumber: 1,
        playerAId: "b",
        playerBId: "d",
        playerAStrokes: 4,
        playerBStrokes: 6,
        playerAAdjusted: 4,
        playerBAdjusted: 6,
        playerAScore: 1,
        playerBScore: -1,
        isTurbo: false,
      },
      {
        pairKey: "c::d",
        holeNumber: 1,
        playerAId: "c",
        playerBId: "d",
        playerAStrokes: 5,
        playerBStrokes: 6,
        playerAAdjusted: 5,
        playerBAdjusted: 6,
        playerAScore: 1,
        playerBScore: -1,
        isTurbo: false,
      },
    ];
    const scores = calculatePlayerHoleScores(players, pairResults, 1, {});
    const total = scores.reduce((sum, s) => sum + s.holeScore, 0);
    expect(total).toBe(0);
    // A: +3, B: +1, C: -1, D: -3
    expect(scores.find((s) => s.playerId === "a")!.holeScore).toBe(3);
    expect(scores.find((s) => s.playerId === "d")!.holeScore).toBe(-3);
  });

  it("running total accumulates from previousTotals correctly", () => {
    const pairResults: PairHoleResult[] = [
      {
        pairKey: "a::b",
        holeNumber: 2,
        playerAId: "a",
        playerBId: "b",
        playerAStrokes: 3,
        playerBStrokes: 5,
        playerAAdjusted: 3,
        playerBAdjusted: 5,
        playerAScore: 1,
        playerBScore: -1,
        isTurbo: false,
      },
    ];
    const previousTotals = { a: 5, b: -5 };
    const scores = calculatePlayerHoleScores(
      twoPlayers,
      pairResults,
      2,
      previousTotals
    );
    expect(scores.find((s) => s.playerId === "a")!.runningTotal).toBe(6);
    expect(scores.find((s) => s.playerId === "b")!.runningTotal).toBe(-6);
  });

  it("6 players: zero-sum holds with all C(6,2) = 15 pairs", () => {
    const players: Player[] = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
    }));
    const pairs = generatePairs(players);
    expect(pairs.length).toBe(15);

    // Each player scores (index + 3) strokes -- distinct values so no ties
    const strokes: HoleStrokes = {
      holeNumber: 1,
      strokes: Object.fromEntries(players.map((p, i) => [p.id, i + 3])),
    };
    const hcap = (pk: string, aId: string, bId: string): PairHandicap => ({
      pairKey: pk,
      playerAId: aId,
      playerBId: bId,
      value: 0,
      handicapHoles: [],
    });
    const pairResults = pairs.map((pair) =>
      calculatePairHoleResult(
        pair.pairKey,
        pair.playerAId,
        pair.playerBId,
        1,
        strokes,
        hcap(pair.pairKey, pair.playerAId, pair.playerBId),
        false
      )
    );
    const scores = calculatePlayerHoleScores(players, pairResults, 1, {});
    const total = scores.reduce((sum, s) => sum + s.holeScore, 0);
    expect(total).toBe(0);
  });
});

// ── verifyZeroSum ────────────────────────────────────────────────────
describe("verifyZeroSum", () => {
  it("returns true when scores sum to zero", () => {
    const scores: PlayerHoleScore[] = [
      { playerId: "a", holeNumber: 1, holeScore: 2, runningTotal: 2 },
      { playerId: "b", holeNumber: 1, holeScore: -2, runningTotal: -2 },
    ];
    expect(verifyZeroSum(scores)).toBe(true);
  });

  it("returns false when scores don't sum to zero", () => {
    const scores: PlayerHoleScore[] = [
      { playerId: "a", holeNumber: 1, holeScore: 2, runningTotal: 2 },
      { playerId: "b", holeNumber: 1, holeScore: -1, runningTotal: -1 },
    ];
    expect(verifyZeroSum(scores)).toBe(false);
  });

  it("returns true for empty array", () => {
    expect(verifyZeroSum([])).toBe(true);
  });

  it("returns true for single player with score 0", () => {
    const scores: PlayerHoleScore[] = [
      { playerId: "a", holeNumber: 1, holeScore: 0, runningTotal: 0 },
    ];
    expect(verifyZeroSum(scores)).toBe(true);
  });

  it("handles large positive and negative scores that cancel out", () => {
    const scores: PlayerHoleScore[] = [
      { playerId: "a", holeNumber: 1, holeScore: 100, runningTotal: 100 },
      { playerId: "b", holeNumber: 1, holeScore: -50, runningTotal: -50 },
      { playerId: "c", holeNumber: 1, holeScore: -50, runningTotal: -50 },
    ];
    expect(verifyZeroSum(scores)).toBe(true);
  });
});

// ── getRunningTotals ─────────────────────────────────────────────────
describe("getRunningTotals", () => {
  const sampleScores: PlayerHoleScore[] = [
    { playerId: "a", holeNumber: 1, holeScore: 1, runningTotal: 1 },
    { playerId: "b", holeNumber: 1, holeScore: -1, runningTotal: -1 },
    { playerId: "a", holeNumber: 2, holeScore: -1, runningTotal: 0 },
    { playerId: "b", holeNumber: 2, holeScore: 1, runningTotal: 0 },
    { playerId: "a", holeNumber: 3, holeScore: 2, runningTotal: 2 },
    { playerId: "b", holeNumber: 3, holeScore: -2, runningTotal: -2 },
  ];

  it("returns totals up to specified hole", () => {
    const totals = getRunningTotals(sampleScores, 2);
    expect(totals).toEqual({ a: 0, b: 0 });
  });

  it("excludes holes after the cutoff", () => {
    const totals = getRunningTotals(sampleScores, 1);
    expect(totals).toEqual({ a: 1, b: -1 });
    // hole 2 and 3 excluded
  });

  it("returns empty object for no scores", () => {
    const totals = getRunningTotals([], 5);
    expect(totals).toEqual({});
  });

  it("accumulates multiple holes correctly", () => {
    const totals = getRunningTotals(sampleScores, 3);
    expect(totals).toEqual({ a: 2, b: -2 });
  });

  it("upToHole = 0 returns empty", () => {
    const totals = getRunningTotals(sampleScores, 0);
    expect(totals).toEqual({});
  });
});

// ── getFinalRankings ─────────────────────────────────────────────────
describe("getFinalRankings", () => {
  it("ranks players by total score (highest first)", () => {
    const players: Player[] = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
    ];
    const scores: PlayerHoleScore[] = [
      { playerId: "a", holeNumber: 1, holeScore: 1, runningTotal: 1 },
      { playerId: "b", holeNumber: 1, holeScore: 3, runningTotal: 3 },
      { playerId: "c", holeNumber: 1, holeScore: -4, runningTotal: -4 },
    ];
    const ranked = getFinalRankings(players, scores);
    expect(ranked[0].player.id).toBe("b");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].player.id).toBe("a");
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].player.id).toBe("c");
    expect(ranked[2].rank).toBe(3);
  });

  it("handles ties with same rank number (two tied at rank 1, next is rank 3)", () => {
    const players: Player[] = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
    ];
    const scores: PlayerHoleScore[] = [
      { playerId: "a", holeNumber: 1, holeScore: 5, runningTotal: 5 },
      { playerId: "b", holeNumber: 1, holeScore: 5, runningTotal: 5 },
      { playerId: "c", holeNumber: 1, holeScore: -10, runningTotal: -10 },
    ];
    const ranked = getFinalRankings(players, scores);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(1);
    expect(ranked[2].rank).toBe(3);
  });

  it("all tied players get rank 1", () => {
    const players: Player[] = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
    ];
    const scores: PlayerHoleScore[] = [
      { playerId: "a", holeNumber: 1, holeScore: 0, runningTotal: 0 },
      { playerId: "b", holeNumber: 1, holeScore: 0, runningTotal: 0 },
      { playerId: "c", holeNumber: 1, holeScore: 0, runningTotal: 0 },
    ];
    const ranked = getFinalRankings(players, scores);
    expect(ranked.every((r) => r.rank === 1)).toBe(true);
  });

  it("single player gets rank 1", () => {
    const players: Player[] = [{ id: "a", name: "A" }];
    const scores: PlayerHoleScore[] = [
      { playerId: "a", holeNumber: 1, holeScore: 3, runningTotal: 3 },
    ];
    const ranked = getFinalRankings(players, scores);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].totalScore).toBe(3);
  });

  it("all negative scores: highest (least negative) wins", () => {
    const players: Player[] = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
    ];
    const scores: PlayerHoleScore[] = [
      { playerId: "a", holeNumber: 1, holeScore: -1, runningTotal: -1 },
      { playerId: "b", holeNumber: 1, holeScore: -5, runningTotal: -5 },
      { playerId: "c", holeNumber: 1, holeScore: -3, runningTotal: -3 },
    ];
    const ranked = getFinalRankings(players, scores);
    expect(ranked[0].player.id).toBe("a");
    expect(ranked[0].totalScore).toBe(-1);
    expect(ranked[2].player.id).toBe("b");
    expect(ranked[2].totalScore).toBe(-5);
  });
});
