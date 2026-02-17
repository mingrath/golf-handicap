# Testing Patterns

**Analysis Date:** 2025-02-17

## Test Framework

**Status:** Not detected

**Current State:**
- No test runner configured (no Jest, Vitest, or other testing framework)
- No test files exist in `src/` directory
- Package.json has no test script (`npm test` is not defined)
- No testing dependencies installed (@testing-library, jest, vitest, etc.)

## Adding Tests (Recommended Approach)

For a frontend-heavy Next.js application like this, when tests are added, consider:

**Suggested Framework: Vitest + React Testing Library**
- Vitest for unit/component tests (fast, ESM-native, Vite-compatible)
- React Testing Library for component testing (user-behavior focused)
- Considerations: Current codebase is small (2503 LOC), pure functions in `src/lib/` are ideal test candidates

**Critical Areas for Testing:**
1. Pure scoring functions in `src/lib/scoring.ts` - zero-sum verification, handicap adjustments, ranking calculations
2. Pair generation and distribution logic in `src/lib/pairs.ts` - ensure all C(n,2) pairs generated correctly
3. Store mutations in `src/lib/game-store.ts` - state transitions, handicap initialization, hole submission
4. Component interactions in `src/components/` - player input, number stepper increments, navigation flow

## Test File Organization (If Implemented)

**Location:** Co-located with source
- Test file pattern: `[module].test.ts` or `[module].test.tsx`
- Example structure: `src/lib/scoring.test.ts` next to `src/lib/scoring.ts`

**Naming Convention:**
- Test files end in `.test.ts` or `.test.tsx`
- Test function names describe the scenario: `test("should calculate +1/-1 for pair winner/loser")`

## Recommended Test Structure (Example Pattern)

```typescript
import { describe, it, expect } from "vitest";
import { calculatePairHoleResult } from "@/lib/scoring";
import { PairHandicap, HoleStrokes } from "@/lib/types";

describe("calculatePairHoleResult", () => {
  it("should assign +1 to playerA when they shoot lower", () => {
    const strokes: HoleStrokes = {
      holeNumber: 1,
      strokes: { "p1": 4, "p2": 5 },
    };
    const handicap: PairHandicap = {
      pairKey: "p1::p2",
      playerAId: "p1",
      playerBId: "p2",
      value: 0,
      handicapHoles: [],
    };

    const result = calculatePairHoleResult(
      "p1::p2",
      "p1",
      "p2",
      1,
      strokes,
      handicap,
      false
    );

    expect(result.playerAScore).toBe(1);
    expect(result.playerBScore).toBe(-1);
  });

  it("should apply handicap adjustment on designated holes", () => {
    const strokes: HoleStrokes = {
      holeNumber: 3,
      strokes: { "p1": 4, "p2": 4 },
    };
    const handicap: PairHandicap = {
      pairKey: "p1::p2",
      playerAId: "p1",
      playerBId: "p2",
      value: 1, // playerA gives 1 stroke (playerB gets -1)
      handicapHoles: [3],
    };

    const result = calculatePairHoleResult(
      "p1::p2",
      "p1",
      "p2",
      3,
      strokes,
      handicap,
      false
    );

    // playerB adjusted: 4 - 1 = 3, playerA adjusted: 4
    expect(result.playerBScore).toBe(1);
    expect(result.playerAScore).toBe(-1);
  });

  it("should double score on turbo holes", () => {
    const strokes: HoleStrokes = {
      holeNumber: 1,
      strokes: { "p1": 3, "p2": 5 },
    };
    const handicap: PairHandicap = {
      pairKey: "p1::p2",
      playerAId: "p1",
      playerBId: "p2",
      value: 0,
      handicapHoles: [],
    };

    const result = calculatePairHoleResult(
      "p1::p2",
      "p1",
      "p2",
      1,
      strokes,
      handicap,
      true // turbo enabled
    );

    expect(result.playerAScore).toBe(2); // 1 * 2
    expect(result.playerBScore).toBe(-2);
    expect(result.isTurbo).toBe(true);
  });
});
```

## Testing Utility/Pure Functions

**Priority:** Test pure functions in `src/lib/` first

**Pattern - Testing `src/lib/scoring.ts`:**
- `getHandicapAdjustment()` - test positive, negative, zero handicaps on and off designated holes
- `calculatePairHoleResult()` - test all win/loss/tie scenarios, turbo multiplier, handicap interactions
- `calculatePlayerHoleScores()` - test aggregation across multiple pairs
- `verifyZeroSum()` - test that all hole scores sum to zero
- `getRunningTotals()` - test cumulative scoring up to N holes
- `getFinalRankings()` - test tie handling, rank assignment

**Pattern - Testing `src/lib/pairs.ts`:**
- `makePairKey()` - test consistency (order invariance)
- `parsePairKey()` - test parsing accuracy
- `generatePairs()` - test count: n=2 → 1 pair, n=3 → 3 pairs, n=4 → 6 pairs, n=6 → 15 pairs
- `distributeHandicapHoles()` - test even distribution across holes

## Testing Zustand Store

**Pattern - Testing `src/lib/game-store.ts`:**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/lib/game-store";

describe("useGameStore", () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
  });

  it("should initialize with empty state", () => {
    const state = useGameStore.getState();
    expect(state.config).toBeNull();
    expect(state.currentHole).toBe(1);
    expect(state.isComplete).toBe(false);
  });

  it("should set players and initialize config", () => {
    const store = useGameStore.getState();
    store.setPlayers([
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
    ]);
    const state = useGameStore.getState();
    expect(state.config?.players).toHaveLength(2);
    expect(state.config?.numberOfHoles).toBe(18);
  });

  it("should toggle turbo holes", () => {
    const store = useGameStore.getState();
    store.toggleTurboHole(5);
    expect(useGameStore.getState().config?.turboHoles).toContain(5);
    store.toggleTurboHole(5);
    expect(useGameStore.getState().config?.turboHoles).not.toContain(5);
  });

  it("should submit hole strokes and calculate pair results", () => {
    // Setup
    const store = useGameStore.getState();
    store.setPlayers([
      { id: "p1", name: "A" },
      { id: "p2", name: "B" },
    ]);
    store.setNumberOfHoles(18);
    store.initializeHandicaps();

    // Submit
    const strokes = {
      holeNumber: 1,
      strokes: { p1: 4, p2: 5 },
    };
    store.submitHoleStrokes(strokes);

    // Verify
    const state = useGameStore.getState();
    expect(state.pairResults).not.toHaveLength(0);
    expect(state.playerScores).not.toHaveLength(0);
  });

  it("should allow re-scoring a hole", () => {
    // Setup and first submission
    const store = useGameStore.getState();
    store.setPlayers([
      { id: "p1", name: "A" },
      { id: "p2", name: "B" },
    ]);
    store.initializeHandicaps();
    store.submitHoleStrokes({
      holeNumber: 1,
      strokes: { p1: 4, p2: 5 },
    });
    const firstResults = useGameStore.getState().pairResults.length;

    // Re-submit same hole
    store.submitHoleStrokes({
      holeNumber: 1,
      strokes: { p1: 3, p2: 5 },
    });
    const secondResults = useGameStore.getState().pairResults.length;

    // Should not duplicate
    expect(firstResults).toBe(secondResults);
  });
});
```

## Testing React Components

**Pattern - Testing interactive components:**

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NumberStepper } from "@/components/shared/number-stepper";

describe("NumberStepper", () => {
  it("should increment on plus button click", () => {
    const onChange = vi.fn();
    render(
      <NumberStepper
        value={5}
        onChange={onChange}
        min={1}
        max={10}
      />
    );

    const plusButton = screen.getByRole("button", { name: /plus/i });
    fireEvent.click(plusButton);

    expect(onChange).toHaveBeenCalledWith(6);
  });

  it("should decrement on minus button click", () => {
    const onChange = vi.fn();
    render(
      <NumberStepper
        value={5}
        onChange={onChange}
        min={1}
        max={10}
      />
    );

    const minusButton = screen.getByRole("button", { name: /minus/i });
    fireEvent.click(minusButton);

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("should not go below min", () => {
    const onChange = vi.fn();
    render(
      <NumberStepper
        value={1}
        onChange={onChange}
        min={1}
        max={10}
      />
    );

    const minusButton = screen.getByRole("button", { name: /minus/i });
    expect(minusButton).toBeDisabled();
  });

  it("should not go above max", () => {
    const onChange = vi.fn();
    render(
      <NumberStepper
        value={10}
        onChange={onChange}
        min={1}
        max={10}
      />
    );

    const plusButton = screen.getByRole("button", { name: /plus/i });
    expect(plusButton).toBeDisabled();
  });
});
```

## What to Mock

**Mock boundaries:**
- `next/navigation` router functions in page components
- Zustand store for isolated component testing (use `vi.mock()`)
- Avoid mocking pure functions in `src/lib/` - test them directly

## What NOT to Mock

**Keep real:**
- Pure scoring functions - test actual behavior
- Pair generation logic - verify correctness
- Data structures and types - use real implementations
- Store mutations - test state transitions

## Coverage

**Not enforced:** No coverage requirements configured

**Future consideration:** If tests are added, recommend 80%+ coverage for:
- `src/lib/scoring.ts` - critical business logic
- `src/lib/pairs.ts` - pair generation correctness
- `src/lib/game-store.ts` - state management

## Running Tests (Once Configured)

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

---

*Testing analysis: 2025-02-17*
