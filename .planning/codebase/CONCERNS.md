# Codebase Concerns

**Analysis Date:** 2026-02-17

## Test Coverage Gaps

**No Test Framework Configured:**
- What's not tested: Core scoring logic, pair generation, handicap distribution, store mutations, UI components
- Files: `src/lib/scoring.ts`, `src/lib/pairs.ts`, `src/lib/game-store.ts`, all pages under `src/app/`
- Risk: Zero-sum game rule can break undetected; handicap calculations prone to silent failures; scoring regressions not caught on deployment
- Priority: High
- Recommendation: Add Jest or Vitest with unit tests for all functions in `src/lib/`. Scoring logic especially needs integration tests validating zero-sum per hole.

## Missing Error Handling

**No Validation in Game Store:**
- Problem: `setHandicap()`, `submitHoleStrokes()` don't validate input ranges (strokes 0-20, handicap -18 to +18, hole numbers 1 to numberOfHoles)
- Files: `src/lib/game-store.ts` (lines 83-103, 160-222)
- Impact: Invalid data can persist in localStorage, corrupting game state on reload
- Fix approach: Add validation layer before mutations; return errors from actions or throw; add error boundary in pages

**Missing Bounds Checks in Scoring:**
- Problem: `getRunningTotals()` uses `Infinity` as hole filter (line 139 in `src/lib/scoring.ts`), `calculatePlayerHoleScores()` doesn't check if player exists
- Files: `src/lib/scoring.ts` (lines 119-130, 81-106)
- Impact: Stale player references after deletion or editing could cause silent NaN in totals
- Fix approach: Add explicit max hole parameter; validate playerId exists in players list

## Data Integrity Risks

**Pair Key Generation Relies on Sorting:**
- Problem: `makePairKey()` in `src/lib/pairs.ts` (lines 4-6) sorts alphabetically but doesn't validate the inputs are non-empty strings
- Files: `src/lib/pairs.ts`
- Impact: Empty or null player IDs could create ambiguous pair keys; manual ID generation with `Math.random()` in `src/app/setup/page.tsx` (line 15) is not guaranteed unique
- Fix approach: Use UUID library (crypto.randomUUID); add assertion that playerIds are non-empty

**No Validation of Player Count:**
- Problem: App assumes 2-6 players but stores only enforce max at UI level (line 40 in setup, line 96 in handicap)
- Files: `src/app/setup/page.tsx`
- Impact: Zustand store could accept 0 or 7+ players if mutations called directly; pair generation becomes unpredictable
- Fix approach: Add store-level validation in `setPlayers()` action to clamp 2-6 range

**No Validation of Hole Numbers:**
- Problem: `numberOfHoles` can be set to 1-36 but there's no guard against setting it to 0 or negative
- Files: `src/lib/game-store.ts` (lines 71-81), `src/app/setup/page.tsx` (lines 84-85)
- Impact: Zero holes would cause division by zero in `distributeHandicapHoles()` (line 45 in `src/lib/pairs.ts`)
- Fix approach: Validate `numberOfHoles >= 1` in store; ensure UI cannot send 0

## Fragile Scoring Logic

**Handicap Adjustment Sign Convention Not Enforced:**
- Problem: Comment says "Positive value = playerA is better" but no validation that value sign matches intended meaning
- Files: `src/lib/scoring.ts` (lines 15-31)
- Impact: If sign is flipped (e.g., admin editing localStorage), results are inverted silently
- Safe modification: Add test fixtures covering positive, negative, and zero handicaps; document in JSDoc that value sign is semantic contract

**Zero-Sum Assumption Not Verified at Store Level:**
- Problem: `verifyZeroSum()` function exists (lines 111-114 in `src/lib/scoring.ts`) but is never called
- Files: `src/lib/scoring.ts`, `src/lib/game-store.ts`
- Impact: Bugs in handicap logic or player count mismatches could silently violate zero-sum, producing invalid leaderboards
- Fix approach: Call `verifyZeroSum()` in `submitHoleStrokes()` action; log warning if fails; consider hard error in strict mode

**Handicap Hole Distribution Uses Floor (Not Balanced):**
- Problem: `distributeHandicapHoles()` uses simple floor division (line 55 in `src/lib/pairs.ts`). For 5 strokes over 18 holes: hits 0, 3.6→3, 7.2→7, 10.8→10, 14.4→14. Gaps are uneven.
- Files: `src/lib/pairs.ts` (lines 40-59)
- Impact: For small strokes over many holes, weighting is biased toward early holes (golfers prefer even distribution)
- Improvement path: Use round-robin or randomized distribution; consider implementing golf's Handicap Index algorithm

## State Management Concerns

**Zustand Persist Middleware Risk:**
- Problem: Entire game state persists to localStorage. If app version adds new fields, old stored data lacks them (null coercion risk)
- Files: `src/lib/game-store.ts` (lines 250-253)
- Impact: Upgrading app with schema changes (e.g., adding `roundId` field) causes silent null values on resumed games
- Mitigation: Add version field to persisted state; implement migration function on hydrate

**No Explicit Hydration Guard:**
- Problem: Pages check `config?.players?.length` to detect if store is loaded, but localStorage might be stale or corrupted
- Files: All pages (`src/app/play/page.tsx`, `src/app/results/page.tsx`, etc.)
- Impact: If localStorage is cleared mid-game or corrupted, pages redirect to setup but don't show error; user loses progress silently
- Fix approach: Add explicit hydration state to store (`isHydrated` flag); show loading screen until hydrated

**Store Reset on Setup Entry:**
- Problem: `resetGame()` called in Setup useEffect (line 35 in `src/app/setup/page.tsx`) with empty dependency array triggers on every mount
- Files: `src/app/setup/page.tsx` (lines 34-37)
- Impact: If user navigates away and back to setup, all game progress is wiped (even if game is in progress)
- Fix approach: Only reset on explicit "new game" button, not on mount; use conditional reset

## UI/UX Edge Cases

**Edit Stroke Changes Don't Show Pair Results:**
- Problem: In results page, editing a stroke (line 49-75 in `src/app/results/page.tsx`) resubmits to store but user sees only stroke change, not recalculated pair matchups
- Files: `src/app/results/page.tsx`
- Impact: User might not realize editing changes pair outcomes and leaderboard
- Fix approach: Show confirmation or diff before applying edit

**No Indication of Save State:**
- Problem: Play page shows "Scores saved!" flash (lines 182-187 in `src/app/play/page.tsx`) but only for manual submit, not for auto-persist. If localStorage write fails, no indication
- Files: `src/app/play/page.tsx`
- Impact: User might think game is saved when it's actually lost if localStorage quota exceeded
- Fix approach: Wrap store mutations with try-catch; show error toast if persist fails

**Number Stepper Has No Input Validation:**
- Problem: `NumberStepper` component accepts `min`/`max` but doesn't validate on paste or input outside range
- Files: `src/components/shared/number-stepper.tsx` (not read yet, but evident from usage)
- Impact: User could paste "999" and bypass max=20 constraint, corrupting hole data
- Fix approach: Add input type="number" with true min/max constraints; validate on change

**Hole Navigator Buttons Don't Disable on Boundary:**
- Problem: Lines 126-127 and 161-164 in `src/app/play/page.tsx` disable navigation but calculation uses currentHole directly
- Files: `src/app/play/page.tsx`
- Impact: Edge case if currentHole somehow exceeds numberOfHoles, buttons appear disabled but state is inconsistent
- Fix approach: Add assertion that currentHole is always 1 to numberOfHoles

## Player ID Handling

**Player IDs Generated with Math.random() Are Not Collision-Safe:**
- Problem: `generateId()` in setup page uses `Math.random().toString(36).substring(2, 9)` (line 14-16 in `src/app/setup/page.tsx`)
- Files: `src/app/setup/page.tsx`
- Impact: While collision chance is low for 6 players, in a multiplayer scenario (future feature) collision risk grows; no UUID standard
- Fix approach: Use `crypto.randomUUID()` or import uuid library

**No Player Deduplication:**
- Problem: Setup page allows same name for multiple players
- Files: `src/app/setup/page.tsx` (lines 51-53)
- Impact: If two players named "Mike", pair key collision or leaderboard confusion possible
- Fix approach: Warn user if duplicate names detected; enforce unique names at store level

## Scaling and Performance

**All Pairs Regenerated on Every Store Action:**
- Problem: `submitHoleStrokes()` calls `generatePairs()` every time (line 180 in `src/lib/game-store.ts`)
- Files: `src/lib/game-store.ts`
- Impact: For 6 players (15 pairs), this is fine, but scales O(n²). If future feature allows 10+ players, performance degrades
- Improvement path: Memoize pairs in config; regenerate only when player count changes

**Scoreboard Table Renders All Holes on Every Update:**
- Problem: Results page scoreboard (lines 169-232 in `src/app/results/page.tsx`) creates table with O(players × holes) cells; re-renders all on any edit
- Files: `src/app/results/page.tsx`
- Impact: With 36 holes × 6 players = 216 cells, editing one cell re-renders all (not virtualized). Noticeable lag on slow devices.
- Improvement path: Memoize cell components; virtualize table if holes > 18

**No Pagination or Lazy Loading:**
- Problem: App loads full game state in memory; no streaming or pagination
- Files: All pages
- Impact: If future feature adds tournament mode with 100+ games, app becomes sluggish
- Improvement path: Add backend API; paginate historical games; stream scorecard updates

## Configuration and Deployment

**No Environment-Based Configuration:**
- Problem: App has no .env.local or process.env checks for feature flags, API endpoints, or deployment target
- Files: All pages, `next.config.ts`
- Impact: Deploying to staging requires code change; no way to disable features per environment
- Fix approach: Add `.env.example`; use `process.env.NEXT_PUBLIC_*` for client-side config

**PWA Service Worker Not Tested:**
- Problem: `public/sw.js` exists but no mention of testing service worker offline behavior
- Files: `public/sw.js` (not read), all pages
- Impact: PWA claims are not verified; offline mode might be broken silently
- Fix approach: Add Lighthouse PWA audit to CI; test offline scenarios manually

## Type Safety Gaps

**HoleStrokes Record<string, number> Not Validated:**
- Problem: `HoleStrokes.strokes` is a Record with no schema validation for missing players or extra players
- Files: `src/lib/types.ts` (line 21), `src/lib/game-store.ts`
- Impact: If store receives strokes for player ID "invalid", it persists silently; later lookup returns `?? 0` masking error
- Fix approach: Use Zod or type guard to validate HoleStrokes shape at store boundary

**PairKey Type Is String, Not Branded Type:**
- Problem: `PairKey = string` (line 7 in `src/lib/types.ts`) allows any string to be used as key
- Files: `src/lib/types.ts`, `src/lib/pairs.ts`
- Impact: Typos in pair key (e.g., `"a::b"` vs `"b::a"`) create phantom entries silently
- Fix approach: Create branded type or enum; enforce makePairKey at all entry points

## Known Limitations (Not Bugs, But Worth Noting)

**No Undo/Redo:**
- Current behavior: Users can edit strokes on results page but no history of changes
- Impact: Hard to diagnose if wrong stroke was entered
- Future consideration: Add change log to game state

**No Player Authentication:**
- Current behavior: App is local-only; no way to identify who entered which scores
- Impact: Cannot detect cheating or tampering
- Future consideration: Add player PIN or biometric

**No Score Export:**
- Current behavior: Results exist only in-app; no CSV/PDF export
- Impact: Users cannot share results or archive games
- Future consideration: Add JSON export at minimum; PDF for printing

---

*Concerns audit: 2026-02-17*
