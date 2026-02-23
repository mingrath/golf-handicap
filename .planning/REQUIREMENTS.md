# Requirements: Golf Handicap Scorer

**Defined:** 2026-02-23
**Core Value:** Fast, clear scoring on the course -- enter strokes quickly after each hole and always know who's winning at a glance.

## v1.3 Requirements

Requirements for v1.3 Handicap Control & History Editing milestone. Each maps to roadmap phases.

### Handicap Hole Control

- [ ] **HCTL-01**: User can see which holes currently have handicap strokes when editing a pair's handicap
- [ ] **HCTL-02**: User can manually toggle individual holes on/off for handicap strokes (instead of only auto-distribute)
- [ ] **HCTL-03**: When user changes handicap value, the app shows current hole selections and lets user adjust which holes to add/remove

### History Editing

- [ ] **HIST-01**: User can tap a past game in the history list to open it in a detail/results view
- [ ] **HIST-02**: User can edit scores (strokes per hole per player) of a past game
- [ ] **HIST-03**: User can edit handicap values and handicap hole assignments of a past game
- [ ] **HIST-04**: Edits to a past game recalculate all scores, rankings, and storytelling, and persist back to IndexedDB

## Previous Requirements (v1.2 -- all complete)

### Score Audit

- [x] **AUDIT-01**: User can open a raw stroke input grid during play showing all entered strokes
- [x] **AUDIT-02**: User can open the same raw stroke input grid from the results page
- [x] **AUDIT-03**: The audit grid shows which holes carry handicap strokes for each pair
- [x] **AUDIT-04**: User can tap any hole row in the audit grid to navigate directly to that hole for editing

### Quick Setup

- [x] **QSET-01**: "Play Again" from home page restores full config including handicap settings
- [x] **QSET-02**: Results page has a "Play Again" button that pre-loads the same full config

## Previous Requirements (v1.1 -- all complete)

### Stroke Input

- [x] **INPUT-01**: User can type any stroke number directly via numeric keypad
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

- [x] **STORY-01**: App generates narrative highlights after each round
- [x] **STORY-02**: Storytelling highlights display on the results page

### Head-to-Head

- [x] **H2H-01**: App computes lifetime win/loss/tie records for each player pair across all saved games
- [x] **H2H-02**: Head-to-head records display on the results page
- [x] **H2H-03**: Head-to-head records display on the stats page

## Future Requirements

Deferred beyond v1.3. Tracked but not in current roadmap.

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
| HCTL-01 | Phase 15 | Pending |
| HCTL-02 | Phase 15 | Pending |
| HCTL-03 | Phase 15 | Pending |
| HIST-01 | Phase 16 | Pending |
| HIST-02 | Phase 16 | Pending |
| HIST-03 | Phase 16 | Pending |
| HIST-04 | Phase 16 | Pending |

**Coverage:**
- v1.3 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 after v1.3 roadmap creation*
