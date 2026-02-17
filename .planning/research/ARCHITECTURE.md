# Architecture Research

**Domain:** Offline-capable golf scoring PWA — evolving from single-game to multi-game with history, stats, and richer UI
**Researched:** 2026-02-17
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Setup   │ │   Play   │ │ Results  │ │  Stats   │  (new)    │
│  │  Flow    │ │   Page   │ │   Page   │ │   Page   │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                  │
│  ┌────┴────┐  ┌────┴────┐  ┌───┴──────┐  ┌──┴───────┐         │
│  │ Shared  │  │ Score   │  │ Charts/  │  │ Stat     │  (new)   │
│  │ Controls│  │ Entry   │  │ Viz Comp │  │ Cards    │          │
│  └─────────┘  └─────────┘  └──────────┘  └──────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                     State Management Layer                       │
│  ┌──────────────────────────┐  ┌────────────────────────┐       │
│  │   Game Store             │  │   History Store         │(new) │
│  │   (active game state)    │  │   (completed rounds)    │      │
│  │   key: golf-handicap-game│  │   key: golf-history     │      │
│  └────────────┬─────────────┘  └───────────┬────────────┘       │
│               │                            │                    │
├───────────────┴────────────────────────────┴────────────────────┤
│                     Domain Logic Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ scoring  │  │  pairs   │  │  stats   │  │ history  │  (new) │
│  │  .ts     │  │   .ts    │  │   .ts    │  │   .ts    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
├─────────────────────────────────────────────────────────────────┤
│                     Type Layer                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  types.ts (Player, GameState, GameSummary, PlayerStats) │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                     Persistence Layer                             │
│  ┌───────────────────┐  ┌────────────────────────┐              │
│  │   localStorage    │  │   Service Worker       │              │
│  │   (Zustand persist│  │   (route/asset cache)  │              │
│  │    2 separate keys│  │                        │              │
│  └───────────────────┘  └────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Game Store** | Active game state: config, current hole, strokes, pair results, player scores | Zustand with persist, key `"golf-handicap-game"` (exists) |
| **History Store** | Completed game summaries: array of `GameSummary` with condensed per-round data | NEW Zustand store with persist, key `"golf-history"`, version 1 |
| **scoring.ts** | Pure scoring functions: pair results, player scores, rankings, zero-sum verification | Exists, no changes needed |
| **pairs.ts** | Pair generation, PairKey management, handicap hole distribution | Exists, no changes needed |
| **stats.ts** | Cross-round stat computation: win rates, score averages, trends, head-to-head records | NEW pure function module |
| **history.ts** | Game-to-summary conversion, history CRUD, storage size management | NEW pure function module |
| **Chart components** | Score trend lines, bar charts for win rates, head-to-head visualizations | NEW using shadcn/ui Chart (Recharts) |
| **Setup Flow** | Player/hole/handicap/turbo configuration (wizard steps) | Exists, streamline UX |
| **Play Page** | Per-hole stroke entry, live scoreboard, hole navigation | Exists, improve display |
| **Results Page** | Final rankings, pair breakdowns, score trend chart, save-to-history action | Exists, extend with charts + save |
| **Stats Page** | Cross-round statistics dashboard | NEW route `/stats` |
| **History Page** | List of past games with summary cards | NEW route `/history` |

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Home: new game, resume, history link
│   ├── layout.tsx              # Root layout, PWA, hydration guard
│   ├── setup/page.tsx          # Step 1: players + holes (streamlined)
│   ├── handicap/page.tsx       # Step 2: handicap config
│   ├── turbo/page.tsx          # Step 3: turbo holes
│   ├── play/page.tsx           # Step 4: scoring
│   ├── results/page.tsx        # Final results + charts + save
│   ├── history/page.tsx        # NEW: past games list
│   └── stats/page.tsx          # NEW: cross-round statistics
├── components/
│   ├── ui/                     # shadcn/ui primitives (button, card, dialog, chart)
│   ├── shared/                 # Reusable: game-header, step-indicator, number-stepper
│   ├── results/                # NEW: result-specific components
│   │   ├── winner-spotlight.tsx     # Winner celebration card
│   │   ├── pair-breakdown.tsx       # Head-to-head pair result cards
│   │   └── score-trend-chart.tsx    # Line chart of score progression
│   ├── history/                # NEW: history-specific components
│   │   └── game-summary-card.tsx    # Compact past-game card
│   └── stats/                  # NEW: stats-specific components
│       ├── win-rate-chart.tsx       # Bar/pie chart of wins per player
│       ├── score-trend-chart.tsx    # Cross-round score trend line
│       └── stat-card.tsx            # Numeric stat display card
├── lib/
│   ├── game-store.ts           # Active game Zustand store (evolve)
│   ├── history-store.ts        # NEW: history Zustand store
│   ├── scoring.ts              # Scoring functions (stable)
│   ├── pairs.ts                # Pair utilities (stable)
│   ├── stats.ts                # NEW: cross-round stat computation
│   ├── history.ts              # NEW: game-to-summary conversion
│   ├── types.ts                # Domain types (extend)
│   └── utils.ts                # Utility functions (stable)
└── ...
```

### Structure Rationale

- **`lib/history-store.ts` as separate store:** History data (array of completed game summaries) has a completely different lifecycle from active game state. Separate localStorage keys prevent game-reset from destroying history. Separate stores mean independent persist/hydrate cycles.
- **`lib/stats.ts` as pure functions:** Stats are derived data computed from history. No store needed -- compute on demand from history store's data. Keeps stats logic testable and avoids stale cached values.
- **`components/results/` and `components/stats/`:** Results page is already 300 lines. Extracting chart/visualization components into feature directories keeps pages thin and components reusable between results and stats pages.
- **shadcn/ui Chart (Recharts) in `components/ui/`:** shadcn/ui already provides a Chart component wrapping Recharts. Since the project uses shadcn/ui, adding charts via `npx shadcn@latest add chart` is the zero-config path -- no new dependency decisions needed.

## Architectural Patterns

### Pattern 1: Two-Store Separation (Game + History)

**What:** Split persistent state into two independent Zustand stores with separate localStorage keys. Game store (`golf-handicap-game`) owns the active round. History store (`golf-history`) owns completed game summaries.

**When to use:** When data has different lifecycles -- active game is reset frequently, history accumulates indefinitely.

**Trade-offs:**
- Pro: `resetGame()` cannot corrupt history; stores hydrate independently; each store stays small and focused
- Pro: Zustand persist middleware natively supports separate stores with separate `name` keys
- Con: Cross-store actions (save game to history) need a thin orchestration layer
- Con: Two stores to version-migrate instead of one

**Example:**
```typescript
// history-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HistoryStore {
  games: GameSummary[];
  addGame: (summary: GameSummary) => void;
  deleteGame: (id: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      games: [],
      addGame: (summary) =>
        set((state) => ({
          games: [summary, ...state.games],
        })),
      deleteGame: (id) =>
        set((state) => ({
          games: state.games.filter((g) => g.id !== id),
        })),
      clearHistory: () => set({ games: [] }),
    }),
    {
      name: "golf-history",
      version: 1,
      // migrate: (persisted, version) => { ... }
    }
  )
);
```

### Pattern 2: Game-to-Summary Conversion at Save Boundary

**What:** When a game completes, convert the full `GameState` (verbose, per-stroke) into a compact `GameSummary` (condensed, per-player totals and rankings) before writing to history. The full `GameState` is discarded after conversion.

**When to use:** History does not need per-stroke granularity. Storing full `GameState` for every round would exhaust localStorage quickly.

**Trade-offs:**
- Pro: Each `GameSummary` is approximately 0.5-1 KB vs 5-10 KB for full `GameState` with 18 holes. Allows hundreds of games in localStorage's 5 MB limit.
- Pro: Stats computation only needs summary data, not raw strokes
- Con: Cannot "replay" a historical game hole-by-hole (acceptable per scope)
- Con: If you later want per-hole drill-down in history, you'd need to store more

**Example:**
```typescript
// types.ts additions
interface GameSummary {
  id: string;
  date: string;              // ISO date string
  numberOfHoles: number;
  players: Player[];
  rankings: {
    playerId: string;
    playerName: string;
    totalScore: number;
    rank: number;
  }[];
  pairRecords: {
    pairKey: PairKey;
    playerAId: string;
    playerBId: string;
    playerATotal: number;
    playerBTotal: number;
  }[];
  turboHoleCount: number;
  hadHandicaps: boolean;
}
```

### Pattern 3: Derived Stats (Compute on Render, Don't Cache)

**What:** Stats are pure functions that take `GameSummary[]` and return computed values. No separate stats store -- compute inside components or via `useMemo`.

**When to use:** When the source data (history) is small enough that derivation is instant. With <500 game summaries, stat computation takes <1ms.

**Trade-offs:**
- Pro: Zero synchronization issues -- stats always reflect current history
- Pro: Adding new stat types requires only new pure functions, no migrations
- Pro: Fully testable without store mocking
- Con: Recomputes on every render (mitigated by `useMemo` with history as dependency)

**Example:**
```typescript
// stats.ts - pure functions, no store
export function getPlayerWinRate(
  playerId: string,
  games: GameSummary[]
): { wins: number; total: number; rate: number } {
  const played = games.filter((g) =>
    g.rankings.some((r) => r.playerId === playerId)
  );
  const wins = played.filter((g) =>
    g.rankings.some((r) => r.playerId === playerId && r.rank === 1)
  );
  return {
    wins: wins.length,
    total: played.length,
    rate: played.length > 0 ? wins.length / played.length : 0,
  };
}

export function getScoreTrend(
  playerId: string,
  games: GameSummary[]
): { date: string; score: number }[] {
  return games
    .filter((g) => g.rankings.some((r) => r.playerId === playerId))
    .map((g) => ({
      date: g.date,
      score: g.rankings.find((r) => r.playerId === playerId)!.totalScore,
    }))
    .reverse(); // chronological
}
```

### Pattern 4: State Version + Migration for Safe Upgrades

**What:** Add `version` number to both Zustand persist configs. When the schema changes, increment version and provide a `migrate` function that transforms old persisted state into the new shape.

**When to use:** Always -- any app using Zustand persist that will evolve over time needs this from day one.

**Trade-offs:**
- Pro: Users don't lose data when app schema changes
- Pro: Zustand persist middleware has built-in `version` + `migrate` support
- Con: Must maintain migration functions for each version bump (but they're small)

**Example:**
```typescript
persist(
  (set, get) => ({ /* store */ }),
  {
    name: "golf-handicap-game",
    version: 2,
    migrate: (persisted: any, version: number) => {
      if (version === 0) {
        // v0 -> v1: add isComplete field
        return { ...persisted, isComplete: persisted.isComplete ?? false };
      }
      if (version === 1) {
        // v1 -> v2: add round ID to config
        return {
          ...persisted,
          config: persisted.config
            ? { ...persisted.config, roundId: crypto.randomUUID() }
            : null,
        };
      }
      return persisted;
    },
  }
)
```

## Data Flow

### Active Game Flow (Existing, No Major Changes)

```
User enters strokes on /play
    ↓
PlayPage calls submitHoleStrokes({ holeNumber, strokes })
    ↓
Game Store action:
    → generatePairs(players)
    → calculatePairHoleResult() for each pair
    → calculatePlayerHoleScores() for all players
    → getRunningTotals() for cumulative scores
    → Persist to localStorage (automatic via Zustand persist)
    ↓
React re-renders PlayPage with updated scores
```

### Game Completion + History Save Flow (New)

```
User taps "Finish Game" on last hole
    ↓
PlayPage calls completeGame() on Game Store
    → Sets isComplete = true
    → Navigates to /results
    ↓
ResultsPage renders final rankings, pair breakdowns, charts
    ↓
User taps "Save & New Game" or "Save & Home"
    ↓
Orchestration in page component:
    1. Read full state from Game Store (config, playerScores, pairResults)
    2. Call convertToSummary(gameState) → GameSummary  [history.ts]
    3. Call addGame(summary) on History Store
    4. Call resetGame() on Game Store
    5. Navigate to /setup or /
    ↓
History Store persists to localStorage key "golf-history"
Game Store clears to initial state
```

### Stats Computation Flow (New)

```
User navigates to /stats
    ↓
StatsPage reads games[] from History Store
    ↓
Pure functions compute derived stats:
    → getPlayerWinRate(playerId, games)    [stats.ts]
    → getScoreTrend(playerId, games)       [stats.ts]
    → getHeadToHeadRecord(pA, pB, games)   [stats.ts]
    → getAverageScore(playerId, games)     [stats.ts]
    ↓
Stats passed to chart/card components
    → <ScoreTrendChart data={trend} />     (shadcn/ui Chart + Recharts)
    → <WinRateChart data={winRates} />
    → <StatCard value={avgScore} />
    ↓
React renders stats dashboard (no persistence needed)
```

### Key Data Flows Summary

1. **Stroke Entry:** User taps +/- on PlayPage -> Game Store computes scores -> React renders updated scoreboard
2. **Game Save:** ResultsPage reads Game Store -> `convertToSummary()` -> History Store saves summary -> Game Store resets
3. **Stats View:** StatsPage reads History Store -> pure stat functions compute -> charts render
4. **History Browse:** HistoryPage reads History Store -> renders summary cards -> tapping a card shows detail overlay

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-50 games stored | localStorage is fine. ~50 KB for 50 summaries. No action needed. |
| 50-500 games stored | Still within localStorage 5 MB limit (~500 KB). Add "export history" as JSON for backup. |
| 500+ games stored | Approaching localStorage limits. Migrate to IndexedDB using `idb-keyval` as Zustand storage adapter. This is a future concern, not v2 scope. |

### Scaling Priorities

1. **First bottleneck: localStorage size for history.** Each `GameSummary` is ~0.5-1 KB. At 500 games, we're at ~500 KB -- well within 5 MB. Not a real concern for years of casual golf. If needed, the Zustand persist `storage` option can be swapped to IndexedDB without changing any business logic.
2. **Second bottleneck: stat computation latency.** Pure functions over 500 game summaries are sub-millisecond. `useMemo` with `[games]` dependency prevents unnecessary recomputation. Not a real concern.
3. **Third bottleneck: Recharts rendering for large datasets.** If charting hundreds of data points, Recharts handles it fine. For 500+ points, add data windowing (last 50 games by default). Not a v2 concern.

## Anti-Patterns

### Anti-Pattern 1: Single Store for Game + History

**What people do:** Put `games: GameSummary[]` inside the existing `useGameStore`, sharing the same localStorage key.
**Why it's wrong:** `resetGame()` wipes all state. If history shares the same store, reset must carefully exclude `games`. The persist middleware serializes the entire store, so game-in-progress data bloats history writes. Schema migration becomes harder when unrelated concerns are entangled.
**Do this instead:** Two separate Zustand stores with separate persist keys. Each store has its own lifecycle, versioning, and migration.

### Anti-Pattern 2: Storing Full GameState in History

**What people do:** Push the entire `GameState` (including per-hole strokes, pair results, player scores) into the history array.
**Why it's wrong:** A single 18-hole, 4-player game with 6 pairs produces ~150 `PairHoleResult` objects + 72 `PlayerHoleScore` objects + 18 `HoleStrokes` objects. That's 5-10 KB per game. At 100 games = 0.5-1 MB. At 500 games = 2.5-5 MB. Hits localStorage limit.
**Do this instead:** Convert to compact `GameSummary` at save time. Store only what stats/display needs: players, rankings, pair totals, date, metadata.

### Anti-Pattern 3: Caching Stats in a Third Store

**What people do:** Create a `useStatsStore` that persists computed stats to localStorage, hoping to avoid recomputation.
**Why it's wrong:** Stats become stale when history changes (delete a game, add a new game). Cache invalidation for derived data is a classic source of bugs. The computation is fast enough to not need caching.
**Do this instead:** Compute stats on the fly from history data. Use `useMemo` in components for render-level memoization. Pure functions are the cache -- the input (history) is the dependency.

### Anti-Pattern 4: Adding Charts Without shadcn/ui Integration

**What people do:** Install Recharts directly and write custom chart wrappers, ignoring that shadcn/ui already provides Chart components.
**Why it's wrong:** Duplicates theming work (dark mode, colors). Loses consistency with the rest of the UI. shadcn/ui Chart components use CSS variables that automatically match the existing theme.
**Do this instead:** `npx shadcn@latest add chart` to get the shadcn/ui Chart component. Build charts using Recharts primitives (LineChart, BarChart) composed with shadcn's ChartTooltip and ChartContainer for theming.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Game Store <-> History Store | Orchestrated by page component | Results page reads Game Store, converts to summary, writes to History Store. No direct store-to-store communication. |
| History Store <-> Stats Functions | Read-only | Stats page reads `games[]` from History Store, passes to pure functions. Stats never write to history. |
| Results Page <-> Chart Components | Props | Results page passes `playerScores[]` data to `ScoreTrendChart` component as props. Chart renders SVG. |
| Stats Page <-> Chart Components | Props | Stats page computes data from history, passes to chart components as props. |
| Home Page <-> Both Stores | Read-only | Home page reads Game Store for active game status, reads History Store for "recent games" display. |

### Component Boundary Details

| Component | Input | Output | Side Effects |
|-----------|-------|--------|--------------|
| `convertToSummary()` | `GameState` (full) | `GameSummary` (compact) | None (pure) |
| `useHistoryStore.addGame()` | `GameSummary` | void | Writes to localStorage |
| `getPlayerWinRate()` | `playerId`, `GameSummary[]` | `{ wins, total, rate }` | None (pure) |
| `ScoreTrendChart` | `data: { hole, score }[]` | SVG chart | None (render only) |
| `GameSummaryCard` | `GameSummary` | JSX card | None (render only) |

## Build Order (Dependency-Driven)

The following build order respects dependencies -- each phase only uses what previous phases provide.

### Phase 1: Foundation (Types + History Store + Tests)

**Build:** Extended types (`GameSummary`, `PlayerStats`), history store, `history.ts` conversion functions, `stats.ts` pure functions, state versioning on existing game store.

**Why first:** Every other phase depends on these types and stores. Charts need data. History page needs store. Stats page needs functions. Building data layer first means UI phases can proceed in parallel.

**Dependencies:** None (extends existing types.ts, adds new files).

### Phase 2: Game Completion + History Save

**Build:** "Save to History" action on results page, `convertToSummary()` integration, updated game completion flow.

**Why second:** Connects existing game flow to the new history store. Without this, history is empty and stats/history pages have no data to display.

**Dependencies:** Phase 1 (History Store, types, conversion functions).

### Phase 3: Rich Results (Charts + Pair Breakdowns)

**Build:** shadcn/ui Chart installation, `ScoreTrendChart` component, `PairBreakdown` component, `WinnerSpotlight` component, enhanced results page layout.

**Why third:** Results page is the immediate payoff users see after every round. Charts make the existing data more compelling. Can be built as soon as Phase 1 types exist (uses existing `playerScores` data, not history).

**Dependencies:** Phase 1 (types only -- chart data comes from active game state, not history).

### Phase 4: History Page

**Build:** `/history` route, `GameSummaryCard` component, history list with filtering/sorting.

**Why fourth:** Needs Phase 2 to have data in the history store. Simple read-only page that maps over `games[]`.

**Dependencies:** Phase 1 (types, History Store), Phase 2 (save flow populates history).

### Phase 5: Stats Page

**Build:** `/stats` route, stat computation integration, chart components for cross-round data, player selector.

**Why fifth:** Needs multiple games in history to be meaningful. Most complex UI composition (multiple chart types). Benefits from chart components built in Phase 3.

**Dependencies:** Phase 1 (stats functions, History Store), Phase 2 (populated history), Phase 3 (chart components reused).

### Phase 6: Setup Flow Streamlining

**Build:** Reduce taps in setup wizard, potentially merge handicap+turbo into single step, add preset/quick-start option, remember last players.

**Why sixth:** Improves existing flow quality. Independent of history/stats features. Lower priority than adding new capabilities.

**Dependencies:** None (existing code), but benefits from Phase 1 state versioning for storing player presets.

```
Phase 1: Types + Stores + Pure Functions (foundation)
    ├──→ Phase 2: Game Save Flow (connects game → history)
    │       └──→ Phase 4: History Page (reads history)
    │               └──→ Phase 5: Stats Page (reads history + reuses charts)
    └──→ Phase 3: Rich Results (uses active game data + charts)
                └──→ Phase 5: Stats Page (reuses chart components)

Phase 6: Setup Streamlining (independent, can parallel with 4/5)
```

## Sources

- [Zustand persist middleware documentation](https://zustand.docs.pmnd.rs/middlewares/persist) -- HIGH confidence: official docs on version, migrate, storage options
- [Zustand multiple stores discussion](https://github.com/pmndrs/zustand/discussions/2496) -- HIGH confidence: official repo discussion confirming multiple stores are idiomatic
- [Zustand slices pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern) -- HIGH confidence: official guide, considered but rejected for this use case (separate stores cleaner)
- [shadcn/ui Chart component](https://ui.shadcn.com/docs/components/radix/chart) -- HIGH confidence: official shadcn/ui docs confirming Recharts integration
- [MDN Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) -- HIGH confidence: authoritative reference for localStorage 5 MB limit
- [web.dev Offline data guide](https://web.dev/learn/pwa/offline-data) -- MEDIUM confidence: Google guidance on localStorage vs IndexedDB tradeoffs
- Existing codebase analysis in `.planning/codebase/ARCHITECTURE.md` -- HIGH confidence: direct code inspection

---
*Architecture research for: Golf Handicap Scorer v2 — game history, stats, and richer UI*
*Researched: 2026-02-17*
