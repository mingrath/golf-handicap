# Technology Stack: v1.1 Features

**Project:** Golf Handicap Scorer v1.1
**Researched:** 2026-02-22
**Confidence:** HIGH

## Verdict: No New Libraries Required

All five v1.1 features are implementable with the existing stack. The current dependencies already provide every capability needed. Adding libraries would be unjustified complexity.

This is a "zero-install milestone."

## Feature-by-Feature Stack Analysis

### Feature 1: Extended Stroke Input (beyond preset 3-7)

**Current state:** `StrokeInput` component has `PRESETS = [3, 4, 5, 6, 7]` with +/- buttons for values outside that range. Values 1-2 and 8-20 work but require repeated +/- tapping.

**What's needed:** UI redesign of the stroke input component. Options include expanding the preset row, adding a scrollable number picker, or making the preset range dynamic/configurable.

**Stack requirement:** None. This is a pure component redesign using existing Tailwind CSS and React. The `NumberStepper` component already handles arbitrary min/max ranges with long-press repeat. The challenge is UX design, not technology.

**Considered and rejected:**
| Library | Why Not |
|---------|---------|
| `react-mobile-picker` | Adds 8 KB for a single scroll-wheel widget. Native CSS `scroll-snap-type` + `overflow-y: auto` achieves the same mobile-native feel at zero cost. |
| `@radix-ui/react-slider` | Sliders are poor for discrete integer input (golf strokes are exact whole numbers). Tap-to-select is faster than drag. |
| Custom numpad component library | The component is ~80 lines. A library adds a dependency for something trivially buildable. |

### Feature 2: Editable Scorecard and Handicap on Results Page

**Current state:** The results page already has an editable scorecard (tap cell -> bottom sheet with `NumberStepper` -> resubmit via `submitHoleStrokes`). This is fully functional for stroke editing.

**What's needed for scorecard editing:** Already done. The existing `editingCell` state + `handleStrokeChange` + modal overlay pattern works. May need UX polish (visual feedback, bulk edit mode) but no new capabilities.

**What's needed for handicap editing on results:** Add handicap editing controls similar to `/handicap` page, but inline on the results page. When handicap changes, recalculate all pair results by replaying `submitHoleStrokes` for each hole. The Zustand store's `setHandicap` and `setHandicapHoles` actions already exist. The scoring engine (`calculatePairHoleResult`) is pure and deterministic -- replay is straightforward.

**Stack requirement:** None. The store already has `setHandicap`, `setHandicapHoles`, and `submitHoleStrokes` which supports re-scoring (it filters out existing hole data before recalculating). The `NumberStepper` component is reused for handicap values.

**Key implementation detail:** After handicap change, iterate all `holeStrokes` and re-submit each one. The store's `submitHoleStrokes` already handles "replace existing" logic (lines 233-241 in game-store.ts).

### Feature 3: Editable Scores and Handicap During Play with Cross-Check

**Current state:** The play page lets users navigate to any hole and re-submit scores (the "Update Scores" button). However, there is no way to edit handicaps mid-game, and no cross-check/validation feedback.

**What's needed:**
1. Handicap editing controls accessible from the play page (reuse `NumberStepper` + handicap hole selection UI from `/handicap` page).
2. Cross-check capability: show the impact of a handicap or score change on pair results and running totals before confirming.
3. Visual diff showing "before" vs "after" when editing.

**Stack requirement:** None. Cross-check is a pure function computation: run `calculatePairHoleResult` with the proposed change and compare to current results. Display the diff with existing Tailwind styling. No diff library needed -- the data structures are simple flat objects.

**Architecture note:** The cross-check preview should NOT mutate the store. Compute results in a local `useMemo` and only commit via `submitHoleStrokes` / `setHandicap` when confirmed.

### Feature 4: Score Storytelling with Narrative Highlights

**Current state:** The results page shows rankings, score trend chart, and pair breakdowns. No narrative text.

**What's needed:** A storytelling engine that analyzes game data and generates narrative strings like "Om dominated the back 9, winning 6 of 9 holes" or "The lead changed hands 4 times" or "Biggest turnaround: Ming went from last to first between holes 12-18."

**Stack requirement:** None. This is a pure TypeScript function that takes `PlayerHoleScore[]`, `PairHoleResult[]`, and `Player[]` and returns `StoryHighlight[]`. No NLP, no templating library, no AI API.

**Pattern:** Create a `src/lib/storytelling.ts` module with functions like:
- `detectLeadChanges(playerScores, players)` -> narrative about lead swaps
- `detectStreaks(pairResults, players)` -> consecutive win/loss streaks
- `detectComebacks(playerScores, players)` -> position change narratives
- `detectDominantHoles(pairResults, players)` -> turbo hole impact, clean sweeps
- `generateHighlights(gameState)` -> ranked list of most interesting stories

Each function returns `{ text: string; importance: number; icon: string }`. Sort by importance, display top 3-5.

**Why not an LLM/AI API:** This is an offline PWA. The narratives are formulaic (template strings with data interpolation). An AI API would add latency, cost, and break offline mode for a feature that can be 100% deterministic.

### Feature 5: Lifetime Player-vs-Player Head-to-Head Records

**Current state:** `pair-breakdown.tsx` shows head-to-head for the current game. `stats.ts` computes per-player lifetime stats. `history-db.ts` stores full game snapshots including `pairResults`. The Dexie schema indexes on `completedAt` only.

**What's needed:** Aggregate head-to-head records across all historical games. For any pair of players (matched by normalized name), compute lifetime wins/losses/ties and score differential.

**Stack requirement:** None. Dexie 4's `toArray()` already loads all games, and the `HistoryRecord` includes `pairResults` with full pair-level data per hole. The computation is a map-reduce over `pairResults` across games, grouped by normalized player name pairs.

**Implementation approach:**
1. Add `computeHeadToHead(playerA: string, playerB: string, games: HistoryRecord[])` to `stats.ts`
2. Add `computeAllHeadToHeads(games: HistoryRecord[])` for the full matrix
3. Use `useLiveQuery` in a new hook `useHeadToHead` for reactive updates

**Dexie schema change:** Not needed. The existing schema stores everything required. No new indexes are necessary because the query pattern is "load all games, filter in JS" -- the same pattern `computeAllPlayerStats` already uses. With typical usage (dozens to low hundreds of games), in-memory filtering is instant.

**If the game count exceeds ~1000:** Consider adding a Dexie index on a compound key or a denormalized head-to-head summary table. But this is premature optimization for a casual golf scoring app.

## Existing Stack (Unchanged)

All v1.1 features use these without modification:

| Technology | Version | Role in v1.1 |
|------------|---------|--------------|
| React 19 | 19.2.3 | Component rendering, hooks for local edit state |
| Zustand 5 | 5.0.11 | Game state mutations (score/handicap edits trigger recalculation) |
| Dexie 4 | 4.3.0 | Historical game queries for head-to-head aggregation |
| dexie-react-hooks | 4.2.0 | `useLiveQuery` for reactive head-to-head data |
| Recharts | 2.15.4 | Score trend charts (may add bar chart for head-to-head visualization) |
| Tailwind CSS 4 | 4.x | All new UI components (extended input, edit modals, story cards) |
| shadcn/ui | 3.8.4 | Reuse Dialog, Card primitives for edit overlays |
| lucide-react | 0.563.0 | Icons for new UI elements |
| sonner | 2.0.7 | Toast notifications for edit confirmations |
| html-to-image | 1.11.13 | Share card generation (may include stories) |
| TypeScript 5 | 5.x | Type safety for new interfaces (StoryHighlight, HeadToHeadRecord) |

## Recharts Version Note

The project currently uses Recharts 2.15.4 (not 3.x). The v1.0 STACK.md recommended Recharts 3.x, but `^2.15.4` was installed. For v1.1:

- **Do NOT upgrade to Recharts 3.x.** It would add Redux/RTK/immer as transitive dependencies (+40-50 KB gzipped) for zero user-facing benefit. Recharts 2.15.4 works correctly with React 19 in this project (proven by the existing score trend chart).
- If Recharts 2.x causes issues with React 19 in the future, upgrade to 3.x at that point.

**Confidence:** HIGH -- the score trend chart renders correctly with the current Recharts 2.15.4 + React 19 combination.

## What NOT to Add

| Library | Temptation | Why Not |
|---------|-----------|---------|
| `react-beautiful-dnd` or `@dnd-kit/core` | Drag-to-reorder scores in scorecard | Overkill. Tap-to-edit with a modal is the established pattern. Drag UX on mobile scorecard cells is frustrating, not helpful. |
| `framer-motion` | Animate story card reveals, edit transitions | Tailwind CSS `animate-*` classes + `@keyframes` in global CSS handle all needed animations. The app already uses CSS animations for podium entrance. framer-motion adds 32 KB gzipped. |
| `zod` or `yup` | Validate edited scores/handicaps | The store already validates (lines 113-120, 217-228 in game-store.ts). Adding a schema validation library for 3 simple range checks is overhead. |
| `diff` or `deep-diff` | Cross-check comparison (before/after edit) | The data is flat arrays of numbers. `a !== b` comparisons are trivial. No structural diffing needed. |
| `openai` / `anthropic` SDK | AI-generated storytelling | Breaks offline mode, adds cost and latency. Template-based narratives are deterministic and instant. |
| `date-fns` | Date formatting in head-to-head records | `Intl.DateTimeFormat` handles all needed date formatting. Already proven in `player-stat-card.tsx` (line 7). |
| `lodash` | Utility functions for data aggregation | Native `Array.prototype.reduce/filter/map` covers everything. The codebase already uses these patterns consistently. |
| `react-virtualized` or `@tanstack/virtual` | Virtualize long head-to-head lists | With 2-6 players, there are at most C(6,2)=15 pairs. No virtualization needed. |

## New TypeScript Interfaces (No Library, Just Types)

These interfaces support v1.1 features within the existing `src/lib/types.ts`:

```typescript
/** Score storytelling */
export interface StoryHighlight {
  id: string;
  text: string;
  importance: number; // 1-10, higher = more interesting
  category: "lead_change" | "streak" | "comeback" | "dominance" | "turbo" | "rivalry";
  involvedPlayers: string[]; // player IDs
}

/** Lifetime head-to-head record */
export interface HeadToHeadRecord {
  playerAName: string; // display name
  playerBName: string;
  playerANormalized: string; // for matching
  playerBNormalized: string;
  playerAWins: number;
  playerBWins: number;
  ties: number;
  totalGames: number;
  playerANetScore: number; // cumulative score differential
  playerBNetScore: number;
  lastPlayed: string; // ISO date
  recentResults: ("A" | "B" | "tie")[]; // last 5-10 games
}
```

## New Pure Modules (No Library, Just Code)

| Module | Purpose | Approximate Size |
|--------|---------|-----------------|
| `src/lib/storytelling.ts` | Analyze game data, generate narrative highlights | ~150-200 lines |
| `src/lib/head-to-head.ts` | Compute lifetime H2H from history records | ~80-120 lines |
| `src/lib/recalculate.ts` | Replay all holes after handicap edit (helper) | ~40-60 lines |

## Installation Summary

```bash
# Nothing to install. Zero new dependencies.
```

## Confidence Assessment

| Decision | Confidence | Basis |
|----------|-----------|-------|
| No new libraries needed | HIGH | Full codebase audit, all 5 features mapped to existing capabilities |
| Storytelling as pure functions | HIGH | Game data is deterministic, templates cover all narrative patterns |
| Head-to-head via existing Dexie queries | HIGH | `HistoryRecord` already stores `pairResults`, `useLiveQuery` proven |
| Score/handicap editing via existing store actions | HIGH | `submitHoleStrokes` already supports re-scoring, `setHandicap` exists |
| Extended stroke input via CSS/component only | HIGH | Current `StrokeInput` is 80 lines, redesign is UI work not library work |
| Keep Recharts 2.15.4 | HIGH | Working in production, upgrade to 3.x adds 40-50 KB with no user benefit |

## Sources

- Codebase audit: all source files in `src/` read and analyzed (2026-02-22)
- `package.json` dependencies verified against actual usage
- Existing `game-store.ts` re-scoring capability verified (lines 230-301)
- Existing `stats.ts` player matching pattern verified (normalizePlayerName)
- Existing `history-db.ts` schema verified (stores full pairResults per game)

---
*Stack research for: Golf Handicap Scorer v1.1 -- extended input, editable scores/HC, storytelling, head-to-head*
*Researched: 2026-02-22*
