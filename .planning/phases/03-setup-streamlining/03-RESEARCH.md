# Phase 3: Setup Streamlining - Research

**Researched:** 2026-02-17
**Domain:** Multi-step wizard UX optimization, smart defaults, setup flow consolidation
**Confidence:** HIGH

## Summary

Phase 3 addresses the friction in the current 4-page setup wizard (/setup -> /handicap -> /turbo -> /play). Today, a user who accepts all defaults (no handicaps, no turbo) must navigate through 4 separate pages with 4 distinct page transitions before reaching the play screen. The handicap and turbo pages serve no purpose when users accept defaults, yet they cannot be skipped. The success criteria require a user accepting all defaults to go from "New Game" to the play screen in 3 steps or fewer, while retaining full access to handicap and turbo configuration for users who need them.

The codebase analysis reveals that the handicap and turbo pages are structurally independent -- they both read and write to the same Zustand store's `config` object, but they operate on different fields (`config.handicaps` vs `config.turboHoles`). The store's `initializeHandicaps()` action already creates zero-valued handicap entries for all pairs, and `turboHoles` defaults to an empty array. This means the store is already "ready to play" immediately after the setup page sets players and hole count -- the handicap and turbo steps are optional configuration, not required initialization. The key insight is that the store layer already supports skipping these steps; only the UI enforces the linear 4-step flow.

The recommended approach is a single redesigned setup page that combines player/hole configuration with a prominent "Start Game" primary action and optional "Configure Handicaps" / "Configure Turbo" secondary actions. Users who want the fast path tap "Start Game" directly from the setup page (step 1: home "New Game", step 2: enter names, step 3: tap "Start Game" = 3 steps). Users who want handicaps or turbo can tap the secondary actions to expand inline configuration sections or navigate to dedicated config pages, then return to the setup page to start.

**Primary recommendation:** Consolidate the setup flow by making handicap and turbo configuration optional, expandable sections accessible from the setup page, with a direct "Start Game" button that initializes default handicaps (all zero) and empty turbo holes before navigating to /play.

## Standard Stack

### Core (already installed -- no new dependencies needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.3 | UI framework | Already installed; useState for accordion/expand state |
| zustand | 5.0.11 | State management | Already installed; `initializeHandicaps()`, `setTurboHoles()` actions ready |
| tailwindcss | 4.x | Styling | Already installed; transition utilities for expand/collapse animations |
| tw-animate-css | 1.4.0 | CSS animations | Already installed; `animate-in`, `fade-in` for section reveals |
| lucide-react | 0.563.0 | Icons | Already installed; `Settings2`, `Zap`, `Play`, `ChevronDown` for UI controls |
| next | 16.1.6 | Router | Already installed; `router.push("/play")` for direct navigation |

### Supporting (no install needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS `max-height` transition | Browser built-in | Expand/collapse animation | Smooth reveal of optional handicap/turbo sections |
| CSS `grid-template-rows: 0fr/1fr` | Browser built-in | Collapse animation | Modern alternative to max-height for smoother accordion |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline expandable sections | Separate modal/dialog for handicap config | Modal breaks flow and is harder to use on small screens. Inline sections keep context and feel faster. |
| Inline expandable sections | Tab-based single page (Setup / Handicap / Turbo tabs) | Tabs hide content behind navigation; users don't know what they're missing. Inline sections make features discoverable. |
| Inline expandable sections | Stepper/accordion wizard on a single page | Similar concept; accordion is one valid implementation of "expandable sections." The key is making expansion optional. |
| Custom collapse animation | Radix Accordion or Collapsible primitive | Radix is installed via `radix-ui` package, and shadcn/ui has Accordion/Collapsible components available. Could use `npx shadcn@latest add accordion` or `collapsible`. However, the expansion is simple enough (one or two sections) that a CSS `grid-template-rows` transition is sufficient. Shadcn components are a viable alternative if we want consistent styling primitives. |
| Direct "Start Game" from setup | "Quick Start" button on home page that skips all setup | Requires storing a "last used players" list (Phase 5 feature HIST-04). For Phase 3, users still need to enter/confirm player names. |

**Installation:**
```bash
# No installation needed -- all dependencies already present
# Optionally add shadcn accordion component if collapsible UI is preferred:
# npx shadcn@latest add collapsible
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── setup/
│   │   └── page.tsx           # REDESIGNED: combined setup with optional handicap/turbo sections
│   ├── handicap/
│   │   └── page.tsx           # KEEP but accessed as optional from setup (may become dead route)
│   ├── turbo/
│   │   └── page.tsx           # KEEP but accessed as optional from setup (may become dead route)
│   └── play/
│       └── page.tsx           # UNCHANGED
├── components/
│   └── shared/
│       ├── step-indicator.tsx  # UPDATE: reduce from 4 steps to reflect new flow
│       ├── game-header.tsx     # UNCHANGED
│       └── number-stepper.tsx  # UNCHANGED (still used in handicap config)
└── lib/
    ├── game-store.ts           # MINOR UPDATE: add startGame() convenience action
    └── ...existing...
```

### Pattern 1: Direct Start with Lazy Initialization
**What:** The setup page provides a primary "Start Game" button that calls `initializeHandicaps()` (sets all handicaps to 0 with empty handicapHoles) and navigates directly to /play, skipping the handicap and turbo pages entirely.
**When to use:** When optional configuration steps have sensible defaults that don't need user interaction.
**Example:**
```typescript
// In setup page: the primary action
const handleStartGame = () => {
  const finalPlayers = players.map((p, i) => ({
    ...p,
    name: p.name.trim() || `Player ${i + 1}`,
  }));
  setPlayers(finalPlayers);
  setNumberOfHoles(numberOfHoles);
  initializeHandicaps(); // sets all pairs to 0 handicap
  // turboHoles already defaults to [] in store
  router.push("/play");
};
```

### Pattern 2: Optional Configuration as Expandable Sections
**What:** Handicap and turbo configuration are presented as collapsible sections below the main setup form. Collapsed by default, they show a summary line ("No handicaps" / "No turbo holes") with a tap-to-expand affordance. When expanded, they render the same UI that currently lives on /handicap and /turbo.
**When to use:** When features are important but optional, and the majority use case skips them.
**Example:**
```typescript
// Collapsible section using CSS grid-template-rows for smooth animation
interface CollapsibleSectionProps {
  title: string;
  summary: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, summary, icon, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          {icon}
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {!isOpen && (
              <p className="text-xs text-slate-500">{summary}</p>
            )}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Pattern 3: Updated Step Indicator
**What:** The step indicator should reflect that the setup flow is now primarily 2 meaningful steps: "Setup" and "Play". The handicap and turbo configuration, being optional, are sub-steps of setup rather than top-level steps.
**When to use:** When the wizard structure changes from mandatory linear to optional-with-fast-path.
**Possible approaches:**
1. Remove step indicator entirely from setup page (simplest -- it's one page now)
2. Show a 2-step indicator: "Setup" -> "Play"
3. Keep 4-step indicator but mark handicap/turbo as "optional" visually

**Recommendation:** Option 2 (2-step indicator) or Option 1 (remove entirely). The 4-step indicator is misleading if steps 2 and 3 are optional. A simpler indicator better communicates the streamlined flow.

### Anti-Patterns to Avoid
- **Removing handicap/turbo functionality entirely:** The requirements say "retaining full access." These features must remain accessible, just not mandatory.
- **Auto-detecting "simple game" vs "advanced game":** Don't try to guess whether the user wants handicaps. Make both paths equally accessible with clear visual hierarchy (primary = start, secondary = configure).
- **Breaking the store's existing initialization flow:** The store's `initializeHandicaps()` already creates default entries. Don't create a new initialization pattern; use the existing one.
- **Putting configuration behind a settings gear icon only:** Optional config must be discoverable by new users, not hidden in a settings menu. Collapsible sections with descriptive labels are more discoverable.
- **Separate "Quick Start" and "Advanced Setup" modes:** This creates a mode problem. One flow with optional expansion is simpler than two separate flows.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Handicap initialization | New "quick start" store action | Existing `initializeHandicaps()` | Already creates zero-valued entries for all pairs; tested in Phase 1 |
| Turbo defaults | New "clear turbo" action | Store already defaults `turboHoles` to `[]` | No action needed; the default state is already "no turbo" |
| Collapse animation | JavaScript height calculation | CSS `grid-template-rows: 0fr/1fr` transition | Pure CSS approach, no JS measurement needed, hardware-accelerated |
| Player pair generation | Custom pair UI logic | `generatePairs()` from `pairs.ts` | Already used in /handicap page; tested in Phase 1 |
| Handicap configuration UI | New handicap config component | Extract existing UI from `/handicap/page.tsx` | The current handicap page already has working UI for pair handicap + hole selection |

**Key insight:** Phase 3 is a UX restructuring, not a feature addition. The store already supports the fast path -- all work is in rearranging how the existing setup UI is presented to the user.

## Common Pitfalls

### Pitfall 1: Inline Handicap Config Becomes Overwhelmingly Long
**What goes wrong:** With 6 players (15 pairs), the expanded handicap section becomes a scrolling nightmare on the setup page, pushing the "Start Game" button far below the fold.
**Why it happens:** C(6,2) = 15 pairs, each needing a NumberStepper and potentially hole selection UI.
**How to avoid:** Two options: (a) keep handicap config as a separate page (navigated from setup, returns to setup), or (b) inline only the handicap values (NumberSteppers) and show hole selection only when a non-zero handicap is set. Option (a) is safer for 4+ players. The expanded section can show a summary with a "Configure" link that navigates to /handicap with a back-to-setup return path.
**Warning signs:** Setup page exceeds 3 screen heights when handicap section is expanded.

### Pitfall 2: Breaking the Back Button / Navigation Flow
**What goes wrong:** If handicap/turbo config is done on sub-pages, pressing the browser back button or the header back arrow navigates incorrectly (e.g., back to home instead of back to setup).
**Why it happens:** The current flow is linear (/setup -> /handicap -> /turbo -> /play). Changing to /setup -> /handicap -> /setup -> /play changes the history stack expectations.
**How to avoid:** Use `router.push()` (not `router.replace()`) for navigation to config sub-pages, and set `backHref="/setup"` on the GameHeader of handicap/turbo pages. The existing GameHeader already supports `backHref`. For the inline approach, this pitfall doesn't apply.
**Warning signs:** Tapping "back" on /handicap goes to home instead of setup.

### Pitfall 3: Store State Not Ready When Skipping Steps
**What goes wrong:** Navigating directly from /setup to /play without visiting /handicap means `initializeHandicaps()` was never called, so `config.handicaps` is an empty object `{}`. The play page's scoring engine tries to look up handicaps and finds nothing.
**Why it happens:** Currently, `initializeHandicaps()` is called in the `/handicap` page's `useEffect`. If that page is skipped, the initialization never happens.
**How to avoid:** Call `initializeHandicaps()` in the "Start Game" handler on the setup page, before navigating to /play. This is the single most important store operation for the fast path. Verify that `initializeHandicaps()` with all-zero handicaps produces correct scoring results (it should -- tested in Phase 1).
**Warning signs:** `config.handicaps` is `{}` when reaching /play; pair results are undefined or missing.

### Pitfall 4: Step Indicator Mismatch Across Pages
**What goes wrong:** The step indicator shows different states depending on which path was taken (direct start vs. configured handicaps), leading to visual inconsistency.
**Why it happens:** The current `STEPS = ["Setup", "Handicap", "Turbo", "Play"]` array and `currentStep` index are hardcoded per page.
**How to avoid:** Either (a) update the step indicator to reflect the new 2-step flow, or (b) remove it from the setup page and only show it when the user explicitly enters the multi-step configuration path. The play page currently doesn't show the step indicator at all (it has its own header), so this only affects setup, handicap, and turbo pages.
**Warning signs:** Step indicator shows "step 1 of 4" but user can go directly from step 1 to play.

### Pitfall 5: Default Names Block "Start Game"
**What goes wrong:** The current setup page requires non-empty names before enabling the "Next" button (`canContinue = players.every(p => p.name.trim().length > 0)`). If this validation remains for "Start Game," users must still type names before starting.
**Why it happens:** The validation was designed for the old linear flow where "Next" meant commitment to the next step.
**How to avoid:** The "Start Game" handler already has fallback logic: `p.name.trim() || 'Player ${i + 1}'`. Apply the same approach to the canContinue validation -- either (a) allow empty names (fallback to "Player 1", "Player 2"), or (b) keep requiring names but make input faster (e.g., placeholder text that auto-fills). Recommendation: keep requiring names for clarity, since entering player names is the one irreducible step. The success criteria counts this as one step.
**Warning signs:** Users frustrated by having to name players when they just want a quick round.

## Code Examples

Verified patterns from the current codebase:

### Current "Start Game" Flow (4 pages, 4 transitions)
```typescript
// Page 1: /setup - handleNext()
const handleNext = () => {
  setPlayers(finalPlayers);
  setNumberOfHoles(numberOfHoles);
  router.push("/handicap");  // FORCES handicap page visit
};

// Page 2: /handicap - useEffect + handleNext()
useEffect(() => { initializeHandicaps(); }, []);  // Init happens HERE
const handleNext = () => { router.push("/turbo"); };

// Page 3: /turbo - handleStart()
const handleStart = () => { router.push("/play"); };

// Total: 3 page transitions, 3 button taps after entering names
```

### Proposed "Start Game" Fast Path (1 page, 1 transition)
```typescript
// Page 1: /setup - handleStartGame()
const handleStartGame = () => {
  const finalPlayers = players.map((p, i) => ({
    ...p,
    name: p.name.trim() || `Player ${i + 1}`,
  }));
  setPlayers(finalPlayers);
  setNumberOfHoles(numberOfHoles);
  initializeHandicaps();  // Init moved HERE (zero handicaps for all pairs)
  // turboHoles already defaults to [] -- no action needed
  router.push("/play");   // Skip handicap and turbo pages entirely
};

// Total: 1 page transition, 1 button tap after entering names
```

### Store Action: initializeHandicaps() Already Handles Defaults
```typescript
// From game-store.ts -- already creates zero-valued entries
initializeHandicaps: () =>
  set((state) => {
    if (!state.config) return {};
    const pairs = generatePairs(state.config.players);
    const handicaps: Record<PairKey, PairHandicap> = {};
    for (const pair of pairs) {
      handicaps[pair.pairKey] = state.config.handicaps[pair.pairKey] ?? {
        pairKey: pair.pairKey,
        playerAId: pair.playerAId,
        playerBId: pair.playerBId,
        value: 0,           // <-- default: no handicap
        handicapHoles: [],   // <-- default: no handicap holes
      };
    }
    return { config: { ...state.config, handicaps } };
  }),
```

### Collapsible Section with CSS Grid Animation
```typescript
// Smooth expand/collapse using grid-template-rows transition
// This is a well-supported pattern (Chrome 70+, Safari 16+, Firefox 66+)
<div
  className="grid transition-[grid-template-rows] duration-300 ease-out"
  style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
>
  <div className="overflow-hidden">
    {/* Section content goes here */}
  </div>
</div>
```

### Button Hierarchy Pattern (Primary + Secondary Actions)
```typescript
// Primary: Start Game (prominent, gradient background)
<button
  className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
  onClick={handleStartGame}
>
  <Rocket className="h-5 w-5" />
  Start Game
</button>

// Secondary: Configure Handicaps / Turbo (subtle, outlined)
<button
  className="w-full h-12 rounded-xl text-sm font-semibold bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:bg-slate-700/80 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
  onClick={() => setShowHandicaps(!showHandicaps)}
>
  <Settings2 className="h-4 w-4" />
  Configure Handicaps
  <ChevronDown className={`h-4 w-4 transition-transform ${showHandicaps ? "rotate-180" : ""}`} />
</button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multi-page wizard with mandatory linear steps | Single-page setup with optional expandable sections | Common pattern since 2020+ | Reduces page transitions, faster for majority use case |
| `max-height` CSS transition for collapse | `grid-template-rows: 0fr/1fr` transition | CSS Grid Animation support, 2022+ | Smoother, no need to hardcode max-height values, works with dynamic content |
| Separate "simple" and "advanced" modes | Single flow with progressive disclosure | UX best practice, always | Avoids mode confusion, keeps all features discoverable |

**Deprecated/outdated:**
- `max-height` hack for collapse animation: Still works but `grid-template-rows` is cleaner and doesn't require knowing content height. Safari 16+ supports it (2022).
- Multi-page mandatory wizards for simple configuration: Modern mobile UX prefers progressive disclosure on a single view rather than forcing navigation through empty steps.

## Open Questions

1. **Inline handicap config vs. sub-page navigation?**
   - What we know: Inline is faster for 2-3 players (1-3 pairs). Sub-page is better for 4-6 players (6-15 pairs) to avoid overwhelming the setup page.
   - What's unclear: Should we implement one approach for all cases, or adapt based on player count?
   - Recommendation: Use inline collapsible sections. For the handicap section, show just the NumberSteppers for each pair (compact). Only expand the hole-selection UI when a non-zero handicap is set. This keeps the section manageable even with 6 players (15 compact rows vs. 15 expanded sections). If the section is too long during implementation, fall back to a sub-page approach.

2. **Should the /handicap and /turbo routes be removed?**
   - What we know: They will no longer be the mandatory path. But they could serve as dedicated config pages for power users.
   - What's unclear: Is it worth maintaining two code paths (inline + standalone pages)?
   - Recommendation: Keep the routes functional but don't actively navigate to them from the default flow. The inline approach on /setup is the primary path. If inline gets too complex, these routes become the fallback. Removing them can be a cleanup task in a future phase.

3. **Step indicator: update or remove?**
   - What we know: The current 4-step indicator (Setup, Handicap, Turbo, Play) no longer reflects the flow when steps are optional.
   - What's unclear: Whether a simplified indicator (Setup -> Play) adds value or is unnecessary UI.
   - Recommendation: Remove the step indicator from the setup page. The setup page is now a single destination, not a step in a multi-page sequence. The play page already has its own header without the step indicator.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/app/setup/page.tsx` -- current setup page (143 lines, 4-step flow, linear navigation)
- Codebase inspection: `src/app/handicap/page.tsx` -- current handicap page (174 lines, pair config with NumberStepper + hole selection)
- Codebase inspection: `src/app/turbo/page.tsx` -- current turbo page (91 lines, hole toggle grid)
- Codebase inspection: `src/lib/game-store.ts` -- `initializeHandicaps()` already creates zero-valued defaults (line 164-181)
- Codebase inspection: `src/lib/types.ts` -- `GameConfig.turboHoles` defaults to `[]`, `GameConfig.handicaps` defaults to `{}`
- Codebase inspection: `src/lib/__tests__/game-store.test.ts` -- 86 passing tests confirm store behavior

### Secondary (MEDIUM confidence)
- CSS `grid-template-rows` animation: [web.dev/css-grid-animation](https://web.dev/articles/css-animated-grid-layouts) -- verified support in Chrome 107+, Safari 16.4+, Firefox 66+
- Progressive disclosure UX pattern: standard UX principle documented in Nielsen Norman Group research

### Tertiary (LOW confidence)
- None -- all findings verified against codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies needed; all libraries verified from package.json
- Architecture: HIGH -- patterns verified against actual codebase; store API confirmed by reading code and tests
- Pitfalls: HIGH -- identified from concrete analysis of current code flow (initializeHandicaps location, canContinue validation, pair count scaling)
- UI patterns: MEDIUM -- CSS grid-template-rows animation is well-supported but not yet used in this codebase; may need Safari testing

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable domain; no fast-moving dependencies)
