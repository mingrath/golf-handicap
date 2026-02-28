import { describe, it, expect } from "vitest";
import { remapHandicaps } from "@/hooks/use-play-again";
import type { Player, PairKey, PairHandicap } from "@/lib/types";
import { makePairKey } from "@/lib/pairs";

describe("remapHandicaps", () => {
  it("returns empty object when given empty handicaps", () => {
    const oldPlayers: Player[] = [
      { id: "old-a", name: "Alice" },
      { id: "old-b", name: "Bob" },
    ];
    const newPlayers: Player[] = [
      { id: "new-a", name: "Alice" },
      { id: "new-b", name: "Bob" },
    ];
    const result = remapHandicaps(oldPlayers, newPlayers, {});
    expect(result).toEqual({});
  });

  it("correctly translates old PairKeys to new PairKeys via player name matching", () => {
    const oldPlayers: Player[] = [
      { id: "old-a", name: "Alice" },
      { id: "old-b", name: "Bob" },
    ];
    const newPlayers: Player[] = [
      { id: "new-a", name: "Alice" },
      { id: "new-b", name: "Bob" },
    ];
    const oldKey = makePairKey("old-a", "old-b");
    const handicaps: Record<PairKey, PairHandicap> = {
      [oldKey]: {
        pairKey: oldKey,
        playerAId: "old-a",
        playerBId: "old-b",
        value: 2,
        handicapHoles: [3, 9],
      },
    };

    const result = remapHandicaps(oldPlayers, newPlayers, handicaps);
    const newKey = makePairKey("new-a", "new-b");

    expect(result[newKey]).toBeDefined();
    expect(result[oldKey]).toBeUndefined();
  });

  it("sets playerAId and playerBId from the recomputed sorted key (not raw newA/newB)", () => {
    const oldPlayers: Player[] = [
      { id: "old-a", name: "Alice" },
      { id: "old-b", name: "Bob" },
    ];
    const newPlayers: Player[] = [
      { id: "new-a", name: "Alice" },
      { id: "new-b", name: "Bob" },
    ];
    const oldKey = makePairKey("old-a", "old-b");
    const handicaps: Record<PairKey, PairHandicap> = {
      [oldKey]: {
        pairKey: oldKey,
        playerAId: "old-a",
        playerBId: "old-b",
        value: 2,
        handicapHoles: [3, 9],
      },
    };

    const result = remapHandicaps(oldPlayers, newPlayers, handicaps);
    const newKey = makePairKey("new-a", "new-b");
    const [sortedA, sortedB] = newKey.split("::");

    expect(result[newKey].playerAId).toBe(sortedA);
    expect(result[newKey].playerBId).toBe(sortedB);
    expect(result[newKey].pairKey).toBe(newKey);
  });

  it("preserves handicapHoles values on each remapped pair", () => {
    const oldPlayers: Player[] = [
      { id: "old-a", name: "Alice" },
      { id: "old-b", name: "Bob" },
    ];
    const newPlayers: Player[] = [
      { id: "new-a", name: "Alice" },
      { id: "new-b", name: "Bob" },
    ];
    const oldKey = makePairKey("old-a", "old-b");
    const handicaps: Record<PairKey, PairHandicap> = {
      [oldKey]: {
        pairKey: oldKey,
        playerAId: "old-a",
        playerBId: "old-b",
        value: 2,
        handicapHoles: [3, 9],
      },
    };

    const result = remapHandicaps(oldPlayers, newPlayers, handicaps);
    const newKey = makePairKey("new-a", "new-b");

    expect(result[newKey].value).toBe(2);
    expect(result[newKey].handicapHoles).toEqual([3, 9]);
  });

  it("silently skips pairs where a player name has no match in new players", () => {
    const oldPlayers: Player[] = [
      { id: "old-a", name: "Alice" },
      { id: "old-b", name: "Bob" },
    ];
    // newPlayers has Alice but not Bob
    const newPlayers: Player[] = [
      { id: "new-a", name: "Alice" },
      { id: "new-c", name: "Charlie" },
    ];
    const oldKey = makePairKey("old-a", "old-b");
    const handicaps: Record<PairKey, PairHandicap> = {
      [oldKey]: {
        pairKey: oldKey,
        playerAId: "old-a",
        playerBId: "old-b",
        value: 3,
        handicapHoles: [1, 5, 10],
      },
    };

    const result = remapHandicaps(oldPlayers, newPlayers, handicaps);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("negates value when new UUID sort order flips playerA/playerB", () => {
    // Old IDs sort as: old-a < old-b → playerA=old-a, playerB=old-b
    const oldPlayers: Player[] = [
      { id: "old-a", name: "Alice" },
      { id: "old-b", name: "Bob" },
    ];
    // New IDs sort REVERSED: zzz-alice > aaa-bob → playerA=aaa-bob, playerB=zzz-alice
    const newPlayers: Player[] = [
      { id: "zzz-alice", name: "Alice" },
      { id: "aaa-bob", name: "Bob" },
    ];
    const oldKey = makePairKey("old-a", "old-b");
    const handicaps: Record<PairKey, PairHandicap> = {
      [oldKey]: {
        pairKey: oldKey,
        playerAId: "old-a",
        playerBId: "old-b",
        value: 3, // Alice gives 3 strokes to Bob
        handicapHoles: [1, 2, 5],
      },
    };

    const result = remapHandicaps(oldPlayers, newPlayers, handicaps);
    const newKey = makePairKey("zzz-alice", "aaa-bob");
    // New sorted order: aaa-bob (playerA) :: zzz-alice (playerB)
    // Alice was playerA, now she's playerB → value must negate
    // -3 means playerB (Alice) gives 3 strokes to playerA (Bob) → same real-world direction
    expect(result[newKey].value).toBe(-3);
    expect(result[newKey].playerAId).toBe("aaa-bob");
    expect(result[newKey].playerBId).toBe("zzz-alice");
    expect(result[newKey].handicapHoles).toEqual([1, 2, 5]);
  });

  it("preserves value sign when new UUID sort order stays the same", () => {
    const oldPlayers: Player[] = [
      { id: "old-a", name: "Alice" },
      { id: "old-b", name: "Bob" },
    ];
    // New IDs sort same way: aaa-alice < bbb-bob
    const newPlayers: Player[] = [
      { id: "aaa-alice", name: "Alice" },
      { id: "bbb-bob", name: "Bob" },
    ];
    const oldKey = makePairKey("old-a", "old-b");
    const handicaps: Record<PairKey, PairHandicap> = {
      [oldKey]: {
        pairKey: oldKey,
        playerAId: "old-a",
        playerBId: "old-b",
        value: 2,
        handicapHoles: [3, 9],
      },
    };

    const result = remapHandicaps(oldPlayers, newPlayers, handicaps);
    const newKey = makePairKey("aaa-alice", "bbb-bob");
    expect(result[newKey].value).toBe(2);
  });

  it("correctly remaps all three pairs for three players", () => {
    const oldPlayers: Player[] = [
      { id: "old-a", name: "Alice" },
      { id: "old-b", name: "Bob" },
      { id: "old-c", name: "Charlie" },
    ];
    const newPlayers: Player[] = [
      { id: "new-a", name: "Alice" },
      { id: "new-b", name: "Bob" },
      { id: "new-c", name: "Charlie" },
    ];

    const oldKeyAB = makePairKey("old-a", "old-b");
    const oldKeyAC = makePairKey("old-a", "old-c");
    const oldKeyBC = makePairKey("old-b", "old-c");

    const handicaps: Record<PairKey, PairHandicap> = {
      [oldKeyAB]: {
        pairKey: oldKeyAB,
        playerAId: "old-a",
        playerBId: "old-b",
        value: 1,
        handicapHoles: [5],
      },
      [oldKeyAC]: {
        pairKey: oldKeyAC,
        playerAId: "old-a",
        playerBId: "old-c",
        value: 2,
        handicapHoles: [3, 9],
      },
      [oldKeyBC]: {
        pairKey: oldKeyBC,
        playerAId: "old-b",
        playerBId: "old-c",
        value: -1,
        handicapHoles: [7],
      },
    };

    const result = remapHandicaps(oldPlayers, newPlayers, handicaps);

    const newKeyAB = makePairKey("new-a", "new-b");
    const newKeyAC = makePairKey("new-a", "new-c");
    const newKeyBC = makePairKey("new-b", "new-c");

    expect(Object.keys(result)).toHaveLength(3);
    expect(result[newKeyAB]).toBeDefined();
    expect(result[newKeyAC]).toBeDefined();
    expect(result[newKeyBC]).toBeDefined();

    expect(result[newKeyAB].value).toBe(1);
    expect(result[newKeyAC].value).toBe(2);
    expect(result[newKeyBC].value).toBe(-1);
  });
});
