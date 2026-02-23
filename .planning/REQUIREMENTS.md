# Requirements: Golf Handicap Scorer

**Defined:** 2026-02-23
**Core Value:** Fast, clear scoring on the course -- enter strokes quickly after each hole and always know who's winning at a glance.

## v1.2 Requirements

Requirements for v1.2 Score Transparency & Fast Setup milestone. Each maps to roadmap phases.

### Score Audit

- [ ] **AUDIT-01**: User can open a raw stroke input grid during play showing all entered strokes (rows = holes, columns = players)
- [ ] **AUDIT-02**: User can open the same raw stroke input grid from the results page
- [ ] **AUDIT-03**: The audit grid shows which holes carry handicap strokes for each pair, so user can verify handicap configuration
- [ ] **AUDIT-04**: User can tap any hole row in the audit grid to navigate directly to that hole for editing

### Quick Setup

- [ ] **QSET-01**: "Play Again" from home page restores full config — player names, hole count, AND all handicap settings (not just names + holes)
- [ ] **QSET-02**: Results page has a "Play Again" button that pre-loads the same full config and starts a new game

## Previous Requirements (v1.1 -- all complete)

### Stroke Input

- [x] **INPUT-01**: User can type any stroke number directly via numeric keypad (replacing preset button row)
- [x] **INPUT-02**: Stroke input defaults to 4 for each player on each hole

### Play Editing

- [x] **EDIT-01**: User can tap any previous hole to go back and edit strokes during play
- [x] **EDIT-02**: Editing a hole's strokes automatically recalculates all pair results and running totals
- [x] **EDIT-03**: User can edit handicap settings during play with full score replay
- [x] **EDIT-04**: Cross-check: two scorers can compare and correct scores immediately after each hole

### Results Editing

- [x] **REDT-01**: User can edit individual stroke entries on the final results scorecard
- [x] **REDT-02**: User can edit handicap settings on the final results page
- [x] **REDT-03**: Editing on results page recalculates all scores, rankings, and updates saved history

### Storytelling

- [x] **STORY-01**: App generates narrative highlights after each round (e.g., "biggest comeback", "longest winning streak", "clutch finish")
- [x] **STORY-02**: Storytelling highlights display on the results page

### Head-to-Head

- [x] **H2H-01**: App computes lifetime win/loss/tie records for each player pair across all saved games
- [x] **H2H-02**: Head-to-head records display on the results page (current matchup context)
- [x] **H2H-03**: Head-to-head records display on the stats page (full history view)

## Future Requirements

Deferred beyond v1.2. Tracked but not in current roadmap.

### Backlog

- **EXPORT-01**: User can export game history as JSON backup
- **PWA-01**: App prompts for persistent storage to prevent IndexedDB eviction

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time multiplayer / cloud sync | One phone is the scorer, no backend |
| User accounts / authentication | Single-device app, no login friction |
| Tournament mode (brackets, flights) | Focus on single-round experience |
| Shot-by-shot tracking | Slows down scoring, different input model |
| Official USGA/R&A handicap calculation | Legally regulated, requires 20+ rounds |
| AI-powered analysis | Rule-based highlights work fine |
| Player profiles / avatars | Name-based matching sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 13 | Pending |
| AUDIT-02 | Phase 13 | Pending |
| AUDIT-03 | Phase 13 | Pending |
| AUDIT-04 | Phase 13 | Pending |
| QSET-01 | Phase 14 | Pending |
| QSET-02 | Phase 14 | Pending |

**Coverage:**
- v1.2 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 -- traceability filled after roadmap creation*
