# Milestones

## v1.0 Golf Handicap Scorer v2 (Shipped: 2026-02-17)

**Phases completed:** 7 phases, 12 plans
**Requirements:** 28/28 satisfied
**Timeline:** 2026-02-17 (single day)
**LOC:** 6,289 TypeScript/CSS
**Files changed:** 79 (14,704 insertions, 1,320 deletions)
**Git range:** feat(01-01) → feat(07-02) (22 feature commits)

**Key accomplishments:**
1. Hardened Zustand store with input validation, state versioning, crypto UUIDs, and 86 passing Vitest tests
2. Fast stroke input with single-tap preset numbers, auto-advance with confirmation flash, and haptic feedback
3. Always-visible mini-leaderboard with sparklines and swipe hole navigation during play
4. Rich results: animated winner podium with confetti, score trend charts, head-to-head pair breakdowns, shareable PNG image card
5. Game history persisted to IndexedDB via Dexie with play-again shortcut and cross-round statistics (win rates, averages)
6. Dark/light theme with system auto-detection, manual toggle, and ~230 hardcoded colors migrated to semantic tokens
7. Undo last score submission with 10-second floating banner and Zustand snapshot/restore

**Archive:** `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`

---

## v1.1 UX Fixes & Insights (Shipped: 2026-02-22)

**Phases completed:** 5 phases (8–12), 5 plans
**Requirements:** 14/14 satisfied
**Timeline:** 2026-02-22 (single day)
**Tests:** 112 tests across 5 test files (all passing)

**Key accomplishments:**
1. Free-type stroke input (any value 1–20), defaults to 4 per player per hole
2. Replay engine (`recalculateAllResults`) — foundation for all editing features
3. Tap-to-edit any hole during play, handicap edit dialog with full score replay
4. Edit strokes and handicap on results page with auto-update to saved history
5. Storytelling engine with 6 narrative detectors (biggest comeback, longest streak, clutch finish, etc.)
6. Lifetime head-to-head records across saved games with case-insensitive name matching

**Archive:** `milestones/v1.1-ROADMAP.md` (see ROADMAP.md phases 8–12)

---


## v1.2 Score Transparency & Fast Setup (Shipped: 2026-02-23)

**Phases completed:** 2 phases (13-14), 3 plans
**Requirements:** 6/6 satisfied (AUDIT-01/02/03/04, QSET-01/02)
**Timeline:** 2026-02-23 (single day)
**Tests:** 118 tests across 6 test files (all passing)

**Key accomplishments:**
1. Score audit grid (ScoreAuditDialog) for verifying raw stroke inputs during and after play, with handicap-hole visibility
2. Tap-to-edit navigation from audit grid to specific holes
3. "Play Again" config restore from home and results pages using remapHandicaps + usePlayAgain hook

**Archive:** `milestones/v1.2-ROADMAP.md`, `milestones/v1.2-REQUIREMENTS.md`

---

## v1.3 Handicap Control & History Editing (Shipped: 2026-02-23)

**Phases completed:** 2 phases (15-16), 3 plans
**Requirements:** 7/7 satisfied (HCTL-01/02/03, HIST-01/02/03/04)
**Timeline:** 2026-02-23 (~35 min)
**Files changed:** 16 files (+1,259/-63 lines)
**Git range:** b101f46..133e368

**Key accomplishments:**
1. Inline hole toggle grid in HandicapEditDialog with smart preserve/trim logic (HCTL-01/02/03)
2. Two-store bridge: loadHistoryGame hydrates Zustand from IndexedDB with historyId tracking
3. History-aware useSaveGame with skip-on-load pattern for seamless edit persistence
4. Clickable history cards with tap-to-load and history-mode results page (HIST-01/02/03/04)

**Archive:** `milestones/v1.3-ROADMAP.md`, `milestones/v1.3-REQUIREMENTS.md`

---

