# Project Research Summary

**Project:** Golf Handicap Scorer v2
**Domain:** Mobile-first PWA for pairwise handicap golf scoring
**Researched:** 2026-02-17
**Confidence:** HIGH

## Executive Summary

This is a golf scoring PWA that evolved from v1 (single-game, localStorage-only) to v2 (game history, cross-round statistics, richer visualizations, and mobile UX improvements). The product occupies a unique niche: **pairwise group scoring where all C(n,2) player pairs compete simultaneously with configurable handicaps**. No major competitor (Golf GameBook, VPAR, Skins App, Beezer Golf) focuses deeply on this model.

The recommended approach is to build incrementally on the existing foundation. The v1 architecture (Zustand + localStorage, Next.js static PWA, pure scoring functions) is sound and should be preserved. The critical path is: **harden the state layer first (validation, versioning, ID safety)**, then add game history with proper storage (IndexedDB via Dexie), then layer on visualizations (Recharts via shadcn/ui Chart), and finally refine mobile UX. Attempting to add charting or stats before fixing state management pitfalls will result in permanently corrupted historical data.

Key risks are **silent data corruption** (no validation at store boundaries, `verifyZeroSum()` exists but is never called), **localStorage-to-IndexedDB migration** (users mid-game will lose data if migration isn't handled), and **weak ID generation** (`Math.random()` IDs will collide across hundreds of saved games). All three are preventable with proper Phase 1 groundwork. The research has identified clear architectural patterns (two-store separation, game-to-summary conversion, derived stats from history) that avoid common pitfalls in similar offline-first apps.

## Key Findings

### Recommended Stack

The existing stack (Next.js 16, React 19, Zustand 5, Tailwind 4, shadcn/ui) requires no changes. v2 adds:

**Core technologies:**
- **Recharts 3.7.0 (via shadcn/ui Chart)** — SVG charting for score trends and win rates. Adds ~40-50 KB gzipped but is the only chart library with official shadcn/ui integration, ensuring theme consistency and React 19 support. Alternative lightweight options (Victory, Nivo, raw SVG) were considered but lack the ecosystem maturity and design system integration.
- **Dexie 4.3.0 + dexie-react-hooks 4.2.0** — IndexedDB wrapper for game history storage. Provides fluent queries, schema versioning, and reactive React hooks. Game history needs filtering by date/player/course, which raw `idb` cannot do. localStorage will hit 5 MB limits after 50-100 games. Dexie is tree-shakeable (~27 KB gzipped) and has proven migration patterns.
- **Vitest 4.0.18 + React Testing Library** — Official Next.js recommendation for testing. No test coverage exists in v1. Phase 1 requires testing `scoring.ts` (pure functions, zero-sum verification) and `pairs.ts` before building history/stats on top. `fake-indexeddb` allows testing Dexie code without a real browser.

**No mobile input library needed.** The existing `NumberStepper` + shadcn/ui primitives are sufficient. Adding libraries like `react-mobile-picker` would bloat the bundle for problems solvable with CSS and native browser APIs.

**Conditional: date-fns 4.1.0** — Only if relative dates ("3 days ago") are needed in history UI. Try `Intl.DateTimeFormat` first. Add date-fns only if native APIs become unwieldy.

### Expected Features

Research analyzed 15+ golf scoring apps (Golf GameBook, VPAR, PlayThru, Skins App, Beezer Golf, Golf Pad, 18Birdies, mScorecard, TheGrint, Hole19, Arccos) to establish feature expectations.

**Must have (table stakes):**
- **Fast stroke input (<3 taps/player/hole)** — Current v1 uses +/- stepper. Competitors achieve 1-2 taps via preset number rows.
- **Auto-advance to next hole after submit** — Standard across all competitors. v1 requires manual "Next Hole" tap.
- **Clear "who's winning" leaderboard during play** — Every live scoring app shows rankings prominently. v1 hides scoreboard behind toggle.
- **Hole-by-hole score trend visualization** — 18Birdies, mScorecard, Beezer Golf all show line charts. Users expect to see momentum.
- **Head-to-head pair breakdowns** — Core to pairwise model. Must show final scores, who won which holes, handicap-adjusted strokes for each pair.
- **Game history with list of past rounds** — mScorecard, 18Birdies, TheGrint store unlimited round history. Users expect to look back.
- **Basic stats across rounds** — Win rate per player, average score, best/worst rounds.
- **Input validation + state versioning** — Not visible but prevents corrupt state. All production apps validate.

**Should have (competitive advantage):**
- **Score storytelling (narrative results)** — No competitor generates text highlights like "Ohm dominated holes 10-14 to overtake Mingrath." Biggest UX gap in market.
- **Player-vs-player historical stats** — "You vs Mingrath: 12 wins, 8 losses across 23 rounds." No app shows lifetime head-to-head records.
- **Results share as image** — Standard sharing feature. Generate styled results card via canvas-to-image.
- **Animated results podium** — Kahoot-style reveal. Low cost, high delight.
- **Dark/light theme toggle** — v1 is dark-only. Golf is played in bright sunlight where dark themes are hard to read.

**Defer (anti-features — deliberately not building):**
- **GPS course maps and distances** — Different product category. Adds massive complexity. This is a scoring tool, not a rangefinder.
- **Real-time multiplayer / cloud sync** — Requires backend, auth, conflict resolution. One phone is always the scorer in practice.
- **Official USGA/R&A handicap calculation** — Legal/regulatory complexity. This app uses per-round pairwise handicaps (strokes given), not official handicap indices.
- **Tournament mode (brackets, flights)** — Exponential complexity. Focus on single-round experience.
- **Shot-by-shot tracking** — Slows down scoring flow which is this app's core value.

### Architecture Approach

Evolve from single-game model to multi-game with history and stats while preserving v1's sound foundations (pure scoring functions, static PWA, Zustand state management).

**Major components:**

1. **Two-store separation (Game + History)** — Split persistent state into two independent Zustand stores with separate localStorage keys. Game store (`golf-handicap-game`) owns active round. History store (`golf-history`) owns completed game summaries. `resetGame()` cannot corrupt history. Each store hydrates independently and has its own versioning.

2. **Game-to-summary conversion at save boundary** — When a game completes, convert full `GameState` (verbose, per-stroke) into compact `GameSummary` (condensed, per-player totals and rankings) before writing to history. Each `GameSummary` is ~0.5-1 KB vs 5-10 KB for full state. Allows hundreds of games in localStorage.

3. **Derived stats (compute on render, don't cache)** — Stats are pure functions that take `GameSummary[]` and return computed values. No separate stats store. With <500 game summaries, computation is <1ms. `useMemo` prevents unnecessary recomputation.

4. **State version + migration for safe upgrades** — Add `version` number to both stores. When schema changes, increment version and provide `migrate` function. Zustand persist has built-in support. Users don't lose data when app evolves.

5. **IndexedDB for history storage** — Migrate from localStorage (5 MB limit) to IndexedDB via Dexie. Includes one-time migration utility that checks `localStorage.getItem("golf-handicap-game")`, parses it, writes to IndexedDB, then clears localStorage. Must ship in same deploy that switches storage backends.

**Build order (dependency-driven):**
1. **Phase 1: Foundation** — Types, stores, pure functions, validation, versioning, tests
2. **Phase 2: Game completion + history save** — Connects existing game flow to new history store
3. **Phase 3: Rich results (charts + pair breakdowns)** — shadcn/ui Chart, score trend visualization
4. **Phase 4: History page** — Read-only list of past games with summaries
5. **Phase 5: Stats page** — Cross-round statistics, chart reuse from Phase 3
6. **Phase 6: Setup flow streamlining** — UX improvements, independent of history features

### Critical Pitfalls

**Top 5 pitfalls from research (codebase-verified + ecosystem patterns):**

1. **Setup page `resetGame()` on mount destroys in-progress games** — Current `/setup` calls `resetGame()` in `useEffect([], [])`. If user navigates to setup while active game exists, all strokes are wiped. In v2 with game history, this will prevent saving completed games. **Fix:** Remove unconditional reset. Gate behind explicit "New Game" action. Add `gamePhase` field (`setup | playing | complete`) to store. **Phase: 1 (Store Hardening).**

2. **`Math.random()` player IDs will cause collisions across saved games** — `generateId()` uses `Math.random().toString(36).substring(2, 9)` producing ~36 bits entropy. With hundreds of saved games, birthday problem makes collisions non-trivial. A collision corrupts stats aggregation. **Fix:** Replace with `crypto.randomUUID()`. Add migration preserving existing IDs. **Phase: 1 (Store Hardening).**

3. **`verifyZeroSum()` exists but is never called — silent scoring corruption** — Validation function in `scoring.ts` is never wired to `submitHoleStrokes`. In v2, corrupted scores would be persisted to history and pollute lifetime stats. **Fix:** Call `verifyZeroSum()` inside score submission. Add unit tests verifying zero-sum across all configs. **Phase: 1 (Test Coverage).**

4. **localStorage-to-IndexedDB migration loses active games** — Users who update mid-game will lose in-progress state when storage backend switches. **Fix:** One-time migration utility runs on boot: check localStorage, parse, write to IndexedDB, clear localStorage. Test by seeding localStorage in dev. **Phase: 2 (Game History).**

5. **Zustand store schema evolution without version cascading** — Current store has no `version` field. Developers write migrations for `version === N-1 -> N` but users can skip versions. Without cascading (`if (version < 1) { ... } if (version < 2) { ... }`), store silently resets to defaults. **Fix:** Add `version: 1` immediately. Use `<` not `===` for comparisons. Test skipping versions. **Phase: 1 (Store Hardening).**

**Additional notable pitfalls:**
- **Charting library bloats PWA bundle** — Recharts adds ~40-50 KB gzipped. Acceptable for PWA but must verify charts work offline (precache in service worker) and measure bundle impact. **Phase: 3 (Stats & Charting).**
- **IndexedDB data eviction deletes history without warning** — Browsers can purge data after 7 days inactivity. Call `navigator.storage.persist()` on first launch and show warning if denied. **Phase: 2 (Game History).**

## Implications for Roadmap

Based on research, suggested phase structure prioritizes **data integrity before feature richness**. You cannot retroactively fix corrupted historical data.

### Phase 1: Store Hardening & Test Foundation

**Rationale:** Every subsequent phase depends on a trustworthy state layer. v1 has zero validation, no versioning, weak ID generation, and unused verification functions. Adding game history on top of this foundation will permanently corrupt data. Testing is critical for scoring logic (zero-sum invariant) and migration code.

**Delivers:**
- Input validation at store action boundaries (strokes 0-20, valid player/hole IDs)
- State versioning infrastructure (`version: 1`, cascading migration pattern)
- Secure ID generation (`crypto.randomUUID()` replaces `Math.random()`)
- `verifyZeroSum()` wired into score submission with error handling
- Test setup: Vitest + RTL + fake-indexeddb
- Unit tests for `scoring.ts` (all pair comparison logic, zero-sum verification)
- Unit tests for `pairs.ts` (pair generation, handicap distribution)
- Fix setup page `resetGame()` bug (gate behind explicit action, add `gamePhase` field)

**Addresses:**
- T12 (Input validation), T13 (State versioning), T14 (Hydration guard) from FEATURES.md
- Pitfalls 1, 2, 3, 5 from PITFALLS.md

**Avoids:**
- Silent data corruption in game history
- ID collisions across saved games
- Migration failures when users skip versions
- Active game loss from accidental resets

**Research flag:** Standard patterns. Zustand persist, `crypto.randomUUID()`, and Vitest setup are well-documented. Skip `/gsd:research-phase`.

---

### Phase 2: Game History Storage

**Rationale:** Connects existing game flow to persistent history. Without this, no data for stats/charts. Must include localStorage-to-IndexedDB migration or users lose mid-game progress during deploy.

**Delivers:**
- `GameSummary` type (condensed representation of completed game)
- History store (`useHistoryStore`) with Dexie persistence
- `convertToSummary()` function (GameState → GameSummary)
- Save-to-history action on results page
- localStorage-to-IndexedDB migration utility (one-time, runs on boot)
- `navigator.storage.persist()` call + permission check
- Export history as JSON (manual backup option)

**Uses:**
- Dexie 4.3.0 + dexie-react-hooks 4.2.0 (IndexedDB wrapper)
- State versioning infrastructure from Phase 1

**Implements:**
- Two-store separation pattern (ARCHITECTURE.md)
- Game-to-summary conversion pattern (ARCHITECTURE.md)

**Addresses:**
- T10 (Game history), T13 (State versioning) from FEATURES.md
- Pitfalls 4, 7 from PITFALLS.md

**Avoids:**
- localStorage 5 MB limit
- Active game loss during storage migration
- IndexedDB data eviction without user awareness

**Research flag:** Standard patterns. Dexie migration and Zustand persist with IndexedDB are well-documented. Skip `/gsd:research-phase`.

---

### Phase 3: Rich Results Visualization

**Rationale:** Results page is the immediate payoff users see after every round. Charts make existing data compelling and verify the history/stats architecture works before building the stats dashboard. Can be built using active game state, not historical data, so doesn't block on Phase 2 completion.

**Delivers:**
- shadcn/ui Chart component installation (`npx shadcn@latest add chart`)
- `ScoreTrendChart` component (line chart: cumulative score over holes per player)
- `PairBreakdownAccordion` component (collapsible per-pair results with handicap-adjusted strokes)
- `WinnerSpotlight` component (animated podium reveal, crown + glow)
- Enhanced results page layout (charts + pair breakdowns + save action)
- Haptic feedback on score submission (`navigator.vibrate(50)`)

**Uses:**
- Recharts 3.7.0 (via shadcn/ui Chart) from STACK.md
- Existing `playerScores[]` data from game store

**Implements:**
- Chart components pattern from ARCHITECTURE.md
- Service worker precache for chart bundle (offline support)

**Addresses:**
- T8 (Score trend chart), T9 (Head-to-head pair breakdowns), T4 (Winner spotlight — enhance existing), D6 (Animated podium), D7 (Haptic feedback) from FEATURES.md
- Pitfall 6 (bundle bloat) from PITFALLS.md

**Avoids:**
- Chart library bundle bloat (measure with `next build`, set 50KB budget)
- Offline chart rendering failure (precache Recharts in service worker)
- Inconsistent theming (shadcn/ui integration ensures CSS variable reuse)

**Research flag:** Standard patterns. Recharts + shadcn/ui Chart is documented. Skip `/gsd:research-phase`.

---

### Phase 4: History Page

**Rationale:** Simple read-only page that maps over `games[]` from history store. Needs Phase 2 to populate data. Lower complexity than stats page (no cross-round computation).

**Delivers:**
- `/history` route
- `GameSummaryCard` component (compact past-game display: date, players, winner, score)
- Filter/sort controls (by date, by player, by winner)
- Delete game action with confirmation
- Detail overlay on card tap (full rankings + pair results for selected game)

**Dependencies:**
- Phase 1 (types, History Store)
- Phase 2 (save flow populates history)

**Implements:**
- History page component from ARCHITECTURE.md

**Addresses:**
- T10 (Game history — display) from FEATURES.md

**Research flag:** Standard patterns. List view with Zustand store is straightforward. Skip `/gsd:research-phase`.

---

### Phase 5: Statistics Dashboard

**Rationale:** Most complex UI composition (multiple chart types, player selector, cross-round computation). Benefits from chart components built in Phase 3. Requires multiple games in history to be meaningful.

**Delivers:**
- `/stats` route
- `stats.ts` pure functions: `getPlayerWinRate()`, `getScoreTrend()`, `getHeadToHeadRecord()`, `getAverageScore()`
- Player selector dropdown (show stats for selected player)
- `WinRateChart` component (bar chart: wins/losses per player)
- `ScoreTrendChart` component (reused from Phase 3: score over time across rounds)
- `HeadToHeadCard` component (lifetime record vs each opponent)
- `StatCard` component (numeric stat display: avg score, best round, etc.)

**Dependencies:**
- Phase 1 (stats functions, History Store)
- Phase 2 (populated history)
- Phase 3 (chart components reused)

**Uses:**
- Derived stats pattern (compute on render) from ARCHITECTURE.md
- Recharts components from Phase 3

**Implements:**
- Stats page component from ARCHITECTURE.md

**Addresses:**
- T11 (Basic stats across rounds), D5 (Player-vs-player historical stats), D9 (Sparklines — optional) from FEATURES.md

**Research flag:** Standard patterns. Pure function stats + chart reuse is straightforward. Skip `/gsd:research-phase`.

---

### Phase 6: Setup Flow & Mobile UX Improvements

**Rationale:** Improves existing flow quality. Independent of history/stats features. Lower priority than adding new capabilities but critical for mobile usability (golf is played outdoors with sun glare, one-handed operation).

**Delivers:**
- Fast stroke input redesign (preset number row 3-7, single tap per player)
- Auto-advance to next hole after submit (remove manual "Next Hole" tap)
- Always-visible mini-leaderboard (ranked list with running totals, no toggle)
- Swipe-based hole navigation (left = next, right = previous)
- Setup wizard streamlining (merge handicap+turbo into single step, "Play again with same players" preset)
- Dark/light theme toggle (auto-detect system preference, high-contrast light mode for sunlight)
- Undo last submission (10-second window to revert)
- Touch target size audit (min 48x48px, verify with DevTools overlay)

**Dependencies:**
- Phase 1 (state versioning for player presets)

**Addresses:**
- T1 (Fast stroke input), T2 (Auto-advance), T3 (Clear live leaderboard), D1 (Swipe navigation), D2 (Quick-setup presets), D8 (Dark/light theme), D10 (Undo) from FEATURES.md
- Pitfalls from PITFALLS.md: NumberStepper too small, scoreboard unreadable, default stroke value wastes taps

**Research flag:** Needs research. Mobile input UX patterns (swipe gestures, one-handed operation, outdoor readability) have sparse golf-specific documentation. **Recommend `/gsd:research-phase` for mobile UX patterns.**

---

### Phase Ordering Rationale

1. **Phase 1 must come first** — Data integrity is non-negotiable. Adding history/stats on top of unvalidated, unversioned state with weak IDs creates permanent corruption. Testing infrastructure is required for confidence in migration code.

2. **Phase 2 before Phase 4/5** — History storage must exist before pages that read history. Dexie migration must ship in same deploy that switches backends or users lose active games.

3. **Phase 3 can parallel Phase 2** — Charts use active game data from v1 store, not history. Building charts first validates the visualization approach before stats complexity.

4. **Phase 4 before Phase 5** — History list is simpler than stats dashboard. Validates history store read patterns before complex cross-round computation.

5. **Phase 6 independent** — Can build in parallel with 4/5. UX improvements don't depend on history features. Deferred to last because new capabilities (history/stats) are higher value than refining existing flows.

**Dependency chain:**
```
Phase 1 (Foundation)
    ├──→ Phase 2 (History Storage)
    │       ├──→ Phase 4 (History Page)
    │       └──→ Phase 5 (Stats Page) ← also uses Phase 3 charts
    ├──→ Phase 3 (Rich Results) ──→ Phase 5 (reuses charts)
    └──→ Phase 6 (Setup/Mobile UX — independent)
```

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 6 (Setup/Mobile UX)** — Mobile input patterns (swipe gestures, one-handed operation, outdoor readability) are domain-specific. Golf apps have unique constraints (sun glare, gloves, walking). Recommend `/gsd:research-phase` to study Golf Pad, Beezer Golf mobile input UX and NN/g touch target guidelines.

**Phases with standard patterns (skip research-phase):**
- **Phase 1** — Zustand persist versioning, Vitest setup, `crypto.randomUUID()` are well-documented
- **Phase 2** — Dexie migration patterns, Zustand with IndexedDB storage adapter are documented
- **Phase 3** — shadcn/ui Chart + Recharts integration is official
- **Phase 4** — List view with filter/sort is standard React patterns
- **Phase 5** — Pure function stats + chart reuse is straightforward

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All versions verified via npm registry. Recharts 3.7.0 peer deps explicitly include React 19. Vitest 4.x is official Next.js recommendation. Dexie 4.x has proven React 19 compatibility. |
| Features | **MEDIUM** | Based on analysis of 15+ golf apps (marketing pages + app store listings, not hands-on testing). Table stakes features are consistent across competitors. Differentiators are inferred gaps, not validated with users. |
| Architecture | **HIGH** | Zustand multi-store pattern is documented in official repo discussions. Game-to-summary conversion is standard event sourcing practice. Derived stats pattern avoids common caching pitfalls. |
| Pitfalls | **HIGH** | Pitfalls 1-3 are codebase-verified (setup reset bug, Math.random IDs, unused verifyZeroSum). Pitfalls 4-7 are documented in Zustand persist, MDN Storage API, and web.dev PWA guides. |

**Overall confidence:** **HIGH**

### Gaps to Address

**Gap 1: Mobile input UX for outdoor use**
- **Issue:** Golf is played in bright sunlight with gloves, one-handed, while walking. Desktop UX patterns (click small buttons) don't translate.
- **Resolution:** Phase 6 requires `/gsd:research-phase` to study mobile-first golf apps (Golf Pad, Beezer), WCAG touch target guidelines, and PWA input best practices. Test on real phone outdoors before finalizing.

**Gap 2: Score storytelling algorithm (narrative results)**
- **Issue:** "Ohm dominated holes 10-14 to overtake Mingrath" requires post-game analysis algorithm. No research conducted on natural language generation for sports results.
- **Resolution:** Defer to v3+ (marked as future consideration in FEATURES.md). If prioritized, requires separate research spike on NLG templates and momentum detection algorithms.

**Gap 3: Bundle size tolerance for PWA**
- **Issue:** Recharts adds ~40-50 KB gzipped. Acceptable for this use case but no hard budget was established.
- **Resolution:** Phase 3 planning must measure bundle impact with `next build` and set hard limit (recommend max 200 KB first-load JS per route, max 50 KB for chart code). If exceeded, evaluate lightweight alternatives (uplot, raw SVG).

**Gap 4: Player identity across rounds**
- **Issue:** Stats like "lifetime record vs Mingrath" require matching player names across rounds. Current design uses name-based matching (string equality). Nicknames, typos, or name changes break associations.
- **Resolution:** Accept limitation for v2. Phase 5 planning should note this edge case. If it becomes a real problem, add a "player profiles" feature in v3 with explicit identity management.

## Sources

### Primary (HIGH confidence)
- [npm registry: recharts@3.7.0](https://www.npmjs.com/package/recharts) — version, peer deps (React 19), dependencies verified
- [npm registry: dexie@4.3.0](https://www.npmjs.com/package/dexie) — version verified
- [npm registry: vitest@4.0.18](https://www.npmjs.com/package/vitest) — version, peer deps verified
- [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/radix/chart) — Recharts integration, installation
- [Zustand persist middleware docs](https://zustand.docs.pmnd.rs/middlewares/persist) — version, migrate, storage options
- [Next.js Testing Guide: Vitest](https://nextjs.org/docs/app/guides/testing/vitest) — official setup
- [MDN Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — quotas, eviction policies
- [web.dev Persistent Storage](https://web.dev/articles/persistent-storage) — `navigator.storage.persist()` behavior
- Codebase analysis: `src/lib/game-store.ts`, `src/app/setup/page.tsx`, `src/lib/scoring.ts` — verified current bugs

### Secondary (MEDIUM confidence)
- [Golf GameBook](https://www.golfgamebook.com/) — feature list, 20+ game formats
- [VPAR](https://vpar.com/) — GPS, matchplay mode, dynamic leaderboards
- [PlayThru](https://www.golfplaythru.com/) — live scoring UX
- [Skins App](https://skinsapp.com/) — 13 game types, money tracking
- [Beezer Golf](https://www.beezergolf.com/) — 20 side games, stat visualization
- [Golf Pad Quick Score](https://support.golfpadgps.com/support/solutions/articles/6000225549-keeping-score-in-quick-score) — 2-tap input flow
- [18Birdies](https://18birdies.com/) — score-over-time charts
- [mScorecard](https://www.mscorecard.com/) — round history, advanced stats
- [8 Top Golf Scoring Apps Compared](https://www.golfplaythru.com/blog/8-of-the-top-golf-scoring-apps-compared) — feature comparison
- [NN/g Input Stepper Guidelines](https://www.nngroup.com/articles/input-steppers/) — touch target sizing
- [React Chart Libraries 2026](https://blog.logrocket.com/best-react-chart-libraries-2025/) — bundle size comparison

### Tertiary (LOW confidence)
- [Golf App UX Best Practices 2025](https://www.golfcoursetechnologyreviews.org/buying-guide/comprehensive-buying-guide-to-golf-course-mobile-apps-in-2025) — one-handed use, battery life (needs validation)
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) — 44px touch target (accessibility standard)

---

*Research completed: 2026-02-17*
*Ready for roadmap: yes*
