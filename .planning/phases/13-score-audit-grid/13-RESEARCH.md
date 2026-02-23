# Phase 13: Score Audit Grid - Research

**Researched:** 2026-02-23
**Domain:** React grid UI, Zustand state access, shadcn/ui Dialog, mobile-first table patterns
**Confidence:** HIGH

---

## Summary

Phase 13 adds a "Score Audit Grid" — a full matrix view of raw strokes per hole per player, with handicap-stroke indicators per pair and tap-to-edit per hole row. It must be accessible from both the play screen and the results screen.

The codebase already contains all the data and interaction primitives needed. `holeStrokes: HoleStrokes[]` (from Zustand) stores raw strokes indexed by hole number and player ID. `config.handicaps` (a `Record<PairKey, PairHandicap>`) gives `handicapHoles: number[]` per pair — the set of holes where a given pair's handicap applies. Navigation is already wired: `goToHole(n)` moves the play screen to any hole; the results screen already has an inline edit pattern (bottom-sheet overlay with `NumberStepper`).

The primary design decision is **component shape**: a full-screen Dialog (using the existing shadcn Dialog) is the right choice. It avoids an extra route, reuses the existing Dialog primitive already installed, and keeps the grid dismissible without losing play/results page state.

**Primary recommendation:** Build a single `ScoreAuditDialog` component (Dialog-based, full-screen on mobile) that accepts an `onHoleSelect` callback, and mount it in both play page and results page with context-appropriate handlers.

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `radix-ui` (Dialog) | installed | Modal overlay with focus trap, escape key, accessibility | Already used in `HandicapEditDialog` and `handicap-edit-dialog.tsx` |
| `zustand` | 5 | All game state including `holeStrokes`, `config.handicaps` | Single source of truth; no prop drilling needed |
| `lucide-react` | installed | Icons (Grid, TableProperties, etc.) | Already used everywhere |
| Tailwind CSS 4 | installed | Styling, responsive grid, `scrollbar-hide` utility | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `shadcn/ui Dialog` | installed | Full-screen modal container | ScoreAuditDialog wrapper |
| `NumberStepper` (shared) | local | +/- stroke editing in results edit overlay | Reuse existing component |

### No New Installs Required

All required libraries are present. Do not add a sheet/drawer library. The existing Dialog component handles full-screen by passing `className` overrides. The results page already uses a custom bottom-sheet overlay (built from scratch) — that pattern can be reused for edit actions from the audit grid on the results screen.

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── components/
│   └── shared/
│       └── score-audit-dialog.tsx   # New: the audit grid dialog
├── app/
│   ├── play/
│   │   └── page.tsx                 # Add <ScoreAuditDialog> trigger here
│   └── results/
│       └── page.tsx                 # Add <ScoreAuditDialog> trigger here
```

### Pattern 1: Shared Dialog Component with Context-Aware Callback

**What:** A single `ScoreAuditDialog` component handles both entry points. It receives an `onHoleSelect(holeNumber: number) => void` prop. The play page passes a handler that calls `goToHole(n)` and closes the dialog. The results page passes a handler that opens the per-cell edit overlay (the existing `EditingCell` pattern).

**When to use:** When the same UI surface needs different tap actions depending on context. This avoids duplicating the grid rendering logic.

**Example:**
```tsx
// src/components/shared/score-audit-dialog.tsx
interface ScoreAuditDialogProps {
  trigger: React.ReactNode;
  onHoleSelect: (holeNumber: number) => void;
  mode: "play" | "results";
}

export function ScoreAuditDialog({ trigger, onHoleSelect, mode }: ScoreAuditDialogProps) {
  const [open, setOpen] = useState(false);
  const { config, holeStrokes } = useGameStore();
  // ... render grid, call onHoleSelect on row tap, close dialog
}
```

**In play/page.tsx:**
```tsx
<ScoreAuditDialog
  trigger={<button aria-label="Score audit"><Grid className="h-5 w-5" /></button>}
  onHoleSelect={(hole) => { goToHole(hole); setAuditOpen(false); }}
  mode="play"
/>
```

**In results/page.tsx:**
```tsx
<ScoreAuditDialog
  trigger={<button aria-label="Score audit"><Grid className="h-5 w-5" /></button>}
  onHoleSelect={(hole) => { setEditingHole(hole); }}
  mode="results"
/>
```

### Pattern 2: Grid Layout — Rows = Holes, Cols = Players

**What:** An HTML `<table>` or CSS grid with `overflow-x-auto` wrapper. Rows are holes (1 to N). Columns are players (2 to 6). Each cell shows the raw stroke value from `holeStrokes`. An extra visual marker indicates handicap-stroke holes per pair.

**Exact data access from store:**
```tsx
// Raw strokes for a specific hole + player:
const holeData = holeStrokes.find(s => s.holeNumber === hole);
const rawStrokes = holeData?.strokes[player.id] ?? null;

// Whether this hole is a handicap hole for a given pair:
const handicap = config.handicaps[pairKey];
const isHandicapHole = handicap?.handicapHoles.includes(holeNumber) ?? false;

// Turbo holes:
const isTurbo = config.turboHoles.includes(holeNumber);
```

**Example table skeleton (mirrors results page scorecard pattern):**
```tsx
<div className="overflow-x-auto scrollbar-hide">
  <table className="w-full text-sm">
    <thead>
      <tr>
        <th className="text-left py-2 pr-3 text-muted-foreground">Hole</th>
        {config.players.map(p => (
          <th key={p.id} className="text-center px-2 py-2 text-muted-foreground truncate max-w-[60px]">
            {p.name}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.from({ length: config.numberOfHoles }, (_, i) => i + 1).map(hole => (
        <tr
          key={hole}
          className="border-b border-border/50 cursor-pointer active:bg-muted/50 transition-colors"
          onClick={() => onHoleSelect(hole)}
        >
          <td className="py-2.5 pr-3 font-medium tabular-nums">{hole}</td>
          {config.players.map(p => {
            const val = holeStrokes.find(s => s.holeNumber === hole)?.strokes[p.id];
            return (
              <td key={p.id} className="text-center px-2 py-2.5 tabular-nums">
                {val != null ? val : <span className="text-muted-foreground/30">—</span>}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Pattern 3: Handicap Stroke Indicator per Pair

**What:** AUDIT-03 requires showing which holes carry handicap strokes for each pair. Because pairs grow as C(n,2), showing per-pair columns in the grid for 6 players (15 pairs) is unreadable on mobile. The recommended pattern is a **legend section below the grid** or **a secondary expandable section** that lists each pair and its handicap holes.

Alternatively, a **row-level dot indicator** on the hole row — a small colored dot or badge that appears if *any* pair has a handicap stroke on that hole. A tooltip or tap on the dot can reveal which pairs. This is more mobile-friendly.

**Data to compute the legend:**
```tsx
// For each hole, compute which pairs have handicap strokes:
const handicapHolesPerPair = useMemo(() => {
  if (!config) return {};
  return Object.fromEntries(
    Object.values(config.handicaps).map(h => [h.pairKey, h.handicapHoles])
  );
}, [config]);
```

### Pattern 4: Full-Screen Dialog on Mobile

**What:** The existing `DialogContent` positions itself centered. For a data grid, a full-height sheet-style overlay is better on mobile. Achieved by overriding the Dialog className:

```tsx
<DialogContent
  className="max-w-full h-[90dvh] flex flex-col p-0 gap-0 rounded-t-2xl rounded-b-none top-[10dvh] translate-y-0"
  showCloseButton={false}
>
```

This is the same approach used in the results page's manual bottom-sheet overlay — the pattern is already proven in the codebase.

### Anti-Patterns to Avoid

- **Adding a Sheet/Drawer library:** No `shadcn sheet` component is installed. The Dialog with className override achieves the same result with zero new dependencies.
- **Duplicating the grid in both pages:** Build one `ScoreAuditDialog` component, mount it in both places with different `onHoleSelect` handlers.
- **Rendering handicap info as extra columns:** With 6 players (15 pairs), extra columns are unreadable. Use a legend/section pattern instead.
- **Re-implementing stroke editing inside the audit dialog:** On the results page, the audit dialog's `onHoleSelect` should open the existing per-cell edit overlay from `results/page.tsx` — don't build a second edit mechanism.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal overlay with focus trap | Custom div + escape listener | `Dialog` from `@/components/ui/dialog` | Already installed, handles a11y, escape key, backdrop click |
| Stroke increment/decrement | Custom buttons | `NumberStepper` from `@/components/shared/number-stepper` | Already handles hold-to-repeat, min/max, all sizes |
| Handicap holes computation | Custom math | `config.handicaps[pairKey].handicapHoles` | Already distributed and stored by `distributeHandicapHoles` in pairs.ts |
| Hole navigation | `router.push()` + state | `goToHole(n)` from Zustand store | Already wired in play page |
| Score edit on results | New dialog | Existing `editingCell` + bottom-sheet in results/page.tsx | Already built and working |

**Key insight:** The codebase already has 90% of the pieces. This phase is primarily UI composition — reading existing state, laying it out in a grid, and wiring the two entry points to the right callbacks.

---

## Common Pitfalls

### Pitfall 1: Dialog Accessibility — Missing Description

**What goes wrong:** Radix Dialog requires either `DialogDescription` or `aria-describedby={undefined}` to avoid console warnings. Omitting it causes a runtime warning.

**Why it happens:** Radix enforces accessible dialog patterns.

**How to avoid:** Add a `DialogDescription` (can be sr-only) or explicitly set `aria-describedby={undefined}` on `DialogContent`.

**Warning signs:** Console warning about missing description when dialog opens.

### Pitfall 2: Table Overflow on Mobile with Many Players

**What goes wrong:** With 6 players, the table header row overflows. Player names truncate badly in narrow `<th>` cells.

**Why it happens:** Mobile screens are 375px wide; 6 player columns + 1 hole column = 7 columns in ~375px.

**How to avoid:** Cap player name display to 2-3 characters (initials) in table headers. Use `truncate` + `max-w-[40px]` on `<th>`. The results page scorecard already has `max-w-[80px]` on player column — reduce for the audit grid since there are more columns.

**Warning signs:** Horizontal scroll required even on the hole column.

### Pitfall 3: goToHole Does Not Navigate — It Only Updates Store

**What goes wrong:** Calling `goToHole(n)` from inside the Dialog (mounted in play page) updates `currentHole` in the store but does not auto-scroll the stroke input into view or close the dialog.

**Why it happens:** `goToHole` is a pure store action (`set({ currentHole: holeNumber })`). It has no side effects.

**How to avoid:** The `onHoleSelect` handler in play page must: (1) call `goToHole(n)`, (2) close the dialog (`setOpen(false)`). The play page already re-renders when `currentHole` changes, so the stroke input naturally shows the correct hole.

### Pitfall 4: Unscored Holes Show as Empty — Confusing for Users

**What goes wrong:** Holes not yet played have `null` strokes. If the grid just shows empty cells, users may think data is missing.

**Why it happens:** `holeStrokes.find(s => s.holeNumber === hole)` returns `undefined` for unplayed holes.

**How to avoid:** Render an em dash (`—`) styled in `text-muted-foreground/30` for unscored holes (same pattern as results page scorecard). This is already established convention in the codebase.

### Pitfall 5: Handicap Holes Stored Per Pair — Cannot Trivially Merge Into Single Column

**What goes wrong:** Designer instinct is to add a "HCP" column to the grid showing which holes have handicap. But handicap holes are per-pair, not per-hole globally. Hole 3 might be a handicap hole for pair A-B but not for pair C-D.

**Why it happens:** `PairHandicap.handicapHoles: number[]` is pair-scoped by design.

**How to avoid:** Show handicap info in a separate legend section below the grid, listing each pair and its handicap holes. Or show a dot/badge on the hole row indicating "at least one pair has a handicap stroke here" with a tap to expand which pairs.

---

## Code Examples

Verified patterns from codebase inspection:

### Reading Raw Strokes Per Hole Per Player
```tsx
// Source: src/lib/types.ts + src/app/results/page.tsx (lines 70-73)
const getStrokeValue = (playerId: string, hole: number): number => {
  const holeData = holeStrokes.find((s) => s.holeNumber === hole);
  return holeData?.strokes[playerId] ?? 0;
};
```

### Reading Handicap Holes Per Pair
```tsx
// Source: src/lib/types.ts (PairHandicap.handicapHoles) + src/lib/game-store.ts
const handicap = config.handicaps[pairKey]; // PairHandicap
const holesWithStroke = handicap?.handicapHoles ?? []; // number[]
const isHandicapHole = holesWithStroke.includes(holeNumber);
```

### Navigating to a Hole (Play Screen)
```tsx
// Source: src/app/play/page.tsx (line 324 in game-store.ts)
// goToHole is a direct store action: set({ currentHole: holeNumber })
const { goToHole } = useGameStore();
goToHole(3); // sets currentHole = 3; play page re-renders
```

### Opening Edit for a Specific Hole (Results Screen)
```tsx
// Source: src/app/results/page.tsx (lines 25-29, 66-68)
interface EditingCell {
  playerId: string;
  playerName: string;
  hole: number;
}
// setEditingCell triggers the existing bottom-sheet overlay
const handleEditStroke = (playerId: string, playerName: string, hole: number) => {
  setEditingCell({ playerId, playerName, hole });
};
```

### Full-Screen Dialog Pattern (adapted from results page bottom-sheet)
```tsx
// Source: src/app/results/page.tsx (lines 276-320) + src/components/ui/dialog.tsx
// Dialog with className override for bottom-anchored full-height appearance:
<DialogContent
  className="max-w-full h-[90dvh] top-[10dvh] translate-y-0 flex flex-col p-0 rounded-t-2xl rounded-b-none"
  showCloseButton={false}
>
  <div className="flex-1 overflow-y-auto p-4">
    {/* grid content */}
  </div>
</DialogContent>
```

### Handicap Edit Dialog Entry Point Pattern (existing icon-button in header)
```tsx
// Source: src/components/shared/handicap-edit-dialog.tsx (lines 49-58)
// This is the established pattern for header icon triggers:
<Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
  <DialogTrigger asChild>
    <button
      className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      aria-label="Score audit"
    >
      <TableProperties className="h-5 w-5" />
    </button>
  </DialogTrigger>
```

### Scrollable Hole Navigator Pattern (from play page)
```tsx
// Source: src/app/play/page.tsx (lines 204-230)
// Already uses scrollbar-hide + overflow-x-auto for horizontal scroll:
<div className="overflow-x-auto scrollbar-hide">
  <div className="flex gap-1.5 px-1 w-max">
    {/* items */}
  </div>
</div>
```

### Generating All Pairs for Handicap Legend
```tsx
// Source: src/lib/pairs.ts generatePairs()
import { generatePairs, getPlayerName } from "@/lib/pairs";
const pairs = generatePairs(config.players);
// pairs[i] = { pairKey, playerAId, playerBId }
// config.handicaps[pairs[i].pairKey].handicapHoles = [1, 4, 7, ...]
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Edit strokes via route navigation | Inline dialog/overlay (no route change) | Already established in results page |
| Manual sheet/drawer library | Dialog + className override | Zero new deps, already working |
| Global navigation for any edit | `goToHole(n)` + close dialog | Smooth, stateful, no flicker |

---

## Open Questions

1. **Handicap indicator display format for AUDIT-03**
   - What we know: Handicap holes are per-pair (`PairHandicap.handicapHoles`), not global per-hole
   - What's unclear: The requirement says "see which holes carry handicap strokes per pair" — whether this means a per-pair sub-section or inline markers on each hole row
   - Recommendation: Use a collapsible legend section below the stroke grid. Each pair listed with its name and highlighted hole numbers. This keeps the main grid readable and satisfies AUDIT-03.

2. **Entry point icon/button label in play page header**
   - What we know: The header already has `HandicapEditDialog` in the top-right (one icon button)
   - What's unclear: Should the audit grid be a second icon button in the header, or in the hole navigator bar, or somewhere else?
   - Recommendation: Add a second icon button in the play page header to the left of the HandicapEditDialog button. Use `TableProperties` or `LayoutGrid` icon from lucide-react.

3. **"Jump to hole for editing" behavior from results page**
   - What we know: The results page has `editingCell: { playerId, playerName, hole }` state. It edits per-player-per-hole.
   - What's unclear: AUDIT-04 says "open edit for that hole" — does this mean open the existing per-player cell editor, or navigate back to play page for that hole?
   - Recommendation: On results page, tapping a hole row in the audit grid should open the existing edit overlay pre-focused on the first player for that hole. The user can then navigate players. This keeps the user on the results page.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/lib/types.ts` — `HoleStrokes`, `PairHandicap`, `GameConfig` types
- Direct codebase inspection: `src/lib/game-store.ts` — `holeStrokes`, `config.handicaps`, `goToHole` action
- Direct codebase inspection: `src/lib/pairs.ts` — `generatePairs`, `distributeHandicapHoles`
- Direct codebase inspection: `src/lib/scoring.ts` — `recalculateAllResults`, `getHandicapAdjustment`
- Direct codebase inspection: `src/app/play/page.tsx` — hole navigator pattern, `goToHole` wiring
- Direct codebase inspection: `src/app/results/page.tsx` — editable scorecard pattern, bottom-sheet edit overlay
- Direct codebase inspection: `src/components/ui/dialog.tsx` — Dialog primitive, `showCloseButton` prop
- Direct codebase inspection: `src/components/shared/handicap-edit-dialog.tsx` — Dialog usage pattern
- Direct codebase inspection: `src/components/shared/number-stepper.tsx` — existing stepper component
- Direct codebase inspection: `src/app/globals.css` — `glass-card`, `scrollbar-hide`, `animate-fade-up`, `pb-safe`
- Direct codebase inspection: `package.json` — confirmed installed packages

### Secondary (MEDIUM confidence)
- Radix UI Dialog accessibility requirements (aria-describedby) — standard Radix behavior, matches what's already implemented in codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries directly verified in package.json and component files
- Architecture patterns: HIGH — all patterns derived from existing codebase code, no speculation
- Data access: HIGH — types and store actions read directly from source files
- Pitfalls: HIGH — derived from actual codebase constraints (table layout, store action behavior, pair-scoped handicaps)
- Open questions: MEDIUM — these are design decisions not resolvable from code alone

**Research date:** 2026-02-23
**Valid until:** 2026-03-30 (stable codebase, no fast-moving dependencies)
