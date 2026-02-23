# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Fast, clear scoring on the course -- enter strokes quickly after each hole and always know who's winning at a glance.
**Current focus:** v1.2 milestone -- Phase 14: Play Again Fix

## Current Position

Milestone: v1.2 Score Transparency & Fast Setup
Phase: 14 of 14 (Play Again Config Restore) -- IN PROGRESS
Plan: 1 of 2 complete in Phase 14
Status: Phase 14 Plan 01 complete -- remapHandicaps + usePlayAgain hook shipped
Last activity: 2026-02-23 -- Phase 14-01 executed: usePlayAgain hook + remapHandicaps pure function (TDD)

Progress: [███████████░] 95% overall (14 phases, 1/2 plans in Phase 14)

## Performance Metrics

**Velocity:**
- Total plans completed: 19 (v1.0: 12, v1.1: 5, v1.2: 2)
- Average duration: ~5 min/plan
- Total execution time: ~1.5 hours

**By Milestone:**

| Milestone | Phases | Plans | Status |
|-----------|--------|-------|--------|
| v1.0 | 7 | 12/12 | Shipped 2026-02-17 |
| v1.1 | 5 | 5/5 | Shipped 2026-02-22 |
| v1.2 | 2 | 2/TBD | In progress |

**Phase 13 Metrics:**

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 13-score-audit-grid | 13-01 | 3 min | 2 | 3 |

**Phase 14 Metrics:**

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 14-play-again-config-restore | 14-01 | 2 min | 1 (TDD) | 2 |

## Test Coverage

- 118 tests across 6 test files (all passing as of Phase 14-01)
- pairs: 25, scoring: 39, game-store: 30, storytelling: 8, stats-h2h: 10, use-play-again: 6

## Accumulated Context

### Decisions

- [v1.1]: Replay engine (`recalculateAllResults`) is foundation for all editing features
- [v1.1 Phase 12]: H2H uses case-insensitive name matching via normalizePlayerName for cross-game identity
- [v1.2 Feedback]: Play Again on home page only restores player names + hole count, NOT handicap settings -- root cause identified in `handlePlayAgain` in src/app/page.tsx
- [v1.2 Feedback]: Users need raw input visibility when computed scores diverge from paper scorecard
- [v1.2 Roadmap]: Audit grid (AUDIT-01-04) all coupled to one component -- Phase 13 single delivery
- [v1.2 Roadmap]: Play Again fix (QSET-01-02) are one logical change -- Phase 14 single delivery
- [v1.2 Phase 13]: ScoreAuditDialog uses trigger-as-prop pattern; dialog closes itself after onHoleSelect -- callers do not manage open state
- [v1.2 Phase 13]: Bottom-sheet dialog pattern: DialogContent className override (max-w-full h-[90dvh] top-[10dvh] translate-y-0 rounded-t-2xl rounded-b-none)
- [v1.2 Phase 14-01]: remapHandicaps uses player name matching to bridge old-UUID to new-UUID gap across Play Again sessions
- [v1.2 Phase 14-01]: playerAId/playerBId derived from makePairKey sorted output (newKey.split("::")) not raw lookup order
- [v1.2 Phase 14-01]: setHandicap must be called before setHandicapHoles -- setHandicap resets handicapHoles to [] internally
- [v1.2 Phase 14-01]: Pure remapHandicaps co-located with usePlayAgain in same file for single import surface

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 14-01-PLAN.md -- usePlayAgain hook + remapHandicaps pure function shipped. Ready for Phase 14-02 (home page / results page integration).
Resume file: None
