# Domain Pitfalls

**Domain:** Golf scoring PWA -- v1.1 feature additions (editable scores, cascading recalculation, score storytelling, lifetime head-to-head)
**Researched:** 2026-02-22
**Scope:** Integration pitfalls when adding these features to the existing v1.0 codebase
**Overall confidence:** HIGH (most pitfalls verified against actual codebase)

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or broken existing functionality.

### Pitfall 1: Running Total Cascade Failure on Mid-Game Edit

**What goes wrong:** Editing strokes for hole 3 in a completed 18-hole game recalculates pair results and player scores for hole 3, but does NOT recalculate `runningTotal` values for holes 4-18. Every subsequent hole's `runningTotal` is now wrong because it was computed from the old hole 3 total.

**Why it happens:** The current `submitHoleStrokes` (game-store.ts:194-301) filters out the edited hole's data and recalculates it, but only computes `previousTotals` from `existingPlayerScores` for `holeNumber - 1`. It does not propagate the delta to all subsequent holes. The `playerScores` array stores pre-computed `runningTotal` per hole (types.ts:43), so stale values persist for holes after the edited one.

**Consequences:**
- Leaderboard shows wrong standings for all holes after the edit
- Final rankings are actually correct (uses `getRunningTotals(playerScores, Infinity)` which sums `holeScore` values independently), but all intermediate `runningTotal` values shown in sparklines, mini-leaderboard, and score trend charts will be inconsistent
- Score trend chart shows an impossible discontinuity at the edited hole
- Zero-sum verification passes per-hole but running totals look broken to the user

**Prevention:**
- After any hole edit, rebuild ALL `playerScores` entries from hole 1 to `numberOfHoles` sequentially. The `holeScore` values per hole are independent (derived from pair results), but `runningTotal` must chain forward.
- Create a `recalculateAllRunningTotals(playerScores, players)` function that takes the flat `holeScore` entries and recomputes `runningTotal` in order.
- Alternatively (and better), stop storing `runningTotal` and derive it at render time via `useMemo`. This is the cleaner solution -- `runningTotal` is derived state that should not be persisted. This eliminates the entire class of cascade bugs.

**Detection:** Add a test: edit hole 3 of an 18-hole game, verify that `playerScores[hole=10].runningTotal` equals the sum of holeScores for holes 1-10 (not just the old cached value).

**Confidence:** HIGH -- verified by reading game-store.ts lines 268-293. The current `submitHoleStrokes` only recalculates the edited hole's running total from its predecessors, not subsequent holes' running totals.

---

### Pitfall 2: History Record Becomes Stale After Post-Submission Score Edit

**What goes wrong:** When a game completes, `useSaveGame` (use-save-game.ts) fires once and writes the full game state to IndexedDB. If the user then edits a score on the results page (which already works via results/page.tsx:64-89), the IndexedDB record retains the old, pre-edit data. The `savedRef` guard (line 19) explicitly prevents re-saving. The user sees corrected scores on-screen but history/stats pages show the original uncorrected data forever.

**Why it happens:** The `useSaveGame` hook was intentionally designed to fire-and-forget once. The comment at lines 42-46 explicitly warns against adding more deps because "they change on score edits, which would re-trigger the save." The existing code chose "save once" to avoid duplicate records, but this means edits are lost.

**Consequences:**
- Lifetime stats (win rates, averages, H2H records) computed from IndexedDB are based on incorrect scores
- User sees different results on the results page vs. the history page
- If the edit changes who won, the history page shows the wrong winner
- Cross-round statistics become unreliable, undermining the entire stats feature

**Prevention:**
- After any score edit on the results page, update the existing IndexedDB record using `historyDb.games.put(updatedRecord)` instead of `add()`. This requires knowing the record's `id`.
- Store the history record ID in component state after the initial save, then use it for subsequent updates.
- Add a `useUpdateSavedGame` hook (or extend `useSaveGame`) that watches for score changes after the initial save and debounces updates to IndexedDB.
- Be careful with Dexie's `put()` vs `update()`: `put()` requires the full record (overwrites entirely), `update()` does partial updates. For score edits, reconstruct the full record and use `put()`.

**Detection:** Test: complete a game, verify history record, edit a score on results page, re-read history record from IndexedDB, verify it reflects the edit.

**Confidence:** HIGH -- verified by reading use-save-game.ts:19-46 and results/page.tsx:64-89. The gap is clearly visible in the code.

---

### Pitfall 3: Undo System Breaks When Editability Enters

**What goes wrong:** The current undo is a single-snapshot system (`_undoSnapshot` in game-store.ts:24-27). It captures the state before `submitHoleStrokes` and restores it on undo. When the user edits a score on the results page, `submitHoleStrokes` is called again (results/page.tsx:89), which overwrites `_undoSnapshot` with the current (already complete) game state. If the user then goes back to `/play` and undoes, they get the results-page edit state, not the actual last gameplay submission.

**Why it happens:** The undo system was designed for linear gameplay flow: submit hole, undo within 10 seconds, move on. It assumes `submitHoleStrokes` is only called during sequential play. Post-game edits reuse the same function, creating snapshot confusion.

**Consequences:**
- Undo after a results-page edit could revert to a nonsensical state
- The undo banner does not appear on the results page (UndoBanner is not rendered there), but `_undoSnapshot` is still mutated silently
- If the user navigates back to `/play` after editing on results, the stale undo snapshot persists in memory

**Prevention:**
- Create a dedicated `editHoleStrokes(holeNumber, playerId, newStrokes)` store action that does NOT touch `_undoSnapshot`. This cleanly separates the edit pathway from the gameplay submission pathway.
- For a richer edit experience, consider replacing the single snapshot with a proper undo stack. The `zundo` library (https://github.com/charkour/zundo) provides this for Zustand with <700 bytes and supports `diff`-based storage to minimize memory.
- If inline editing is added to `/play` during a game, the single-snapshot undo becomes even more fragile -- an undo stack becomes necessary.

**Detection:** Test: complete a game, edit a score on results, navigate to `/play`, verify `_undoSnapshot` is null or irrelevant. Test: during gameplay, submit hole 5, then edit hole 3, then undo -- verify undo reverts the hole 3 edit, not hole 5.

**Confidence:** HIGH -- verified by reading game-store.ts:198-204 and results/page.tsx:86-89.

---

### Pitfall 4: Auto-Advance Timer Fires During Score Editing on /play

**What goes wrong:** The current play page uses a 1-second `setTimeout` after submission that auto-advances to the next hole (play/page.tsx:128-132). If the user navigates to an already-scored hole and taps "Update Scores" to correct it, the auto-advance timer fires after 1 second and yanks the view to the next hole. The user is pulled away from the hole they just edited. In outdoor/sunlight mobile use, they may not even notice.

**Why it happens:** The `handleSubmitAndAdvance` function (line 113-133) always calls `goToNextHole()` after the timer, regardless of whether this was a first submission or an edit. The `holeAlreadyScored` check (line 169-171) changes the button text to "Update Scores" but still calls the same `handleSubmitAndAdvance` handler.

**Consequences:**
- User edits hole 5, gets auto-advanced to hole 6, loses context
- If the user was reviewing and editing multiple holes in sequence, auto-advance disrupts the review workflow every time
- Frustration compounds outdoors where the app is used in challenging conditions (glare, one-handed use)
- User might think the edit did not register because they were moved away

**Prevention:**
- Do NOT auto-advance when updating an already-scored hole. Check `holeAlreadyScored` before calling `goToNextHole()`:
  ```typescript
  if (!holeAlreadyScored) {
    confirmationTimerRef.current = setTimeout(() => {
      setShowConfirmation(false);
      goToNextHole();
    }, 1000);
  } else {
    confirmationTimerRef.current = setTimeout(() => {
      setShowConfirmation(false);
    }, 1000);
  }
  ```
- Show "Updated" confirmation flash instead of "Saved" to make edits feel distinct from first entries.
- Consider showing a brief diff ("4 -> 5 strokes") so the user has clear feedback the edit registered.

**Detection:** Manual test: score hole 5, navigate back to hole 5, change a value, tap "Update Scores", verify the view stays on hole 5.

**Confidence:** HIGH -- verified by reading play/page.tsx:113-133 and 169-171.

---

## Moderate Pitfalls

### Pitfall 5: Player Name Fragmentation in Head-to-Head Records

**What goes wrong:** Cross-round stats use `normalizePlayerName()` (stats.ts:15-17) which does `name.trim().toLowerCase()`. This handles "Om" vs "om" but NOT:
- Non-breaking spaces, tabs, or multiple spaces (common from mobile keyboard autocomplete)
- Thai characters with different Unicode normalization forms (NFC vs NFD)
- Nicknames vs full names across games ("Om" in one game, "Ohm" in another)
- Leading/trailing emoji or special characters from keyboard suggestions

For H2H records, two separate name variants create two separate player identities. A user who plays 5 games as "Om" and 3 as "Ohm" has two incomplete H2H records instead of one consolidated record.

**Prevention:**
- Improve normalization: `name.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()`
- Build a "player picker" component that suggests previously used names (autocomplete from IndexedDB history) during game setup. This prevents fragmentation at the source rather than trying to fix it after the fact.
- For the H2H display, consider a "merge players" option in stats settings for manual correction of past games.
- Do NOT attempt automatic fuzzy matching -- the risk of over-merging ("John" and "Jon" might be different people) is worse than under-merging in a small friend group where the user can correct it.

**Detection:** Test: create games with players "Om " (trailing space), " Om" (leading space), and "Om", verify all three resolve to the same player in stats. Test with Thai names containing combining characters.

**Confidence:** MEDIUM -- the `normalizePlayerName` function is verifiably basic (stats.ts:16). Whether this actually affects users depends on how carefully they type names.

---

### Pitfall 6: Storytelling Generates Nonsense for Degenerate Game States

**What goes wrong:** Narrative generation ("Player X dominated the back nine", "A dramatic comeback") fails or produces absurd output for edge cases:
- **2-player game:** Only 1 pair exists. Phrases like "X beat Y in 3 out of 5 pairs" are wrong.
- **All ties:** Every hole is 0-0 across all pairs. "The dominant player was..." has no answer.
- **1-hole game:** No "momentum shift" or "back nine" exists to describe.
- **All identical strokes:** Every player scores 4 on every hole. Zero drama, narrative has nothing to say.
- **6-player game with turbo holes:** 15 pairs per hole, scores range from -10 to +10. Narrative templates assuming small numbers look wrong ("Player X scored +10 on a single hole").
- **Game abandoned mid-round:** Only 5 of 18 holes played. "Front nine summary" references holes that were never played.

**Why it happens:** Narrative templates are typically written for the "happy path" (4 players, 18 holes, clear winner, some drama). Edge cases are forgotten because developers test with normal-looking games.

**Consequences:**
- Empty or generic fallback text that adds no value ("Great game everyone!")
- Factually incorrect statements ("Player X led from start to finish" when they actually lost the last 3 holes)
- UI layout breaks when narrative text is unexpectedly empty or excessively long
- Users lose trust in the feature if the narrative is wrong even once

**Prevention:**
- Define a `GameShape` classifier first: categorize the game (2-player duel, multi-player, short round, full round, blowout, close match, all-ties, comeback, wire-to-wire). Select narrative templates by shape.
- Write explicit empty/fallback handling: if no interesting patterns detected, show nothing rather than a bad narrative. A missing narrative is better than a wrong one.
- Build the feature as a set of independent "insight detectors" that each check for a specific pattern (comeback, blowout, streak, rivalry, turbo drama). Only surface insights whose preconditions are met.
- Test with at minimum: 2 players / 1 hole, 6 players / 18 holes with all ties, lead-change-every-hole game, blowout (one player wins every hole), and partial game (only half the holes scored).
- Set character limits on generated text and test that the UI handles both empty (no insights found) and maximum-length (all detectors fire) cases.

**Detection:** Unit tests for each game shape with snapshot assertions on output text. Verify no narrative contains player names that don't exist in the game.

**Confidence:** HIGH -- these are universal narrative generation edge cases, well-documented in sports recap template systems.

---

### Pitfall 7: H2H Records Inflated by Phantom Players (0-Stroke Default)

**What goes wrong:** The scoring system defaults missing strokes to 0 (scoring.ts:46: `strokes.strokes[playerAId] ?? 0`). If a player was added to game setup but never had strokes entered for some holes (e.g., left the group), they are treated as scoring 0 strokes on those holes. Since 0 is impossibly good in golf, this player "wins" every hole where their strokes are missing.

**Why it happens:** The system has no concept of "player did not actually play this hole." The `?? 0` default was reasonable for v1.0 where all players are expected to complete all holes. But with game history and H2H, these phantom results persist and inflate statistics.

**Consequences:**
- H2H records show a phantom player beating everyone on holes they never played
- Lifetime win rates are inflated for players who had strokes missing
- A player added by mistake but never having strokes entered appears as a dominant player in stats

**Prevention:**
- Before including a game in H2H calculations, verify that BOTH players have non-zero strokes recorded for at least one hole. Use the `holeStrokes` data from `HistoryRecord` to filter.
- Consider adding a `playedHoles: number` count per player to the history record summary for quick filtering.
- Note: the results page edit modal allows min=0 strokes (NumberStepper with min=0 at results/page.tsx:298), while the play-page StrokeInput enforces min=1 (stroke-input.tsx:12). Harmonize these -- either both allow 0 or neither does.
- For H2H specifically, only count holes where BOTH players in the pair had strokes > 0.

**Detection:** Test: create a 3-player game where player C has strokes entered for 0 holes. Verify H2H between A and C shows "no games" rather than C winning everything.

**Confidence:** MEDIUM -- the `?? 0` default is confirmed in code. The results page min=0 vs play page min=1 inconsistency is confirmed (results/page.tsx:298 vs stroke-input.tsx:12).

---

### Pitfall 8: Score Edit on Results Page Creates Duplicate History Records

**What goes wrong:** If the results page component unmounts and remounts during or after a score edit (React Strict Mode, layout shift, mobile browser background/foreground cycle), the `savedRef` in `useSaveGame` resets. The `isComplete` flag is still true, so the game gets saved to IndexedDB again as a new record with a new auto-incremented `id`.

**Why it happens:** `savedRef` is a React ref, which resets on component remount. React 18+ Strict Mode double-invokes effects in development. While the ref guard works for a single mount cycle, any full unmount/remount resets it.

**Consequences:**
- History page shows duplicate games
- Stats are inflated (games played count increases, win rates skewed by duplicates)
- User confusion seeing the same game listed multiple times
- If the duplicate has different scores (because of an edit between mounts), stats become inconsistent

**Prevention:**
- Add a `gameId: string` field to `GameConfig` (generated via `crypto.randomUUID()` during game setup). Use this as a deduplication key.
- Before saving to IndexedDB, check if a record with the same `gameId` already exists. If so, use `put()` to update instead of `add()` to insert.
- Alternatively, after the first successful save, store the IndexedDB record `id` in the Zustand store and use it for all subsequent saves.
- This also solves Pitfall 2 (stale history after edit) -- every save becomes an upsert keyed on `gameId`.

**Detection:** Test in React Strict Mode: complete a game, verify only one history record exists. Navigate away and back to results, verify still only one record.

**Confidence:** MEDIUM -- the `savedRef` fragility is a known React pattern issue. Whether it manifests depends on exact component lifecycle behavior during edits.

---

### Pitfall 9: State Version Migration Needed But Not Planned for New Fields

**What goes wrong:** Adding new fields to game state (e.g., `gameId`, `editHistory`, extended stroke metadata) without bumping the Zustand persist version causes existing saved games to load without the new fields. Any code that accesses `state.gameId.length` or `state.editHistory.map(...)` will crash with a TypeError on undefined.

**Why it happens:** Developers add fields to the TypeScript interface, see no compile errors (because TypeScript doesn't know about runtime persisted state), and forget that existing `localStorage["golf-handicap-game"]` from v1.0 users does not contain the new fields.

**Consequences:**
- App crashes on load for users with existing saved games
- Loss of in-progress game data if migration resets state
- The existing `migrate` function (game-store.ts:351-358) wipes state on major version bumps: `return { ...initialState }`. This is destructive -- the user's in-progress game disappears.

**Prevention:**
- Plan ALL new fields needed for v1.1 features before implementation. Add them in a single version bump (v1 -> v2).
- Write a non-destructive migration function that preserves existing data and adds defaults for new fields:
  ```typescript
  if (version < 2) {
    const state = persistedState as GameStateV1;
    return {
      ...state,
      gameId: crypto.randomUUID(),
      // other new v1.1 fields with safe defaults
    };
  }
  ```
- Write a migration test: serialize a v1 state JSON, run it through the v2 migrator, verify all new fields are present AND all existing data (strokes, scores, config) is preserved.
- Use `<` comparisons (not `===`) in the migration chain so users who skip versions still get migrated correctly.

**Detection:** Test: construct a v1 persisted state object, pass it through the v2 migration, assert it produces valid v2 state with all new fields populated and all existing fields intact. Verify no data loss.

**Confidence:** HIGH -- the current v0->v1 migration is verifiably destructive (game-store.ts:354: `return { ...initialState }`). A v1->v2 migration MUST be non-destructive.

---

## Minor Pitfalls

### Pitfall 10: Extended Stroke Input Breaks Layout on Small Screens

**What goes wrong:** The current `StrokeInput` component (stroke-input.tsx) shows 5 preset buttons [3, 4, 5, 6, 7] with +/- buttons = 7 elements in a row. If extended input adds more presets (e.g., [2, 3, 4, 5, 6, 7, 8]) or additional UI (par indicator, putt count field), the row overflows on small phones (320px width, iPhone SE).

**Prevention:** Test on 320px viewport width. Use a scrollable row or adaptive layout that adjusts based on screen width. Keep the existing 5-button layout as default and only expand via a "more" toggle. The current `min-w-[44px]` per button x 7 = 308px + gaps already leaves almost no margin on 320px screens.

**Confidence:** MEDIUM -- depends on what "extended stroke input" actually entails.

---

### Pitfall 11: Narrative Text Mixes Poorly with Thai Player Names

**What goes wrong:** If narrative generation produces English sentences with embedded Thai names, mixed-script text can have awkward line breaks, inconsistent font metrics, and confusing reading flow. Template strings like `"${playerName} dominated the back nine"` produce `"som dominated the back nine"` or `"som dominated the back nine"` with mixed Thai/English runs.

**Prevention:** Keep narratives short and data-focused rather than prose-heavy. Use factual statements ("Longest streak: Om, 5 consecutive wins from hole 8") rather than flowing English sentences. Test with 4+ character Thai names to verify line wrapping and font rendering.

**Confidence:** LOW -- depends on actual user behavior and whether Thai names are commonly used. The issue is real for any mixed-script UI.

---

### Pitfall 12: Confirmation Flash Overlay Disrupts Edit Flow

**What goes wrong:** The confirmation flash overlay (play/page.tsx:253-262) is a `fixed inset-0 z-50` element that appears for 1 second after every score submission. Although it has `pointer-events-none`, during rapid sequential edits (fixing multiple holes), the visual flash every time is distracting and makes the user wait 1 second between edits.

**Prevention:** For edit submissions (not first-time submissions), use a smaller, less intrusive toast notification (e.g., bottom-edge toast rather than full-screen flash). Reduce the duration to 500ms for edits. The `pointer-events-none` already prevents blocking, but the visual distraction during edit workflows is the real problem.

**Confidence:** MEDIUM -- the overlay has `pointer-events-none` so no taps are blocked. But the 1-second visual disruption during rapid editing is a real UX issue.

---

### Pitfall 13: H2H Performance is Fine at Current Scale But Architecture Should Not Preclude Optimization

**What goes wrong:** For a H2H record between two players, all history records must be scanned to find games where both participated. With 100+ saved games and 10 unique players (C(10,2) = 45 pairs), that is 4,500 iterations.

**Prevention:** This is a non-issue until ~500+ games. For v1.1, simple iteration over `HistoryRecord[]` is fine. Do not pre-optimize. BUT: structure the H2H computation as a pure function (`computeH2H(playerA, playerB, games)`) so it can be wrapped in a web worker or cached later without refactoring.

**Confidence:** HIGH -- 4,500 iterations over small JavaScript objects is < 10ms on any modern phone.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Extended stroke input | Layout overflow on small screens (#10) | Minor | Test on 320px viewport, keep 5-preset default |
| Editable scores on /play | Auto-advance fires after edit (#4) | **Critical** | Branch on `holeAlreadyScored` before auto-advance |
| Editable scores on /play | Undo snapshot confusion (#3) | **Critical** | Separate edit action from submit action in store |
| Post-submission correction | Running total cascade (#1) | **Critical** | Derive `runningTotal` at render time OR rebuild all totals after any edit |
| Post-submission correction | History record stale (#2) | **Critical** | Update IndexedDB record after edit via upsert on `gameId` |
| Post-submission correction | Duplicate history records (#8) | Moderate | Add `gameId` to config, upsert instead of insert |
| Any new state fields | State migration needed (#9) | Moderate | Plan all fields upfront, single version bump, non-destructive migration |
| Score storytelling | Degenerate game states (#6) | Moderate | Classify game shape first, test all edge cases |
| Score storytelling | Mixed-script text (#11) | Minor | Data-focused statements, not prose |
| Lifetime H2H | Name fragmentation (#5) | Moderate | Player name autocomplete from history, Unicode normalization |
| Lifetime H2H | Phantom player inflation (#7) | Moderate | Filter by actual strokes recorded per player per hole |
| Lifetime H2H | Query performance (#13) | Minor | Non-issue now, structure for future optimization |
| Confirmation overlay | Visual disruption during edits (#12) | Minor | Smaller toast for edits, shorter duration |

## Recommended Implementation Order (Risk-Informed)

Based on pitfall severity, dependency chains, and the principle of fixing foundations before building on them:

1. **State migration infrastructure + gameId** (#9, #8) -- Must come first. Every subsequent feature needs new state fields. Get the migration right once, add `gameId` for deduplication.
2. **Derive runningTotal instead of storing it** (#1) -- Prerequisite for any editing feature. Eliminates the entire class of cascade bugs. Touch `playerScores` type, `submitHoleStrokes`, and all consumers.
3. **Separate edit pathway in store** (#3) -- Create `editHoleStrokes()` action distinct from `submitHoleStrokes()`. Prerequisite for both play-page and results-page editing to not corrupt undo state.
4. **History record upsert mechanism** (#2, #8) -- Change `useSaveGame` to support updates after initial save. Uses `gameId` from step 1.
5. **Auto-advance fix for edits on /play** (#4) -- Now safe because the store, totals, and history are all correct. Small change but critical for UX.
6. **Player name autocomplete + improved normalization** (#5) -- Prerequisite for reliable H2H. Fix the source of name fragmentation before building on it.
7. **Lifetime H2H with phantom-player filtering** (#7) -- Depends on clean player identity from step 6.
8. **Score storytelling with game shape classifier** (#6) -- Independent feature, build last. Comprehensive edge case testing required.

## Sources

- Codebase analysis: `game-store.ts`, `scoring.ts`, `types.ts`, `stats.ts`, `history-db.ts`, `use-save-game.ts`, `results/page.tsx`, `play/page.tsx`, `stroke-input.tsx` (all verified by direct file reading -- HIGH confidence)
- [Zundo - undo/redo middleware for Zustand](https://github.com/charkour/zundo) -- alternative undo/redo approach (HIGH confidence)
- [React - Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) -- ref lifecycle behavior (HIGH confidence)
- [React blog - You Probably Don't Need Derived State](https://legacy.reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html) -- runningTotal should be derived (HIGH confidence)
- [Identity resolution deduplication pitfalls](https://us.fitgap.com/stack-guides/resolving-identity-and-deduplication-issues-that-break-persona-classification) -- over-merge vs under-merge tradeoffs (MEDIUM confidence)
- [Writing effective game recaps - Fiveable](https://library.fiveable.me/sports-reporting-and-production/unit-4/writing-effective-game-recaps/study-guide/GPcsMuMiHnsy0zJt) -- narrative structure patterns (MEDIUM confidence)
- [IndexedDB for save game data](https://lvl17.com/wp/using-indexeddb-for-save-game-data/) -- put vs add, eviction risks (MEDIUM confidence)
- [Pardot scoring recalculation cascade](https://pardotgeeks.com/2020/12/pardot-prospect-score-changes/) -- cascading score recalculation real-world failures (MEDIUM confidence)

---
*Pitfalls research for: Golf Handicap Scorer v1.1 features*
*Researched: 2026-02-22*
