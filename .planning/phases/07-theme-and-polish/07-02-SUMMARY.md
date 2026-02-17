---
phase: 07-theme-and-polish
plan: 02
subsystem: ui
tags: [zustand, undo, react, countdown, state-management]

# Dependency graph
requires:
  - phase: 07-01
    provides: "Theme infrastructure and color system for consistent styling"
  - phase: 02-01
    provides: "Play page with submitHoleStrokes flow and confirmation flash"
provides:
  - "Store-level undo snapshot/restore for last score submission"
  - "UndoBanner floating component with 10-second countdown"
  - "partialize config excluding ephemeral state from localStorage"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zustand partialize for excluding ephemeral state from persist"
    - "Key-based React component reset for timer restart"
    - "Pre-mutation snapshot pattern for undo capability"

key-files:
  created:
    - src/components/shared/undo-banner.tsx
  modified:
    - src/lib/game-store.ts
    - src/app/play/page.tsx

key-decisions:
  - "Undo snapshot stored in Zustand store, excluded from localStorage via partialize"
  - "UndoBanner uses key prop reset pattern for fresh countdown on each submission"
  - "onExpire callback cleans up snapshot when timer runs out"

patterns-established:
  - "partialize pattern: exclude ephemeral/transient state from Zustand persist"
  - "key-based timer reset: increment key to remount component with fresh state"

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 7 Plan 2: Undo Last Submission Summary

**Store-level undo snapshot with 10-second floating UndoBanner countdown on play page**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T09:56:20Z
- **Completed:** 2026-02-17T10:00:22Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added pre-mutation snapshot capture in submitHoleStrokes action for full state rollback
- Created UndoBanner component with 100ms countdown, opacity fade in final 3 seconds, and auto-dismiss
- Integrated undo flow on play page with key-based timer reset and haptic feedback
- Excluded _undoSnapshot from localStorage persistence via partialize config

## Task Commits

Each task was committed atomically:

1. **Task 1: Add undo snapshot/restore to Zustand game store** - `f70314c` (feat)
2. **Task 2: Create UndoBanner component and integrate on play page** - `d0e5575` (feat)

## Files Created/Modified
- `src/lib/game-store.ts` - Added UndoSnapshot type, _undoSnapshot field, undoLastSubmission/clearUndoSnapshot actions, partialize config
- `src/components/shared/undo-banner.tsx` - New floating undo button with countdown timer and opacity fade
- `src/app/play/page.tsx` - Integrated UndoBanner with undoKey state, handleUndo callback, onExpire cleanup

## Decisions Made
- **Undo snapshot is store-only, not in types.ts**: _undoSnapshot is ephemeral UI state, not domain state -- kept out of GameState interface
- **partialize excludes _undoSnapshot from localStorage**: Undo state should never survive page refresh -- only exists during active session
- **key prop pattern for timer reset**: Using `key={undoKey}` remounts UndoBanner on each submission, giving a fresh 10-second countdown without manual timer reset logic
- **onExpire callback for cleanup**: When the 10-second timer expires, clearUndoSnapshot is called to null out the snapshot in the store

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All Phase 7 plans complete (theme infrastructure + undo capability)
- Project v1.0 milestone fully delivered
- All 86 existing tests pass, build succeeds with zero errors

## Self-Check: PASSED

All created files verified present. Both task commits (f70314c, d0e5575) verified in git log.

---
*Phase: 07-theme-and-polish*
*Completed: 2026-02-17*
