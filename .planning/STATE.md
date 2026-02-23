# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Fast, clear scoring on the course -- enter strokes quickly after each hole and always know who's winning at a glance.
**Current focus:** v1.3 Handicap Control & History Editing

## Current Position

Milestone: v1.3 Handicap Control & History Editing
Phase: 16 of 16 (History Game Loading & Editing)
Plan: 02 of 02 complete
Status: Phase 16 complete -- v1.3 milestone feature-complete
Last activity: 2026-02-23 -- Phase 16-02 complete: history game loading & editing UI (clickable cards, history-aware results page)

## Performance Metrics

**Velocity:**
- Total plans completed: 21 (v1.0: 12, v1.1: 5, v1.2: 2, v1.3: 2)
- Average duration: ~5 min/plan
- Total execution time: ~1.5 hours

**By Milestone:**

| Milestone | Phases | Plans | Status |
|-----------|--------|-------|--------|
| v1.0 | 7 | 12/12 | Shipped 2026-02-17 |
| v1.1 | 5 | 5/5 | Shipped 2026-02-22 |
| v1.2 | 2 | 2/2 | Shipped 2026-02-23 |
| v1.3 | 2 | 2/2 | Complete |

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
- [v1.3 Phase 16-01]: historyId included in localStorage persistence for refresh resilience; skipNextSave ref prevents save-on-load
- [v1.3 Phase 16-01]: Two-store bridge pattern: IndexedDB -> Zustand via loadHistoryGame, edits -> IndexedDB via history-aware useSaveGame
- [v1.3 Phase 16-02]: isHistoryMode derived from historyId for conditional UI; resetGame() before back navigation clears store
- [v1.3 Phase 16-02]: useGameStore.getState().historyId used in mount-only useEffect to avoid stale closure

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 16-02-PLAN.md (history game loading & editing UI). v1.3 milestone feature-complete.
Resume file: None
