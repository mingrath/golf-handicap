---
phase: 13-score-audit-grid
plan: 01
subsystem: ui
tags: [react, dialog, radix-ui, zustand, table, lucide-react]

# Dependency graph
requires:
  - phase: 12-h2h-stats
    provides: game-store with holeStrokes, config.handicaps, config.players
  - phase: 11-stroke-edit
    provides: editingCell pattern in results page used by onHoleSelect handler

provides:
  - ScoreAuditDialog component — full-height bottom-sheet Dialog with stroke grid and handicap legend
  - Audit trigger (TableProperties icon) wired into play page header
  - Audit trigger wired into results page header

affects:
  - 14-play-again-fix

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Bottom-sheet Dialog via DialogContent className override (max-w-full h-[90dvh] top-[10dvh] translate-y-0 rounded-t-2xl rounded-b-none)
    - trigger prop pattern: caller passes <button> as ReactNode, component wraps in DialogTrigger asChild
    - Collapsible section via local legendOpen useState + ChevronDown rotation

key-files:
  created:
    - src/components/shared/score-audit-dialog.tsx
  modified:
    - src/app/play/page.tsx
    - src/app/results/page.tsx

key-decisions:
  - "ScoreAuditDialog takes a trigger prop (ReactNode) so callers control the button appearance"
  - "onHoleSelect called before setOpen(false) inside the row click handler — caller does not need to close dialog"
  - "mode prop kept in interface for future differentiation but not used in current implementation"

patterns-established:
  - "Shared dialog pattern: trigger as prop + internal open state + onHoleSelect callback"

# Metrics
duration: 3min
completed: 2026-02-23
---

# Phase 13 Plan 01: Score Audit Grid Summary

**ScoreAuditDialog bottom-sheet with raw stroke grid (rows=holes, cols=players), collapsible handicap legend, and hole-tap navigation wired into play and results page headers**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-23T11:31:28Z
- **Completed:** 2026-02-23T11:34:48Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Created `ScoreAuditDialog` shared component: 147-line bottom-sheet Dialog reading `holeStrokes` and `config` from game store
- Stroke grid shows all holes x all players with em-dash for unscored cells; unscored rows are dimmed and non-interactive
- Collapsible handicap legend renders below the stroke table, showing each pair's handicap holes sorted numerically
- Wired `TableProperties` icon button into play page header — tapping a scored row calls `goToHole(hole)` and closes dialog
- Wired same button into results page header — tapping a scored row opens existing `editingCell` overlay for the first player of that hole
- Fixed pre-existing `results/page.tsx` lint bug: `hasAnimatedRef.current` accessed during render replaced with `useState + useEffect` pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ScoreAuditDialog component** - `8f4897f` (feat)
2. **Task 2: Wire ScoreAuditDialog into play and results page headers** - `1b3cca3` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/shared/score-audit-dialog.tsx` - New shared Dialog component: stroke grid + handicap legend + bottom-sheet layout
- `src/app/play/page.tsx` - Added ScoreAuditDialog + TableProperties icon to header; onHoleSelect calls goToHole
- `src/app/results/page.tsx` - Added ScoreAuditDialog + TableProperties icon to header; onHoleSelect opens editingCell for first player

## Decisions Made

- Used `trigger` as a `React.ReactNode` prop so callers fully control the trigger button's appearance and aria-label
- Dialog closes itself after calling `onHoleSelect` — callers do not need to manage open state
- `mode` prop retained in the interface for forward compatibility but unused in rendering logic
- Unscored rows: `opacity-50`, cursor-default, guarded click handler — keeps layout stable without removing rows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed useRef.current access during render in results/page.tsx**
- **Found during:** Task 2 (wiring results page)
- **Issue:** Pre-existing code accessed `hasAnimatedRef.current` and mutated it during render body, triggering ESLint `react-hooks/refs` errors
- **Fix:** Replaced `useRef(false)` with `useState(false)` + `useEffect` that triggers animation on mount when `isComplete` is true, then clears it after 2 seconds via `setTimeout`
- **Files modified:** `src/app/results/page.tsx`
- **Verification:** `npx eslint src/app/results/page.tsx` — zero errors
- **Committed in:** `1b3cca3` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix was necessary for lint pass and correct React behavior. No scope creep.

## Issues Encountered

- Pre-existing ESLint errors in `src/app/page.tsx` (3x `@typescript-eslint/no-explicit-any` on PWA install prompt) — not in plan scope, not modified, left as-is.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AUDIT-01 through AUDIT-04 all satisfied by this single plan
- Phase 13 complete — ready for Phase 14 (Play Again Fix)
- No blockers

## Self-Check: PASSED

- `src/components/shared/score-audit-dialog.tsx` - EXISTS (147 lines, exports ScoreAuditDialog)
- `src/app/play/page.tsx` - Contains ScoreAuditDialog (2 occurrences)
- `src/app/results/page.tsx` - Contains ScoreAuditDialog (2 occurrences)
- Commit `8f4897f` - EXISTS (feat(13-01): create ScoreAuditDialog component)
- Commit `1b3cca3` - EXISTS (feat(13-01): wire ScoreAuditDialog into play and results page headers)
- Build: PASSED (zero TypeScript errors)
- Tests: 112/112 PASSED

---
*Phase: 13-score-audit-grid*
*Completed: 2026-02-23*
