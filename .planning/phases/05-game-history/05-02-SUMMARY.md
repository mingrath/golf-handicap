---
phase: 05-game-history
plan: 02
subsystem: ui
tags: [dexie-react-hooks, useLiveQuery, history, play-again, indexeddb, react]

# Dependency graph
requires:
  - phase: 05-game-history
    plan: 01
    provides: historyDb singleton, HistoryRecord type, dexie-react-hooks
  - phase: 01-foundation
    provides: game-store with resetGame, setPlayers, setNumberOfHoles actions
provides:
  - /history page with reverse-chronological game list
  - Play Again button on home page using latest game from IndexedDB
  - View Game History navigation link on home page
affects: [future-stats-phase, future-game-detail-view]

# Tech tracking
tech-stack:
  added: []
  patterns: [useLiveQuery for reactive IndexedDB reads, progressive enhancement with null default]

key-files:
  created:
    - src/app/history/page.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "useLiveQuery with null default for progressive enhancement -- home page renders immediately, play-again appears when data arrives"
  - "Play Again hidden when hasActiveGame is true -- resume card takes priority over rematch shortcut"
  - "Fresh crypto.randomUUID() for play-again players -- never reuse old player IDs to avoid history data corruption"

patterns-established:
  - "Progressive IndexedDB reads: useLiveQuery with sensible default (null or []) renders immediately without loading states"
  - "Play-again flow: resetGame() then setPlayers() then setNumberOfHoles() then navigate -- clean state before populating"

# Metrics
duration: 2min
completed: 2026-02-17
---

# Phase 5 Plan 2: History List & Play Again Summary

**Reverse-chronological history page with useLiveQuery and one-tap play-again shortcut using latest game from IndexedDB**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-17T04:59:22Z
- **Completed:** 2026-02-17T05:01:56Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created /history page with reactive game list showing date, winner, players, and hole count per game
- Added Play Again card on home page that reads latest game and starts new round with same players (fresh UUIDs)
- Added View Game History navigation link on home page for quick access to history

## Task Commits

Each task was committed atomically:

1. **Task 1: Create history list page at /history** - `84ed590` (feat)
2. **Task 2: Add play-again button and history link to home page** - `b88c900` (feat)

## Files Created/Modified
- `src/app/history/page.tsx` - History page with useLiveQuery reading all games in reverse chronological order, empty state, and game cards
- `src/app/page.tsx` - Added useLiveQuery for latest game, Play Again card with fresh UUIDs, and View Game History link

## Decisions Made
- useLiveQuery with null/[] defaults for progressive enhancement -- no loading spinners, UI appears when IndexedDB data arrives
- Play Again card hidden during active games -- resume takes priority, avoids confusing users mid-round
- Fresh crypto.randomUUID() on play-again to prevent any possibility of player ID collision with historical data
- History link placed before PWA install button so install remains the lowest-priority action

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Game History feature complete (storage + UI + play-again)
- Phase 05 fully delivered: auto-save on completion, history browsing, and quick rematch
- Ready for Phase 06 (next milestone feature)

## Self-Check: PASSED

- All 2 files verified present on disk
- Commit 84ed590 verified in git log
- Commit b88c900 verified in git log
- TypeScript: no errors
- Build: successful
- Tests: 86/86 pass

---
*Phase: 05-game-history*
*Completed: 2026-02-17*
