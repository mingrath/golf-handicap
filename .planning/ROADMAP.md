# Roadmap: Golf Handicap Scorer v2

## Milestones

- **v1.0 Golf Handicap Scorer v2** -- Phases 1-7 (shipped 2026-02-17)
- **v1.1 UX Fixes & Insights** -- Phases 8-12 (shipped 2026-02-22)

## Phases

<details>
<summary>v1.0 (Phases 1-7) -- SHIPPED 2026-02-17</summary>

- [x] Phase 1: Store Hardening & Test Foundation (2/2 plans) -- completed 2026-02-17
- [x] Phase 2: Score Input & Live Play (2/2 plans) -- completed 2026-02-17
- [x] Phase 3: Setup Streamlining (1/1 plan) -- completed 2026-02-17
- [x] Phase 4: Rich Results (2/2 plans) -- completed 2026-02-17
- [x] Phase 5: Game History (2/2 plans) -- completed 2026-02-17
- [x] Phase 6: Cross-Round Statistics (1/1 plan) -- completed 2026-02-17
- [x] Phase 7: Theme & Polish (2/2 plans) -- completed 2026-02-17

Full details: `milestones/v1.0-ROADMAP.md`

</details>

### v1.1 UX Fixes & Insights (In Progress)

**Milestone Goal:** Address real user feedback (stroke input limits, score editability) and add round insight features (storytelling narratives, lifetime head-to-head records).

- [x] **Phase 8: Foundation** - Replay engine, running total fix, and extended stroke input
- [x] **Phase 9: Edit During Play** - Tap-to-edit holes, handicap editing, and cross-check during play
- [x] **Phase 10: Edit on Results** - Stroke and handicap editing on results page with history update
- [x] **Phase 11: Storytelling** - Narrative highlight engine and results page display
- [x] **Phase 12: Head-to-Head** - Lifetime player-vs-player records across saved games

## Phase Details

### Phase 8: Foundation
**Goal**: Users get a better stroke input experience, and the app gains the replay infrastructure that all editing features depend on
**Depends on**: v1.0 (shipped)
**Requirements**: INPUT-01, INPUT-02, EDIT-02
**Success Criteria** (what must be TRUE):
  1. User can enter any stroke value from 1 to 20 (not limited to the preset 1-6 row)
  2. Stroke input defaults to 4 for every player on every hole, reducing taps for typical scores
  3. Editing any hole's strokes automatically recalculates all pair results, running totals, and rankings from that hole forward
  4. Score trend chart and mini leaderboard show correct intermediate running totals after any edit (no stale values)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Edit During Play
**Goal**: Users can correct mistakes and cross-check scores with a second scorer without leaving the play screen
**Depends on**: Phase 8 (replay engine)
**Requirements**: EDIT-01, EDIT-03, EDIT-04
**Success Criteria** (what must be TRUE):
  1. User can tap any previously completed hole to navigate back and edit its strokes during play
  2. User can change handicap settings during play and see all scores replay correctly
  3. Two scorers can compare their independently recorded scores for a hole and correct discrepancies immediately
  4. All edits during play preserve undo capability and do not corrupt game state
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Edit on Results
**Goal**: Users can fix keying mistakes on the final results page and have corrections persist to saved history
**Depends on**: Phase 8 (replay engine)
**Requirements**: REDT-01, REDT-02, REDT-03
**Success Criteria** (what must be TRUE):
  1. User can edit individual stroke entries on the final results scorecard
  2. User can edit handicap settings on the final results page
  3. Editing any value on results recalculates all scores, rankings, podium, charts, and storytelling
  4. Edits on the results page update the saved game in IndexedDB history (no desync between display and storage)
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

### Phase 11: Storytelling
**Goal**: Users see entertaining narrative highlights that make their round memorable and shareable
**Depends on**: Phase 8 (scoring data, but no hard code dependency -- can run in parallel with 9/10 if needed)
**Requirements**: STORY-01, STORY-02
**Success Criteria** (what must be TRUE):
  1. App generates at least 2-3 narrative highlights per completed round (e.g., "biggest comeback", "longest winning streak", "clutch finish")
  2. Storytelling highlights display prominently on the results page
  3. Highlights handle edge cases gracefully (short games, ties, single-pair matches produce meaningful narratives or are omitted)
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

### Phase 12: Head-to-Head
**Goal**: Users can see their lifetime rivalry records against specific opponents across all saved games
**Depends on**: v1.0 history store (no dependency on phases 8-11)
**Requirements**: H2H-01, H2H-02, H2H-03
**Success Criteria** (what must be TRUE):
  1. App computes lifetime win/loss/tie records for every player pair from all saved games in IndexedDB
  2. Head-to-head records display on the results page showing current matchup context (e.g., "You lead 5-3-1 all time")
  3. Head-to-head records display on the stats page as a full history view across all player pairs
  4. Player matching works correctly across games despite capitalization differences (case-insensitive name matching)
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 8 -> 9 -> 10 -> 11 -> 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Store Hardening & Test Foundation | v1.0 | 2/2 | Complete | 2026-02-17 |
| 2. Score Input & Live Play | v1.0 | 2/2 | Complete | 2026-02-17 |
| 3. Setup Streamlining | v1.0 | 1/1 | Complete | 2026-02-17 |
| 4. Rich Results | v1.0 | 2/2 | Complete | 2026-02-17 |
| 5. Game History | v1.0 | 2/2 | Complete | 2026-02-17 |
| 6. Cross-Round Statistics | v1.0 | 1/1 | Complete | 2026-02-17 |
| 7. Theme & Polish | v1.0 | 2/2 | Complete | 2026-02-17 |
| 8. Foundation | v1.1 | 1/1 | Complete | 2026-02-22 |
| 9. Edit During Play | v1.1 | 1/1 | Complete | 2026-02-22 |
| 10. Edit on Results | v1.1 | 1/1 | Complete | 2026-02-22 |
| 11. Storytelling | v1.1 | 1/1 | Complete | 2026-02-22 |
| 12. Head-to-Head | v1.1 | 1/1 | Complete | 2026-02-22 |

---
*Roadmap created: 2026-02-17 (v1.0), updated 2026-02-22 (v1.1)*
