import { describe, it, expect } from "vitest";
import {
  makePairKey,
  parsePairKey,
  generatePairs,
  getPlayerName,
  distributeHandicapHoles,
} from "@/lib/pairs";
import type { Player } from "@/lib/types";

// ── makePairKey ──────────────────────────────────────────────────────
describe("makePairKey", () => {
  it("sorts IDs alphabetically and joins with ::", () => {
    expect(makePairKey("b", "a")).toBe("a::b");
    expect(makePairKey("alice", "bob")).toBe("alice::bob");
  });

  it("same result regardless of argument order (commutative)", () => {
    expect(makePairKey("x", "y")).toBe(makePairKey("y", "x"));
  });

  it("works with UUID-format IDs", () => {
    const id1 = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const id2 = "550e8400-e29b-41d4-a716-446655440000";
    const key = makePairKey(id1, id2);
    expect(key).toBe(`${id2}::${id1}`); // 550... < f47...
    expect(key).toContain("::");
  });

  it("handles identical IDs (degenerate)", () => {
    const key = makePairKey("same", "same");
    expect(key).toBe("same::same");
  });
});

// ── parsePairKey ─────────────────────────────────────────────────────
describe("parsePairKey", () => {
  it("splits pair key back into two IDs", () => {
    const [a, b] = parsePairKey("alice::bob");
    expect(a).toBe("alice");
    expect(b).toBe("bob");
  });

  it("round-trips with makePairKey", () => {
    const key = makePairKey("zara", "adam");
    const [a, b] = parsePairKey(key);
    expect(a).toBe("adam");
    expect(b).toBe("zara");
  });
});

// ── generatePairs ────────────────────────────────────────────────────
describe("generatePairs", () => {
  function makePlayers(n: number): Player[] {
    return Array.from({ length: n }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
    }));
  }

  it("2 players -> 1 pair (C(2,2) = 1)", () => {
    expect(generatePairs(makePlayers(2)).length).toBe(1);
  });

  it("3 players -> 3 pairs (C(3,2) = 3)", () => {
    expect(generatePairs(makePlayers(3)).length).toBe(3);
  });

  it("4 players -> 6 pairs (C(4,2) = 6)", () => {
    expect(generatePairs(makePlayers(4)).length).toBe(6);
  });

  it("5 players -> 10 pairs", () => {
    expect(generatePairs(makePlayers(5)).length).toBe(10);
  });

  it("6 players -> 15 pairs (max C(6,2) = 15)", () => {
    expect(generatePairs(makePlayers(6)).length).toBe(15);
  });

  it("each pair has consistent pairKey (alphabetically sorted)", () => {
    const pairs = generatePairs(makePlayers(3));
    for (const pair of pairs) {
      const [a, b] = parsePairKey(pair.pairKey);
      expect(a <= b).toBe(true);
    }
  });

  it("all pairs are unique (no duplicates)", () => {
    const pairs = generatePairs(makePlayers(6));
    const keys = pairs.map((p) => p.pairKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("empty players -> empty result", () => {
    expect(generatePairs([]).length).toBe(0);
  });

  it("single player -> empty result", () => {
    expect(generatePairs(makePlayers(1)).length).toBe(0);
  });
});

// ── getPlayerName ────────────────────────────────────────────────────
describe("getPlayerName", () => {
  const players: Player[] = [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
  ];

  it("returns player name when found", () => {
    expect(getPlayerName(players, "p1")).toBe("Alice");
  });

  it("returns playerId as fallback when not found", () => {
    expect(getPlayerName(players, "unknown-id")).toBe("unknown-id");
  });
});

// ── distributeHandicapHoles ──────────────────────────────────────────
describe("distributeHandicapHoles", () => {
  it("zero handicap returns empty array", () => {
    expect(distributeHandicapHoles(0, 18)).toEqual([]);
  });

  it("handicap of 1 over 18 holes selects 1 hole (hole 1)", () => {
    const holes = distributeHandicapHoles(1, 18);
    expect(holes.length).toBe(1);
    expect(holes[0]).toBe(1);
  });

  it("handicap equal to hole count selects all holes", () => {
    const holes = distributeHandicapHoles(18, 18);
    expect(holes.length).toBe(18);
    expect(holes).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
  });

  it("handicap exceeding hole count selects all holes (capped)", () => {
    const holes = distributeHandicapHoles(25, 18);
    expect(holes.length).toBe(18);
  });

  it("9 handicap over 18 holes distributes evenly", () => {
    const holes = distributeHandicapHoles(9, 18);
    expect(holes.length).toBe(9);
    // Spacing should be 2 (18/9), so holes: 1, 3, 5, 7, 9, 11, 13, 15, 17
    expect(holes).toEqual([1, 3, 5, 7, 9, 11, 13, 15, 17]);
  });

  it("negative handicap treated as absolute value (same distribution)", () => {
    const positive = distributeHandicapHoles(5, 18);
    const negative = distributeHandicapHoles(-5, 18);
    expect(negative).toEqual(positive);
  });

  it("0 holes returns empty array", () => {
    expect(distributeHandicapHoles(5, 0)).toEqual([]);
  });

  it("36 holes, handicap 36 selects all 36 holes", () => {
    const holes = distributeHandicapHoles(36, 36);
    expect(holes.length).toBe(36);
    expect(holes).toEqual(Array.from({ length: 36 }, (_, i) => i + 1));
  });
});
