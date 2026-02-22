# Architecture Patterns: v1.1

**Domain:** Golf scoring PWA -- UX fixes and insight features
**Researched:** 2026-02-22

## Existing Architecture (Preserved)

The v1.0 two-store architecture remains unchanged:

```
Zustand (localStorage)          Dexie (IndexedDB)
+-----------------------+       +------------------------+
| Live game state       |       | Completed game history  |
| - config (players,    | save  | - Full state snapshots  |
|   handicaps, turbo)   | ----> | - Rankings              |
| - holeStrokes[]       |       | - Indexed by date       |
| - pairResults[]       |       +------------------------+
| - playerScores[]      |
| - currentHole         |
+-----------------------+
```

**Data flow:** Setup -> Play (Zustand mutations) -> Complete -> Save to Dexie -> Results (read from Zustand) -> Stats (read from Dexie)

## v1.1 Architecture Additions

### 1. Hole Replay Mechanism

**Problem:** When handicaps change mid-game or post-game, all pair results and player scores must be recalculated from scratch because handicap adjustments affect every hole where the handicap is applied.

**Pattern: Command Replay**

The `holeStrokes[]` array is the "event log." Pair results and player scores are derived state. To recalculate after a handicap change:

```
Input:  holeStrokes[] (immutable raw data) + new handicaps
Output: new pairResults[] + new playerScores[]
```

```typescript
// src/lib/recalculate.ts
export function recalculateAllResults(
  config: GameConfig,  // with updated handicaps
  holeStrokes: HoleStrokes[]
): { pairResults: PairHoleResult[]; playerScores: PlayerHoleScore[] }
```

This function replays the scoring engine for every hole in order, building up running totals. It does NOT mutate the store -- it returns pure data. The caller decides whether to commit.

**Why not re-submit through the store:** The store's `submitHoleStrokes` has side effects (toast notifications, undo snapshots). Replay should be silent and atomic -- compute everything, then batch-update the store once.

**Store integration:** Add a new action `replaceAllResults(pairResults, playerScores)` that does a single atomic state update without the per-hole side effects.

### 2. Cross-Check Preview

**Problem:** When editing a score or handicap, the user wants to see the impact before confirming.

**Pattern: Preview Computation (No State Mutation)**

```
Current State ----+
                  |---> computePreview() ---> PreviewDiff
Proposed Change --+
```

```typescript
// Preview is computed in component via useMemo, never touches the store
const preview = useMemo(() => {
  if (!proposedChange) return null;
  const hypotheticalConfig = applyChange(config, proposedChange);
  const newResults = recalculateAllResults(hypotheticalConfig, holeStrokes);
  return computeDiff(currentResults, newResults);
}, [proposedChange, config, holeStrokes, currentResults]);
```

The diff output is simple: for each player, `{ before: number, after: number, delta: number }` for total score and rank.

### 3. Storytelling Engine

**Pattern: Analyzer Pipeline**

```
Game Data ---> [Analyzer 1] ---> StoryHighlight[]
           |-> [Analyzer 2] ---> StoryHighlight[]
           |-> [Analyzer 3] ---> StoryHighlight[]
           |-> ...
           |
           +-> Sort by importance ---> Top N highlights
```

Each analyzer is a pure function with the signature:
```typescript
type StoryAnalyzer = (
  players: Player[],
  playerScores: PlayerHoleScore[],
  pairResults: PairHoleResult[],
  config: GameConfig
) => StoryHighlight[];
```

Analyzers are independent and composable. Adding new story types means adding a new analyzer function, not modifying existing ones.

**Registration:**
```typescript
const analyzers: StoryAnalyzer[] = [
  detectLeadChanges,
  detectStreaks,
  detectComebacks,
  detectDominantHoles,
  detectTurboImpact,
  detectRivalries,
];

export function generateHighlights(gameState: GameState): StoryHighlight[] {
  return analyzers
    .flatMap(fn => fn(gameState.config.players, gameState.playerScores, gameState.pairResults, gameState.config))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5);
}
```

### 4. Head-to-Head Aggregation

**Pattern: Cross-Game Name Matching + Map-Reduce**

```
Dexie games[] ---> for each game:
                     for each pairResult:
                       normalize names ---> Map<PairKey, HeadToHeadRecord>
                   ---> aggregate wins/losses/ties per pair
```

Uses the existing `normalizePlayerName()` from `stats.ts` for case-insensitive cross-game matching.

**Key concern: Name collisions.** If two different players named "Om" play in different groups, they will be merged. This is the same limitation v1.0 stats already has. Acceptable for the friend-group use case. Document as a known limitation.

**Pair key for cross-game matching:** Sort normalized names alphabetically, join with `::`. This is consistent with the intra-game `makePairKey` pattern but uses names instead of IDs (because IDs are per-game UUIDs).

```typescript
function makeLifetimePairKey(nameA: string, nameB: string): string {
  const [a, b] = [normalizePlayerName(nameA), normalizePlayerName(nameB)].sort();
  return `${a}::${b}`;
}
```

### 5. Edit Flow on Results Page (Handicap)

**Pattern: Edit Mode Toggle + Deferred Commit**

```
Results Page
  |
  +-- [Edit Handicaps] button
  |     |
  |     v
  |   Edit Mode overlay/section
  |     - NumberStepper per pair (reuses handicap page UI)
  |     - Handicap hole selection grid
  |     - Live preview diff (cross-check)
  |     |
  |     +-- [Apply Changes] --> recalculateAllResults() --> replaceAllResults() --> re-save to Dexie
  |     +-- [Cancel] --> discard changes
  |
  +-- Rankings, Charts, Stories (all re-render from store)
```

**History re-save concern:** When editing a completed game, the Dexie record must be updated. The current `useSaveGame` hook saves once on completion. For edits, add an `updateSavedGame` function that overwrites the existing record by ID.

```typescript
// history-db.ts addition
export async function updateLatestGame(updates: Partial<HistoryRecord>) {
  const latest = await historyDb.games.orderBy('completedAt').last();
  if (latest?.id) {
    await historyDb.games.update(latest.id, updates);
  }
}
```

### 6. Edit Flow on Play Page (Handicap)

**Pattern: Slide-Up Panel**

```
Play Page
  |
  +-- [Handicap] button in header or footer
  |     |
  |     v
  |   Bottom sheet / full-screen overlay
  |     - Same handicap editing UI as /handicap page
  |     - Cross-check preview: "This changes Hole 3, 7, 12 results"
  |     |
  |     +-- [Apply] --> recalculateAllResults() --> replaceAllResults()
  |     +-- [Cancel] --> dismiss
  |
  +-- Play continues with updated handicaps
```

## Component Boundaries

| Component | Responsibility | v1.1 Changes |
|-----------|---------------|-------------|
| `StrokeInput` | Per-player stroke entry for a single hole | Redesign preset row, add extended range support |
| `NumberStepper` | Generic +/- numeric control | No changes needed |
| `PairBreakdown` | Per-pair H2H for current game | Add lifetime H2H data prop |
| `ScoreTrendChart` | Line chart of running totals | No changes needed |
| `WinnerPodium` | Animated winner display | No changes needed |
| `ShareResultsCard` | Capturable share image | Add story highlight text |
| **NEW: `HandicapEditor`** | Inline handicap editing (shared between play/results) | Extract from `/handicap` page into reusable component |
| **NEW: `StoryHighlights`** | Display narrative highlights | Renders `StoryHighlight[]` as styled cards |
| **NEW: `LifetimeHeadToHead`** | Cross-game H2H display | Shows lifetime records per pair |
| **NEW: `CrossCheckPreview`** | Before/after diff for edits | Shows score impact of proposed change |

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mutating Store for Preview
**What:** Computing cross-check by temporarily modifying Zustand state, then reverting.
**Why bad:** Creates flicker, potential race conditions, undo snapshot corruption.
**Instead:** Compute preview as pure function output in `useMemo`. Never touch the store until user confirms.

### Anti-Pattern 2: Duplicating Scoring Logic
**What:** Writing separate calculation code for replay vs. normal play.
**Why bad:** Logic drift -- if scoring rules change, two places need updating.
**Instead:** `recalculateAllResults` calls the same `calculatePairHoleResult` and `calculatePlayerHoleScores` from `scoring.ts`.

### Anti-Pattern 3: Storing Derived Data in Dexie
**What:** Adding separate H2H summary records to IndexedDB.
**Why bad:** Dual source of truth. Summary gets stale if games are edited/deleted.
**Instead:** Compute H2H on-the-fly from raw game records. With <1000 games, this is instant.

### Anti-Pattern 4: Fat Story Components
**What:** Putting narrative detection logic inside React components.
**Why bad:** Untestable, re-runs on every render, mixes concerns.
**Instead:** Pure `storytelling.ts` module. Components just render `StoryHighlight[]`.

## Data Flow Changes

### Before v1.1:
```
submitHoleStrokes(strokes) --> calculate pairs --> update store
```

### After v1.1:
```
submitHoleStrokes(strokes) --> calculate pairs --> update store  (unchanged for normal play)

editHandicap(change) --> recalculateAllResults(newConfig, allStrokes) --> replaceAllResults(results)  (new path for edits)

previewEdit(change) --> recalculateAllResults(hypotheticalConfig, allStrokes) --> render diff  (new path for preview, no store mutation)
```

## Sources

- Codebase architecture analysis of `game-store.ts`, `scoring.ts`, `history-db.ts`
- Component structure audit of all `src/components/` files
- Zustand persist middleware behavior verification

---
*Architecture research for: Golf Handicap Scorer v1.1*
*Researched: 2026-02-22*
