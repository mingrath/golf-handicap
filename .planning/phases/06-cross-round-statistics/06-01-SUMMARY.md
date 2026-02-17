---
phase: 06-cross-round-statistics
plan: 01
subsystem: ui, stats
tags: [recharts, dexie, useLiveQuery, bar-chart, stats-computation]

requires:
  - phase: 05-game-history
    provides: Dexie history database with HistoryRecord schema and useLiveQuery pattern
provides:
  - Pure stats computation module (normalizePlayerName, getUniquePlayerNames, computePlayerStats, computeAllPlayerStats)
  - Reactive usePlayerStats hook returning PlayerStats[] | null
  - /stats dashboard page with win rate chart and per-player stat cards
  - Navigation links from home page and history page to /stats
affects: [07-final-polish]

tech-stack:
  added: []
  patterns: [pure-stats-computation, bar-chart-with-ChartContainer, case-insensitive-player-matching]

key-files:
  created:
    - src/lib/stats.ts
    - src/hooks/use-player-stats.ts
    - src/components/stats/player-stat-card.tsx
    - src/components/stats/win-rate-chart.tsx
    - src/app/stats/page.tsx
  modified:
    - src/app/page.tsx
    - src/app/history/page.tsx

key-decisions:
  - "Case-insensitive player matching via normalize (trim + lowercase) with first-occurrence display name"
  - "Ties at rank 1 count as wins for all tied players"
  - "WinRateChart uses same ChartContainer + Recharts pattern as ScoreTrendChart"
  - "Stats sorted by winRate desc then gamesPlayed desc"

patterns-established:
  - "Pure stats module pattern: separate computation from reactive data fetching"
  - "Bar chart pattern: BarChart + ChartContainer with percentage YAxis"

duration: 3min
completed: 2026-02-17
---

# Phase 6 Plan 1: Cross-Round Statistics Summary

**Per-player stats dashboard with win rates, averages, best/worst rounds, and bar chart -- all reactively computed from Dexie game history via useLiveQuery**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T05:35:45Z
- **Completed:** 2026-02-17T05:38:49Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Pure stats computation module with case-insensitive player matching across games
- Reactive usePlayerStats hook using useLiveQuery for auto-updating stats
- /stats dashboard page with win rate bar chart and per-player stat cards (win rate, avg score, best/worst round)
- Navigation to /stats from both home page ("View Stats") and history page ("Player Stats")
- Empty state handling when no games exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Create stats computation module and reactive hook** - `3d0bb1a` (feat)
2. **Task 2: Build stats dashboard page with charts and navigation** - `2973d34` (feat)

## Files Created/Modified
- `src/lib/stats.ts` - Pure stats computation: PlayerStats interface, normalizePlayerName, getUniquePlayerNames, computePlayerStats, computeAllPlayerStats
- `src/hooks/use-player-stats.ts` - Reactive hook wrapping useLiveQuery + computeAllPlayerStats
- `src/components/stats/player-stat-card.tsx` - Per-player stat card with 2x2 grid (win rate, avg score, best/worst round)
- `src/components/stats/win-rate-chart.tsx` - Bar chart showing win rates using Recharts + ChartContainer
- `src/app/stats/page.tsx` - Stats dashboard page with header, empty state, chart, and stat cards
- `src/app/page.tsx` - Added "View Stats" navigation link with BarChart3 icon
- `src/app/history/page.tsx` - Added "Player Stats" glass-card link with BarChart3 icon

## Decisions Made
- Case-insensitive player matching via normalize (trim + lowercase) with first-occurrence kept as display name -- ensures "Alice" and "alice" merge correctly across games
- Ties at rank 1 count as wins for all tied players -- fair multi-winner handling
- WinRateChart follows exact same ChartContainer + Recharts pattern as ScoreTrendChart from Phase 4 for consistency
- Stats sorted by winRate desc, then gamesPlayed desc -- most successful players shown first

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Stats feature complete, fulfills HIST-03 requirement
- Ready for Phase 7 (Final Polish) -- all core features built
- No blockers or concerns

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (3d0bb1a, 2973d34) verified in git log.

---
*Phase: 06-cross-round-statistics*
*Completed: 2026-02-17*
