import { describe, it, expect } from "vitest";
import { analyzeGame } from "@/lib/storytelling";
import type { Player, PlayerHoleScore, PairHoleResult } from "@/lib/types";

const players: Player[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];

function makePlayerScore(
  playerId: string,
  holeNumber: number,
  holeScore: number,
  runningTotal: number
): PlayerHoleScore {
  return { playerId, holeNumber, holeScore, runningTotal };
}

function makePairResult(
  holeNumber: number,
  aScore: number,
  bScore: number
): PairHoleResult {
  return {
    pairKey: "a::b",
    holeNumber,
    playerAId: "a",
    playerBId: "b",
    playerAStrokes: 4,
    playerBStrokes: 4,
    playerAAdjusted: 4,
    playerBAdjusted: 4,
    playerAScore: aScore,
    playerBScore: bScore,
    isTurbo: false,
  };
}

describe("analyzeGame", () => {
  it("returns empty array for no scores", () => {
    expect(analyzeGame(players, [], [])).toEqual([]);
  });

  it("returns empty array for single player", () => {
    const scores = [makePlayerScore("a", 1, 0, 0)];
    expect(analyzeGame([players[0]], scores, [])).toEqual([]);
  });

  it("detects photo finish when tied", () => {
    const scores = [
      makePlayerScore("a", 1, 1, 1),
      makePlayerScore("b", 1, -1, -1),
      makePlayerScore("a", 2, -1, 0),
      makePlayerScore("b", 2, 1, 0),
    ];
    const results = analyzeGame(players, scores, []);
    const photoFinish = results.find((r) => r.type === "photo_finish");
    expect(photoFinish).toBeDefined();
    expect(photoFinish!.title).toBe("Dead Heat");
  });

  it("detects photo finish with 1-point gap", () => {
    // A finishes at +1, B at 0 — gap of 1
    const threePlayers: Player[] = [
      { id: "a", name: "Alice" },
      { id: "b", name: "Bob" },
      { id: "c", name: "Carol" },
    ];
    const scores = [
      makePlayerScore("a", 1, 1, 1),
      makePlayerScore("b", 1, 0, 0),
      makePlayerScore("c", 1, -1, -1),
      makePlayerScore("a", 2, 0, 1),
      makePlayerScore("b", 2, 0, 0),
      makePlayerScore("c", 2, 0, -1),
    ];
    const results = analyzeGame(threePlayers, scores, []);
    const photoFinish = results.find((r) => r.type === "photo_finish");
    expect(photoFinish).toBeDefined();
    expect(photoFinish!.title).toBe("Photo Finish");
  });

  it("detects winning streak of 3+", () => {
    const scores = [
      makePlayerScore("a", 1, 1, 1),
      makePlayerScore("b", 1, -1, -1),
      makePlayerScore("a", 2, 1, 2),
      makePlayerScore("b", 2, -1, -2),
      makePlayerScore("a", 3, 1, 3),
      makePlayerScore("b", 3, -1, -3),
      makePlayerScore("a", 4, -1, 2),
      makePlayerScore("b", 4, 1, -2),
    ];
    const results = analyzeGame(players, scores, []);
    const streak = results.find((r) => r.type === "streak");
    expect(streak).toBeDefined();
    expect(streak!.description).toContain("3 holes in a row");
  });

  it("detects comeback", () => {
    const scores = [
      makePlayerScore("a", 1, -1, -1),
      makePlayerScore("b", 1, 1, 1),
      makePlayerScore("a", 2, -1, -2),
      makePlayerScore("b", 2, 1, 2),
      makePlayerScore("a", 3, 2, 0),
      makePlayerScore("b", 3, -2, 0),
      makePlayerScore("a", 4, 2, 2),
      makePlayerScore("b", 4, -2, -2),
    ];
    const results = analyzeGame(players, scores, []);
    const comeback = results.find((r) => r.type === "comeback");
    expect(comeback).toBeDefined();
    expect(comeback!.description).toContain("Alice");
  });

  it("detects rivalry with lead changes", () => {
    // A leads, then B leads by 2 (direct swap), then A leads again
    const pairResults = [
      makePairResult(1, 2, -2),  // A leads +2
      makePairResult(2, -2, 2),  // tied
      makePairResult(3, -2, 2),  // B leads +2
      makePairResult(4, 2, -2),  // tied
      makePairResult(5, 2, -2),  // A leads +2
      makePairResult(6, -2, 2),  // tied
      makePairResult(7, -2, 2),  // B leads +2
    ];
    const scores = [
      makePlayerScore("a", 1, 2, 2),
      makePlayerScore("b", 1, -2, -2),
      makePlayerScore("a", 2, -2, 0),
      makePlayerScore("b", 2, 2, 0),
      makePlayerScore("a", 3, -2, -2),
      makePlayerScore("b", 3, 2, 2),
      makePlayerScore("a", 4, 2, 0),
      makePlayerScore("b", 4, -2, 0),
      makePlayerScore("a", 5, 2, 2),
      makePlayerScore("b", 5, -2, -2),
      makePlayerScore("a", 6, -2, 0),
      makePlayerScore("b", 6, 2, 0),
      makePlayerScore("a", 7, -2, -2),
      makePlayerScore("b", 7, 2, 2),
    ];
    const results = analyzeGame(players, scores, pairResults);
    const rivalry = results.find((r) => r.type === "rivalry");
    expect(rivalry).toBeDefined();
    expect(rivalry!.description).toContain("lead changes");
  });

  it("handles short games gracefully (2 holes)", () => {
    const scores = [
      makePlayerScore("a", 1, 1, 1),
      makePlayerScore("b", 1, -1, -1),
      makePlayerScore("a", 2, 1, 2),
      makePlayerScore("b", 2, -1, -2),
    ];
    // Short games shouldn't trigger streak (need 3+) or domination
    const results = analyzeGame(players, scores, []);
    const streak = results.find((r) => r.type === "streak");
    expect(streak).toBeUndefined();
  });
});
