# Research Summary: Golf Handicap Scorer v1.1

**Domain:** Golf scoring PWA -- UX fixes and insight features
**Researched:** 2026-02-22
**Overall confidence:** HIGH

## Executive Summary

The v1.1 milestone adds five features to the existing golf scoring PWA: extended stroke input, editable scorecards and handicaps on the results page, editable scores and handicaps during play with cross-check preview, score storytelling narratives, and lifetime player-vs-player head-to-head records.

The most important finding is that **zero new library dependencies are required**. Every v1.1 feature is implementable using the existing stack (React 19, Zustand 5, Dexie 4, Recharts 2.15, Tailwind CSS 4, shadcn/ui). The v1.0 architecture was well-designed: the Zustand store already supports re-scoring, Dexie stores full game snapshots with pair-level results, and the scoring engine is pure functions that can be replayed. The new features are pure TypeScript modules and component-level UI work.

The primary technical challenge is the **handicap edit replay mechanism**. When a handicap changes mid-game or post-game, all holes must be recalculated from scratch because running totals propagate through every subsequent hole. This requires a new `recalculateAllResults` function that replays the scoring engine in order, plus a new store action `replaceAllResults` that atomically updates state without per-hole side effects. Getting this wrong causes cascading data corruption.

A related finding is that the existing `submitHoleStrokes` action has a **stale running total bug** when editing non-latest holes. It recalculates the edited hole correctly but leaves subsequent holes' `runningTotal` values stale. This does not affect final rankings (which sum `holeScore` directly) but causes the score trend chart and mini leaderboard to show wrong intermediate values. The `rebuildRunningTotals` utility fixes this.

The storytelling engine is a fun differentiator that is pure computation -- no AI, no API, no dependencies. Template-based narrative generation from game data analysis. The head-to-head aggregation leverages the existing Dexie history store and `normalizePlayerName` cross-game matching pattern. Both features are isolated modules with no impact on the critical scoring path.

## Key Findings

**Stack:** No new dependencies. Zero-install milestone. All features use existing React 19 + Zustand 5 + Dexie 4 + Tailwind CSS 4.

**Architecture:** New `recalculateAllResults` pure function replays scoring engine after handicap changes. Preview computations via `useMemo` -- never mutate store for cross-check. Storytelling and H2H are independent pure modules.

**Critical pitfall:** Handicap edit cascading recalculation. Running totals propagate through every hole. Must replay ALL holes in order, not just the affected ones. Zero-sum verification on every replayed hole catches bugs.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation: Replay Mechanism + Extended Input** - Build the hole replay function and the new store action first, since both handicap-editing features depend on them. Bundle with extended stroke input (smallest, independent UX win) and the rebuildRunningTotals fix.
   - Addresses: Extended stroke input, `recalculateAllResults` utility, `replaceAllResults` store action, `rebuildRunningTotals` fix
   - Avoids: Pitfall 1 (cascading recalculation), Pitfall 4 (stale running totals) by getting the replay right first

2. **Edit During Play** - Add handicap editing to the play page with cross-check preview. This is the highest-impact UX fix.
   - Addresses: Editable handicap during play, cross-check preview, auto-distribute handicap holes
   - Avoids: Pitfall 3 (handicap hole invalidation), Pitfall 9 (undo corruption)

3. **Edit on Results** - Extend handicap editing to the results page. Add history record update.
   - Addresses: Editable handicap on results, Dexie record re-save
   - Avoids: Pitfall 2 (history desync)

4. **Storytelling** - Score narrative engine and display components.
   - Addresses: Story highlight generation, display on results page
   - Avoids: Pitfall 5 (edge cases) via minimum game length guards

5. **Lifetime Head-to-Head** - Cross-game H2H aggregation and display.
   - Addresses: H2H computation, display on results and stats pages
   - Avoids: Pitfall 7 (performance) via async computation

**Phase ordering rationale:**
- Replay mechanism is a dependency for phases 2 and 3 -- must come first
- Edit during play (phase 2) before edit on results (phase 3) because mid-game edits are more urgent UX need
- Storytelling (phase 4) and H2H (phase 5) are independent insight features, ordered by implementation simplicity
- Extended stroke input is bundled in phase 1 because it is independent, small, and provides an early deliverable

**Research flags for phases:**
- Phase 1: Standard patterns, unlikely to need research. Pure function + component redesign.
- Phase 2: May need UX research for the cross-check preview layout. How much diff information to show?
- Phase 3: History re-save pattern is straightforward. No research needed.
- Phase 4: Story template authoring is creative work, not technical research. May iterate on what stories resonate.
- Phase 5: Name collision limitation should be documented clearly. No technical research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Full codebase audit confirms all capabilities exist. No gaps. |
| Features | HIGH | All 5 features mapped to concrete implementation approaches |
| Architecture | HIGH | Replay pattern is well-understood. Pure function composition. |
| Pitfalls | HIGH | Identified from direct code analysis, not theoretical |

## Gaps to Address

- **UX design for extended stroke input:** Adaptive centering vs. scrollable row vs. two rows. Needs mockup/prototype, not research.
- **Cross-check preview layout:** How to show "before vs after" on mobile without overwhelming the user. UX decision, not tech decision.
- **Story template wording:** What makes golf narratives entertaining? May need iteration with real users.
- **Name collision edge case:** Acknowledged limitation. Future v2+ could add player profiles. Not blocking for v1.1.

## Sources

- Full codebase audit of `src/` directory (all 42 TypeScript files)
- `package.json` dependency analysis
- Store action capabilities (`game-store.ts` -- 369 lines)
- Scoring engine purity analysis (`scoring.ts` -- 160 lines)
- History database schema analysis (`history-db.ts` -- 36 lines)
- Stats computation pattern analysis (`stats.ts` -- 127 lines)

---
*Research summary for: Golf Handicap Scorer v1.1*
*Researched: 2026-02-22*
