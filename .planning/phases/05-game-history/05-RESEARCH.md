# Phase 5: Game History - Research

**Researched:** 2026-02-17
**Domain:** Client-side persistent storage (IndexedDB via Dexie), history data modeling, play-again UX
**Confidence:** HIGH

## Summary

Phase 5 introduces a second data store (IndexedDB via Dexie.js) alongside the existing Zustand/localStorage game store. The completed game's full state snapshot is saved automatically when the game completes, then displayed in a history list page. A "play again" shortcut on the home screen reads the most recent game's player list and pre-populates a new game setup.

The technical surface is small: one Dexie database with one table, a save call at game completion, a list page with `useLiveQuery`, and a button that reads the latest record. The main risks are (1) SSR/hydration issues since IndexedDB is browser-only and this is a Next.js app, (2) getting the save timing right so history is written exactly once when `completeGame()` fires, and (3) ensuring storage persistence survives cache clearing (already handled -- `navigator.storage.persist()` is called in `layout.tsx`).

**Primary recommendation:** Use Dexie 4 with `dexie-react-hooks` for the history store. Keep it fully separate from the Zustand game store. Save happens in a `useEffect` that watches `isComplete` on the results page. History list is a new `/history` route. Play-again reads the latest record and pre-populates the Zustand store before navigating to `/setup`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dexie | ^4.0.11 | IndexedDB wrapper with typed tables | De facto standard for client-side IndexedDB; 100k+ sites, clean API, auto-versioning |
| dexie-react-hooks | ^4.2.0 | `useLiveQuery` hook for reactive reads | Official React integration; components auto-update when DB changes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | ^5.0.11 (existing) | Game state store | Already in use -- read game state for save; write player list for play-again |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dexie | idb (by Jake Archibald) | Lower-level, no reactive hooks, more manual code |
| Dexie | localForage | Simpler API but no indexing, no typed schema, no live queries |
| IndexedDB | localStorage (JSON) | 5MB limit, no indexing, blocks main thread on large reads |

**Installation:**
```bash
npm install dexie dexie-react-hooks
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── game-store.ts           # Existing Zustand store (unchanged)
│   ├── history-db.ts           # NEW: Dexie database declaration + types
│   └── types.ts                # Existing types (add HistoryRecord)
├── app/
│   ├── page.tsx                # Home: add play-again button
│   ├── results/page.tsx        # Results: add auto-save effect
│   └── history/page.tsx        # NEW: History list page
└── hooks/
    └── use-save-game.ts        # NEW: Hook encapsulating save logic
```

### Pattern 1: Singleton Dexie Database Declaration
**What:** Declare the Dexie DB as a module-level singleton, export it for use in components and hooks.
**When to use:** Always -- Dexie instances must be singletons.
**Example:**
```typescript
// src/lib/history-db.ts
// Source: https://github.com/dexie/Dexie.js (README)
import Dexie, { type EntityTable } from "dexie";

export interface HistoryRecord {
  id?: number;                    // Auto-incremented primary key
  completedAt: string;            // ISO 8601 date string
  players: { id: string; name: string }[];
  numberOfHoles: number;
  rankings: { playerId: string; playerName: string; totalScore: number; rank: number }[];
  winnerId: string;
  winnerName: string;
  // Full state snapshot for potential future detail view
  config: GameConfig;
  holeStrokes: HoleStrokes[];
  pairResults: PairHoleResult[];
  playerScores: PlayerHoleScore[];
}

export const historyDb = new Dexie("golf-handicap-history") as Dexie & {
  games: EntityTable<HistoryRecord, "id">;
};

historyDb.version(1).stores({
  games: "++id, completedAt",
});
```

### Pattern 2: Save on Game Completion via useEffect
**What:** Watch `isComplete` and save the game state to IndexedDB exactly once when it transitions to `true`.
**When to use:** On the results page, since that's where `completeGame()` is called.
**Example:**
```typescript
// In results/page.tsx or a custom hook
const savedRef = useRef(false);

useEffect(() => {
  if (isComplete && config && !savedRef.current) {
    savedRef.current = true;
    const record: HistoryRecord = {
      completedAt: new Date().toISOString(),
      players: config.players,
      numberOfHoles: config.numberOfHoles,
      rankings: getFinalRankings(config.players, playerScores).map(r => ({
        playerId: r.player.id,
        playerName: r.player.name,
        totalScore: r.totalScore,
        rank: r.rank,
      })),
      winnerId: rankings[0]?.player.id ?? "",
      winnerName: rankings[0]?.player.name ?? "",
      config,
      holeStrokes,
      pairResults,
      playerScores,
    };
    historyDb.games.add(record).catch(console.error);
  }
}, [isComplete]);
```

### Pattern 3: useLiveQuery for Reactive History List
**What:** Use `useLiveQuery` to read from IndexedDB reactively -- list auto-updates if records change.
**When to use:** On the history list page.
**Example:**
```typescript
// Source: https://github.com/dexie/Dexie.js (README)
import { useLiveQuery } from "dexie-react-hooks";
import { historyDb } from "@/lib/history-db";

function HistoryPage() {
  const games = useLiveQuery(
    () => historyDb.games.orderBy("completedAt").reverse().toArray(),
    [],  // deps
    []   // default value (empty array while loading)
  );
  // games is HistoryRecord[] -- never undefined because of default
}
```

### Pattern 4: Play-Again Shortcut
**What:** Read the most recent game from history, extract player names, and pre-populate a new game.
**When to use:** On the home page when history has at least one record.
**Example:**
```typescript
// Read latest game (non-reactive, one-shot)
const latestGame = await historyDb.games
  .orderBy("completedAt")
  .reverse()
  .first();

if (latestGame) {
  // Create fresh players with new IDs but same names
  const players = latestGame.players.map(p => ({
    id: crypto.randomUUID(),
    name: p.name,
  }));
  resetGame();
  setPlayers(players);
  setNumberOfHoles(latestGame.numberOfHoles);
  router.push("/setup");
}
```

### Anti-Patterns to Avoid
- **Don't index blob/binary data:** Only index fields you query by. The full game state (holeStrokes, pairResults, etc.) should NOT be indexed -- just stored.
- **Don't read from IndexedDB during SSR:** Dexie is browser-only. All Dexie usage must be in `"use client"` components or `useEffect` callbacks. (This app is already all client components.)
- **Don't mix Dexie and Zustand for the same data:** Keep game state in Zustand, history in Dexie. One-way flow: Zustand -> Dexie on save. Never read history back into Zustand's persisted state.
- **Don't save incomplete games:** Only save when `isComplete === true`. A game that's abandoned mid-round should not appear in history.
- **Don't duplicate player IDs across games:** When "play again" creates new players, generate fresh `crypto.randomUUID()` IDs. Reuse names only, not IDs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB CRUD | Raw IndexedDB API with `onupgradeneeded`, cursors, transactions | Dexie.js | IndexedDB API is 50+ lines for a simple put; Dexie is 1 line |
| Reactive IndexedDB reads | Custom `addEventListener` on IndexedDB + setState | `useLiveQuery` from dexie-react-hooks | Binary range tree diff algorithm handles cross-tab updates efficiently |
| Schema migrations | Manual `onupgradeneeded` version checking | `db.version(N).stores({...})` chain | Dexie diffs schemas automatically between versions |
| Storage persistence | Custom logic to check/request persistence | `navigator.storage.persist()` | Already called in layout.tsx; browser-native API |

**Key insight:** Dexie eliminates all IndexedDB ceremony (open transactions, request objects, cursor iteration). The entire history store is ~20 lines of declaration + ~10 lines per operation.

## Common Pitfalls

### Pitfall 1: Double-Saving on Results Page Re-Render
**What goes wrong:** The save effect fires multiple times because React re-renders the results page (e.g., when editing a stroke score), causing duplicate history records.
**Why it happens:** `isComplete` stays `true` across re-renders, and React effects can re-run.
**How to avoid:** Use a `useRef(false)` flag that's set to `true` after the first save. The ref persists across re-renders but resets on remount. Also, do NOT include mutable store data in the effect's dependency array -- only `isComplete`.
**Warning signs:** Multiple identical records in history for the same game.

### Pitfall 2: SSR/Hydration Crash Accessing IndexedDB
**What goes wrong:** Dexie's constructor or `useLiveQuery` runs during server-side rendering and throws because `indexedDB` is not defined on the server.
**Why it happens:** Next.js pre-renders pages on the server, even with `"use client"` directive. The module-level Dexie instance is fine (it lazy-opens), but `useLiveQuery` must only run client-side.
**How to avoid:** (a) This app already uses all client components with `"use client"`. (b) The `HydrationGate` wrapper ensures children render only after hydration. (c) Dexie's constructor does NOT immediately open the database -- it opens lazily on first query, so the module-level singleton is safe. (d) `useLiveQuery` returns `undefined` (or default value) before the first client-side query resolves. Provide a default value (empty array) to avoid conditional rendering issues.
**Warning signs:** "indexedDB is not defined" error during build or SSR.

### Pitfall 3: TransactionInactiveError from Async Operations
**What goes wrong:** Calling non-IndexedDB async APIs (fetch, crypto, etc.) inside a Dexie transaction kills the transaction.
**Why it happens:** IndexedDB auto-commits transactions when no pending requests remain in the current microtask. Awaiting non-IDB promises lets the transaction commit prematurely.
**How to avoid:** For our use case, we don't need explicit transactions at all. A single `db.games.add(record)` is auto-transactional. Never wrap the save in `db.transaction()` unless you need multi-table atomicity (we don't -- we have one table).
**Warning signs:** "TransactionInactiveError" in console.

### Pitfall 4: Play-Again Creates Players with Stale IDs
**What goes wrong:** Reusing player IDs from history causes pair key collisions or incorrect score lookups in the new game.
**Why it happens:** The game store uses player IDs as keys in `Record<string, ...>` maps. Old IDs might conflict with other state.
**How to avoid:** Always generate fresh `crypto.randomUUID()` IDs when creating play-again players. Only copy the `.name` property.
**Warning signs:** Wrong scores appearing, pair keys not matching expected players.

### Pitfall 5: History DB Blocks First Paint
**What goes wrong:** If `useLiveQuery` is used on the home page to check "has history" for the play-again button, it adds latency to the first meaningful paint.
**Why it happens:** IndexedDB open + query is async, and the component must wait for it.
**How to avoid:** Use `useLiveQuery` with a default value (e.g., `null`) so the home page renders immediately with the default UI, then updates to show the play-again button when data arrives. The visual change is a progressive enhancement, not a layout shift -- the button simply appears.
**Warning signs:** Noticeable delay before home page content appears.

## Code Examples

Verified patterns from official sources:

### Dexie Database Declaration (TypeScript)
```typescript
// Source: https://github.com/dexie/Dexie.js (README, TypeScript EntityTable pattern)
import Dexie, { type EntityTable } from "dexie";

export interface HistoryRecord {
  id?: number;
  completedAt: string;
  players: { id: string; name: string }[];
  numberOfHoles: number;
  rankings: { playerId: string; playerName: string; totalScore: number; rank: number }[];
  winnerId: string;
  winnerName: string;
  config: import("./types").GameConfig;
  holeStrokes: import("./types").HoleStrokes[];
  pairResults: import("./types").PairHoleResult[];
  playerScores: import("./types").PlayerHoleScore[];
}

export const historyDb = new Dexie("golf-handicap-history") as Dexie & {
  games: EntityTable<HistoryRecord, "id">;
};

historyDb.version(1).stores({
  games: "++id, completedAt",
});
```
**Schema notes:**
- `++id` = auto-incremented primary key (Dexie generates it)
- `completedAt` = indexed for sorting by date
- All other fields are stored but NOT indexed (no need to query by them)
- Only indexed fields appear in the schema string. Non-indexed fields are stored automatically.

### Adding a History Record
```typescript
// Source: Dexie CRUD documentation
await historyDb.games.add({
  completedAt: new Date().toISOString(),
  players: config.players,
  numberOfHoles: config.numberOfHoles,
  rankings: [...],
  winnerId: rankings[0].player.id,
  winnerName: rankings[0].player.name,
  config,
  holeStrokes,
  pairResults,
  playerScores,
});
// id is auto-generated -- no need to provide it
```

### Querying All Games (Reverse Chronological)
```typescript
// Source: Dexie collection methods + dexie-react-hooks
import { useLiveQuery } from "dexie-react-hooks";

const games = useLiveQuery(
  () => historyDb.games.orderBy("completedAt").reverse().toArray(),
  [],   // dependency array
  []    // default value while loading
);
```

### Reading the Latest Game Only
```typescript
// Source: Dexie Collection.first()
const latest = await historyDb.games
  .orderBy("completedAt")
  .reverse()
  .first();
// Returns HistoryRecord | undefined
```

### Deleting a Single Game
```typescript
// Source: Dexie Table.delete()
await historyDb.games.delete(gameId);
```

### Checking Storage Persistence
```typescript
// Already in layout.tsx -- no additional code needed
if (navigator.storage && navigator.storage.persist) {
  const persisted = await navigator.storage.persist();
  console.log("Storage persisted:", persisted);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage for all data | localStorage for live game, IndexedDB for history | This phase | Separates ephemeral game state from permanent history |
| dexie v3 + separate dexie-react-hooks package | dexie v4 + dexie-react-hooks v4 (aligned versions) | Dexie 4.0 (2024) | Better TypeScript types with EntityTable, React integration refined |
| Manual IndexedDB `onupgradeneeded` | Declarative `db.version(N).stores({})` | Dexie (all versions) | Schema diffing is automatic; just declare current + past versions |
| `useLiveQuery` returns `undefined` initially | Can provide default value as 3rd argument | Dexie 3.2+ | Eliminates need for loading state in simple cases |

**Deprecated/outdated:**
- `Dexie.Promise`: No longer needed since modern browsers have native promises compatible with IndexedDB
- `dexie-react-hooks` as a separate install: Still a separate package, but version-aligned with dexie 4

## Existing Codebase Integration Points

### 1. `completeGame()` action (game-store.ts:300)
Sets `isComplete: true`. This is the trigger for saving to history. The save should happen in the consumer (results page effect), NOT inside the store action, to keep the Zustand store unaware of Dexie.

### 2. `resetGame()` action (game-store.ts:302)
Clears all game state. Called by "New Game" button. The play-again flow should call `resetGame()` first, then set players and config from history, then navigate.

### 3. Results page (results/page.tsx)
Currently has `isComplete` and all game state available. The save effect can read everything it needs from the existing `useGameStore()` hook. No new props or state needed.

### 4. Home page (page.tsx)
Currently shows "New Game" and "Resume Game" buttons. The play-again button goes here, conditionally shown when history has >= 1 record. It needs to read only the latest game from IndexedDB.

### 5. `navigator.storage.persist()` (layout.tsx:59-61)
Already called on page load. No additional persistence code needed. The roadmap requirement "IndexedDB with storage persistence" is already satisfied by the existing layout code.

### 6. HydrationGate (hydration-gate.tsx)
Wraps all page content. Dexie queries run inside this gate, so they execute client-side only. No additional SSR guards needed for Dexie.

## Open Questions

1. **Should the history page support deleting individual records?**
   - What we know: Requirements HIST-02 only specifies viewing, not deleting.
   - What's unclear: Whether users would want to clean up their history.
   - Recommendation: Add a swipe-to-delete or long-press-to-delete as a nice-to-have, but it is NOT in the requirements. Planner can skip it or add as a stretch task.

2. **Should the play-again button also restore handicap/turbo config?**
   - What we know: HIST-04 says "Play again with same players" using "last-used player list". This implies players only.
   - What's unclear: Whether users expect handicaps to carry over (they often do stay the same between rounds).
   - Recommendation: Copy player names AND numberOfHoles. Do NOT copy handicaps/turbo -- these are per-round settings that users should re-confirm. The setup page already shows them collapsed with defaults.

3. **Maximum number of history records to store?**
   - What we know: IndexedDB can store gigabytes. Each game record is ~2-10KB (depends on player count and holes).
   - What's unclear: Whether we should cap history at some limit.
   - Recommendation: No cap needed for v1. 1000 games would be ~10MB, well within limits. Add a "Clear All History" option on the history page as a safety valve.

## Sources

### Primary (HIGH confidence)
- [Dexie.js GitHub README](https://github.com/dexie/Dexie.js) - Database declaration, TypeScript EntityTable pattern, CRUD operations, React hooks
- [Dexie.js npm](https://www.npmjs.com/package/dexie) - Version 4.0.11 (latest stable as of 2026-02)
- [dexie-react-hooks npm](https://www.npmjs.com/package/dexie-react-hooks) - Version 4.2.0 (latest)
- [web.dev Persistent Storage](https://web.dev/articles/persistent-storage) - `navigator.storage.persist()` API, browser support, eviction policies
- [MDN Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API) - Storage quotas and eviction criteria

### Secondary (MEDIUM confidence)
- [Dexie Best Practices](https://dexie.org/docs/Tutorial/Best-Practices) - Transaction pitfalls, indexing guidance (content confirmed via multiple sources)
- [Dexie Version.upgrade()](https://dexie.org/docs/Version/Version.upgrade()) - Schema migration patterns
- [Dexie StorageManager](https://dexie.org/docs/StorageManager) - Integration with Storage API
- [WebKit Storage Policy Updates](https://webkit.org/blog/14403/updates-to-storage-policy/) - Safari 17+ full Storage API support

### Tertiary (LOW confidence)
- [Dexie + Next.js Medium article](https://medium.com/dexie-js/dexie-js-next-js-fd15556653e6) - SSR considerations (could not extract content, pattern inferred from multiple community sources)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Dexie is the clear standard for IndexedDB in React; versions confirmed via npm
- Architecture: HIGH - Two-store pattern is a prior decision; integration points verified by reading actual codebase
- Pitfalls: HIGH - Transaction pitfalls confirmed by official docs; double-save pattern verified by understanding React effect behavior
- Code examples: HIGH - Patterns from official Dexie GitHub README and verified against npm package types

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable domain -- Dexie 4.x is mature, no breaking changes expected)
