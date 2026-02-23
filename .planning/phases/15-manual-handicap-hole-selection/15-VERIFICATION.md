---
phase: 15-manual-handicap-hole-selection
verified: 2026-02-23T13:35:00Z
status: human_needed
score: 4/4 must-haves verified
re_verification: false
human_verification:
  - test: "Open HandicapEditDialog during play with a pair that has handicap 3 set. Confirm hole toggle grid appears with 3 holes highlighted green."
    expected: "Hole toggle grid visible below NumberStepper, 3 holes shown selected (emerald-500), counter reads '3/3 selected'"
    why_human: "Visual rendering and correct initial state from store cannot be verified programmatically"
  - test: "Tap a selected hole — it should deselect. Tap an unselected hole when not at max — it should select. Try to select a 4th hole when max is 3 — button should be disabled."
    expected: "Toggle on/off works, at-max holes are visually dimmed and non-interactive"
    why_human: "Click interaction and disabled state behaviour requires runtime verification"
  - test: "With handicap 3 and holes [1,3,5] selected, use the stepper to change value to 5. Confirm holes [1,3,5] remain selected and counter reads '3/5 selected — select 2 more'."
    expected: "Existing 3 holes preserved, warning counter in rose-400 prompting user to add 2 more"
    why_human: "State preservation across stepper change requires live store observation"
  - test: "Change value from 5 back to 2. Confirm only holes [1,3] remain (highest trimmed)."
    expected: "Holes trimmed to lowest 2 by hole number, counter reads '2/2 selected'"
    why_human: "Trim-from-highest logic outcome requires live verification"
  - test: "Close the dialog after changing handicap holes mid-game. Verify pair scores on the leaderboard change to reflect the new hole selections."
    expected: "Score recalculation fires on dialog close, leaderboard updates immediately"
    why_human: "recalculateFromStrokes side-effect on score display requires live game state"
  - test: "On the /results page, open HandicapEditDialog, change holes, close dialog. Verify rankings, scorecards, and any charts update correctly."
    expected: "All result views recompute using new handicap hole selections"
    why_human: "Results page re-render after recalculation requires visual confirmation"
---

# Phase 15: Manual Handicap Hole Selection Verification Report

**Phase Goal:** Users can see and manually control which specific holes receive handicap strokes when editing a pair's handicap, instead of relying solely on auto-distribution
**Verified:** 2026-02-23T13:35:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | When user opens handicap edit dialog, they see which holes currently have handicap strokes for each pair | ? HUMAN | Hole toggle grid code exists and reads `handicapHoles` from store — visual rendering needs human confirmation |
| 2 | User can tap individual holes to toggle handicap strokes on/off for a pair, overriding auto-distribution | ? HUMAN | Toggle onClick calls `setHandicapHoles` with filter/spread, disabled at-max logic present — interaction needs human confirmation |
| 3 | When user changes handicap value via stepper, existing hole selections are preserved and user can manually adjust the difference | ? HUMAN | `handleHandicapChange` implements full preserve/trim/auto-distribute case logic — runtime behaviour needs human confirmation |
| 4 | Manual hole selections persist through score replay — all pair results recalculate correctly using user-chosen handicap holes | ? HUMAN | `handleClose` calls `recalculateFromStrokes()` when `hasScores` — score update effect needs live game confirmation |

All 4 truths have verified code implementations. All 4 require human confirmation for runtime behaviour.

**Score:** 4/4 implementations verified (all need human runtime confirmation)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/shared/handicap-edit-dialog.tsx` | Enhanced HandicapEditDialog with inline hole toggle grid per pair | VERIFIED | 182 lines, contains `handicapHoles`, hole toggle grid, smart `handleHandicapChange`, `setHandicapHoles` calls, `recalculateFromStrokes` on close. Committed in b101f46. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `handicap-edit-dialog.tsx` | `useGameStore.setHandicapHoles` | toggle button onClick calling `setHandicapHoles` with updated array | WIRED | Line 138: `setHandicapHoles(pair.pairKey, handicapHoles.filter(...))` and line 143: `setHandicapHoles(pair.pairKey, [...handicapHoles, hole])`. Pattern `setHandicapHoles\(pair\.pairKey` confirmed present. |
| `handicap-edit-dialog.tsx` | `useGameStore.recalculateFromStrokes` | `handleClose` calls `recalculateFromStrokes` when scores exist | WIRED | Lines 66-71: `handleClose` checks `hasScores` and calls `recalculateFromStrokes()`. Pattern confirmed present. |
| `handicap-edit-dialog.tsx` | `/play` page | Rendered as `<HandicapEditDialog />` | WIRED | `play/page.tsx` line 16 imports, line 209 renders. |
| `handicap-edit-dialog.tsx` | `/results` page | Rendered as `<HandicapEditDialog />` | WIRED | `results/page.tsx` line 18 imports, line 134 renders. |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| HCTL-01: Users see current handicap hole assignments | SATISFIED | Hole toggle grid reads `config.handicaps[pairKey]?.handicapHoles` and renders selected state with emerald-500 |
| HCTL-02: Users can tap to toggle individual holes | SATISFIED | Toggle buttons with onClick handler, disabled-at-max logic, selection counter with warning |
| HCTL-03: Changing value preserves existing selections | SATISFIED | Full case analysis: preserve on increase, trim-from-highest on decrease, auto-distribute on fresh start/sign-change, clear on zero |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `handicap-edit-dialog.tsx` | 27 | `return null` | Info | Guard clause for missing config — correct defensive pattern, not a stub |

No blockers or warnings found.

### Build and Test Status

- `npm run build`: Passed — all 11 static routes generated, no TypeScript errors
- `npm test`: Passed — 118/118 tests across 6 test files
- Commit `b101f46` confirmed in git log, touching only `handicap-edit-dialog.tsx`

### Human Verification Required

#### 1. Hole toggle grid renders with correct initial state

**Test:** Open HandicapEditDialog during play with a pair that has handicap 3 set. Confirm hole toggle grid appears with 3 holes highlighted green.
**Expected:** Hole toggle grid visible below NumberStepper, 3 holes shown selected (emerald-500), counter reads "3/3 selected"
**Why human:** Visual rendering and correct initial state from store cannot be verified programmatically

#### 2. Toggle interaction works correctly

**Test:** Tap a selected hole — it should deselect. Tap an unselected hole when not at max — it should select. Try to select a 4th hole when max is 3 — button should be disabled.
**Expected:** Toggle on/off works, at-max holes are visually dimmed and non-interactive
**Why human:** Click interaction and disabled state behaviour requires runtime verification

#### 3. Value increase preserves existing selections (HCTL-03)

**Test:** With handicap 3 and holes [1,3,5] selected, use the stepper to change value to 5. Confirm holes [1,3,5] remain selected and counter reads "3/5 selected — select 2 more".
**Expected:** Existing 3 holes preserved, warning counter in rose-400 prompting user to add 2 more
**Why human:** State preservation across stepper change requires live store observation

#### 4. Value decrease trims from highest holes (HCTL-03)

**Test:** With 5 holes selected including high-numbered holes, decrease value to 2. Confirm only the 2 lowest-numbered selected holes remain.
**Expected:** Holes trimmed to lowest 2 by hole number, counter reads "2/2 selected"
**Why human:** Trim-from-highest logic outcome requires live verification

#### 5. Dialog close triggers score recalculation

**Test:** Close the dialog after changing handicap holes mid-game. Verify pair scores on the leaderboard change to reflect the new hole selections.
**Expected:** Score recalculation fires on dialog close, leaderboard updates immediately
**Why human:** recalculateFromStrokes side-effect on score display requires live game state

#### 6. Results page recalculates after handicap hole change

**Test:** On the /results page, open HandicapEditDialog, change holes, close dialog. Verify rankings, scorecards, and any charts update correctly.
**Expected:** All result views recompute using new handicap hole selections
**Why human:** Results page re-render after recalculation requires visual confirmation

### Gaps Summary

No gaps in the implementation. All four must-have truths have complete, substantive, and wired code implementations. The phase is blocked only by human runtime verification of visual rendering and interactive behaviour — which the plan explicitly requires as a checkpoint:human-verify gate.

---

_Verified: 2026-02-23T13:35:00Z_
_Verifier: Claude (gsd-verifier)_
