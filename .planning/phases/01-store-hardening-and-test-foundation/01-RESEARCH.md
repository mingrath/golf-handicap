# Phase 1: Store Hardening & Test Foundation - Research

**Researched:** 2026-02-17
**Domain:** Zustand store validation, state versioning/migration, Vitest testing, hydration UX
**Confidence:** HIGH

## Summary

This phase hardens the existing Zustand game store by adding input validation, state versioning with migration support, cryptographic ID generation, zero-sum verification, hydration guards, and comprehensive test coverage. The codebase is small and well-structured: five core TypeScript modules under `src/lib/` (game-store.ts, scoring.ts, pairs.ts, types.ts, utils.ts) plus six page components. No test infrastructure exists today -- Vitest needs to be set up from scratch.

The key technical challenges are: (1) wiring Zustand persist's `version` + `migrate` options for future-proof state evolution, (2) adding a hydration gate that shows a branded loading screen before the store rehydrates from localStorage, (3) replacing `Math.random()` ID generation with `crypto.randomUUID()`, (4) adding validation to store actions without blocking the fast on-course scoring UX, and (5) setting up Vitest 4 with proper path alias support.

**Primary recommendation:** Tackle store changes (validation, versioning, ID generation, hydration, reset fix) as Plan 01-01, then test infrastructure and full test coverage as Plan 01-02 -- the tests validate the hardened store.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Validation behavior:**
- Accept invalid input at the UI level, then show a toast notification warning -- don't prevent typing/tapping, but require correction before submission proceeds
- Handicap values are capped at the current hole count (dynamic max, not fixed 18) -- can't give more strokes than holes being played
- Stroke values validated to 0-20 range
- Player count validated to 2-6 at store level
- Hole numbers validated against game config
- Corrupted v1 data: attempt to recover what's salvageable, warn about anything lost via toast

**Loading/hydration UX:**
- Show app logo + centered spinner while store hydrates from storage
- Target under 200ms for hydration -- if it takes longer, treat as an error condition and show recovery options
- No skeleton layout -- keep it simple with the branded loading screen

**Migration strategy:**
- This is mostly a personal app (user + friends), not a large user base
- v2 starts with a clean slate -- no migration of v1 game data into new history system
- State versioning still needed for future v2.x upgrades
- Zustand persist `version` field with cascading `if (version < N)` migration pattern

**Test coverage scope:**
- Full coverage of pure scoring functions: calculatePairHoleResult, getRunningTotals, getFinalRankings, verifyZeroSum
- Full coverage of pair generation: generatePairs, makePairKey, parsePairKey, distributeHandicapHoles
- Integration-level tests for store actions: submitHoleStrokes, setHandicap, resetGame
- Edge case coverage: 6 players x 36 holes, all ties, max handicap, turbo on every hole
- Pre-commit hook to run tests before every commit (safety net)
- Framework: Vitest

### Claude's Discretion
- Toast notification library choice (shadcn/ui toast or custom)
- Exact error messages wording
- Test file organization (co-located vs `__tests__` directory)
- Pre-commit hook implementation (husky, simple-git-hooks, or lint-staged)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.11 | State management with persist middleware | Already in use; persist middleware provides `version` + `migrate` for state evolution |
| next | 16.1.6 | App Router framework | Already in use; all pages are client components |
| react | 19.2.3 | UI framework | Already in use |
| typescript | 5.9.3 | Type safety | Already in use |
| shadcn/ui | 3.8.4 (CLI) | Component library (New York style) | Already configured; provides Sonner toast integration |

### To Install
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.0 | Test runner | All unit and integration tests |
| @vitejs/plugin-react | ^5.1 | React support in Vitest | Required for JSX/TSX in test files |
| vite-tsconfig-paths | ^5.0 | Path alias support (`@/*`) in tests | Required so test imports resolve `@/lib/scoring` etc. |
| jsdom | latest | Browser environment simulation | Required for store tests that touch localStorage |
| sonner | latest | Toast notifications | Validation warnings, corruption recovery alerts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sonner (via shadcn) | Custom toast | shadcn already wraps sonner; custom would duplicate effort with worse accessibility |
| simple-git-hooks | husky | Husky is more popular (21M downloads/week) but heavier; simple-git-hooks is zero-config for our use case (single pre-commit command) |
| `__tests__/` directory | Co-located `.test.ts` files | Co-located keeps tests next to source; `__tests__/` is cleaner for the `src/lib/` structure since these are pure logic modules, not components |

**Installation:**
```bash
# Test infrastructure
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom

# Toast notifications (via shadcn CLI)
npx shadcn@latest add sonner

# Pre-commit hook
npm install -D simple-git-hooks
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── game-store.ts        # Zustand store (modified: validation, versioning, hydration)
│   ├── scoring.ts           # Pure scoring functions (unchanged)
│   ├── pairs.ts             # Pure pair generation functions (unchanged)
│   ├── types.ts             # Domain types (modified: add state version type)
│   ├── utils.ts             # Utility functions (unchanged)
│   └── __tests__/           # Test files
│       ├── scoring.test.ts
│       ├── pairs.test.ts
│       └── game-store.test.ts
├── components/
│   ├── ui/
│   │   └── sonner.tsx       # Added by shadcn CLI
│   └── shared/
│       └── hydration-gate.tsx  # New: loading screen while store hydrates
├── app/
│   ├── layout.tsx           # Modified: add <Toaster /> and <HydrationGate />
│   ├── page.tsx             # Modified: remove direct resetGame call
│   └── setup/
│       └── page.tsx         # Modified: remove useEffect resetGame, use crypto.randomUUID
vitest.config.mts            # New: Vitest configuration
```

### Pattern 1: Zustand Persist with Version and Migration
**What:** Add `version` and `migrate` options to the persist config to handle state schema evolution.
**When to use:** Every time the persisted state shape changes in a future release.
**Example:**
```typescript
// Source: https://zustand.docs.pmnd.rs/integrations/persisting-store-data
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: "golf-handicap-game",
      version: 1, // Increment on every schema change
      migrate: (persistedState: any, version: number) => {
        // Cascading migration: each block upgrades one version
        if (version < 1) {
          // v0 -> v1: Initial versioning, clear any v1 data
          return { ...initialState };
        }
        // Future: if (version < 2) { ... }
        return persistedState as GameState;
      },
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error("Hydration failed:", error);
            // Toast about corruption, offer reset
          }
          // Signal hydration complete
        };
      },
    }
  )
);
```

### Pattern 2: Hydration Gate Component
**What:** A wrapper component that shows a loading screen until the Zustand persist store has finished rehydrating from localStorage.
**When to use:** Wrap the app content in layout.tsx.
**Example:**
```typescript
// Source: https://zustand.docs.pmnd.rs/integrations/persisting-store-data (hasHydrated pattern)
"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";

export function HydrationGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if already hydrated (synchronous localStorage is usually instant)
    const unsub = useGameStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // If already hydrated by the time this runs
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">&#9971;</div>
          <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

### Pattern 3: Store-Level Validation with Toast Feedback
**What:** Validate inputs inside store actions, return early with a toast warning on invalid data. Do not throw -- gracefully reject and notify.
**When to use:** Every store action that accepts external input (submitHoleStrokes, setHandicap, setPlayers, etc.).
**Example:**
```typescript
import { toast } from "sonner";

// Inside store action
submitHoleStrokes: (strokes) =>
  set((state) => {
    if (!state.config) return {};

    // Validate stroke values
    for (const [playerId, value] of Object.entries(strokes.strokes)) {
      if (value < 0 || value > 20 || !Number.isInteger(value)) {
        toast.warning(`Invalid stroke value for player. Must be 0-20.`);
        return {};
      }
    }

    // Validate hole number
    if (strokes.holeNumber < 1 || strokes.holeNumber > state.config.numberOfHoles) {
      toast.warning(`Invalid hole number.`);
      return {};
    }

    // ... proceed with scoring
  }),
```

### Pattern 4: crypto.randomUUID() for Player IDs
**What:** Replace `Math.random().toString(36).substring(2,9)` with `crypto.randomUUID()` for collision-proof IDs.
**When to use:** Whenever a new player is created.
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
function generateId(): string {
  return crypto.randomUUID();
}
// Returns e.g. "36b8f84d-df4e-4d49-b662-bcde71a8764f"
```

### Anti-Patterns to Avoid
- **Throwing errors in store actions:** Zustand actions should not throw -- an unhandled throw inside `set()` corrupts the state update. Use early return + toast instead.
- **Validating only at the UI level:** The NumberStepper already constrains `min`/`max`, but values can be injected programmatically or via corrupted state. Store MUST be the single source of truth for validation.
- **Using `useEffect(resetGame, [])` on mount:** This is the current setup page bug. The setup page calls `resetGame()` in a mount effect, which wipes an active game whenever the user navigates to `/setup`. Fix: only reset on explicit "New Game" action from the home page.
- **Mocking zustand in tests unnecessarily:** For testing pure functions (scoring.ts, pairs.ts), no mocking is needed -- import and call directly. Only store integration tests need localStorage mocking.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast with CSS animations | sonner via shadcn/ui | Handles accessibility (aria-live), positioning, animation, queue management, mobile-safe. shadcn wraps it perfectly |
| UUID generation | `Math.random().toString(36)` | `crypto.randomUUID()` | Built-in Web API, cryptographically secure, zero collisions, supported in all modern browsers since 2022 |
| State migration | Custom JSON parsing/versioning | Zustand persist `version` + `migrate` | Built into the middleware we already use; handles version comparison, async storage, error recovery |
| Pre-commit hooks | Manual `.git/hooks/pre-commit` | simple-git-hooks | Package.json config, auto-installs on `npm install`, works across team members |

**Key insight:** Every "don't hand-roll" item here is a case where the existing stack already provides the solution -- we just need to wire it up.

## Common Pitfalls

### Pitfall 1: Zustand Persist Hydration Race
**What goes wrong:** Components render with initial state (config: null) before localStorage data is loaded, causing a flash of empty state or incorrect redirects.
**Why it happens:** Zustand persist rehydrates asynchronously. Even though localStorage is synchronous, the persist middleware schedules rehydration via microtask.
**How to avoid:** Use the HydrationGate pattern. Check `useGameStore.persist.hasHydrated()` before rendering any page that depends on store state.
**Warning signs:** Components briefly showing "no game" state on page reload, or redirecting to `/setup` when a game is actually in progress.

### Pitfall 2: Setup Page Wipes Active Game (Current Bug)
**What goes wrong:** `src/app/setup/page.tsx` line 34-37 calls `resetGame()` in a `useEffect([], [])` on mount. If a user navigates to `/setup` (e.g., via browser back), the active game is destroyed.
**Why it happens:** The original intent was to start fresh on setup, but the reset should only happen on an explicit "New Game" action.
**How to avoid:** Remove the `useEffect(resetGame, [])` from setup page. The `resetGame()` call already happens in `handleNewGame()` on the home page (line 41 of `src/app/page.tsx`) and in `handleNewGame()` on the results page (line 41 of `src/app/results/page.tsx`). Setup page should initialize from existing config or start fresh based on whether config exists.
**Warning signs:** Players losing mid-game progress when accidentally navigating to setup.

### Pitfall 3: Validation Returning Empty Object in Zustand
**What goes wrong:** Returning `{}` from a `set()` callback in Zustand doesn't prevent the state update -- it applies an empty partial update (which is a no-op but still triggers subscribers).
**Why it happens:** Zustand's `set()` with the updater function pattern applies the returned partial state.
**How to avoid:** Returning `{}` is actually the correct pattern for "do nothing" in Zustand's `set((state) => ...)` form -- it merges nothing. But make sure to show the toast BEFORE the return so the user gets feedback. Alternatively, extract validation into a separate function that runs before `set()`.
**Warning signs:** Toast not appearing, or appearing after a delay.

### Pitfall 4: Testing Store Actions with Persist Middleware
**What goes wrong:** Tests fail because the persist middleware tries to read/write localStorage, or state leaks between tests.
**Why it happens:** Vitest runs in jsdom which has a localStorage implementation, but it's shared across tests unless explicitly cleared.
**How to avoid:** For pure function tests (scoring.ts, pairs.ts), just import and test directly -- no store involved. For store integration tests, reset the store between tests and clear localStorage in `beforeEach`.
**Warning signs:** Tests passing individually but failing when run together; test order affecting outcomes.

### Pitfall 5: crypto.randomUUID() in Non-Secure Context
**What goes wrong:** `crypto.randomUUID()` throws in HTTP (non-HTTPS) contexts.
**Why it happens:** The Web Crypto API requires a secure context.
**How to avoid:** The app is a PWA deployed on Vercel (HTTPS). Development uses `localhost` which is considered a secure context. In tests, jsdom provides `crypto.randomUUID()` via Node.js's built-in crypto. No issue expected.
**Warning signs:** Only a problem if someone runs the app over plain HTTP on a non-localhost domain.

### Pitfall 6: Handicap Max Not Dynamic
**What goes wrong:** The handicap page currently uses `min={-18} max={18}` hardcoded in the NumberStepper. If the game has fewer holes (e.g., 9), a handicap of 18 is nonsensical.
**Why it happens:** The original UI was built with a fixed 18-hole assumption.
**How to avoid:** The store validation should cap handicap values to `[-numberOfHoles, +numberOfHoles]`. The UI should also reflect this by passing `min={-numberOfHoles} max={numberOfHoles}` to the NumberStepper.
**Warning signs:** Users setting handicaps larger than the number of holes.

## Code Examples

Verified patterns from official sources:

### Vitest Configuration for Next.js
```typescript
// vitest.config.mts
// Source: https://nextjs.org/docs/app/guides/testing/vitest
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

### Zustand Persist with Version + Migrate + onRehydrateStorage
```typescript
// Source: https://zustand.docs.pmnd.rs/integrations/persisting-store-data
persist(
  (set, get) => ({ /* ... */ }),
  {
    name: "golf-handicap-game",
    version: 1,
    migrate: (persistedState: any, version: number) => {
      if (version < 1) {
        // v0 (unversioned) -> v1: clean slate
        return undefined; // Forces fresh state
      }
      // Future migrations chain here:
      // if (version < 2) { persistedState.newField = computeDefault(); }
      return persistedState;
    },
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) {
          toast.error("Game data corrupted. Starting fresh.");
        }
      };
    },
  }
)
```

### Testing Pure Functions (No Mocking Needed)
```typescript
// src/lib/__tests__/scoring.test.ts
import { describe, it, expect } from "vitest";
import { calculatePairHoleResult, verifyZeroSum, getRunningTotals, getFinalRankings } from "@/lib/scoring";
import { PairHandicap, HoleStrokes } from "@/lib/types";

describe("calculatePairHoleResult", () => {
  it("awards +1 to lower scorer and -1 to higher scorer", () => {
    const strokes: HoleStrokes = { holeNumber: 1, strokes: { a: 3, b: 5 } };
    const handicap: PairHandicap = {
      pairKey: "a::b", playerAId: "a", playerBId: "b",
      value: 0, handicapHoles: [],
    };
    const result = calculatePairHoleResult("a::b", "a", "b", 1, strokes, handicap, false);
    expect(result.playerAScore).toBe(1);
    expect(result.playerBScore).toBe(-1);
  });
});
```

### Testing Store Actions (Integration)
```typescript
// src/lib/__tests__/game-store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/lib/game-store";

describe("game store actions", () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.getState().resetGame();
    // Clear any persisted data
    localStorage.clear();
  });

  it("setPlayers rejects more than 6 players", () => {
    const players = Array.from({ length: 7 }, (_, i) => ({
      id: crypto.randomUUID(),
      name: `Player ${i + 1}`,
    }));
    useGameStore.getState().setPlayers(players);
    // Store should NOT have saved 7 players
    expect(useGameStore.getState().config?.players.length).not.toBe(7);
  });
});
```

### Sonner Toast Setup
```typescript
// src/app/layout.tsx (modification)
// Source: https://ui.shadcn.com/docs/components/radix/sonner
import { Toaster } from "@/components/ui/sonner";

// Add inside <body>:
<Toaster position="top-center" richColors />
```

### simple-git-hooks Configuration
```json
// package.json addition
{
  "simple-git-hooks": {
    "pre-commit": "npx vitest run --bail 1"
  }
}
```
```bash
# After adding to package.json, activate:
npx simple-git-hooks
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Math.random().toString(36)` for IDs | `crypto.randomUUID()` | Available since 2022 in all browsers | Zero collision risk, standard UUID v4 format |
| Zustand v4 persist | Zustand v5 persist (5.0.11) | v5 released 2024 | Already using v5; persist API unchanged |
| Jest for React testing | Vitest 4.x | Vitest 4.0 released late 2025 | Faster, ESM-native, Vite-compatible, simpler config |
| Husky for git hooks | simple-git-hooks or husky 9 | simple-git-hooks stable since 2023 | simple-git-hooks: zero-config for single-command hooks |

**Deprecated/outdated:**
- shadcn/ui `toast` component: Deprecated in favor of `sonner`. The shadcn CLI now installs sonner when you run `npx shadcn@latest add sonner`.

## Discretion Recommendations

### Toast Library: Sonner via shadcn/ui
**Recommendation:** Use `npx shadcn@latest add sonner`. This is the shadcn/ui-blessed toast solution.
**Rationale:** The project already uses shadcn/ui (New York style). The old shadcn `toast` component is deprecated. Sonner is lightweight (~5KB), has rich color variants (success, warning, error), handles positioning, and integrates seamlessly. Installing via shadcn CLI auto-generates `src/components/ui/sonner.tsx` with proper theme integration.

### Test File Organization: `__tests__/` Directory
**Recommendation:** Use `src/lib/__tests__/` for all test files.
**Rationale:** The files being tested (scoring.ts, pairs.ts, game-store.ts) are all pure logic modules in `src/lib/`. Co-locating tests as `scoring.test.ts` next to `scoring.ts` would clutter the `lib/` directory. A dedicated `__tests__/` folder keeps the lib directory clean and groups all related tests together. This matches the pattern used by Next.js's official Vitest documentation.

### Pre-commit Hook: simple-git-hooks
**Recommendation:** Use `simple-git-hooks` over Husky.
**Rationale:** This is a personal/small-team project. We need exactly one hook: run `vitest run --bail 1` before commits. simple-git-hooks does this with zero ceremony -- just a `package.json` entry. Husky 9 requires a `.husky/` directory with shell scripts, which is overkill for one command. simple-git-hooks has 338K weekly downloads and is well-maintained.

## Open Questions

1. **Toast import location in store files**
   - What we know: `sonner`'s `toast()` function is a direct import, not a React hook. It can be called from anywhere, including Zustand store actions.
   - What's unclear: Whether calling `toast()` from inside a Zustand `set()` callback works reliably (it triggers a DOM update from inside a synchronous state update).
   - Recommendation: Call `toast()` BEFORE the `return {}` statement inside validation checks. If issues arise, extract validation out of `set()` and call toast from the action wrapper. LOW risk since sonner queues toast renders asynchronously.

2. **Hydration timing with localStorage**
   - What we know: localStorage is synchronous. Zustand persist rehydrates on a microtask (Promise.resolve). In practice, hydration takes <10ms.
   - What's unclear: Whether the 200ms error threshold is necessary -- it may never trigger under normal conditions.
   - Recommendation: Implement the threshold as a safety net with `setTimeout`. If it fires, show a "Taking too long? Tap to reset" option. This handles the edge case of corrupted/huge state in localStorage.

## Sources

### Primary (HIGH confidence)
- [Zustand persist middleware docs](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) - version, migrate, onRehydrateStorage, hasHydrated patterns
- [Zustand persist middleware reference](https://zustand.docs.pmnd.rs/middlewares/persist) - API reference for persist options
- [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest) - Official setup for Vitest with Next.js App Router
- [MDN crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) - Browser support, secure context requirement
- [shadcn/ui Sonner docs](https://ui.shadcn.com/docs/components/radix/sonner) - Installation, configuration, usage with Next.js
- [Vitest 4.0 release](https://vitest.dev/blog/vitest-4) - Configuration changes from v3 to v4

### Secondary (MEDIUM confidence)
- [simple-git-hooks GitHub](https://github.com/toplenboren/simple-git-hooks) - Configuration, comparison with Husky
- [Zustand persist migration discussion #984](https://github.com/pmndrs/zustand/issues/984) - Community patterns for cascading version migrations
- [Can I Use crypto.randomUUID](https://caniuse.com/mdn-api_crypto_randomuuid) - Broad browser support data
- [npm trends: husky vs simple-git-hooks](https://npmtrends.com/husky-vs-pre-commit-vs-simple-git-hooks) - Download comparisons

### Tertiary (LOW confidence)
- None -- all findings verified with official documentation

## Codebase Analysis

### Current State Inventory

**Files to modify:**
| File | Changes | Requirements |
|------|---------|-------------|
| `src/lib/game-store.ts` | Add validation to all actions, add version/migrate/onRehydrateStorage to persist config | FOUN-01, FOUN-02, FOUN-03, FOUN-05, FOUN-06 |
| `src/lib/types.ts` | No structural changes needed -- types are already well-defined | -- |
| `src/app/setup/page.tsx` | Replace `Math.random()` with `crypto.randomUUID()`, remove `useEffect(resetGame, [])` | FOUN-04, FOUN-10 |
| `src/app/layout.tsx` | Add `<Toaster />` from sonner, add `<HydrationGate>` wrapper | FOUN-07 |
| `src/app/handicap/page.tsx` | Change NumberStepper max from hardcoded 18 to dynamic `numberOfHoles` | FOUN-02 |
| `package.json` | Add test script, simple-git-hooks config | FOUN-08, FOUN-09 |

**Files to create:**
| File | Purpose | Requirements |
|------|---------|-------------|
| `src/components/shared/hydration-gate.tsx` | Loading screen during store hydration | FOUN-07 |
| `src/components/ui/sonner.tsx` | Auto-generated by `npx shadcn@latest add sonner` | FOUN-01-05 (toast feedback) |
| `vitest.config.mts` | Vitest configuration with React + path aliases | FOUN-08, FOUN-09 |
| `src/lib/__tests__/scoring.test.ts` | Tests for all scoring.ts functions | FOUN-08 |
| `src/lib/__tests__/pairs.test.ts` | Tests for all pairs.ts functions | FOUN-09 |
| `src/lib/__tests__/game-store.test.ts` | Integration tests for store actions | FOUN-08, FOUN-09 |

### Existing Bugs Found

1. **Setup page resets active game (FOUN-10):** `src/app/setup/page.tsx` line 34-37: `useEffect(() => { resetGame(); }, [])` wipes the store on every mount.

2. **Weak ID generation (FOUN-04):** `src/app/setup/page.tsx` line 14-16: `Math.random().toString(36).substring(2, 9)` produces 7-character alphanumeric IDs with non-trivial collision probability in 2^41 space.

3. **Hardcoded handicap range (FOUN-02):** `src/app/handicap/page.tsx` line 93: `min={-18} max={18}` ignores actual hole count.

4. **No zero-sum verification (FOUN-05):** `verifyZeroSum()` exists in scoring.ts but is never called anywhere in the codebase.

5. **No validation on any store action (FOUN-01, FOUN-02, FOUN-03):** All store actions in game-store.ts accept any value without checking range or type.

6. **No state versioning (FOUN-06):** The persist config has only `name: "golf-handicap-game"` -- no version, no migrate function.

7. **No hydration guard (FOUN-07):** Pages render immediately and redirect to `/setup` if config is null, which could be a false negative during hydration.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are already in use or are the official/documented solution for the project's stack
- Architecture: HIGH - Patterns are directly from official Zustand and Next.js documentation
- Pitfalls: HIGH - Identified from actual codebase analysis (bugs confirmed by reading source code)
- Testing: HIGH - Vitest setup follows official Next.js docs; pure function testing requires no special patterns

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable stack, no fast-moving dependencies)
