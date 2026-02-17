import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameStore } from "@/lib/game-store";
import type { Player, HoleStrokes } from "@/lib/types";

// Mock sonner so toast calls don't throw
vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { toast } from "sonner";

// ── Helper ───────────────────────────────────────────────────────────
function setupGameWithPlayers(count: number = 2, holes: number = 18) {
  const players: Player[] = Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    name: `Player ${i + 1}`,
  }));
  const store = useGameStore.getState();
  store.setPlayers(players);
  store.setNumberOfHoles(holes);
  store.initializeHandicaps();
  return players;
}

// ── Setup ────────────────────────────────────────────────────────────
beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().resetGame();
  vi.restoreAllMocks();
});

// ── setPlayers ───────────────────────────────────────────────────────
describe("setPlayers", () => {
  it("accepts 2 players (minimum)", () => {
    const players = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ];
    useGameStore.getState().setPlayers(players);
    expect(useGameStore.getState().config?.players).toEqual(players);
  });

  it("accepts 6 players (maximum)", () => {
    const players = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
    }));
    useGameStore.getState().setPlayers(players);
    expect(useGameStore.getState().config?.players.length).toBe(6);
  });

  it("rejects 1 player (below minimum)", () => {
    const players = [{ id: "a", name: "A" }];
    useGameStore.getState().setPlayers(players);
    // config should remain null (reset state)
    expect(useGameStore.getState().config).toBeNull();
  });

  it("rejects 7 players (above maximum)", () => {
    // Set up valid state first to verify it doesn't change
    setupGameWithPlayers(2);
    const configBefore = useGameStore.getState().config;
    const sevenPlayers = Array.from({ length: 7 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
    }));
    useGameStore.getState().setPlayers(sevenPlayers);
    // Config should remain unchanged
    expect(useGameStore.getState().config).toEqual(configBefore);
  });

  it("shows toast.warning when rejecting invalid player count", () => {
    useGameStore.getState().setPlayers([{ id: "a", name: "A" }]);
    expect(toast.warning).toHaveBeenCalledWith(
      "Player count must be between 2 and 6"
    );
  });

  it("rejects empty array", () => {
    useGameStore.getState().setPlayers([]);
    expect(useGameStore.getState().config).toBeNull();
    expect(toast.warning).toHaveBeenCalled();
  });
});

// ── setNumberOfHoles ─────────────────────────────────────────────────
describe("setNumberOfHoles", () => {
  it("accepts 1 hole (minimum)", () => {
    useGameStore.getState().setNumberOfHoles(1);
    expect(useGameStore.getState().config?.numberOfHoles).toBe(1);
  });

  it("accepts 36 holes (maximum)", () => {
    useGameStore.getState().setNumberOfHoles(36);
    expect(useGameStore.getState().config?.numberOfHoles).toBe(36);
  });

  it("rejects 0 holes", () => {
    setupGameWithPlayers(2, 18);
    useGameStore.getState().setNumberOfHoles(0);
    // Should remain 18
    expect(useGameStore.getState().config?.numberOfHoles).toBe(18);
  });

  it("rejects 37 holes", () => {
    setupGameWithPlayers(2, 18);
    useGameStore.getState().setNumberOfHoles(37);
    expect(useGameStore.getState().config?.numberOfHoles).toBe(18);
  });

  it("rejects non-integer (e.g., 9.5)", () => {
    setupGameWithPlayers(2, 18);
    useGameStore.getState().setNumberOfHoles(9.5);
    expect(useGameStore.getState().config?.numberOfHoles).toBe(18);
  });
});

// ── setHandicap ──────────────────────────────────────────────────────
describe("setHandicap", () => {
  it("accepts handicap within hole count range", () => {
    const players = setupGameWithPlayers(2, 18);
    const pairKey = Object.keys(useGameStore.getState().config!.handicaps)[0];
    useGameStore.getState().setHandicap(pairKey, 5);
    expect(
      useGameStore.getState().config!.handicaps[pairKey].value
    ).toBe(5);
  });

  it("rejects handicap exceeding hole count", () => {
    setupGameWithPlayers(2, 9);
    const pairKey = Object.keys(useGameStore.getState().config!.handicaps)[0];
    useGameStore.getState().setHandicap(pairKey, 10);
    // Should remain 0 (initial value)
    expect(
      useGameStore.getState().config!.handicaps[pairKey].value
    ).toBe(0);
  });

  it("shows toast.warning when rejecting", () => {
    setupGameWithPlayers(2, 9);
    const pairKey = Object.keys(useGameStore.getState().config!.handicaps)[0];
    useGameStore.getState().setHandicap(pairKey, 10);
    expect(toast.warning).toHaveBeenCalledWith(
      "Handicap cannot exceed the number of holes"
    );
  });

  it("rejects non-integer handicap value", () => {
    setupGameWithPlayers(2, 18);
    const pairKey = Object.keys(useGameStore.getState().config!.handicaps)[0];
    useGameStore.getState().setHandicap(pairKey, 3.5);
    expect(
      useGameStore.getState().config!.handicaps[pairKey].value
    ).toBe(0);
    expect(toast.warning).toHaveBeenCalledWith(
      "Handicap must be a whole number"
    );
  });

  it("requires config to exist (returns {} without config)", () => {
    // No setup -- config is null
    useGameStore.getState().setHandicap("a::b", 5);
    expect(useGameStore.getState().config).toBeNull();
  });
});

// ── submitHoleStrokes ────────────────────────────────────────────────
describe("submitHoleStrokes", () => {
  it("rejects stroke value below 0", () => {
    const players = setupGameWithPlayers(2, 18);
    const strokes: HoleStrokes = {
      holeNumber: 1,
      strokes: { [players[0].id]: -1, [players[1].id]: 4 },
    };
    useGameStore.getState().submitHoleStrokes(strokes);
    expect(toast.warning).toHaveBeenCalledWith(
      "Stroke values must be whole numbers between 0 and 20"
    );
    expect(useGameStore.getState().holeStrokes.length).toBe(0);
  });

  it("rejects stroke value above 20", () => {
    const players = setupGameWithPlayers(2, 18);
    const strokes: HoleStrokes = {
      holeNumber: 1,
      strokes: { [players[0].id]: 21, [players[1].id]: 4 },
    };
    useGameStore.getState().submitHoleStrokes(strokes);
    expect(toast.warning).toHaveBeenCalled();
    expect(useGameStore.getState().holeStrokes.length).toBe(0);
  });

  it("rejects non-integer stroke value (e.g., 3.5)", () => {
    const players = setupGameWithPlayers(2, 18);
    const strokes: HoleStrokes = {
      holeNumber: 1,
      strokes: { [players[0].id]: 3.5, [players[1].id]: 4 },
    };
    useGameStore.getState().submitHoleStrokes(strokes);
    expect(toast.warning).toHaveBeenCalled();
    expect(useGameStore.getState().holeStrokes.length).toBe(0);
  });

  it("rejects hole number below 1", () => {
    const players = setupGameWithPlayers(2, 18);
    const strokes: HoleStrokes = {
      holeNumber: 0,
      strokes: { [players[0].id]: 4, [players[1].id]: 5 },
    };
    useGameStore.getState().submitHoleStrokes(strokes);
    expect(toast.warning).toHaveBeenCalled();
    expect(useGameStore.getState().holeStrokes.length).toBe(0);
  });

  it("rejects hole number above config.numberOfHoles", () => {
    const players = setupGameWithPlayers(2, 9);
    const strokes: HoleStrokes = {
      holeNumber: 10,
      strokes: { [players[0].id]: 4, [players[1].id]: 5 },
    };
    useGameStore.getState().submitHoleStrokes(strokes);
    expect(toast.warning).toHaveBeenCalled();
    expect(useGameStore.getState().holeStrokes.length).toBe(0);
  });

  it("accepts valid strokes and persists results", () => {
    const players = setupGameWithPlayers(2, 18);
    const strokes: HoleStrokes = {
      holeNumber: 1,
      strokes: { [players[0].id]: 4, [players[1].id]: 5 },
    };
    useGameStore.getState().submitHoleStrokes(strokes);
    expect(useGameStore.getState().holeStrokes.length).toBe(1);
    expect(useGameStore.getState().pairResults.length).toBeGreaterThan(0);
    expect(useGameStore.getState().playerScores.length).toBeGreaterThan(0);
  });

  it("re-scoring an existing hole replaces the old data", () => {
    const players = setupGameWithPlayers(2, 18);
    const strokes1: HoleStrokes = {
      holeNumber: 1,
      strokes: { [players[0].id]: 4, [players[1].id]: 5 },
    };
    useGameStore.getState().submitHoleStrokes(strokes1);
    const firstScore = useGameStore
      .getState()
      .playerScores.find((s) => s.playerId === players[0].id)!.holeScore;

    // Re-score with different values
    const strokes2: HoleStrokes = {
      holeNumber: 1,
      strokes: { [players[0].id]: 6, [players[1].id]: 3 },
    };
    useGameStore.getState().submitHoleStrokes(strokes2);

    // Should still have only 1 hole worth of data
    expect(useGameStore.getState().holeStrokes.length).toBe(1);
    const newScore = useGameStore
      .getState()
      .playerScores.find((s) => s.playerId === players[0].id)!.holeScore;
    expect(newScore).not.toBe(firstScore);
  });
});

// ── resetGame ────────────────────────────────────────────────────────
describe("resetGame", () => {
  it("clears all state back to initialState", () => {
    setupGameWithPlayers(3, 18);
    useGameStore.getState().resetGame();
    const state = useGameStore.getState();
    expect(state.config).toBeNull();
    expect(state.currentHole).toBe(1);
    expect(state.holeStrokes).toEqual([]);
    expect(state.pairResults).toEqual([]);
    expect(state.playerScores).toEqual([]);
    expect(state.isComplete).toBe(false);
  });

  it("config becomes null after reset", () => {
    setupGameWithPlayers(2);
    expect(useGameStore.getState().config).not.toBeNull();
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().config).toBeNull();
  });

  it("holeStrokes becomes empty after reset", () => {
    const players = setupGameWithPlayers(2, 18);
    useGameStore.getState().submitHoleStrokes({
      holeNumber: 1,
      strokes: { [players[0].id]: 4, [players[1].id]: 5 },
    });
    expect(useGameStore.getState().holeStrokes.length).toBe(1);
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().holeStrokes).toEqual([]);
  });
});

// ── hasActiveGame ────────────────────────────────────────────────────
describe("hasActiveGame", () => {
  it("returns false with no config", () => {
    expect(useGameStore.getState().hasActiveGame()).toBe(false);
  });

  it("returns false with config but no strokes", () => {
    setupGameWithPlayers(2, 18);
    expect(useGameStore.getState().hasActiveGame()).toBe(false);
  });

  it("returns true with config and at least one stroke entry", () => {
    const players = setupGameWithPlayers(2, 18);
    useGameStore.getState().submitHoleStrokes({
      holeNumber: 1,
      strokes: { [players[0].id]: 4, [players[1].id]: 5 },
    });
    expect(useGameStore.getState().hasActiveGame()).toBe(true);
  });
});

// ── state versioning ─────────────────────────────────────────────────
describe("state versioning", () => {
  it("store persist config includes version field", () => {
    // Verify the store has version by checking what Zustand puts in localStorage
    // The persist middleware uses the version in its internal config
    // We can verify by checking the store's persist API
    const persistApi = (useGameStore as unknown as { persist: { getOptions: () => { version: number } } }).persist;
    expect(persistApi.getOptions().version).toBe(1);
  });
});
