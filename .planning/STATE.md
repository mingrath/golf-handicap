# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Fast, clear scoring on the course -- enter strokes quickly after each hole and always know who's winning at a glance.
**Current focus:** v1.3 Handicap Control & History Editing

## Current Position

Milestone: v1.3 Handicap Control & History Editing
Phase: 15 of 16 (Manual Handicap Hole Selection)
Plan: 01 complete
Status: Phase 15 complete — ready for Phase 16
Last activity: 2026-02-23 -- Phase 15-01 complete: manual handicap hole selection (HCTL-01/02/03) verified

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
| v1.2 | 2 | 2/2 | Shipped 2026-02-23 |
| v1.3 | 2 | 1/TBD | In progress |

## Test Coverage

- 118 tests across 6 test files (all passing as of Phase 14-01)
- pairs: 25, scoring: 39, game-store: 30, storytelling: 8, stats-h2h: 10, use-play-again: 6

## Accumulated Context

### Decisions

- [v1.1]: Replay engine (`recalculateAllResults`) is foundation for all editing features
- [v1.2 Phase 13]: ScoreAuditDialog uses trigger-as-prop pattern; bottom-sheet dialog pattern
- [v1.2 Phase 14-01]: remapHandicaps uses player name matching to bridge old-UUID to new-UUID gap
- [v1.2 Phase 14-01]: setHandicap must be called before setHandicapHoles -- setHandicap resets handicapHoles to [] internally
- [v1.3 Roadmap]: HCTL requirements tightly coupled to existing HandicapEditDialog -- single phase delivery
- [v1.3 Roadmap]: HIST requires HCTL manual hole selection UI -- Phase 16 depends on Phase 15
- [v1.3 Phase 15-01]: Preserve existing hole selections when value increases; trim from highest on decrease; auto-distribute only on fresh start or sign change (HCTL-03 smart logic)
- [v1.3 Phase 15-01]: setHandicap must be called before setHandicapHoles -- confirmed pattern from Phase 14-01 holds

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 15-01-PLAN.md (manual handicap hole selection). Phase 15 done, ready for Phase 16.
Resume file: None
