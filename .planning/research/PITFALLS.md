# Pitfalls Research

**Domain:** Golf scoring PWA rebuild (v1 to v2 with history, stats, charting, redesigned UX)
**Researched:** 2026-02-17
**Confidence:** HIGH (codebase-verified issues combined with documented ecosystem pitfalls)

## Critical Pitfalls

### Pitfall 1: Setup Page `resetGame()` on Mount Destroys In-Progress Games

**What goes wrong:**
The current `/setup` page calls `resetGame()` in a `useEffect([], [])` on mount. If a user navigates to setup while an active game exists (to check config, or via browser back), all strokes, pair results, and player scores are wiped. In v2 with game history, this pattern will also prevent saving completed games because the reset fires before any save-to-history logic could run.

**Why it happens:**
v1 assumed setup always means "new game." The `useEffect` has an eslint-disable comment hiding the dependency warning, indicating this was a known shortcut.

**How to avoid:**
- Remove the unconditional `resetGame()` from setup mount
- Gate reset behind explicit user action ("New Game" button on home page)
- In v2, wire the reset through a "finalize and archive" flow: save completed game to IndexedDB before clearing the active store
- Add a `gamePhase` field to the store (`setup | playing | complete`) so components know whether to reset or resume

**Warning signs:**
- Users report "my game disappeared" after navigating back to check settings
- During development: visiting `/setup` while a game is in progress silently zeros out `holeStrokes`

**Phase to address:**
Phase 1 (Store Hardening) -- fix before any history/persistence work begins, since the bug will silently destroy data that should be archived.

---

### Pitfall 2: `Math.random()` Player IDs Will Cause Collisions Across Saved Games

**What goes wrong:**
`generateId()` in setup uses `Math.random().toString(36).substring(2, 9)` producing ~7 alphanumeric characters (~36 bits of entropy). With a game history containing hundreds of saved games across months, ID collisions between players in different games become statistically non-trivial. Worse, `Math.random()` is a PRNG that some engines seed identically on cold start (e.g., GoogleBot), and on mobile Safari the entropy pool can be weak after fresh app launch. A collision means IndexedDB lookups by player ID return wrong data, corrupting stats aggregation.

**Why it happens:**
For a single game in v1, collisions are astronomically unlikely. But v2 accumulates IDs over time across many games, and the birthday problem means collision probability rises faster than intuition suggests. With 7 base-36 chars (~36^7 = ~78 billion possibilities), you need ~280,000 IDs for a 50% collision chance, but with weak PRNG seeding, the effective keyspace can be much smaller.

**How to avoid:**
- Replace `Math.random()` with `crypto.randomUUID()` (supported in all modern browsers, returns 128-bit UUIDs)
- Add a migration that preserves existing player IDs in saved games (don't regenerate historical IDs)
- Add uniqueness validation at the store level when creating players

**Warning signs:**
- Two players with the same `id` in different games
- Stats aggregation returns unexpected numbers for a player name

**Phase to address:**
Phase 1 (Store Hardening) -- must be fixed before game history is introduced, as historical IDs become permanent.

---

### Pitfall 3: localStorage-to-IndexedDB Migration Loses Active Games

**What goes wrong:**
v1 persists via Zustand's `persist` middleware with `localStorage` (key: `"golf-handicap-game"`). When v2 switches to IndexedDB as the storage backend, users who update the app mid-game will lose their in-progress game because the new storage layer is empty. The old localStorage data still exists but the app no longer reads it.

**Why it happens:**
Zustand's `persist` middleware reads from whichever storage engine is configured. Changing the storage engine doesn't trigger migration of the old data -- it just starts fresh. Developers focus on the new storage layer and forget that existing users have data in the old one.

**How to avoid:**
- Write a one-time migration utility that runs on app boot: check if `localStorage.getItem("golf-handicap-game")` exists, parse it, write it to IndexedDB, then remove the localStorage entry
- Run this migration before Zustand hydration (in a layout-level effect or a migration gate component)
- Add a `migrationVersion` field to IndexedDB to track which migrations have run
- Test the migration path by seeding localStorage in dev and verifying the app picks up the data after switching backends

**Warning signs:**
- "Resume Game" button disappears after a deploy
- localStorage still has data but the app shows empty state

**Phase to address:**
Phase 2 (Game History / IndexedDB) -- this migration must ship in the same deploy that switches storage backends.

---

### Pitfall 4: Zustand Store Schema Evolution Without Version Cascading

**What goes wrong:**
Zustand's `persist` middleware supports a `version` number and a `migrate(persistedState, version)` function, but the migrate function only receives the stored version -- not intermediate versions. If v2 ships version 1, v3 ships version 2, and a user skips v2 entirely, the migration function receives version 0 and must handle the jump from 0 to 2. Without cascading migration logic, the store silently resets to defaults (Zustand's fallback when migration returns incomplete state).

**Why it happens:**
The current store has no `version` field at all (defaults to 0). Developers write migrations that only handle `version === N-1 -> N` and don't account for users jumping multiple versions. Zustand's shallow merge also drops nested object fields that aren't explicitly preserved during migration.

**How to avoid:**
- Add `version: 1` to the persist config immediately (even before any schema changes, to establish the baseline)
- Write migrations as a chain of sequential transforms: `if (version < 1) { /* v0->v1 */ } if (version < 2) { /* v1->v2 */ }` -- never use `===`, always use `<`
- Use `merge: (persistedState, currentState) => deepMerge(currentState, persistedState)` instead of the default shallow merge to prevent nested field loss
- Write unit tests for each migration step with fixtures of old state shapes

**Warning signs:**
- After a deploy, users see empty config/scores despite having data in storage
- Console shows Zustand hydration completing but state is all defaults
- `onRehydrateStorage` callback fires with no error but state doesn't match expectations

**Phase to address:**
Phase 1 (Store Hardening) -- version and migration infrastructure must exist before any schema changes. Every subsequent phase that adds fields to the store must increment the version and add a migration step.

---

### Pitfall 5: `verifyZeroSum()` Exists But Is Never Called -- Silent Scoring Corruption

**What goes wrong:**
The codebase has a `verifyZeroSum()` function in `scoring.ts` that validates the zero-sum invariant (all player scores for a hole must sum to zero). It is never called anywhere. In v1 this is merely a latent bug. In v2, corrupted scores would be persisted to game history and pollute lifetime stats, making the corruption permanent and retroactive.

**Why it happens:**
The function was written as a safety check but never wired into `submitHoleStrokes`. Without tests, there is no CI enforcement that the invariant holds. The scoring model is zero-sum by construction (for each pair, `playerAScore = -playerBScore`), so in theory violations can't happen. In practice, bugs in handicap adjustment, turbo multiplication, or future features (e.g., partial holes, DNF handling) can break the invariant.

**How to avoid:**
- Call `verifyZeroSum()` inside `submitHoleStrokes` after computing `newPlayerScores`
- If verification fails, throw an error or log a warning rather than silently persisting bad data
- Add unit tests that verify zero-sum across varied game configurations (2-6 players, with/without handicaps, with/without turbo)
- Before saving a completed game to history, run a full-game zero-sum audit

**Warning signs:**
- Player totals across all players for a hole do not sum to zero
- Running totals diverge from recalculated-from-scratch totals
- Lifetime stats show impossible score distributions

**Phase to address:**
Phase 1 (Store Hardening / Test Coverage) -- wire the check and add tests before building stats on top of potentially corrupt data.

---

### Pitfall 6: Charting Library Bloats PWA Bundle and Breaks Offline

**What goes wrong:**
Adding a charting library (Recharts, Chart.js, Victory, etc.) can add 100-300KB gzipped to the JavaScript bundle. For a PWA that should load instantly and work offline, this defeats the purpose. SVG-based libraries like Recharts also render poorly on low-end phones with many data points. If the chart library loads from a CDN or dynamically imports from a URL, it fails offline entirely.

**Why it happens:**
Developers pick the most popular library without measuring bundle impact. Recharts pulls in significant D3 submodules. Chart.js is lighter but react-chartjs-2 adds its own overhead. Neither is designed for the "needs to work offline on a phone in a golf cart" use case.

**How to avoid:**
- Measure bundle size before and after adding any chart library using `next build` + bundle analyzer
- Prefer lightweight options: `@nivo/line` (tree-shakeable), raw SVG with React, or `uplot` (~35KB total)
- Alternatively, build simple bar/sparkline charts with raw SVG elements -- the stats views in a golf app are simple enough (bar charts of scores, line charts of running totals) that a full charting library may be unnecessary
- Ensure the chart library is included in the service worker precache, not loaded from a CDN
- Use `next/dynamic` with `ssr: false` to code-split chart components so they only load on the stats/results pages

**Warning signs:**
- `next build` output shows a route exceeding 200KB JS
- First load on mobile takes more than 3 seconds on 3G
- Charts fail to render when offline

**Phase to address:**
Phase 3 (Stats & Charting) -- evaluate bundle impact during spike/research before committing to a library. Set a hard budget (e.g., max 50KB gzipped for chart code).

---

### Pitfall 7: IndexedDB Data Eviction Deletes Game History Without Warning

**What goes wrong:**
Browsers can evict IndexedDB data when storage pressure is high. On Safari/iOS, data stored by a PWA that hasn't been used recently can be purged after 7 days of inactivity. A golfer who plays once a month could lose their entire game history between rounds.

**Why it happens:**
By default, web storage is "best-effort" -- the browser can delete it at any time. Only data marked as "persistent" via `navigator.storage.persist()` is protected from eviction. Most developers assume IndexedDB data is permanent (like a native app's database) and never request persistent storage.

**How to avoid:**
- Call `navigator.storage.persist()` on first app launch and on PWA install
- Check `navigator.storage.persisted()` on boot and show a warning if persistence was denied
- On Safari/iOS, prompt users to add the app to their home screen (installed PWAs get more lenient storage treatment)
- Implement an export-to-JSON feature as a manual backup option
- Display storage usage via `navigator.storage.estimate()` in settings

**Warning signs:**
- Users report "all my games disappeared" after not using the app for a few weeks
- `navigator.storage.persisted()` returns `false` in production

**Phase to address:**
Phase 2 (Game History / IndexedDB) -- request persistent storage at the same time as introducing IndexedDB. The export feature can be deferred to a later phase.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| No input validation at store level (e.g., negative strokes, strokes > 20 silently accepted) | Faster development, simpler store code | Corrupted game history, impossible stats, bugs hard to trace to source | Never in v2 -- validate before persisting to history |
| Single Zustand store for everything (config + gameplay + UI state) | Simple architecture, one persist call | Store grows large, migrations become complex, UI re-renders on unrelated state changes | Acceptable for v1 scope; split in v2 when adding history |
| No `gameId` on active game (game identity is implicit "whatever is in the store") | Works for single-game model | Cannot save multiple games, cannot reference a game in history, cannot share results | Never in v2 -- every game needs a unique ID from creation |
| PairKey as untyped `string` instead of branded type | Simpler TypeScript, fewer generics | Easy to pass wrong string format, no compile-time safety for pair operations | Acceptable for now; consider branded types when adding stats |
| Computed state (runningTotals) mixed into persisted state | Avoid recomputation on load | Persisted data can drift from derived values, migration must handle computed fields | Refactor in v2 -- store only source data, derive on read |

## Integration Gotchas

Common mistakes when connecting to external services or browser APIs.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| IndexedDB (via idb-keyval or Dexie) | Using multiple Zustand stores with `idb-keyval` that share a database name causes key collisions | Use a single IDB database with separate object stores, or use unique store names in `idb-keyval` |
| Service Worker cache | Updating precache list but not changing `CACHE_NAME` version string, so old cache persists | Automate cache versioning with build hash, or use Workbox for cache management |
| `navigator.storage.persist()` | Calling it and assuming it succeeds -- Safari often denies it silently | Always check the return value; design for the case where persistence is denied |
| PWA manifest updates | Changing `manifest.json` but users see stale version because SW serves cached manifest | Include manifest in network-first caching strategy, not cache-first |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recalculating all pair results on every `submitHoleStrokes` call | UI jank when entering scores | Cache pair results per hole; only recompute the current hole | 6 players (15 pairs) x 36 holes -- noticeable at max config |
| Rendering full scoreboard table with all holes in the DOM | Scroll jank on `/play` page, especially 36-hole games | Virtualize or paginate the scoreboard; show 9-hole chunks | 6 players x 36 holes = 216 cells, all re-rendering on state change |
| Loading entire game history into memory for stats computation | Memory spikes, slow page load for stats page | Use IndexedDB cursors or pagination; compute stats incrementally or in a web worker | After 50+ saved games with 4+ players each |
| `generatePairs()` called on every render in `/play` | Redundant O(n^2) computation on every React render cycle | Memoize with `useMemo` or compute once and store in state | Not a performance crisis but wasteful; becomes habit if unchecked |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Player names stored without sanitization | XSS if names are rendered with `dangerouslySetInnerHTML` (not currently used, but could be introduced in share/export features) | Sanitize on input; never use `dangerouslySetInnerHTML` for user-provided content |
| Game data in localStorage readable by any script on the same origin | If a third-party script is added (analytics, ads), it can read all game data | Move to IndexedDB (not accessible via simple `localStorage.getItem`); minimize third-party scripts |
| Export/share feature could leak player contact info if names contain phone numbers or emails | Privacy concern if shared URLs include full game data | Strip or hash player identifiers in shared content; only include first names |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| NumberStepper requires precise tapping of small +/- buttons in bright sunlight while walking | Mis-taps, frustration, slows down play, phone overheats if screen brightness is maxed | Use large touch targets (min 48x48px, ideally 56px+), high-contrast colors, consider swipe-to-increment gesture or direct numeric keypad input |
| Scoreboard table in `/play` tries to show all 36 holes horizontally | Unreadable on phone screens, requires scroll-hunting to find current hole | Show current 9-hole chunk (Front/Back/C), highlight current hole, auto-scroll to current position |
| No "undo last hole" -- only "re-score current hole" exists | If user submits wrong scores and moves to next hole, they must manually navigate back and remember what to fix | Add explicit undo action that reverts the last submission, with confirmation |
| Default stroke value of 4 for every player on every hole | Forces 2 taps per player per hole minimum (most golfers score 3-6); wastes time | Remember each player's most common stroke count from recent holes, or use par as default with quick-select buttons for common values |
| No haptic feedback or audio confirmation on score submission | On a bright golf course, visual "Scores saved!" flash at top of screen is easily missed | Add `navigator.vibrate(50)` on submit; ensure flash is visible without shade |
| Handicap setup requires understanding "playerA gives to playerB" convention | Casual golfers don't think in these terms; they think "Tom gets 3 strokes" | Reframe UX: show player names with "Who is the stronger player?" and "How many strokes?" |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Game History:** Often missing export/import -- verify users can back up their data
- [ ] **Stats Page:** Often missing "per-opponent" breakdown -- verify head-to-head record is shown (this is what golf groups actually care about)
- [ ] **Offline Support:** Often missing offline-first for new routes added in v2 -- verify `/history`, `/stats` are in the service worker precache list
- [ ] **Score Editing on Results:** Often missing recalculation cascade -- verify editing hole 3's score updates running totals for holes 4-18 and final rankings
- [ ] **IndexedDB Migration:** Often missing error handling for corrupt/partial data -- verify the app gracefully handles malformed localStorage JSON
- [ ] **Store Schema Migration:** Often missing test for "user skips a version" -- verify migration from v0 directly to v3 works
- [ ] **PWA Update:** Often missing user notification that a new version is available -- verify service worker `controllerchange` event triggers an update prompt
- [ ] **Touch Targets:** Often missing accessibility audit -- verify all interactive elements are at least 44x44px using browser DevTools touch target overlay

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Corrupted game history (bad migration) | MEDIUM | Add a "repair database" utility that re-derives computed fields from source data; keep raw strokes as ground truth |
| Lost active game (setup reset bug) | HIGH | Cannot recover lost data; prevention is the only option. Add a "recently deleted" soft-delete with 24h retention |
| ID collisions across games | HIGH | Write a one-time dedup script that assigns new IDs to colliding players while preserving score associations; complex and error-prone |
| Bundle size regression | LOW | Audit with bundle analyzer; replace heavy library with lighter alternative or raw SVG; code-split aggressively |
| IndexedDB eviction | MEDIUM | If export feature exists, user can re-import. If not, data is gone. Prevention (persistent storage) is critical |
| Broken offline experience | LOW | Update service worker precache list; verify with Lighthouse PWA audit; deploy and wait for SW to update |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Setup mount `resetGame()` wipes active game | Phase 1 (Store Hardening) | Test: navigate to `/setup` with active game, verify game persists |
| `Math.random()` ID collisions | Phase 1 (Store Hardening) | Test: generate 10,000 IDs, assert zero collisions; verify `crypto.randomUUID()` is used |
| `verifyZeroSum()` never called | Phase 1 (Test Coverage) | Test: scoring tests assert zero-sum for all configurations; `submitHoleStrokes` calls verifier |
| No store version / migration infra | Phase 1 (Store Hardening) | Verify `version: 1` in persist config; migration function exists and is tested |
| localStorage-to-IndexedDB migration | Phase 2 (Game History) | Test: seed localStorage, boot app, verify data appears in IndexedDB and localStorage is cleared |
| IndexedDB data eviction | Phase 2 (Game History) | Verify `navigator.storage.persist()` is called; check `persisted()` status in dev tools |
| Store schema evolution without cascading | Phase 2+ (every phase that changes store shape) | Test: migrate from v0 to latest in one step; test each intermediate step |
| Charting library bundle bloat | Phase 3 (Stats & Charts) | Run `next build`; assert no route > 200KB first-load JS; verify charts work offline |
| Scoreboard unreadable on mobile | Phase 4 (UX Redesign) | Manual test on real phone in sunlight; verify 9-hole chunking and auto-scroll |
| NumberStepper too small for outdoor use | Phase 4 (UX Redesign) | Verify touch targets >= 48px; test with gloves; test one-handed operation |
| Default stroke value wastes taps | Phase 4 (UX Redesign) | Measure average taps-per-hole in usability test; target <= 3 taps per player per hole |

## Sources

- [Zustand persist middleware docs](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) -- version/migrate/merge behavior (HIGH confidence)
- [Zustand persist with IndexedDB discussion #1721](https://github.com/pmndrs/zustand/discussions/1721) -- idb-keyval integration patterns (HIGH confidence)
- [Zustand multi-version migration issue #984](https://github.com/pmndrs/zustand/issues/984) -- cascading migration problem (HIGH confidence)
- [web.dev Persistent Storage](https://web.dev/articles/persistent-storage) -- `navigator.storage.persist()` behavior (HIGH confidence)
- [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) -- browser eviction policies (HIGH confidence)
- [JavaScript UUID Collisions](https://www.javaspring.net/blog/collisions-when-generating-uuids-in-javascript/) -- Math.random collision risk analysis (MEDIUM confidence)
- [MDN crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) -- secure alternative (HIGH confidence)
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) -- 44px touch target recommendation (HIGH confidence)
- [Smashing Magazine Accessible Target Sizes](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) -- outdoor/mobile touch target research (MEDIUM confidence)
- [LogRocket React Chart Libraries 2025](https://blog.logrocket.com/best-react-chart-libraries-2025/) -- bundle size comparison (MEDIUM confidence)
- Codebase analysis: `src/lib/game-store.ts`, `src/app/setup/page.tsx`, `src/lib/scoring.ts` -- verified current bugs (HIGH confidence)

---
*Pitfalls research for: Golf Handicap Scorer v2 rebuild*
*Researched: 2026-02-17*
