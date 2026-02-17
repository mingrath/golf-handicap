---
phase: 07-theme-and-polish
plan: 01
subsystem: ui
tags: [next-themes, tailwindcss, dark-mode, css-variables, oklch]

requires:
  - phase: 01-foundation
    provides: "shadcn/ui component system, globals.css, layout.tsx"
  - phase: 02-play-experience
    provides: "Play page, stroke-input, mini-leaderboard components"
  - phase: 04-results-sharing
    provides: "Results page, winner-podium, pair-breakdown, share-results-card, score-trend-chart"
  - phase: 05-game-history
    provides: "History page, hydration-gate"
  - phase: 06-cross-round-stats
    provides: "Stats page, player-stat-card, win-rate-chart"
provides:
  - "Light/dark theme system with automatic system preference detection"
  - "ThemeProvider wrapper with class-based dark mode"
  - "ThemeToggle component for manual theme switching"
  - "Light and dark CSS variable palettes using OKLCH color space"
  - "All pages and components use semantic color tokens"
affects: [07-02-polish-pwa]

tech-stack:
  added: [next-themes]
  patterns: [semantic-color-tokens, class-based-dark-mode, oklch-palettes]

key-files:
  created:
    - "src/components/shared/theme-toggle.tsx"
  modified:
    - "src/app/globals.css"
    - "src/app/layout.tsx"
    - "src/components/ui/sonner.tsx"
    - "src/app/page.tsx"
    - "src/app/play/page.tsx"
    - "src/app/setup/page.tsx"
    - "src/app/results/page.tsx"
    - "src/app/history/page.tsx"
    - "src/app/stats/page.tsx"
    - "src/app/turbo/page.tsx"
    - "src/app/handicap/page.tsx"
    - "src/components/shared/game-header.tsx"
    - "src/components/shared/stroke-input.tsx"
    - "src/components/shared/number-stepper.tsx"
    - "src/components/shared/mini-leaderboard.tsx"
    - "src/components/shared/hydration-gate.tsx"
    - "src/components/results/winner-podium.tsx"
    - "src/components/results/pair-breakdown.tsx"
    - "src/components/results/share-results-card.tsx"
    - "src/components/results/score-trend-chart.tsx"
    - "src/components/stats/player-stat-card.tsx"
    - "src/components/stats/win-rate-chart.tsx"

key-decisions:
  - "Light palette uses emerald primary with neutral base; dark palette preserves existing slate-based design"
  - "Glass-card uses two-block approach (.glass-card + .dark .glass-card) instead of oklch(from ...) for browser compatibility"
  - "Chart tick/grid colors use Tailwind CSS classes (fill-muted-foreground, stroke-border) instead of hardcoded rgba"
  - "Podium bar numbers and crown icon stay text-white since they render on colored gradient backgrounds"
  - "text-white preserved on all gradient buttons (emerald, amber/orange) for consistent contrast"

patterns-established:
  - "Semantic tokens: bg-background, text-foreground, bg-card, bg-muted, text-muted-foreground, border-border for theme-adaptive colors"
  - "ThemeProvider at layout.tsx level with attribute='class' and defaultTheme='system'"
  - "Mounted guard pattern for client-side theme toggle to prevent hydration mismatch"
  - "@custom-variant dark using :where() selector for proper specificity handling"

duration: 14min
completed: 2026-02-17
---

# Phase 7 Plan 1: Theme & Polish Summary

**Dark/light theme system with OKLCH palettes, next-themes ThemeProvider, ThemeToggle on home page, and ~230 hardcoded color references migrated to semantic tokens across 19 files**

## Performance

- **Duration:** 14 min
- **Started:** 2026-02-17T09:38:32Z
- **Completed:** 2026-02-17T09:53:18Z
- **Tasks:** 2
- **Files modified:** 20 (1 created, 19 modified)

## Accomplishments
- Light and dark CSS variable palettes using OKLCH color space with emerald primary
- ThemeProvider with automatic system preference detection and manual toggle
- All pages and components migrated from hardcoded slate/white colors to semantic tokens
- Share card remains dark-only for reliable image capture per decision [04-02]
- Sonner toasts adapt to current theme via resolvedTheme
- Browser chrome (viewport themeColor) adapts to prefers-color-scheme

## Task Commits

Each task was committed atomically:

1. **Task 1: Theme infrastructure** - `feb760e` (feat)
2. **Task 2: Migrate hardcoded colors to semantic tokens** - `312ca65` (feat)

## Files Created/Modified
- `src/app/globals.css` - Light/dark CSS variable palettes, @custom-variant fix, glass-card light/dark variants
- `src/app/layout.tsx` - ThemeProvider wrapper, suppressHydrationWarning, viewport themeColor
- `src/components/ui/sonner.tsx` - Theme-aware toaster using resolvedTheme
- `src/components/shared/theme-toggle.tsx` - New: toggle button with mounted guard and Sun/Moon icons
- `src/app/page.tsx` - Semantic tokens + ThemeToggle added
- `src/app/play/page.tsx` - Semantic tokens for header, navigator, pair results, action bar
- `src/app/setup/page.tsx` - Semantic tokens for inputs, handicap/turbo sections
- `src/app/results/page.tsx` - Semantic tokens for rankings, scorecard, edit modal
- `src/app/history/page.tsx` - Semantic tokens for header, game cards
- `src/app/stats/page.tsx` - Semantic tokens for header, empty state
- `src/app/turbo/page.tsx` - Semantic tokens (deviation fix)
- `src/app/handicap/page.tsx` - Semantic tokens (deviation fix)
- `src/components/shared/game-header.tsx` - Semantic tokens for header bar
- `src/components/shared/stroke-input.tsx` - Semantic tokens for preset buttons
- `src/components/shared/number-stepper.tsx` - Semantic tokens for +/- buttons, value display
- `src/components/shared/mini-leaderboard.tsx` - Semantic tokens for leaderboard card
- `src/components/shared/hydration-gate.tsx` - Semantic tokens for loading/error states
- `src/components/results/winner-podium.tsx` - Semantic tokens (preserved white on colored bars)
- `src/components/results/pair-breakdown.tsx` - Semantic tokens for pair cards
- `src/components/results/share-results-card.tsx` - Share button semantic tokens (capture card untouched)
- `src/components/results/score-trend-chart.tsx` - CSS class-based chart tick/grid colors
- `src/components/stats/player-stat-card.tsx` - Semantic tokens for stat grid
- `src/components/stats/win-rate-chart.tsx` - CSS class-based chart tick/grid colors

## Decisions Made
- Light palette uses emerald primary (oklch 0.55 0.19 163) with neutral base for high outdoor visibility
- Glass-card uses two-block CSS approach for broad browser compatibility (no oklch relative color syntax)
- Chart tick/grid colors use Tailwind CSS utility classes instead of hardcoded rgba for theme adaptability
- Podium numbers and crown icon keep text-white since they always sit on colored gradient backgrounds
- step-indicator.tsx left with hardcoded colors since it's unused (decision [03-01])

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migrated turbo/page.tsx and handicap/page.tsx to semantic tokens**
- **Found during:** Task 2 (color migration grep)
- **Issue:** These standalone pages were not listed in the plan's files_modified but contained hardcoded slate colors that would render incorrectly in light mode
- **Fix:** Applied same semantic token mapping to both files
- **Files modified:** src/app/turbo/page.tsx, src/app/handicap/page.tsx
- **Verification:** Build passes, grep confirms no hardcoded slate references
- **Committed in:** 312ca65 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Essential for visual correctness in light mode. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Theme system fully operational with light/dark support
- Ready for 07-02 (PWA polish) which may add theme-aware PWA splash screens
- All semantic tokens in place for any future component additions

---
## Self-Check: PASSED

All created files verified on disk. Both task commits (feb760e, 312ca65) verified in git log.

---
*Phase: 07-theme-and-polish*
*Completed: 2026-02-17*
