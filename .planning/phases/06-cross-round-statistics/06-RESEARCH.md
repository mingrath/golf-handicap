# Phase 6: Cross-Round Statistics - Research

**Researched:** 2026-02-17
**Domain:** Cross-game statistics computation, player identity resolution across games, reactive IndexedDB queries, bar/line chart visualization
**Confidence:** HIGH

## Summary

Phase 6 adds a statistics dashboard that computes win rates, average scores, best/worst rounds, and score trends across all saved games in the Dexie IndexedDB history store. The technical surface is: (1) a pure-function stats computation module that derives all metrics from `HistoryRecord[]`, (2) a `/stats` page that uses `useLiveQuery` to reactively read all history records and pass them through the stats functions, and (3) chart/card components reusing the existing shadcn/ui Chart (Recharts) infrastructure from Phase 4.

The **critical design challenge** is **player identity across games**. Each game creates fresh `crypto.randomUUID()` player IDs (established in Phase 5's play-again flow and confirmed throughout the codebase). The same real person playing five games has five different UUIDs. The only stable identifier across games is the **player name string**. This means cross-round stats MUST match players by name. Name matching should be case-insensitive and whitespace-trimmed to handle minor inconsistencies (e.g., "Alice" vs "alice" vs " Alice "). This is an acceptable tradeoff for a casual scoring app -- the user controls player names and they tend to be consistent because of the play-again flow which copies names from the previous game.

The data layer is already ideal for this: every `HistoryRecord` stores `rankings[]` with `playerName` and `totalScore`, plus `winnerId` / `winnerName` for quick winner lookups. The full state snapshot (`playerScores`, `pairResults`) is also available for advanced per-hole stats, though the requirements (HIST-03) only ask for win rate, average score, and best/worst rounds -- all derivable from `rankings[]` alone.

**Primary recommendation:** Create a `src/lib/stats.ts` module with pure functions that take `HistoryRecord[]` and return computed stats per player. Use `useLiveQuery` to fetch all games and compute stats reactively (auto-updates when new games are saved). Build the dashboard at `/stats` with stat cards for each player and a bar chart for win rates. Reuse `ChartContainer` from shadcn/ui chart. No new dependencies needed -- everything is already installed.

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dexie | ^4.3.0 | IndexedDB wrapper for reading history records | Already installed; `historyDb.games.toArray()` provides all records |
| dexie-react-hooks | ^4.2.0 | `useLiveQuery` for reactive stats that auto-update | Already installed; stats page auto-refreshes when new games are saved |
| recharts | ^2.15.4 | Bar chart for win rates, line chart for score trends | Already installed via shadcn chart (Phase 4) |
| zustand | ^5.0.11 | Not directly used in stats page, but history is separate from game store | Already installed |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.563.0 | Icons for stat cards (Trophy, TrendingUp, Target, etc.) | Stat card visual indicators |
| tailwindcss | ^4 | Styling stat cards, dashboard layout | All UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure functions for stats | A stats Zustand store | Adds unnecessary caching layer; stats are derived data and should be computed fresh from history. Pure functions are simpler, testable, and never stale. |
| Player name matching | Adding persistent player IDs to a separate "players" table | Over-engineering for a casual app; names work fine when users control them. A players table would require registration UX, migration, and linking -- all for marginal benefit. |
| `useLiveQuery` with full computation | Separate `useEffect` + `useState` | `useLiveQuery` already handles the async read + re-render pattern. Wrapping stats computation inside it means stats auto-update when any game is added/deleted. Simpler than manual effect management. |

**Installation:**
```bash
# No installation needed -- all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── stats.ts                  # NEW: Pure functions for cross-round stats
│   ├── history-db.ts             # EXISTING: Dexie database (read by stats page)
│   ├── scoring.ts                # EXISTING: Per-game scoring (not needed for stats)
│   └── types.ts                  # EXISTING: May add PlayerStats interface
├── app/
│   ├── stats/page.tsx            # NEW: Stats dashboard page
│   └── page.tsx                  # EXISTING: Add "View Stats" link (like "View Game History")
├── components/
│   ├── stats/                    # NEW: Stats-specific components
│   │   ├── player-stat-card.tsx  # NEW: Per-player stat summary card
│   │   └── win-rate-chart.tsx    # NEW: Bar chart showing win rates
│   └── ui/
│       └── chart.tsx             # EXISTING: shadcn chart wrapper (reuse)
└── hooks/
    └── use-player-stats.ts       # NEW: Hook that wraps useLiveQuery + stats computation
```

### Pattern 1: Player Identity Resolution by Name
**What:** Normalize player names across games to create a stable cross-game identity. Use case-insensitive, trimmed name matching.
**When to use:** Any time you need to aggregate data for the same real person across multiple games.
**Example:**
```typescript
// src/lib/stats.ts
function normalizePlayerName(name: string): string {
  return name.trim().toLowerCase();
}

function getUniquePlayerNames(games: HistoryRecord[]): string[] {
  const nameSet = new Map<string, string>(); // normalized -> display name
  for (const game of games) {
    for (const player of game.players) {
      const key = normalizePlayerName(player.name);
      if (!nameSet.has(key)) {
        nameSet.set(key, player.name); // keep first occurrence as display name
      }
    }
  }
  return Array.from(nameSet.values());
}
```

### Pattern 2: Derived Stats via Pure Functions
**What:** All stats are computed from `HistoryRecord[]` by pure functions. No caching, no separate store.
**When to use:** When source data is small enough for instant computation (sub-millisecond for hundreds of games).
**Example:**
```typescript
// src/lib/stats.ts
export interface PlayerStats {
  displayName: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;         // 0-1
  avgScore: number;
  bestRound: { score: number; date: string } | null;
  worstRound: { score: number; date: string } | null;
  scoreTrend: { date: string; score: number }[];
}

export function computePlayerStats(
  playerName: string,
  games: HistoryRecord[]
): PlayerStats {
  const normalizedTarget = normalizePlayerName(playerName);
  const played = games.filter((g) =>
    g.rankings.some((r) => normalizePlayerName(r.playerName) === normalizedTarget)
  );

  let wins = 0;
  let totalScore = 0;
  let best: { score: number; date: string } | null = null;
  let worst: { score: number; date: string } | null = null;
  const trend: { date: string; score: number }[] = [];

  for (const game of played) {
    const ranking = game.rankings.find(
      (r) => normalizePlayerName(r.playerName) === normalizedTarget
    )!;
    if (ranking.rank === 1) wins++;
    totalScore += ranking.totalScore;

    const entry = { score: ranking.totalScore, date: game.completedAt };
    trend.push(entry);

    if (!best || ranking.totalScore > best.score) best = entry;
    if (!worst || ranking.totalScore < worst.score) worst = entry;
  }

  return {
    displayName: playerName,
    gamesPlayed: played.length,
    wins,
    winRate: played.length > 0 ? wins / played.length : 0,
    avgScore: played.length > 0 ? totalScore / played.length : 0,
    bestRound: best,
    worstRound: worst,
    scoreTrend: trend, // chronological (games are sorted by completedAt desc, reverse for chrono)
  };
}
```

### Pattern 3: useLiveQuery for Reactive Stats
**What:** Wrap the entire stats computation inside `useLiveQuery` so the dashboard auto-updates when new games are saved (even from a different tab).
**When to use:** On the stats page, so adding a game and navigating to stats shows updated numbers without refresh.
**Example:**
```typescript
// src/hooks/use-player-stats.ts
import { useLiveQuery } from "dexie-react-hooks";
import { historyDb } from "@/lib/history-db";
import { computeAllPlayerStats, type PlayerStats } from "@/lib/stats";

export function usePlayerStats(): PlayerStats[] | null {
  return useLiveQuery(
    async () => {
      const games = await historyDb.games
        .orderBy("completedAt")
        .reverse()
        .toArray();
      return computeAllPlayerStats(games);
    },
    [],
    null // null while loading (progressive enhancement)
  );
}
```
**Key insight:** `useLiveQuery` can return any computed value, not just raw table data. The querier function does `toArray()` + pure computation, and Dexie's reactivity system tracks which tables were read. When `games` table changes, the query re-runs and stats update.

### Pattern 4: Reusing shadcn Chart for Bar Charts
**What:** Use Recharts `BarChart` inside shadcn's `ChartContainer` for the win rate visualization, following the same pattern as the `ScoreTrendChart` from Phase 4.
**When to use:** Any discrete comparison chart (win rates per player, average scores per player).
**Example:**
```typescript
// src/components/stats/win-rate-chart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface WinRateChartProps {
  data: { name: string; winRate: number; wins: number; games: number }[];
}

const chartConfig: ChartConfig = {
  winRate: { label: "Win Rate", color: "hsl(142, 71%, 45%)" },
};

export function WinRateChart({ data }: WinRateChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "rgba(148, 163, 184, 0.7)", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgba(148, 163, 184, 0.7)", fontSize: 12 }} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="winRate" fill="var(--color-winRate)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
```

### Anti-Patterns to Avoid
- **Matching players by UUID across games:** Player IDs are per-game UUIDs. NEVER try to match by ID across games. Use name matching.
- **Creating a stats Zustand store:** Stats are derived data. A store adds a cache invalidation problem (when does it update?). Pure functions computed inside `useLiveQuery` are always fresh.
- **Loading all games on the home page for stats:** The home page already uses `useLiveQuery` for the latest game. Adding a full `toArray()` just to show a stats badge would slow home page render. Stats computation should only happen on the `/stats` page.
- **Iterating HistoryRecord.playerScores for basic stats:** The `rankings[]` field already contains `totalScore` and `rank` per player per game. For HIST-03 requirements (win rate, average score, best/worst), you only need `rankings[]`. Don't traverse the much larger `playerScores[]` unless adding per-hole stats (out of scope).
- **Adding Dexie indexes for player name:** Player names are stored inside nested arrays (`rankings[].playerName`). Dexie's indexing works on top-level fields, not nested array properties. All filtering must be done client-side after `toArray()`. This is fine -- the dataset is small.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bar chart with axes and labels | Custom SVG bar chart | Recharts `BarChart` via shadcn `ChartContainer` | Already installed and proven in Phase 4; handles responsive sizing, tooltips, axis formatting |
| Reactive IndexedDB reads | Custom `addEventListener` + `useState` | `useLiveQuery` from dexie-react-hooks | Already installed; handles cross-tab updates, re-renders on data change |
| Player name normalization | No normalization (exact match) | `trim().toLowerCase()` utility | Handles "Alice" vs "alice" vs " Alice " -- common input variations |
| Score trend line chart | New chart component from scratch | Reuse/adapt `ScoreTrendChart` pattern from Phase 4 | Same ChartContainer + LineChart pattern, just with different data shape |

**Key insight:** Phase 6 requires NO new npm dependencies. Everything needed is already installed: Dexie for data access, Recharts for charts, shadcn chart wrapper for theming, Lucide for icons. The entire phase is pure functions + UI components.

## Common Pitfalls

### Pitfall 1: Player Name Collisions in Multi-Player Groups
**What goes wrong:** Two different real people with the same name (e.g., two friends both named "Mike") get their stats merged, showing inflated game counts and averaged-out win rates.
**Why it happens:** Name-based identity has no disambiguation mechanism.
**How to avoid:** This is an accepted limitation for a casual app. Document it. In the unlikely case, users can differentiate by adding a last initial ("Mike A", "Mike B"). The play-again flow preserves exact names, so this is consistent within a friend group. Do NOT add a complex player registration system to solve a rare edge case.
**Warning signs:** A player's games-played count exceeds what the user expects.

### Pitfall 2: Empty State Causes Division by Zero
**What goes wrong:** Computing `winRate = wins / gamesPlayed` when `gamesPlayed === 0` produces `NaN` or `Infinity`, which propagates to chart rendering and causes blank or broken charts.
**Why it happens:** The stats page can be visited before any games are completed, or a player may appear in zero games after filtering.
**How to avoid:** Guard every division with `gamesPlayed > 0 ? ... : 0`. The stats functions should return `0` for rates/averages when there are no games. The stats page should show an empty state ("Play some games to see your stats") when no history exists.
**Warning signs:** `NaN` appearing in stat cards or chart tooltips.

### Pitfall 3: useLiveQuery Returns null Before First Query
**What goes wrong:** The stats page crashes on first render because it tries to `.map()` over `null` (the default value before `useLiveQuery` resolves).
**Why it happens:** `useLiveQuery` returns its default value synchronously on first render, then the async query resolves and triggers a re-render.
**How to avoid:** Use `null` as default and render a lightweight fallback (empty state or nothing) when stats are `null`. This is the progressive enhancement pattern established in Phase 5. Do NOT use `[]` as default if the return type is `PlayerStats[]`, because an empty array means "computed but no data" while `null` means "not yet loaded".
**Warning signs:** TypeErrors on first render; "Cannot read properties of null" in console.

### Pitfall 4: Score Trend Chart Has Only One Data Point
**What goes wrong:** A player who has played only one game has a "score trend" with a single point, which renders as a dot (not a line) in Recharts LineChart.
**Why it happens:** Recharts needs at least two data points to draw a line.
**How to avoid:** Hide the score trend chart for players with fewer than 2 games. Show a message like "Play more rounds to see trends" instead. Alternatively, still show the single point but as a dot marker, not a line.
**Warning signs:** A tiny dot where a trend line should be, confusing users.

### Pitfall 5: Games Sorted in Wrong Direction for Trend
**What goes wrong:** The score trend chart shows scores in reverse chronological order (newest on the left), which is counterintuitive for a "trend over time" visualization.
**Why it happens:** The history query returns games in reverse chronological order (newest first) for the history list page. If the same order is passed to the trend chart, the x-axis is backwards.
**How to avoid:** Always reverse/sort the trend data into chronological order (oldest first) before passing to the chart. The `computePlayerStats` function should return `scoreTrend` in chronological order.
**Warning signs:** Users see their trend going "backwards" over time.

### Pitfall 6: Navigation to Stats Page Not Discoverable
**What goes wrong:** Users don't know the stats page exists because there's no link to it.
**Why it happens:** The `/stats` route is created but no navigation entry is added.
**How to avoid:** Add a "View Stats" link on the home page (alongside "View Game History") and optionally on the history page. Only show the link when history has games (same progressive enhancement pattern as play-again button).
**Warning signs:** Zero traffic to the stats page despite completed games.

## Code Examples

Verified patterns from existing codebase and official sources:

### Stats Computation Core
```typescript
// src/lib/stats.ts
import type { HistoryRecord } from "./history-db";

export interface PlayerStats {
  displayName: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  avgScore: number;
  bestRound: { score: number; date: string } | null;
  worstRound: { score: number; date: string } | null;
  scoreTrend: { date: string; score: number }[];
}

function normalizePlayerName(name: string): string {
  return name.trim().toLowerCase();
}

export function getUniquePlayerNames(games: HistoryRecord[]): string[] {
  const nameMap = new Map<string, string>();
  for (const game of games) {
    for (const player of game.players) {
      const key = normalizePlayerName(player.name);
      if (!nameMap.has(key)) {
        nameMap.set(key, player.name);
      }
    }
  }
  return Array.from(nameMap.values());
}

export function computePlayerStats(
  playerName: string,
  games: HistoryRecord[]
): PlayerStats {
  const normalized = normalizePlayerName(playerName);
  const played = games.filter((g) =>
    g.rankings.some((r) => normalizePlayerName(r.playerName) === normalized)
  );

  let wins = 0;
  let totalScore = 0;
  let best: { score: number; date: string } | null = null;
  let worst: { score: number; date: string } | null = null;
  const trend: { date: string; score: number }[] = [];

  for (const game of played) {
    const ranking = game.rankings.find(
      (r) => normalizePlayerName(r.playerName) === normalized
    )!;
    if (ranking.rank === 1) wins++;
    totalScore += ranking.totalScore;
    const entry = { score: ranking.totalScore, date: game.completedAt };
    trend.push(entry);
    if (!best || ranking.totalScore > best.score) best = entry;
    if (!worst || ranking.totalScore < worst.score) worst = entry;
  }

  // Sort trend chronologically (oldest first)
  trend.sort((a, b) => a.date.localeCompare(b.date));

  return {
    displayName: playerName,
    gamesPlayed: played.length,
    wins,
    winRate: played.length > 0 ? wins / played.length : 0,
    avgScore: played.length > 0 ? totalScore / played.length : 0,
    bestRound: best,
    worstRound: worst,
    scoreTrend: trend,
  };
}

export function computeAllPlayerStats(games: HistoryRecord[]): PlayerStats[] {
  const names = getUniquePlayerNames(games);
  return names
    .map((name) => computePlayerStats(name, games))
    .sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed);
}
```

### Reactive Stats Hook
```typescript
// src/hooks/use-player-stats.ts
import { useLiveQuery } from "dexie-react-hooks";
import { historyDb } from "@/lib/history-db";
import { computeAllPlayerStats, type PlayerStats } from "@/lib/stats";

export function usePlayerStats(): PlayerStats[] | null {
  return useLiveQuery(
    async () => {
      const games = await historyDb.games
        .orderBy("completedAt")
        .reverse()
        .toArray();
      if (games.length === 0) return [];
      return computeAllPlayerStats(games);
    },
    [],
    null
  );
}
```

### Win Rate Bar Chart (Recharts via shadcn)
```typescript
// Follows exact same pattern as ScoreTrendChart from Phase 4
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const chartConfig: ChartConfig = {
  winRate: { label: "Win Rate", color: "hsl(142, 71%, 45%)" },
};

// data shape: [{ name: "Alice", winRate: 0.75 }, { name: "Bob", winRate: 0.25 }]
<ChartContainer config={chartConfig} className="h-[200px] w-full">
  <BarChart data={data}>
    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "rgba(148, 163, 184, 0.7)", fontSize: 12 }} />
    <YAxis tickLine={false} axisLine={false} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fill: "rgba(148, 163, 184, 0.7)", fontSize: 12 }} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="winRate" fill="var(--color-winRate)" radius={[4, 4, 0, 0]} />
  </BarChart>
</ChartContainer>
```

### Stat Card Component
```typescript
// Follows glass-card pattern established throughout the app
<div className="glass-card p-4">
  <div className="flex items-center gap-2 mb-1">
    <Trophy className="h-4 w-4 text-amber-400" />
    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Win Rate</span>
  </div>
  <div className="text-2xl font-bold text-white tabular-nums">
    {Math.round(stats.winRate * 100)}%
  </div>
  <div className="text-xs text-slate-500 mt-1">
    {stats.wins} wins in {stats.gamesPlayed} games
  </div>
</div>
```

## Existing Codebase Integration Points

### 1. `historyDb.games` (history-db.ts)
The Dexie database already stores all completed games with `HistoryRecord` type. Stats page reads from this table via `useLiveQuery`. No schema changes needed.

### 2. `HistoryRecord.rankings[]` (history-db.ts:14-19)
Each record has pre-computed rankings with `playerName`, `totalScore`, and `rank`. This is the primary data source for stats -- no need to recompute rankings from raw `playerScores`.

### 3. `HistoryRecord.winnerId` / `winnerName` (history-db.ts:20-21)
Quick winner identification without scanning `rankings[]`. Useful for win count computation.

### 4. Home page (page.tsx)
Currently shows "View Game History" link when `latestGame` is available. The "View Stats" link should follow the same pattern -- show only when history exists.

### 5. `ScoreTrendChart` (components/results/score-trend-chart.tsx)
The existing line chart component demonstrates the Recharts + shadcn ChartContainer pattern. The cross-round score trend chart should follow the same structure but with a different data shape (dates on x-axis instead of hole numbers).

### 6. `glass-card` CSS class (globals.css:159-165)
All cards in the app use this class. Stat cards should too, for visual consistency.

### 7. Color conventions (Phase 4 decision)
- Emerald (`hsl(142, 71%, 45%)`) = positive/winning
- Rose (`hsl(350, 89%, 60%)`) = negative/losing
- Slate = neutral/tie
These colors should be used consistently in stat cards (e.g., win rate in emerald, worst round in rose).

## Data Model Analysis

### What HistoryRecord Provides (sufficient for HIST-03)
```typescript
interface HistoryRecord {
  id?: number;
  completedAt: string;          // Date for trend x-axis
  players: { id, name }[];      // Player names for identity resolution
  numberOfHoles: number;         // For context display
  rankings: {
    playerId: string;
    playerName: string;          // Cross-game identity key
    totalScore: number;          // For avg, best, worst computation
    rank: number;                // rank === 1 means winner
  }[];
  winnerId: string;
  winnerName: string;            // Quick winner check
  // Full snapshot below -- NOT needed for basic stats
  config: GameConfig;
  holeStrokes: HoleStrokes[];
  pairResults: PairHoleResult[];
  playerScores: PlayerHoleScore[];
}
```

### What Stats Need from Each Game
| Stat | Data Source | Computation |
|------|------------|-------------|
| Games played | `rankings[].playerName` match | Count of games containing the player |
| Win rate | `rankings[].rank === 1` | wins / gamesPlayed |
| Average score | `rankings[].totalScore` | sum(totalScore) / gamesPlayed |
| Best round | `rankings[].totalScore` | max(totalScore) across games |
| Worst round | `rankings[].totalScore` | min(totalScore) across games |
| Score trend | `rankings[].totalScore` + `completedAt` | Array of {date, score} sorted chronologically |

All derivable from `rankings[]` + `completedAt` -- no need to access the full state snapshot.

## Performance Analysis

### Data Volume Estimates
| Games | Approx. Records Size | toArray() Time | Stats Computation Time |
|-------|---------------------|----------------|----------------------|
| 10 | ~50 KB | <5ms | <1ms |
| 100 | ~500 KB | <20ms | <2ms |
| 500 | ~2.5 MB | <50ms | <5ms |
| 1000 | ~5 MB | <100ms | <10ms |

**Conclusion:** Even at 1000 games, the total time (IndexedDB read + stats computation) is well under 200ms. No pagination, windowing, or web worker needed. `useMemo` inside `useLiveQuery` is unnecessary since the query itself already acts as the memoization boundary.

### Optimization If Needed (NOT recommended for v1)
- Add a `completedAt` range filter to only load recent games (last 50)
- Pre-compute stats on game save and store in a separate Dexie table
- Move stats computation to a Web Worker

None of these are needed for the expected dataset size.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand localStorage for history + manual stats recomputation | Dexie IndexedDB + useLiveQuery for reactive stats | Phase 5 decision (2026-02-17) | Stats auto-update across tabs; no 5MB limit concern |
| Architecture research suggested Zustand history store | Implemented as Dexie IndexedDB | Phase 5 implementation | Full state snapshot stored (no compact summary needed); richer data for stats |
| Player identity by UUID | Player identity by name (UUID is per-game) | Play-again flow decision (Phase 5) | Cross-round stats must use name matching |

**Deprecated/outdated:**
- The ARCHITECTURE.md research suggested a Zustand-based history store with compact `GameSummary`. Phase 5 actually implemented Dexie with full `HistoryRecord` snapshots. The stats phase should work with the actual Dexie implementation, not the architecture research proposal.

## Open Questions

1. **Should ties in win rate (rank 1 shared by multiple players) count as a win for all tied players?**
   - What we know: `getFinalRankings` assigns `rank: 1` to all players tied at the top. So a game where Alice and Bob both have +5 gives both `rank: 1`.
   - What's unclear: Should both count as "wins" for win rate? Or should ties be tracked separately?
   - Recommendation: Count rank === 1 as a win, even if shared. In casual golf scoring, a tie at the top feels like a win for both. This keeps the computation simple and the metric intuitive. If the user sees "3 wins in 5 games" and one was a tie, that still feels correct.

2. **Should the stats page show head-to-head records between specific player pairs across games?**
   - What we know: HIST-03 requires "win rate per player, average score, best/worst rounds." It does not mention head-to-head.
   - What's unclear: Whether users would find cross-round head-to-head valuable.
   - Recommendation: Out of scope for HIST-03. The per-game pair breakdown already exists on the results page (Phase 4). Cross-round head-to-head would require scanning `pairResults` across all games and matching pair names -- feasible but not required.

3. **Where should the stats link appear in navigation?**
   - What we know: "View Game History" is on the home page, shown when `latestGame` exists.
   - What's unclear: Should stats be a separate page, a tab on the history page, or accessible from both?
   - Recommendation: Separate `/stats` route with a "View Stats" link on the home page (below "View Game History"). Also add a link/button on the history page for discoverability. This matches the existing navigation pattern.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/lib/history-db.ts` -- HistoryRecord type with rankings[], winnerId, winnerName, full state snapshot
- Codebase inspection: `src/app/history/page.tsx` -- useLiveQuery pattern with toArray() and default value
- Codebase inspection: `src/app/page.tsx` -- useLiveQuery for latest game, progressive enhancement pattern
- Codebase inspection: `src/components/results/score-trend-chart.tsx` -- Recharts LineChart via shadcn ChartContainer (established chart pattern)
- Codebase inspection: `src/components/results/pair-breakdown.tsx` -- glass-card pattern, emerald/rose color convention
- Codebase inspection: `src/hooks/use-save-game.ts` -- Confirms HistoryRecord stores rankings with playerName and totalScore
- Codebase inspection: `src/lib/scoring.ts` -- getFinalRankings assigns rank with tie handling
- Phase 5 research and summaries -- Dexie patterns, useLiveQuery defaults, progressive enhancement
- Phase 4 research and summaries -- shadcn chart, Recharts BarChart/LineChart, color conventions

### Secondary (MEDIUM confidence)
- [Dexie.js liveQuery() documentation](https://dexie.org/docs/liveQuery()) -- Reactive query re-execution on table changes
- [Dexie.js useLiveQuery() documentation](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) -- Hook API, default value parameter
- [shadcn/ui Bar Charts](https://ui.shadcn.com/charts/bar) -- BarChart examples with ChartContainer
- [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/radix/chart) -- ChartConfig, ChartTooltip composition pattern

### Tertiary (LOW confidence)
- Performance estimates for toArray() on large datasets -- based on general IndexedDB benchmarks, not measured in this specific app. Actual performance may vary by device.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies; all libraries already installed and proven in previous phases
- Architecture: HIGH -- Pure function stats module is well-understood pattern; useLiveQuery reactive reads verified by existing codebase usage; player name matching is the only viable cross-game identity strategy given UUID-per-game design
- Pitfalls: HIGH -- Name collision and empty state issues are obvious; division by zero is a classic stats bug; sort direction verified by checking existing query order
- Code examples: HIGH -- Derived directly from existing codebase patterns (ScoreTrendChart, pair-breakdown, useLiveQuery usage on home/history pages)

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable domain -- no new library features needed)
