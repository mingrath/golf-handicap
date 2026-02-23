---
phase: 14-play-again-config-restore
plan: 02
subsystem: ui
tags: [react, hooks, zustand, lucide-react, dexie, play-again, results-page]

# Dependency graph
requires:
  - phase: 14-play-again-config-restore
    plan: 01
    provides: usePlayAgain hook + remapHandicaps pure function
  - phase: 11-history-persistence
    provides: historyDb.games, useLiveQuery, HistoryRecord type
provides:
  - Home page Play Again restores full config including handicap values and hole assignments (QSET-01 fix)
  - Results page 3-button sticky footer with Play Again button using usePlayAgain hook (QSET-02)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useLiveQuery for latest game in results page (historyDb.games.orderBy("completedAt").reverse().first())
    - 3-button sticky footer layout: icon-only square + flex-1 primary + flex-1 secondary
    - usePlayAgain hook replaces inline handlePlayAgain on all call sites

key-files:
  created: []
  modified:
    - src/app/page.tsx
    - src/app/results/page.tsx

key-decisions:
  - "Home page Play Again delegates entirely to usePlayAgain hook — removed setPlayers/setNumberOfHoles destructures, replaced multi-step inline function with single hook call"
  - "Results page Play Again is always visible (not conditional) because latestGame resolves immediately after useSaveGame fires"
  - "Results page footer layout: Home = icon-only square, Play Again = flex-1 gradient primary, New Game = flex-1 muted secondary"
  - "RefreshCcw icon used for Play Again (visually distinct from RotateCcw used for New Game)"

patterns-established:
  - "Single-hook delegation: replace inline multi-step handlers with usePlayAgain() return value"
  - "useLiveQuery for latest history record: historyDb.games.orderBy('completedAt').reverse().first()"

# Metrics
duration: 8min
completed: 2026-02-23
---

# Phase 14 Plan 02: Play Again Config Restore Summary

**`usePlayAgain` hook wired into home page and results page — Play Again now restores full handicap config (values + hole assignments + turbo holes) from both entry points, with a new 3-button results footer (QSET-01 + QSET-02)**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-23T12:13:58Z
- **Completed:** 2026-02-23T12:21:47Z (human verify approved)
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments

- Fixed home page Play Again (QSET-01): replaced inline `handlePlayAgain` with `usePlayAgain()` hook — now restores player names, hole count, handicap values, handicap hole assignments, and turbo holes
- Added results page Play Again (QSET-02): new 3-button sticky footer (Home icon-only, Play Again gradient primary, New Game muted secondary); Play Again uses same `usePlayAgain` hook with `useLiveQuery` for `latestGame`
- Regression verified: New Game on results page still clears all config correctly
- 118/118 tests green; `tsc --noEmit` exits 0; production build clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix handlePlayAgain on home page (QSET-01)** - `760c2db` (feat)
2. **Task 2: Add Play Again button to results page (QSET-02)** - `8bf026e` (feat)
3. **Task 3: Human verify Play Again config restore** - N/A (checkpoint — user approved)

## Files Created/Modified

- `src/app/page.tsx` - Removed inline `handlePlayAgain`; imports `usePlayAgain`; onClick passes `latestGame` to hook
- `src/app/results/page.tsx` - Added `useLiveQuery` for `latestGame`, `usePlayAgain` hook call, `RefreshCcw` import; replaced 2-button footer with 3-button layout

## Decisions Made

- Home page `useGameStore` destructure no longer pulls `setPlayers` or `setNumberOfHoles` — those are handled internally by the hook. Only `resetGame` stays (still needed by `handleNewGame`).
- Results page `latestGame` is fetched via `useLiveQuery` (same pattern as home page) because the results page needs to read the just-saved game to pass into the hook. `useSaveGame` fires before the user taps Play Again so the record is always present.
- Play Again button on results page is unconditionally rendered — not gated on `latestGame !== null` — because the hook is internally a no-op on null input, and the results page is only reachable after completing a game.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 14 is now complete — all QSET bugs (QSET-01, QSET-02) resolved and verified on device
- v1.2 milestone fully shipped: Score Audit Grid (Phase 13) + Play Again Config Restore (Phase 14)
- No blockers; no pending todos

---
*Phase: 14-play-again-config-restore*
*Completed: 2026-02-23*

## Self-Check: PASSED

- FOUND: src/app/page.tsx (modified — contains usePlayAgain)
- FOUND: src/app/results/page.tsx (modified — contains usePlayAgain, useLiveQuery, RefreshCcw)
- FOUND commit 760c2db (feat — QSET-01 home page fix)
- FOUND commit 8bf026e (feat — QSET-02 results page Play Again)
- 118/118 tests passing
- Production build clean (no TypeScript errors, all 11 static pages generated)
