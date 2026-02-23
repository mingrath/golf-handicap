# Phase 14: Play Again Config Restore - Research

**Researched:** 2026-02-23
**Domain:** Zustand state management, IndexedDB history restore, Next.js App Router navigation
**Confidence:** HIGH

## Summary

This phase fixes a narrow but clear bug: `handlePlayAgain` in `src/app/page.tsx` restores player names and hole count from the last saved `HistoryRecord` but silently drops the full handicap config (`handicaps` Record and `turboHoles` array). The same feature is entirely absent from the results page.

The `HistoryRecord` stored in Dexie already contains the full `GameConfig` (including `handicaps: Record<PairKey, PairHandicap>` and `turboHoles: number[]`) via the `config` field. All the data needed for restoration is already persisted — nothing new needs to be saved. The fix is purely on the read/restore side.

The key complication is PairKey identity. PairKeys are constructed by sorting two player UUIDs alphabetically (`"uuid-A::uuid-B"`). Since `handlePlayAgain` generates fresh UUIDs for each player, the old PairKeys from the history record will never match the new player IDs. The fix must re-map saved handicaps from old player IDs to new player IDs using the player name as the join key, then reconstruct PairKeys with the new UUIDs.

**Primary recommendation:** In `handlePlayAgain` (both on home page and new results-page button), after creating fresh-UUID players, build a name→newId map, remap each `PairHandicap` entry to use the new player IDs and recompute PairKeys, then call `setTurboHoles` and directly set `config.handicaps` via the store (or by calling `setPlayers` + a bulk-set path). Use `setTurboHoles` for turbo holes and loop `setHandicap` + `setHandicapHoles` per pair for handicaps.

---

## Standard Stack

No new dependencies are required. The fix uses only the existing stack.

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 5.x | Game state store | Already the single source of truth for all game config |
| Dexie + dexie-react-hooks | 4.x | IndexedDB ORM + live queries | Already used for game history; `useLiveQuery` already provides `latestGame` on home page |
| Next.js App Router | 16.x | Navigation (`useRouter`) | Already used for routing after Play Again |
| React | 19.x | Component state | Already used |

**Installation:** No new packages needed.

---

## Architecture Patterns

### How the Current Data Flow Works

```
useSaveGame (hook, results page)
  └── writes HistoryRecord to Dexie
        └── record.config = full GameConfig {
              players, numberOfHoles,
              handicaps: Record<PairKey, PairHandicap>,
              turboHoles: number[]
            }

home page
  └── useLiveQuery → latestGame (HistoryRecord)
        └── handlePlayAgain reads:
              latestGame.players         ✓ used
              latestGame.numberOfHoles   ✓ used
              latestGame.config.handicaps  ✗ MISSING
              latestGame.config.turboHoles ✗ MISSING
```

### Pattern 1: PairKey Remapping (CRITICAL)

**What:** When players get new UUIDs, old PairKeys in saved handicaps become invalid. Must translate saved handicaps from old-UUID PairKeys to new-UUID PairKeys.

**Why it matters:** The store's `config.handicaps` is keyed by PairKey (`"sortedUUID1::sortedUUID2"`). If the fix blindly copies `latestGame.config.handicaps` into the store after assigning new UUIDs, no pair will ever match because all PairKeys reference the old UUIDs.

**How to remap:**

```typescript
// Source: codebase — src/lib/pairs.ts makePairKey, src/lib/types.ts PairHandicap

// Step 1: build old-ID → new-ID map (joined on player name)
const oldPlayers = latestGame.players; // [{ id: oldUUID, name }]
const newPlayers = players;            // [{ id: newUUID, name }]

const oldIdToNewId = new Map<string, string>();
for (const oldP of oldPlayers) {
  const match = newPlayers.find((np) => np.name === oldP.name);
  if (match) oldIdToNewId.set(oldP.id, match.id);
}

// Step 2: remap each PairHandicap
const remappedHandicaps: Record<PairKey, PairHandicap> = {};
for (const ph of Object.values(latestGame.config.handicaps)) {
  const newA = oldIdToNewId.get(ph.playerAId);
  const newB = oldIdToNewId.get(ph.playerBId);
  if (!newA || !newB) continue; // skip pairs that can't be resolved
  const newKey = makePairKey(newA, newB);
  remappedHandicaps[newKey] = {
    ...ph,
    pairKey: newKey,
    playerAId: newKey.split("::")[0],
    playerBId: newKey.split("::")[1],
  };
}
```

**Note:** `makePairKey` sorts UUIDs alphabetically, so the remapped `playerAId`/`playerBId` on the new `PairHandicap` must also be set from the recomputed key (not from `newA`/`newB` directly, since sorting may swap them).

### Pattern 2: Setting Full Config via Zustand Actions

The store exposes granular setters. The safest approach for restoring handicaps after `resetGame()` + `setPlayers()` + `setNumberOfHoles()`:

```typescript
// Source: src/lib/game-store.ts

// Option A: Call setHandicap + setHandicapHoles per pair (uses existing validations)
resetGame();
setPlayers(players);
setNumberOfHoles(latestGame.numberOfHoles);

// Handicaps require config to exist first (setPlayers creates it)
for (const ph of Object.values(remappedHandicaps)) {
  setHandicap(ph.pairKey, ph.value);
  // setHandicap resets handicapHoles to [] — must call setHandicapHoles after
  setHandicapHoles(ph.pairKey, ph.handicapHoles);
}
setTurboHoles(latestGame.config.turboHoles);
router.push("/setup");
```

**Warning:** `setHandicap` (line 129 in game-store.ts) always resets `handicapHoles` to `[]` when setting value. Therefore `setHandicapHoles` MUST be called after `setHandicap` for each pair — order matters.

### Pattern 3: Results Page "Play Again" Button

The results page needs access to `latestGame` from Dexie (same as home page) to enable a results-page Play Again. The results page already uses `resetGame` from the store and `useRouter`. The needed additions:

```typescript
// Source: src/app/results/page.tsx — existing pattern for reference
import { useLiveQuery } from "dexie-react-hooks";
import { historyDb } from "@/lib/history-db";

// In component:
const latestGame = useLiveQuery(
  () => historyDb.games.orderBy("completedAt").reverse().first(),
  [],
  null
);
```

The results page currently has two bottom buttons: "Home" (left) and "New Game" (right). The best UX location for "Play Again" is to replace or augment the "New Game" button area. Given the existing 2-column sticky footer (`flex gap-3`), a reasonable approach is to rename the right button to "Play Again" when `latestGame` exists and includes the same players, or add a third button. The current "New Game" clears config entirely; "Play Again" restores config. Both navigate to `/setup`.

### Anti-Patterns to Avoid

- **Copying `latestGame.config.handicaps` directly without remapping:** The old PairKeys will be orphaned since new UUIDs are generated. Handicaps will appear empty when the user opens the handicap section on setup.
- **Calling `setHandicapHoles` before `setHandicap`:** `setHandicapHoles` returns early if the pair doesn't exist in `config.handicaps` (line 146: `if (!existing) return {};`). Must call `setHandicap` first to create the entry.
- **Forgetting `initializeHandicaps` collision:** On `handleStartGame`, setup calls `initializeHandicaps()` which merges — existing entries are preserved (`state.config.handicaps[pair.pairKey] ?? default`). So pre-loaded handicaps survive the Start Game action correctly.
- **Restoring turboHoles with old hole numbers that exceed new `numberOfHoles`:** If the game being replayed had 18 holes and turbo on hole 15, but user changes holes to 9 before starting, the store's `setHandicap` validation catches this for handicap values. However, there is no validation in `setTurboHoles` to filter out-of-range holes. The fix should copy `turboHoles` verbatim (since `numberOfHoles` is also restored from the same game) and document this edge case.
- **Extracting `handlePlayAgain` without sharing:** Home page and results page need identical remapping logic. Extract into a shared utility function or custom hook (e.g., `usePlayAgain`) to avoid duplication.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Live query for latest game | Custom IndexedDB polling | `useLiveQuery` from `dexie-react-hooks` | Already used on home page; reactive and cached |
| PairKey construction | String concatenation | `makePairKey` from `src/lib/pairs.ts` | Handles alphabetical sort; matches store's internal usage |
| Config persistence | localStorage writes | Zustand `persist` middleware | Already handles serialization; writing directly would bypass it |

**Key insight:** All primitives already exist. This phase is pure wiring — read from `HistoryRecord.config`, remap IDs, call existing store actions.

---

## Common Pitfalls

### Pitfall 1: PairKey UUID Mismatch

**What goes wrong:** After Play Again, handicap section on `/setup` shows "No handicap" for all pairs despite the history record having non-zero handicaps. Game starts with no handicaps applied.

**Why it happens:** `handlePlayAgain` generates new UUIDs. Old PairKeys from `latestGame.config.handicaps` reference old UUIDs. The store's `handicaps` record has entries under keys like `"old-uuid-1::old-uuid-2"` but the new pair generates key `"new-uuid-1::new-uuid-2"`. Zero intersection.

**How to avoid:** Always remap handicap pairs via the name-based map before writing to store. See Pattern 1 above.

**Warning signs:** Handicap section summary says "No handicaps — equal match" after Play Again even though the original game had configured handicaps.

### Pitfall 2: setHandicap Clears handicapHoles

**What goes wrong:** `handicapHoles` are not restored — after Play Again, handicap values are correct but no specific holes are selected, causing incorrect scoring.

**Why it happens:** `setHandicap` implementation (game-store.ts line 125-139) always sets `handicapHoles: []` when updating a pair's value. If the fix calls `setHandicap(key, value)` without following up with `setHandicapHoles(key, holes)`, the handicap hole distribution is lost.

**How to avoid:** Always call `setHandicapHoles(pairKey, ph.handicapHoles)` immediately after `setHandicap(pairKey, ph.value)` for every pair.

**Warning signs:** Handicap value shows correctly (e.g., "2 strokes") but "0/2 selected" appears in the hole picker UI.

### Pitfall 3: Results Page Lacks Dexie Query

**What goes wrong:** Results page cannot offer Play Again because it has no reference to the saved game record.

**Why it happens:** Results page currently only reads from Zustand store (`useGameStore`). It doesn't query Dexie.

**How to avoid:** Add `useLiveQuery` on the results page to fetch the latest game. However, the game being viewed IS the latest game (just saved by `useSaveGame`), so querying `historyDb.games.orderBy("completedAt").reverse().first()` will return the correct record immediately after save.

**Warning signs:** `latestGame` is `null` on results page causing Play Again button to not render or be disabled.

### Pitfall 4: Shared Logic Drift

**What goes wrong:** Home page fix works but results page has subtly different remap logic due to code duplication, causing inconsistent behavior.

**How to avoid:** Extract the full Play Again logic (remap + store calls) into a shared hook `usePlayAgain()` or utility function that both pages import.

---

## Code Examples

Verified patterns from actual codebase files:

### Current handlePlayAgain (home page) — what exists today

```typescript
// Source: src/app/page.tsx lines 65-76
const handlePlayAgain = () => {
  if (!latestGame) return;
  // Fresh UUIDs, same names -- NEVER reuse old player IDs
  const players = latestGame.players.map((p) => ({
    id: crypto.randomUUID(),
    name: p.name,
  }));
  resetGame();
  setPlayers(players);
  setNumberOfHoles(latestGame.numberOfHoles);
  router.push("/setup");
};
```

### What HistoryRecord.config contains (fully available)

```typescript
// Source: src/lib/history-db.ts + src/lib/types.ts
export interface HistoryRecord {
  config: GameConfig; // full snapshot including:
  //   config.handicaps: Record<PairKey, PairHandicap>
  //   config.turboHoles: number[]
  //   config.players: Player[]
  //   config.numberOfHoles: number
  // ...
}

export interface PairHandicap {
  pairKey: PairKey;
  playerAId: string;
  playerBId: string;
  value: number;           // e.g. 2 (A gives 2 strokes to B)
  handicapHoles: number[]; // e.g. [3, 9] (which holes carry the stroke)
}
```

### Store actions available for config restore

```typescript
// Source: src/lib/game-store.ts

// These all exist and work correctly:
resetGame()                          // clears everything
setPlayers(players)                  // creates config with players
setNumberOfHoles(n)                  // sets hole count on config
setHandicap(pairKey, value)          // sets value + resets handicapHoles to []
setHandicapHoles(pairKey, holes)     // sets which holes (pair must exist first)
setTurboHoles(holes)                 // replaces entire turboHoles array
initializeHandicaps()                // merges default handicaps for current pairs
```

### makePairKey usage

```typescript
// Source: src/lib/pairs.ts
import { makePairKey } from "@/lib/pairs";

// Sorts IDs alphabetically before joining with "::"
const key = makePairKey("uuid-b", "uuid-a"); // → "uuid-a::uuid-b"
// The first part of the split key IS playerAId in the store
```

### How setup page reads restored config (it just works)

```typescript
// Source: src/app/setup/page.tsx lines 24-37
// Setup reads from store via config on mount:
const [players, setLocalPlayers] = useState<Player[]>(() =>
  config?.players?.length
    ? config.players   // ← restored players will be here
    : [/* defaults */]
);
const [numberOfHoles, setLocalHoles] = useState(
  () => config?.numberOfHoles ?? 18  // ← restored hole count here
);

// Handicap section reads from store directly (not local state):
const handicap = config?.handicaps[pair.pairKey]; // ← restored handicaps visible here
const value = handicap?.value ?? 0;
const handicapHoles = handicap?.handicapHoles ?? [];
```

### Results page bottom action bar (where to add Play Again)

```typescript
// Source: src/app/results/page.tsx lines 283-297
// Existing layout: sticky footer with flex gap-3
<div className="sticky bottom-0 p-4 pb-safe bg-background/90 backdrop-blur-xl border-t border-border flex gap-3">
  <button /* Home — left, muted style */ onClick={handleGoHome}>
    <Home className="h-5 w-5" />
    Home
  </button>
  <button /* New Game — right, primary gradient style */ onClick={handleNewGame}>
    <RotateCcw className="h-5 w-5" />
    New Game
  </button>
</div>
// Play Again button should replace or sit alongside New Game in this footer
// Recommendation: keep both — New Game clears everything, Play Again restores config
// With 3 buttons: Home (flex-none ~h-14 w-14 icon-only), Play Again (flex-1), New Game (flex-1)
// Or: rename right button contextually to "Play Again" when latestGame === this game
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Partial restore (names + holes only) | Full restore (names + holes + handicaps + turbo) | This phase | Users don't re-enter handicaps for repeat games |
| Play Again only on home page | Play Again on both home and results page | This phase | Faster repeat-game UX from results |

**No deprecated APIs involved.** All patterns in use are current Zustand 5 / Dexie 4 patterns.

---

## Open Questions

1. **Results page: replace "New Game" or add separate "Play Again"?**
   - What we know: current footer has two buttons (Home, New Game); layout uses `flex gap-3` with `flex-1` on both
   - What's unclear: user preference for having distinct "New Game" (blank slate) vs "Play Again" (restore config)
   - Recommendation: Add Play Again as a third option. Make Home icon-only (square button), give Play Again and New Game `flex-1` each. This preserves both use cases.

2. **What if player count changed between games (one player dropped)?**
   - What we know: Play Again uses same players as `latestGame.players`; the remapping is 1:1 on name
   - What's unclear: edge case if a name was duplicated in the original game
   - Recommendation: document that Play Again restores exactly the prior game's roster. If the remap fails to find a match (no name match), skip that pair's handicap silently — `setHandicap` will not be called, leaving it at 0.

3. **Should handicap summary badge update on the home page Play Again card?**
   - What we know: home page card shows player names and hole count (`latestGame.numberOfHoles`) but not handicap config
   - What's unclear: whether to surface handicap info in the card subtitle (e.g., "3 pairs configured")
   - Recommendation: out of scope for this phase — the card already shows enough info.

---

## Sources

### Primary (HIGH confidence)

- `/Users/ohmmingrath/Projects/golf-handicap/src/lib/game-store.ts` — all store actions, setHandicap behavior, resetGame, setTurboHoles
- `/Users/ohmmingrath/Projects/golf-handicap/src/lib/history-db.ts` — HistoryRecord shape; confirmed `config: GameConfig` field is stored
- `/Users/ohmmingrath/Projects/golf-handicap/src/lib/types.ts` — PairHandicap, GameConfig, PairKey definitions
- `/Users/ohmmingrath/Projects/golf-handicap/src/app/page.tsx` — current handlePlayAgain implementation (lines 65-76)
- `/Users/ohmmingrath/Projects/golf-handicap/src/app/results/page.tsx` — results page layout, existing buttons
- `/Users/ohmmingrath/Projects/golf-handicap/src/app/setup/page.tsx` — how setup reads restored config on mount
- `/Users/ohmmingrath/Projects/golf-handicap/src/lib/pairs.ts` — makePairKey sort behavior
- `/Users/ohmmingrath/Projects/golf-handicap/src/hooks/use-save-game.ts` — confirmed `config` (full GameConfig) is saved in HistoryRecord

### Secondary (MEDIUM confidence)

- `/Users/ohmmingrath/Projects/golf-handicap/src/lib/__tests__/game-store.test.ts` — test patterns for store setup, confirms test infrastructure uses `useGameStore.getState()` calls directly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all existing libraries verified in codebase
- Architecture (PairKey remapping): HIGH — verified by reading pairs.ts, types.ts, game-store.ts directly
- setHandicap clears handicapHoles: HIGH — verified at game-store.ts lines 125-139
- Results page layout: HIGH — verified in results/page.tsx lines 283-297
- Pitfalls: HIGH — derived from direct code reading, not inference

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable codebase, no fast-moving external dependencies)
