# Roadmap: Golf Handicap Scorer v2

## Overview

Rebuild the golf handicap scorer from a working but rough v1 into a polished v2 with fast mobile input, rich results visualization, game history, and cross-round statistics. The critical path is data integrity first (validation, versioning, tests), then core play UX improvements, then feature additions (results, history, stats), then polish. Every phase delivers a coherent, verifiable capability while preserving v1's sound scoring engine.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Store Hardening & Test Foundation** - Validate inputs, version state, fix ID generation, wire zero-sum checks, add test coverage *(completed 2026-02-17)*
- [ ] **Phase 2: Score Input & Live Play** - Redesign play screen for fast stroke entry and always-visible leaderboard
- [ ] **Phase 3: Setup Streamlining** - Reduce taps in setup wizard with smart defaults and flow optimization
- [ ] **Phase 4: Rich Results** - Winner spotlight, score trend chart, head-to-head pair breakdowns, shareable results
- [ ] **Phase 5: Game History** - Persist completed rounds and browse past games
- [ ] **Phase 6: Cross-Round Statistics** - Win rates, score trends, and improvement tracking across saved rounds
- [ ] **Phase 7: Theme & Polish** - Dark/light mode, undo capability, and final UX refinements

## Phase Details

### Phase 1: Store Hardening & Test Foundation
**Goal**: The state layer is trustworthy -- all inputs validated, state versioned for safe upgrades, IDs collision-proof, scoring integrity verified, and pure logic covered by tests
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05, FOUN-06, FOUN-07, FOUN-08, FOUN-09, FOUN-10
**Success Criteria** (what must be TRUE):
  1. Entering an invalid stroke value (negative, >20, non-integer) is rejected by the store before persisting
  2. App shows a loading skeleton on first load until the Zustand store has hydrated from storage
  3. Navigating to the setup page while a game is in progress does NOT reset the active game
  4. All pure functions in scoring.ts and pairs.ts have passing Vitest tests covering normal cases and edge cases
  5. Persisted state includes a version number that survives app updates via cascading migration
**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Store hardening: validation, versioning, crypto IDs, hydration gate, setup fix (FOUN-01 through FOUN-07, FOUN-10)
- [ ] 01-02-PLAN.md — Test infrastructure: Vitest setup, scoring/pairs/store tests, pre-commit hook (FOUN-08, FOUN-09)

### Phase 2: Score Input & Live Play
**Goal**: Users can enter strokes quickly on the course with minimal taps and always see who is winning at a glance
**Depends on**: Phase 1
**Requirements**: INPT-01, INPT-02, INPT-03, INPT-04, LIVE-01, LIVE-02
**Success Criteria** (what must be TRUE):
  1. User can enter a player's stroke count with a single tap on a preset number (no +/- stepping required)
  2. After submitting all strokes for a hole, the app auto-advances to the next hole with a brief visual confirmation
  3. A mini-leaderboard showing ranked players with running totals is always visible below the stroke input area
  4. User can swipe left/right on the play screen to navigate between holes without tapping buttons
**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md — Fast stroke input with preset number row, auto-advance with confirmation flash, haptic feedback (INPT-01, INPT-02, INPT-04)
- [ ] 02-02-PLAN.md — Always-visible mini-leaderboard with sparklines, swipe hole navigation (LIVE-01, LIVE-02, INPT-03)

### Phase 3: Setup Streamlining
**Goal**: Users can start a new round in fewer taps while retaining full access to handicap and turbo configuration
**Depends on**: Phase 1
**Requirements**: SETP-01, SETP-02
**Success Criteria** (what must be TRUE):
  1. A user who accepts all defaults (no handicaps, no turbo) can go from "New Game" to the play screen in 3 steps or fewer
  2. Handicap and turbo configuration steps pre-fill with sensible defaults (0 handicap, no turbo holes) so users can skip through without interaction
**Plans**: TBD

Plans:
- [ ] 03-01: Setup flow redesign with smart defaults (SETP-01, SETP-02)

### Phase 4: Rich Results
**Goal**: After completing a round, users see a compelling results experience with animated winner reveal, score trend visualization, and detailed pair-by-pair breakdowns
**Depends on**: Phase 1
**Requirements**: RSLT-01, RSLT-02, RSLT-03, RSLT-04
**Success Criteria** (what must be TRUE):
  1. Results page shows a line chart of each player's cumulative score across all holes played
  2. Results page shows a head-to-head section for each pair with final score, hole-by-hole wins, and handicap-adjusted strokes
  3. Winner is revealed with a staggered animated podium (3rd, then 2nd, then 1st with celebration effect)
  4. User can share results as a styled image card via the device share sheet (or download as PNG on unsupported devices)
**Plans**: TBD

Plans:
- [ ] 04-01: Score trend chart and pair breakdowns (RSLT-01, RSLT-02)
- [ ] 04-02: Winner podium animation and share export (RSLT-03, RSLT-04)

### Phase 5: Game History
**Goal**: Completed rounds are saved and users can browse their game history and quickly start a rematch
**Depends on**: Phase 1, Phase 4 (results page is where save happens)
**Requirements**: HIST-01, HIST-02, HIST-04
**Success Criteria** (what must be TRUE):
  1. After finishing a round, the game is automatically saved to persistent storage that survives browser cache clearing (IndexedDB with storage persistence)
  2. User can view a list of past rounds showing date, players, and winner
  3. User can start a new game with the same players from their most recent round in one tap from the home screen
**Plans**: TBD

Plans:
- [ ] 05-01: History storage and save flow (HIST-01)
- [ ] 05-02: History list page and play-again shortcut (HIST-02, HIST-04)

### Phase 6: Cross-Round Statistics
**Goal**: Users can track performance over time with win rates, score trends, and round-over-round improvement
**Depends on**: Phase 5 (needs saved game history), Phase 4 (reuses chart components)
**Requirements**: HIST-03
**Success Criteria** (what must be TRUE):
  1. User can view per-player win rate across all saved rounds
  2. User can see average score, best round, and worst round for each player
  3. Stats update automatically as new rounds are completed and saved
**Plans**: TBD

Plans:
- [ ] 06-01: Stats computation and dashboard (HIST-03)

### Phase 7: Theme & Polish
**Goal**: The app adapts to outdoor/indoor lighting conditions and provides a safety net for scoring mistakes
**Depends on**: Phase 2 (undo applies to score input flow)
**Requirements**: THEM-01, THEM-02
**Success Criteria** (what must be TRUE):
  1. App automatically matches the device's dark/light system preference on first load, and user can manually toggle between themes
  2. After submitting a hole's scores, an undo button appears for 10 seconds that lets the user revert the last submission
**Plans**: TBD

Plans:
- [ ] 07-01: Dark/light theme with system detection (THEM-01)
- [ ] 07-02: Undo last submission (THEM-02)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

**Dependency graph:**
```
Phase 1 (Foundation)
    |---> Phase 2 (Score Input & Live Play)
    |       \---> Phase 7 (Theme & Polish)
    |---> Phase 3 (Setup Streamlining)
    |---> Phase 4 (Rich Results)
    |       |---> Phase 5 (Game History)
    |       |       \---> Phase 6 (Cross-Round Stats)
    |       \---> Phase 6 (reuses charts)
```

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Store Hardening & Test Foundation | 2/2 | ✓ Complete | 2026-02-17 |
| 2. Score Input & Live Play | 0/2 | Not started | - |
| 3. Setup Streamlining | 0/1 | Not started | - |
| 4. Rich Results | 0/2 | Not started | - |
| 5. Game History | 0/2 | Not started | - |
| 6. Cross-Round Statistics | 0/1 | Not started | - |
| 7. Theme & Polish | 0/2 | Not started | - |
