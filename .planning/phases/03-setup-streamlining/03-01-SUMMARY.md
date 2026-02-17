---
phase: 03-setup-streamlining
plan: 01
subsystem: ui
tags: [react, zustand, collapsible-sections, setup-flow, css-grid-animation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Game store with initializeHandicaps, setHandicap, toggleTurboHole actions"
  - phase: 02-play-experience
    provides: "Play page and scoring flow that /setup navigates to"
provides:
  - "Streamlined 3-step setup flow (New Game -> names -> Start Game)"
  - "Collapsible inline handicap configuration on setup page"
  - "Collapsible inline turbo hole configuration on setup page"
  - "Setup-centric navigation (handicap/turbo pages navigate back to /setup)"
affects: [04-game-history, 05-pwa-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS grid-template-rows 0fr/1fr transition for smooth collapsible sections"
    - "commitToStore pattern: sync local state to Zustand before pair-dependent UI"

key-files:
  created: []
  modified:
    - "src/app/setup/page.tsx"
    - "src/app/handicap/page.tsx"
    - "src/app/turbo/page.tsx"
    - "CLAUDE.md"

key-decisions:
  - "Removed StepIndicator from all three pages -- no longer a linear wizard"
  - "Start Game button calls initializeHandicaps() to ensure zero-valued pair entries exist"
  - "Handicap/turbo sub-pages remain functional but navigate back to /setup instead of continuing flow"

patterns-established:
  - "Collapsible config section: glass-card with button header, CSS grid 0fr/1fr transition, overflow-hidden child"
  - "commitToStore helper: sync local React state to Zustand before expanding pair-dependent sections"

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 3 Plan 1: Setup Streamlining Summary

**3-step fast path setup with collapsible inline handicap/turbo configuration and setup-centric navigation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T02:42:39Z
- **Completed:** 2026-02-17T02:46:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Users accepting defaults now go from New Game to play screen in 3 steps (was 4 mandatory steps)
- Handicap configuration available as collapsible section with smart summary ("No handicaps -- equal match" or "N pair(s) configured")
- Turbo hole configuration available as collapsible section with smart summary ("No turbo holes" or "N turbo hole(s) selected")
- Handicap and turbo sub-pages updated to navigate back to /setup with secondary button styling

## Task Commits

Each task was committed atomically:

1. **Task 1: Redesign setup page with Start Game fast path and collapsible config sections** - `c4f5d5e` (feat)
2. **Task 2: Update handicap and turbo sub-pages for setup-centric navigation** - `48a7a0d` (feat)

## Files Created/Modified
- `src/app/setup/page.tsx` - Redesigned with Start Game button, collapsible handicap/turbo sections, no step indicator
- `src/app/handicap/page.tsx` - Removed step indicator, changed navigation to return to /setup, secondary button style
- `src/app/turbo/page.tsx` - Removed step indicator, changed backHref to /setup, secondary button style, removed Rocket icon
- `CLAUDE.md` - Updated app flow documentation from 4-step wizard to streamlined setup

## Decisions Made
- Removed StepIndicator from all setup-flow pages since the flow is no longer a linear wizard
- Start Game button always calls initializeHandicaps() to create zero-valued entries for all pairs, ensuring valid game state
- Handicap/turbo standalone pages remain functional for direct navigation but return to /setup
- Used CSS grid-template-rows transition (0fr to 1fr) for smooth expand/collapse animation
- commitToStore helper syncs local player/hole state to Zustand before expanding sections that depend on pair data

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Setup streamlining complete, app flow is now 3-step for default use case
- Ready for Phase 4 (Game History) or Phase 5 (PWA Polish)
- StepIndicator component still exists in codebase but is unused -- can be removed in a future cleanup

## Self-Check: PASSED

All files and commits verified:
- src/app/setup/page.tsx: FOUND
- src/app/handicap/page.tsx: FOUND
- src/app/turbo/page.tsx: FOUND
- 03-01-SUMMARY.md: FOUND
- commit c4f5d5e: FOUND
- commit 48a7a0d: FOUND

---
*Phase: 03-setup-streamlining*
*Completed: 2026-02-17*
