---
phase: 15-manual-handicap-hole-selection
plan: 01
subsystem: ui
tags: [react, zustand, handicap, hole-selection, dialog]

# Dependency graph
requires:
  - phase: 14-play-again-config-restore
    provides: recalculateFromStrokes replay engine used by HandicapEditDialog on close
provides:
  - Enhanced HandicapEditDialog with inline hole toggle grid per pair (HCTL-01, HCTL-02, HCTL-03)
  - Smart handleHandicapChange that preserves existing hole selections on value changes
affects:
  - 16-handicap-history-editing

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Store-as-source-of-truth for toggles: no local state for hole selections, read config.handicaps[pairKey].handicapHoles directly on each render"
    - "setHandicap before setHandicapHoles: setHandicap resets handicapHoles internally so setHandicapHoles must always follow"

key-files:
  created: []
  modified:
    - src/components/shared/handicap-edit-dialog.tsx

key-decisions:
  - "Preserve existing hole selections when value increases — user manually picks the difference (HCTL-03)"
  - "Trim from highest hole numbers when value decreases to keep most meaningful selections"
  - "Auto-distribute only on fresh start (from 0) or sign change — not on every value change"
  - "No blocking or footer button added — dialog close handles recalculation via existing recalculateFromStrokes"

patterns-established:
  - "Hole toggle grid pattern: flex-wrap buttons w-9 h-9 with emerald-500 selected state, copied from /handicap/page.tsx"
  - "Smart handicap change: case analysis on oldValue, newValue, signChanged to decide preserve/trim/auto-distribute"

# Metrics
duration: ~15min
completed: 2026-02-23
---

# Phase 15 Plan 01: Manual Handicap Hole Selection Summary

**Inline hole toggle grid added to HandicapEditDialog with smart preserve/trim logic — users see and control exact handicap holes during play and results (HCTL-01, HCTL-02, HCTL-03)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-23
- **Completed:** 2026-02-23
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 1

## Accomplishments

- Added inline hole toggle grid below each pair's NumberStepper in HandicapEditDialog, matching the proven UI from /handicap/page.tsx
- Implemented smart handleHandicapChange: preserves existing selections when value increases, trims from highest holes when value decreases, auto-distributes only on fresh start or sign change
- Human verified all three HCTL requirements on both /play and /results pages — hole toggles, persistence through dialog open/close, and score recalculation confirmed working

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance HandicapEditDialog with hole toggle grid** - `b101f46` (feat)
2. **Task 2: Verify manual handicap hole selection on play and results pages** - checkpoint:human-verify (approved, no commit)

## Files Created/Modified

- `src/components/shared/handicap-edit-dialog.tsx` - Enhanced with hole toggle grid per pair, smart handleHandicapChange preserving selections, selection counter with warning, HCTL-01/02/03 fulfilled

## Decisions Made

- Preserved existing hole selections when value increases — user manually picks the difference. This is the core HCTL-03 requirement: the stepper no longer wipes the user's carefully chosen holes.
- Trim from highest hole numbers on decrease — keeps the most relevant (lowest-indexed = hardest) holes selected.
- Auto-distribute only on fresh start (oldValue === 0) or sign change — sensible defaults without disrupting existing work.
- No blocking or footer button — editing during play should not block score entry. Existing dialog close already calls recalculateFromStrokes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 15 complete. HandicapEditDialog now exposes full manual hole control to users during play and on results.
- Phase 16 (Handicap History Editing) can build on this — the hole toggle grid pattern and HCTL UI are proven and ready to reuse.
- All 118 tests passing, build passing as of Task 1 commit.

---

## Self-Check: PASSED

- File `src/components/shared/handicap-edit-dialog.tsx` confirmed modified (git commit b101f46)
- Commit `b101f46` confirmed in git log
- SUMMARY.md created at correct path

---
*Phase: 15-manual-handicap-hole-selection*
*Completed: 2026-02-23*
