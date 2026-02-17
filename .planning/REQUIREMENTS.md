# Requirements: Golf Handicap Scorer v2

**Defined:** 2026-02-17
**Core Value:** Fast, clear scoring on the course -- enter strokes quickly after each hole and always know who's winning at a glance.

## v1 Requirements

Requirements for the v2 rebuild. Each maps to roadmap phases.

### Foundation

- [x] **FOUN-01**: Store validates stroke values (0-20 range) before persisting
- [x] **FOUN-02**: Store validates handicap values and hole numbers against game config
- [x] **FOUN-03**: Store validates player count (2-6) on setPlayers()
- [x] **FOUN-04**: Player IDs use crypto.randomUUID() instead of Math.random()
- [x] **FOUN-05**: verifyZeroSum() called after every score submission with warning on failure
- [x] **FOUN-06**: Persisted state includes version number with cascading migration support
- [x] **FOUN-07**: App shows loading skeleton until Zustand store is hydrated from storage
- [x] **FOUN-08**: Vitest configured with tests covering all pure functions in scoring.ts
- [x] **FOUN-09**: Vitest tests covering all pure functions in pairs.ts
- [x] **FOUN-10**: Setup page resetGame() only triggers on explicit "new game" action, not on mount

### Score Input

- [x] **INPT-01**: User can enter strokes with a single tap per player using preset number row (3-7 range with +/- for outliers)
- [x] **INPT-02**: After submitting hole scores, app auto-advances to the next hole with brief confirmation flash
- [x] **INPT-03**: User can swipe left/right on the play screen to navigate between holes
- [x] **INPT-04**: Phone vibrates briefly on score submission (progressive enhancement, no-op if unsupported)

### Live Display

- [x] **LIVE-01**: Mini-leaderboard showing ranked players with running totals is always visible below stroke input during play
- [x] **LIVE-02**: Each player's leaderboard entry shows inline sparkline of their last 5 holes' cumulative score trend

### Results

- [x] **RSLT-01**: Results page shows line chart of each player's cumulative score across all holes
- [x] **RSLT-02**: Results page shows head-to-head breakdown for each pair with final score, hole-by-hole wins, and handicap-adjusted strokes
- [x] **RSLT-03**: Results page reveals winner with staggered animated podium (3rd -> 2nd -> 1st with celebration)
- [x] **RSLT-04**: User can export results as a styled image card via Web Share API (fallback: download PNG)

### Game History

- [x] **HIST-01**: Completed games are automatically saved to persistent storage (IndexedDB via Dexie)
- [x] **HIST-02**: User can view list of past rounds showing date, players, and winner
- [x] **HIST-03**: User can view cross-round stats: win rate per player, average score, best/worst rounds
- [x] **HIST-04**: Home screen offers "Play again with same players" one-tap start using last-used player list

### Theme & Polish

- [x] **THEM-01**: App supports dark and light theme with auto-detection of system preference and manual toggle
- [x] **THEM-02**: User can undo last score submission within 10 seconds via undo button that appears after submit

### Setup Streamlining

- [x] **SETP-01**: Setup flow (players -> handicaps -> turbo -> play) is streamlined for fewer total taps while keeping all features
- [x] **SETP-02**: Handicap and turbo steps use smart defaults (0 handicap, no turbo) so users can skip through quickly

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Results

- **ADVR-01**: Score storytelling -- generate narrative highlights ("biggest comeback", "longest winning streak")
- **ADVR-02**: Player-vs-player lifetime head-to-head records across all saved rounds

### Advanced Display

- **ADVD-01**: Score trend sparklines in mini-leaderboard during play (upgraded from basic sparklines)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| GPS course maps and distances | Different product category. Users have separate GPS apps/watches. |
| Real-time multiplayer / cloud sync | Requires backend, auth, conflict resolution. One phone is the scorer. |
| User accounts / authentication | Adds login friction. No backend to manage. |
| Official USGA/R&A handicap calculation | Legally regulated, requires 20+ rounds + course ratings. App uses per-round strokes given. |
| Tournament mode (brackets, flights) | Exponential complexity. Focus on single-round experience. |
| Shot-by-shot tracking | Different input model. Slows down scoring, which is the core value. |
| Social feed / comments | Requires backend + moderation. Share via image export instead. |
| Betting / money tracking | Legal gray area. Pairwise scoring already implies "who owes whom." |
| Apple Watch companion | Requires native app, not PWA. Different development stack. |
| AI-powered analysis | Requires ML infrastructure. Rule-based highlights work fine. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Done |
| FOUN-02 | Phase 1 | Done |
| FOUN-03 | Phase 1 | Done |
| FOUN-04 | Phase 1 | Done |
| FOUN-05 | Phase 1 | Done |
| FOUN-06 | Phase 1 | Done |
| FOUN-07 | Phase 1 | Done |
| FOUN-08 | Phase 1 | Done |
| FOUN-09 | Phase 1 | Done |
| FOUN-10 | Phase 1 | Done |
| INPT-01 | Phase 2 | Done |
| INPT-02 | Phase 2 | Done |
| INPT-03 | Phase 2 | Done |
| INPT-04 | Phase 2 | Done |
| LIVE-01 | Phase 2 | Done |
| LIVE-02 | Phase 2 | Done |
| SETP-01 | Phase 3 | Done |
| SETP-02 | Phase 3 | Done |
| RSLT-01 | Phase 4 | Done |
| RSLT-02 | Phase 4 | Done |
| RSLT-03 | Phase 4 | Done |
| RSLT-04 | Phase 4 | Done |
| HIST-01 | Phase 5 | Done |
| HIST-02 | Phase 5 | Done |
| HIST-04 | Phase 5 | Done |
| HIST-03 | Phase 6 | Done |
| THEM-01 | Phase 7 | Done |
| THEM-02 | Phase 7 | Done |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 after roadmap creation*
