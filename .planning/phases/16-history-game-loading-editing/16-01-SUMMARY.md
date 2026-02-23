---
phase: 16-history-game-loading-editing
plan: 01
subsystem: game-store
tags: [zustand, indexeddb, dexie, history, game-loading]

# Dependency graph
requires:
  - phase: 12-history-save
    provides: "IndexedDB history-db with HistoryRecord schema and useSaveGame hook"
provides:
  - "loadHistoryGame Zustand action for hydrating past games into active store"
  - "historyId field on GameState for tracking which IndexedDB record is loaded"
  - "History-aware useSaveGame that updates existing records on edit"
affects: [16-02-history-game-loading-editing]

# Tech tracking
tech-stack:
  added: []
  patterns: ["skipNextSave ref pattern to prevent redundant save on state hydration"]

key-files:
  created: []
  modified:
    - src/lib/types.ts
    - src/lib/game-store.ts
    - src/hooks/use-save-game.ts

key-decisions:
  - "Include historyId in localStorage persistence for refresh resilience (not excluded from partialize)"
  - "skipNextSave ref pattern to suppress save-on-load when historyId transitions from null to number"
  - "No persist version bump -- historyId defaults to null/undefined for existing state (additive change)"

patterns-established:
  - "Two-store bridge: IndexedDB HistoryRecord hydrated into Zustand via loadHistoryGame, edits flow back via useSaveGame"
  - "skipNextSave ref pattern: detect state hydration vs real edit by tracking previous historyId value"

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 16 Plan 01: History Game Loading Infrastructure Summary

**loadHistoryGame Zustand action + historyId tracking field + history-aware useSaveGame with skip-on-load pattern**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-23T13:47:42Z
- **Completed:** 2026-02-23T13:49:53Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `historyId: number | null` field to GameState for tracking which IndexedDB record is currently loaded
- Implemented `loadHistoryGame` action that hydrates all game state fields from a HistoryRecord
- Updated useSaveGame hook to route edits to the correct IndexedDB record based on historyId
- Prevented redundant save-on-load with skipNextSave ref pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Add historyId field and loadHistoryGame action** - `6144a0d` (feat)
2. **Task 2: Update useSaveGame for history editing** - `b6b345d` (feat)

## Files Created/Modified
- `src/lib/types.ts` - Added historyId field to GameState interface
- `src/lib/game-store.ts` - Added HistoryRecord import, historyId to initialState, loadHistoryGame action, historyId reset in resetGame
- `src/hooks/use-save-game.ts` - Added history mode branching, skipNextSave pattern, prevHistoryId tracking

## Decisions Made
- **Include historyId in persistence:** Included in localStorage (not excluded from partialize) so that refreshing while viewing a history game preserves the record ID for the save hook. Reset on resetGame.
- **Skip-on-load pattern:** Used skipNextSave ref + prevHistoryId ref to detect when deps change due to hydration vs actual edit, preventing a redundant save when loadHistoryGame fires.
- **No version bump:** historyId is an additive field that defaults to null/undefined for existing persisted state, so no migrate step needed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Two-store bridge infrastructure is complete: load from IndexedDB into Zustand and save edits back
- Ready for Plan 02: UI integration (history page tap-to-load, results page edit mode)
- All 118 existing tests continue to pass

## Self-Check: PASSED

- [x] src/lib/types.ts - FOUND
- [x] src/lib/game-store.ts - FOUND
- [x] src/hooks/use-save-game.ts - FOUND
- [x] 16-01-SUMMARY.md - FOUND
- [x] Commit 6144a0d - FOUND
- [x] Commit b6b345d - FOUND

---
*Phase: 16-history-game-loading-editing*
*Completed: 2026-02-23*
