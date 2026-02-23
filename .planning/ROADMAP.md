# Roadmap: Golf Handicap Scorer v2

## Milestones

- **v1.0 Golf Handicap Scorer v2** -- Phases 1-7 (shipped 2026-02-17)
- **v1.1 UX Fixes & Insights** -- Phases 8-12 (shipped 2026-02-22)
- **v1.2 Score Transparency & Fast Setup** -- Phases 13-14 (shipped 2026-02-23)
- **v1.3 Handicap Control & History Editing** -- Phases 15-16 (in progress)

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

<details>
<summary>v1.1 UX Fixes & Insights (Phases 8-12) -- SHIPPED 2026-02-22</summary>

- [x] Phase 8: Foundation -- completed 2026-02-22
- [x] Phase 9: Edit During Play -- completed 2026-02-22
- [x] Phase 10: Edit on Results -- completed 2026-02-22
- [x] Phase 11: Storytelling -- completed 2026-02-22
- [x] Phase 12: Head-to-Head -- completed 2026-02-22

Full details: `milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>v1.2 Score Transparency & Fast Setup (Phases 13-14) -- SHIPPED 2026-02-23</summary>

**Milestone Goal:** Let users verify what was entered when scores look wrong, and eliminate handicap re-entry on repeat games.

- [x] **Phase 13: Score Audit Grid** - Raw stroke input grid visible during and after play, with handicap-hole visibility and tap-to-edit navigation -- completed 2026-02-23
- [x] **Phase 14: Play Again Config Restore** - "Play Again" restores full config including handicap settings, accessible from both home and results pages -- completed 2026-02-23

Full details: `milestones/v1.2-ROADMAP.md`

</details>

## Phase Details

<details>
<summary>v1.0 Phases 1-7 (SHIPPED)</summary>

### Phase 1: Store Hardening & Test Foundation
**Goal**: Hardened Zustand store with validation, state versioning, and test coverage
**Plans**: 2/2 complete

### Phase 2: Score Input & Live Play
**Goal**: Fast single-tap stroke input with live leaderboard
**Plans**: 2/2 complete

### Phase 3: Setup Streamlining
**Goal**: 3-step setup flow with smart defaults
**Plans**: 1/1 complete

### Phase 4: Rich Results
**Goal**: Animated podium, charts, head-to-head breakdowns, shareable image card
**Plans**: 2/2 complete

### Phase 5: Game History
**Goal**: Game history persisted to IndexedDB with play-again shortcut
**Plans**: 2/2 complete

### Phase 6: Cross-Round Statistics
**Goal**: Win rates, averages, and best/worst across saved games
**Plans**: 1/1 complete

### Phase 7: Theme & Polish
**Goal**: Dark/light theme, semantic tokens, undo submission
**Plans**: 2/2 complete

</details>

<details>
<summary>v1.1 Phases 8-12 (SHIPPED)</summary>

### Phase 8: Foundation
**Goal**: Users get a better stroke input experience, and the app gains the replay infrastructure that all editing features depend on
**Depends on**: v1.0 (shipped)
**Requirements**: INPUT-01, INPUT-02, EDIT-02
**Success Criteria** (what must be TRUE):
  1. User can enter any stroke value from 1 to 20 (not limited to the preset 1-6 row)
  2. Stroke input defaults to 4 for every player on every hole, reducing taps for typical scores
  3. Editing any hole's strokes automatically recalculates all pair results, running totals, and rankings from that hole forward
  4. Score trend chart and mini leaderboard show correct intermediate running totals after any edit (no stale values)
**Plans**: 1/1 complete

### Phase 9: Edit During Play
**Goal**: Users can correct mistakes and cross-check scores with a second scorer without leaving the play screen
**Depends on**: Phase 8 (replay engine)
**Requirements**: EDIT-01, EDIT-03, EDIT-04
**Success Criteria** (what must be TRUE):
  1. User can tap any previously completed hole to navigate back and edit its strokes during play
  2. User can change handicap settings during play and see all scores replay correctly
  3. Two scorers can compare their independently recorded scores for a hole and correct discrepancies immediately
  4. All edits during play preserve undo capability and do not corrupt game state
**Plans**: 1/1 complete

### Phase 10: Edit on Results
**Goal**: Users can fix keying mistakes on the final results page and have corrections persist to saved history
**Depends on**: Phase 8 (replay engine)
**Requirements**: REDT-01, REDT-02, REDT-03
**Success Criteria** (what must be TRUE):
  1. User can edit individual stroke entries on the final results scorecard
  2. User can edit handicap settings on the final results page
  3. Editing any value on results recalculates all scores, rankings, podium, charts, and storytelling
  4. Edits on the results page update the saved game in IndexedDB history (no desync between display and storage)
**Plans**: 1/1 complete

### Phase 11: Storytelling
**Goal**: Users see entertaining narrative highlights that make their round memorable and shareable
**Depends on**: Phase 8 (scoring data)
**Requirements**: STORY-01, STORY-02
**Success Criteria** (what must be TRUE):
  1. App generates at least 2-3 narrative highlights per completed round (e.g., "biggest comeback", "longest winning streak", "clutch finish")
  2. Storytelling highlights display prominently on the results page
  3. Highlights handle edge cases gracefully (short games, ties, single-pair matches produce meaningful narratives or are omitted)
**Plans**: 1/1 complete

### Phase 12: Head-to-Head
**Goal**: Users can see their lifetime rivalry records against specific opponents across all saved games
**Depends on**: v1.0 history store
**Requirements**: H2H-01, H2H-02, H2H-03
**Success Criteria** (what must be TRUE):
  1. App computes lifetime win/loss/tie records for every player pair from all saved games in IndexedDB
  2. Head-to-head records display on the results page showing current matchup context (e.g., "You lead 5-3-1 all time")
  3. Head-to-head records display on the stats page as a full history view across all player pairs
  4. Player matching works correctly across games despite capitalization differences (case-insensitive name matching)
**Plans**: 1/1 complete

</details>

<details>
<summary>v1.2 Phases 13-14 (SHIPPED)</summary>

### Phase 13: Score Audit Grid
**Goal**: Users can open a raw stroke input grid at any time during or after play to verify exactly what was entered per hole per player, see which holes carry handicap strokes per pair, and jump directly to any hole for editing
**Depends on**: v1.1 (edit-during-play and edit-on-results infrastructure)
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04
**Success Criteria** (what must be TRUE):
  1. User can open the audit grid during active play and see every entered stroke value in a holes-by-players table
  2. User can open the same audit grid from the results page to verify entered strokes post-round
  3. The audit grid shows which holes carry handicap strokes for each pair, so the user can spot a misconfigured handicap
  4. User can tap any hole row in the audit grid to navigate directly to that hole for editing (during play) or for stroke correction (on results)
**Plans**: 1/1 complete

Plans:
- [x] 13-01-PLAN.md — ScoreAuditDialog component + play/results page integration

### Phase 14: Play Again Config Restore
**Goal**: Users can start a repeat game with zero re-entry -- "Play Again" from either the home page or results page restores player names, hole count, and all handicap settings exactly as configured in the previous game
**Depends on**: Phase 13 (no hard dependency -- can run in parallel, but sequenced for clean delivery)
**Requirements**: QSET-01, QSET-02
**Success Criteria** (what must be TRUE):
  1. "Play Again" on the home page restores player names, hole count, AND all handicap settings (pairwise handicap values and handicap hole assignments), not just names and hole count
  2. Results page has a "Play Again" button that pre-loads the same full config and starts a new game
  3. After tapping "Play Again" from either location, the setup page reflects the restored config with no manual re-entry required
**Plans**: 2 plans

Plans:
- [x] 14-01-PLAN.md — TDD: remapHandicaps pure function + usePlayAgain shared hook
- [x] 14-02-PLAN.md — Wire usePlayAgain into home page (QSET-01) and results page (QSET-02)

</details>

### v1.3 Handicap Control & History Editing (Phases 15-16)

**Milestone Goal:** Give users full control over handicap hole selection when adjusting handicaps, and allow editing past games directly from the history page.

### Phase 15: Manual Handicap Hole Selection
**Goal**: Users can see and manually control which specific holes receive handicap strokes when editing a pair's handicap, instead of relying solely on auto-distribution
**Depends on**: v1.2 (shipped) -- builds on existing HandicapEditDialog and replay engine
**Requirements**: HCTL-01, HCTL-02, HCTL-03
**Success Criteria** (what must be TRUE):
  1. When user opens the handicap edit dialog for a pair, they can see which holes currently have handicap strokes assigned
  2. User can tap individual holes to toggle handicap strokes on or off for that pair, overriding the auto-distribution
  3. When user changes the handicap value (e.g., from 3 to 5), the app shows the current hole selections and lets the user choose which new holes to add (rather than redistributing all holes automatically)
  4. Manual hole selections persist correctly through score replay -- all pair results recalculate using the user-chosen handicap holes
**Plans**: 1/1 complete

Plans:
- [x] 15-01-PLAN.md — Enhance HandicapEditDialog with inline hole toggle grid per pair

### Phase 16: History Game Loading & Editing
**Goal**: Users can tap any past game in the history list to open it in an editable results view, modify scores and handicap settings, and have all changes persist back to IndexedDB
**Depends on**: Phase 15 (manual handicap hole selection UI reused for history editing)
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. User can tap a past game in the history list to open it in a detail/results view showing scores, rankings, charts, and storytelling
  2. User can edit stroke values for any hole and any player in the loaded past game
  3. User can edit handicap values and manually adjust handicap hole assignments for any pair in the loaded past game (using the Phase 15 manual selection UI)
  4. After editing, all scores, rankings, storytelling, and head-to-head records recalculate correctly
  5. Edits persist back to IndexedDB -- closing and reopening the game shows the updated values
**Plans**: 2 plans

Plans:
- [ ] 16-01-PLAN.md — Store infrastructure: historyId field + loadHistoryGame action + history-aware save hook
- [ ] 16-02-PLAN.md — UI wiring: clickable history cards + history-mode results page

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> ... -> 14 -> 15 -> 16

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
| 13. Score Audit Grid | v1.2 | 1/1 | Complete | 2026-02-23 |
| 14. Play Again Config Restore | v1.2 | 2/2 | Complete | 2026-02-23 |
| 15. Manual Handicap Hole Selection | v1.3 | 1/1 | Complete | 2026-02-23 |
| 16. History Game Loading & Editing | v1.3 | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-17 (v1.0), updated 2026-02-22 (v1.1), updated 2026-02-23 (v1.2 shipped, v1.3 added)*
