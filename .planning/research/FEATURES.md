# Feature Landscape

**Domain:** Golf scoring PWA -- v1.1 UX fixes and insight features
**Researched:** 2026-02-22
**Overall confidence:** HIGH (features derived from real user feedback + codebase analysis + competitive research)

---

## Table Stakes

Features that v1.1 users explicitly requested or that are standard expectations for a golf scoring app at this maturity level. Missing = users will remain frustrated.

### 1. Extended Stroke Input for High Scores (>7)

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Real users reported the preset row caps at visible 3-7 range. Thai social golfers frequently score 8-12+ per hole. Having to repeatedly tap + to reach 10 is painful. |
| **Complexity** | Low |
| **Depends on** | Existing `StrokeInput` component (`src/components/shared/stroke-input.tsx`) |

**How it works in other apps:**

- **Beezer Golf:** Uses a scoring module that pops up with all relevant inputs. The key insight is that the number input adapts to context -- most strokes cluster around par +/- 2, so the visible presets should center on likely values, with outliers reachable in one additional tap.
- **TheGrint / 18Birdies:** Tap-to-score with a single row of numbers. High scores are entered by tapping a "..." or scrolling to reveal more options. Some apps show a full 1-12 number pad on demand.
- **EasyScore Golf:** Simple numpad overlay for any score entry.

**Expected UX pattern for this app:**

The current implementation has `PRESETS = [3, 4, 5, 6, 7]` with +/- buttons on the ends. The problem: reaching 8, 9, 10+ requires multiple taps on +. Two viable patterns:

1. **Expand preset range** -- Change presets to `[3, 4, 5, 6, 7, 8, 9, 10]` in a horizontally scrollable row. The + button still handles edge cases (11-20). Simplest fix, matches existing interaction model.
2. **Tap-to-expand numpad** -- Tapping + once opens a small numpad (7-12) overlay. More discoverable for high scores but adds an extra tap.

**Recommendation:** Option 1 (expanded scrollable presets) because the app already uses horizontal scrolling for the hole navigator. Users understand the pattern. Extend `PRESETS` to `[3, 4, 5, 6, 7, 8, 9, 10]` and make the row scrollable with the current value auto-scrolled into view. Keep +/- for 1-2 and 11-20. This is a ~30-line change to `stroke-input.tsx`.

**Validation note:** The store already validates strokes 0-20 (`game-store.ts` line 218-228), so the backend supports it. This is purely a UI fix.

---

### 2. Editable Scorecard on Results Page (Post-Round Corrections)

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Users discovered keying mistakes after finishing the round. The results page already has tap-to-edit via a bottom sheet (`NumberStepper` modal), but it only supports stroke editing -- no handicap editing. Users need to fix handicap values after seeing results too. |
| **Complexity** | Low-Medium |
| **Depends on** | Existing edit modal in `results/page.tsx`, existing `submitHoleStrokes` store action |

**How it works in other apps:**

- **PlayThru:** After the round, golfers can review and edit their scorecard before officially submitting. Once submitted to the leaderboard, editing locks. Since this app has no server/leaderboard, there is no lock point -- edits should always be possible.
- **Squabbit:** Users can edit their own scorecard and scores for anyone on their scorecard. No permission gating for casual use.
- **Golf Genius / ScoreboardLive:** Tournament apps require attestation before score finalization. Overkill for a casual app.

**Expected UX pattern for this app:**

The results page ALREADY has a working tap-to-edit scorecard (lines 166-238 of `results/page.tsx`). The edit modal uses `NumberStepper` with min 0, max 20. What is MISSING:

1. **Handicap editing on results page** -- Currently handicap can only be set during `/setup` or `/handicap`. After a round, if users realize the handicap was wrong, they must start a new game. The results page needs a way to adjust pair handicaps and have scores automatically recalculate.
2. **Auto-recalculation cascade** -- When a stroke or handicap is edited on results, ALL pair results and player scores must recompute. The existing `submitHoleStrokes` already handles stroke edits with full recalculation. Handicap edits need a similar action that triggers recalc across all holes.
3. **Re-save to history** -- After edits on the results page, the updated game should re-persist to IndexedDB so the history record reflects corrections.
4. **Improved stroke edit input** -- The current bottom-sheet edit uses `NumberStepper` (+/- buttons) which is slow for large changes. Should use the same expanded preset row from Feature 1 for consistency and speed.

**Recommendation:** Add a "Edit Handicaps" button/section to the results page that opens the same handicap configuration UI used in setup, wired to trigger full game recalculation. Add a new store action `recalculateAllResults()` that iterates all `holeStrokes` and recomputes `pairResults` and `playerScores` from scratch. Replace the `NumberStepper` in the edit modal with the improved `StrokeInput` presets.

---

### 3. Editable Scores During Play (Cross-Check Workflow)

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Real-world workflow: two people in the group each record scores on their phones. After each hole, they compare verbally. If scores differ, they need to immediately correct on the "official" phone. |
| **Complexity** | Medium |
| **Depends on** | Existing play page (`/play`), existing `submitHoleStrokes` (already supports re-scoring a hole) |

**How it works in other apps:**

- **MyEG (England Golf):** Each player submits their own scorecard independently. An attester/marker receives a notification to verify. This is a multi-device, server-based workflow -- NOT applicable here (single device, no backend).
- **ScoreboardLive:** Digital card swap with attestation between player and marker. Tournament-grade multi-device -- not relevant.
- **Golf GameBook:** Enter scores for your whole group on one phone. Scores can be edited before final submission. ANY hole is editable at ANY time during the round.

**Expected UX pattern for this app:**

The cross-check workflow for this app is NOT a multi-device sync problem (explicitly out of scope: "one phone is the scorer, no backend"). Instead, it is:

1. Person A enters scores on the app
2. Person B reads their written scorecard / second phone
3. They compare verbally
4. If a discrepancy is found, Person A taps the hole to correct it

The play page ALREADY supports this partially:
- Navigate to any scored hole via the hole navigator bubbles
- Re-submitting strokes on a scored hole triggers `submitHoleStrokes` which replaces existing data and recalculates
- The button label already changes to "Update Scores" for previously-scored holes

What is MISSING:
1. **Edit affordance on scored holes** -- When navigating back to a scored hole, the UI shows the saved values but there is no obvious "this is editable" signal. An "Editing Hole X" header state or pencil icon would help.
2. **Handicap adjustment during play** -- Same gap as results page. If mid-round they realize handicap is wrong, they should be able to fix it without restarting.
3. **Quick score summary for verbal comparison** -- When on a scored hole, show a compact summary of all players' strokes for that hole (already shown via preset buttons, but could be clearer with a dedicated "Scores for this hole" section showing name: strokes in a simple list).

**Recommendation:** The play page mostly works for cross-check already. The key changes are:
- Add a visual "editing" state indicator when viewing a previously-scored hole (e.g., amber banner "Editing Hole X -- tap Submit to update")
- Add handicap editing accessible from play page (gear icon in header opens handicap config sheet)
- Ensure recalculation cascade works for mid-round handicap changes (reuses `recalculateAllResults()` from Feature 2)

---

## Differentiators

Features that set the app apart from basic scoring apps. Not expected, but create delight and stickiness.

### 4. Score Storytelling / Narrative Highlights

| Attribute | Detail |
|-----------|--------|
| **Value proposition** | Transforms dry scorecard data into memorable moments. Drives screenshot-sharing and re-engagement. The "Spotify Wrapped for golf rounds" pattern. |
| **Complexity** | Medium |
| **Depends on** | Existing `pairResults`, `playerScores`, `holeStrokes` data; results page |

**How it works in other apps and domains:**

- **PGA TOUR App:** Auto-generated "Player Stories" clip highlights from a round. A "Hot Streak" indicator appears on leaderboards when a player has consecutive good holes. Closest parallel to what we want.
- **Spotify Wrapped:** Transforms annual listening data into a narrative slide deck with superlatives ("Your top artist", "You listened to X hours"). Key insight: people LOVE being told stories about their own data.
- **Yahoo Fantasy Sports:** Uses NLG (natural language generation) via Automated Insights' Wordsmith to produce personalized match recaps with snarky tone. The narrative is rule-based templates filled with data, NOT AI-generated.
- **Golf GameBook:** Sums up scores, statistics, and "memories" from a round. Lets users share highlights on social media.

**Expected UX pattern for this app:**

Score storytelling should appear on the results page as a "Round Highlights" card, positioned prominently (above the scorecard table, below the rankings/podium). It should:

1. **Use rule-based templates, not AI** (explicitly out of scope per PROJECT.md: "AI-powered analysis -- rule-based highlights work fine")
2. **Detect notable patterns** from the existing computed data
3. **Present them as short, punchy text cards** with emoji-style icons and visual emphasis

**Highlight categories to implement (ordered by impact):**

| Highlight | Detection Logic | Template Example | Data Source |
|-----------|----------------|------------------|-------------|
| **Biggest comeback** | Player had lowest `runningTotal` at some hole but finished rank 1 or 2 | "[Player] was dead last after hole [X] but clawed back to finish [rank]!" | `playerScores[].runningTotal` |
| **Biggest choke** | Player had highest `runningTotal` at some hole but finished below that position | "[Player] was leading after hole [X] but dropped to [rank]." | `playerScores[].runningTotal` |
| **Dominant pair victory** | One player won the pair matchup on 70%+ of holes | "[Player] dominated [Player], winning [X] of [Y] holes." | `pairResults[]` per pair |
| **Turbo hero** | Player scored the most total points on turbo holes | "[Player] thrived under pressure, scoring [+X] on turbo holes alone." | `pairResults[].isTurbo` + `playerScores[]` |
| **Closest matchup** | Pair where final total score difference is 0-2 | "[Player] vs [Player]: neck and neck, decided by just [X] point(s)." | `pairResults[]` summed per pair |
| **Hot streak** | Player had positive `holeScore` for 3+ consecutive holes | "[Player] was on fire from hole [X] to [Y] with [N] straight winning holes." | `playerScores[].holeScore` |
| **Cold streak** | Player had negative `holeScore` for 3+ consecutive holes | "[Player] had a rough patch from hole [X] to [Y]." | `playerScores[].holeScore` |
| **Biggest swing** | Largest single-hole point gain for any player | "[Player] swung +[N] on hole [X] -- the biggest single-hole move of the round." | `playerScores[].holeScore` |
| **Consistent player** | Lowest standard deviation in `holeScore` across the round | "[Player] was Mr. Consistent -- steady scoring all round." | `playerScores[].holeScore` |

**Data requirements:** All detection can be done with existing `playerScores` (has `holeScore` and `runningTotal` per hole), `pairResults` (has per-pair per-hole scores and `isTurbo`), and `config.turboHoles`. No new data collection needed.

**Tone:** Light, fun, slightly competitive. Not snarky (inappropriate for Thai golf culture). Think friendly sports commentary, not roast.

**Recommendation:** Implement as a pure function `generateHighlights(playerScores, pairResults, config): Highlight[]` in a new `src/lib/highlights.ts`. Each highlight has `type`, `title`, `description`, `priority` (for ordering/deduplication -- show top 3-5). The results page renders them in a styled card with icons. Entirely computed, no state changes, no persistence needed. Estimated ~200 lines of logic + ~80 lines of UI.

---

### 5. Lifetime Player-vs-Player Head-to-Head Records

| Attribute | Detail |
|-----------|--------|
| **Value proposition** | Creates long-term engagement and friendly rivalry. "I've beaten you 7 out of 10 times" is the stat casual golfers love to brag about. |
| **Complexity** | Medium |
| **Depends on** | Existing `HistoryRecord` in IndexedDB (already stores full `pairResults`), existing `stats.ts` and `normalizePlayerName()` |

**How it works in other apps:**

- **GolfStats.com:** Head-to-head comparison tool where you pick two PGA TOUR players and view their statistics over specific time periods. Shows win counts and performance metrics.
- **Data Golf:** Player comparison tool with historical performance data.
- **Birdie (Thailand):** Find friends and other golfers, check out their stats, and see how you all stack up against each other. Closest competitor for Thai golfers.
- **TheGrint:** Leaderboards and competitions with head-to-head scoring.

**Expected UX pattern for this app:**

The app already has:
- Per-round H2H pair breakdowns on the results page (`pair-breakdown.tsx`) with win/loss/tie counts and a visual bar
- Cross-round player stats on the stats page (`/stats`) with win rates, averages, best/worst
- Full `pairResults` stored in every `HistoryRecord` in IndexedDB
- `normalizePlayerName()` for cross-game identity matching

What is MISSING: aggregating pair results ACROSS games to show lifetime H2H records.

**Two entry points for lifetime H2H:**

1. **Stats page** (`/stats`): Below the existing player stat cards, add a "Head-to-Head Records" section showing all player pairs that have played together across multiple games, with lifetime win/loss/tie tallies and a win percentage bar (reusing the `PairCard` visual pattern from `pair-breakdown.tsx`).

2. **Results page** (`/results`): Enhance the existing per-round pair breakdown cards to show "Lifetime: 5-3-1" annotation below the current-round stats. This contextualizes the current game within the rivalry.

**Data model:**

```typescript
interface LifetimeH2H {
  playerAName: string;  // display name
  playerBName: string;
  gamesPlayed: number;
  playerAGameWins: number;   // games where A won the pair matchup
  playerBGameWins: number;
  gamesTied: number;
  playerATotalPoints: number;  // lifetime aggregate points
  playerBTotalPoints: number;
  history: {
    date: string;
    playerAScore: number;  // pair score for that game
    playerBScore: number;
    winner: 'A' | 'B' | 'tie';
  }[];
}
```

This can be computed from existing `HistoryRecord.pairResults` by:
1. Iterating all games from IndexedDB
2. For each game, grouping `pairResults` by pair
3. Matching player names across games via `normalizePlayerName()`
4. Summing pair-level outcomes per game (who won each pair matchup overall)
5. Aggregating across games for lifetime totals

**Recommendation:** Add `computeLifetimeH2H(games: HistoryRecord[]): LifetimeH2H[]` to `stats.ts`. Create a `H2HCard` component reusing the visual language of `PairCard` (the emerald/rose color bar, win counts) but with lifetime data and a mini history list. Place it on both the stats page (full view with expandable game-by-game history) and the results page (compact inline "Lifetime: X-Y-Z" annotation on each pair breakdown card). Estimated ~150 lines of logic + ~100 lines of UI.

---

## Anti-Features

Features to explicitly NOT build for v1.1. Including them would add complexity without proportional value, or would conflict with the app's core identity.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Multi-device score sync / real-time cross-check** | Requires a backend, authentication, WebSocket infrastructure. Explicitly out of scope. Would fundamentally change the app's architecture from single-device PWA to client-server. | Keep the verbal cross-check workflow: two phones record independently, compare verbally, one phone is the "official" scorecard. The improved edit affordances in Feature 3 make correction fast enough. |
| **Attestation / digital signature workflow** | Tournament-grade feature (MyEG, ScoreboardLive, Golf Genius). Overkill for casual social golf. Adds friction to every hole submission. | Trust the group -- they are friends, not tournament competitors. |
| **AI-generated narrative text** | PROJECT.md explicitly rules this out. Would require an API call (breaks offline PWA), adds cost, and rule-based highlights are more predictable and debuggable. | Use template-based highlight generation with fixed, well-crafted copy. |
| **Net Double Bogey / max score capping** | Official handicap calculation feature. The app does NOT calculate official handicaps -- it uses pairwise custom handicaps. Capping scores would confuse the scoring model and conflict with recording actual strokes. | Let players enter actual strokes. The pairwise system (+1/-1/0) naturally limits the impact of blow-up holes. |
| **Full score history replay (hole-by-hole animation)** | Cool but high effort for low payoff. The score trend chart already shows progression visually. | Keep the existing score trend chart. The narrative highlights (Feature 4) capture memorable moments in text. |
| **Player profile pages / avatars** | Adds complexity to a no-auth single-device app. Identity is just a name string matched case-insensitively. | Rely on name-based identity. The stats page and H2H records serve as the de facto "player profile." |
| **Notification to other player's device** | Requires push notification infrastructure, service worker changes, and a backend. | Keep the verbal/in-person comparison workflow. |
| **Season/tournament/league tracking** | Out of scope per PROJECT.md. Would require a new data model layer above individual games with bracket logic, multi-round aggregation, and scheduling. | Lifetime stats and H2H records provide enough cross-game context for casual play. |
| **Score comparison overlay (split-screen two devices)** | Sounds useful for the cross-check scenario but requires multi-device networking, which is out of scope. | The verbal comparison after each hole works well enough. The edit affordances in Feature 3 make corrections fast when discrepancies are found. |

---

## Feature Dependencies

```
Extended Stroke Input (1) -----> standalone, no dependencies
                                     |
                                     v
                            Edit modal in Results (2) -- should use same improved preset input
                            Edit during Play (3) -- benefits from improved input UX

Editable Results (2) ---------> requires new store action: recalculateAllResults()
                                     |
                                     v
                            Editable During Play (3) -- reuses same recalculation logic
                            Re-save to IndexedDB -- requires useSaveGame hook enhancement

Score Storytelling (4) -------> standalone pure computation, no store changes
                                     |
                                     v
                            Results page integration (renders highlight cards)
                            Needs playerScores + pairResults (already computed)

Lifetime H2H (5) ------------> depends on existing IndexedDB history data
                                     |
                                     v
                            Stats page integration (new H2H section)
                            Results page annotation (compact lifetime line on pair cards)
                            Reuses normalizePlayerName() from stats.ts
```

**Key dependency chain:**
- Features 1, 2, 3 share overlapping concerns (input UX, recalculation). Build 1 first (quickest win, unblocks better testing of 2 and 3). Build 2 next (adds `recalculateAllResults()` action that 3 also needs). Build 3 last (reuses recalculation from 2, benefits from input improvements from 1).
- Features 4 and 5 are independent of 1-3 and of each other. They can be built in parallel or in either order after the core editing features.

---

## MVP Recommendation

**Prioritize (in order):**

1. **Extended Stroke Input (Feature 1)** -- Highest user pain, lowest complexity. A ~30-line change to `stroke-input.tsx`. Ship immediately as the quickest win.
2. **Editable Results with Handicap Editing (Feature 2)** -- Second-highest user pain. Requires a new store action (`recalculateAllResults`) but reuses existing UI patterns. ~200 lines.
3. **Editable Scores During Play (Feature 3)** -- Third-highest pain. Mostly UX polish on existing functionality (play page already supports re-scoring). ~100 lines for edit affordances + handicap access during play.
4. **Score Storytelling (Feature 4)** -- Differentiator with highest delight potential. Pure computation, no state changes needed. ~280 lines total (logic + UI).
5. **Lifetime H2H (Feature 5)** -- Differentiator that builds long-term engagement. Depends on having enough game history to be meaningful. ~250 lines total (logic + UI).

**Total estimated scope:** ~860 lines of new/modified code across all 5 features.

**Defer to v1.2:** None of these features should be deferred. All five are well-scoped and address either real user pain (1-3) or clear engagement opportunities (4-5). The total scope is manageable for a single milestone.

---

## Sources

### Golf Scoring Apps (competitive research)
- [Golf GameBook Scorecard](https://www.golfgamebook.com/golf-scorecard) -- social scoring, photo memories, round summaries (MEDIUM confidence)
- [Beezer Golf Interface Design](https://www.beezergolf.com/blogs/golf-scorecard-app) -- haptic-first scorecard UX, validation patterns (MEDIUM confidence)
- [PlayThru Live Scoring](https://www.golfplaythru.com/mobile-scorecards) -- edit-before-submit, organizer overrides (MEDIUM confidence)
- [Squabbit Tournament Software](https://squabbitgolf.com/) -- permission-based scorecard editing (MEDIUM confidence)
- [TheGrint Handicap & Scorecard](https://thegrint.com/) -- social features, 50+ stats, multiple game formats (MEDIUM confidence)
- [18Birdies](https://18birdies.com/) -- social leaderboard, course-based stats (MEDIUM confidence)
- [Birdie Thailand](https://birdie.in.th/) -- Thailand-specific golf app with stats and social features (MEDIUM confidence)
- [GolfStats Head-to-Head](https://www.golfstats.com/headtohead/) -- PGA player comparison tool (HIGH confidence, verified via direct fetch)
- [ScoreboardLive](https://scoreboard.clippd.com/articles/scoreboardlive-scoring-app) -- digital card swap with attestation (MEDIUM confidence)
- [Best Golf Apps 2026](https://www.todays-golfer.com/equipment/best/golf-apps/) -- current market landscape (MEDIUM confidence)

### Score Verification / Attestation
- [MyEG Score Verification](https://englandgolf.freshdesk.com/support/solutions/articles/80000972978-how-to-add-and-verify-a-score-on-myeg-app) -- attester/marker workflow for England Golf (HIGH confidence, verified via direct fetch)
- [Golf Genius Digital Scorecards](https://docs.golfgenius.com/article/show/113400-digital-scorecards-setup-and-management) -- tournament-grade digital scorecard management (MEDIUM confidence)

### Narrative / Storytelling Patterns
- [PGA TOUR App Features](https://www.pgatour.com/pages/whats-new) -- Player Stories, Hot Streak indicator (MEDIUM confidence)
- [Spotify Wrapped UX Case Study](https://medium.com/@yvonneanyaokei8/ux-case-study-spotify-wrapped-experience-af57111dd042) -- data-as-narrative design pattern (MEDIUM confidence)
- [How to Build a Wrapped Feature](https://trophy.so/blog/how-to-build-wrapped-feature) -- gamification and personal data storytelling (MEDIUM confidence)
- [Yahoo Fantasy Sports NLG](https://emerj.com/ai-case-studies/yahoo-uses-nlp-deliver-personal-fantasy-sports-recaps-updates/) -- rule-based narrative generation for sports (MEDIUM confidence)

### Codebase Analysis (HIGH confidence -- verified by reading source code)
- `src/components/shared/stroke-input.tsx` -- Current PRESETS = [3,4,5,6,7], +/- buttons, min 1 / max 20
- `src/app/play/page.tsx` -- Play page with hole navigation, re-scoring support, undo banner
- `src/app/results/page.tsx` -- Results page with existing tap-to-edit scorecard (NumberStepper modal)
- `src/lib/game-store.ts` -- Zustand store with submitHoleStrokes (handles re-scoring + recalculation)
- `src/lib/types.ts` -- GameState, PlayerHoleScore (has runningTotal), PairHoleResult
- `src/lib/stats.ts` -- normalizePlayerName(), computePlayerStats(), computeAllPlayerStats()
- `src/lib/history-db.ts` -- HistoryRecord with full pairResults snapshot in IndexedDB
- `src/components/results/pair-breakdown.tsx` -- PairCard component with win/loss bar visual
- `src/hooks/use-player-stats.ts` -- Reactive hook querying IndexedDB for cross-game stats

---
*Feature research for: Golf Handicap Scorer v1.1 -- UX fixes and insight features*
*Researched: 2026-02-22*
