# Phase 2: Score Input & Live Play - Research

**Researched:** 2026-02-17
**Domain:** Mobile-first touch input UX, swipe gesture navigation, inline sparkline rendering, haptic feedback (Vibration API)
**Confidence:** HIGH

## Summary

Phase 2 transforms the existing play screen (`/play`) from a +/- stepper input pattern into a fast, single-tap score entry system optimized for outdoor, one-handed, on-course use. The current play page is ~540 lines with a working but slow `NumberStepper` component that requires multiple taps to reach common stroke values. The redesign replaces this with a preset number row (3-7 visible, +/- for outliers), adds auto-advance with visual confirmation on hole submission, introduces an always-visible mini-leaderboard with per-player sparklines, and enables swipe-based hole navigation.

The codebase is small and well-structured. The Zustand store already has `submitHoleStrokes`, `goToHole`, `goToNextHole`, and `goToPreviousHole` actions that Phase 2 can wire directly to new UI components. The scoring engine (`scoring.ts`) already computes running totals via `getRunningTotals()` and final rankings via `getFinalRankings()` -- the mini-leaderboard just needs to call these existing functions. No store changes are required for this phase; all work is UI/component-level.

The key technical decisions are: (1) use a custom `useSwipe` hook based on native touch events rather than adding a library dependency -- the swipe detection needed is trivial (left/right with threshold), (2) hand-roll sparklines as a ~30-line SVG `<polyline>` component rather than pulling in a charting library -- the data is always exactly 5 numbers, (3) use `navigator.vibrate()` with a no-op fallback since iOS Safari does not support it (progressive enhancement as specified in INPT-04), and (4) leverage the existing `tw-animate-css` package for the auto-advance confirmation flash animation.

**Primary recommendation:** Split into two plans as outlined in the roadmap -- Plan 02-01 handles the stroke input redesign, haptic feedback, and auto-advance flow; Plan 02-02 handles the always-visible mini-leaderboard with sparklines and swipe hole navigation.

## Standard Stack

### Core (already installed -- no new dependencies needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.3 | UI framework | Already installed; hooks (useState, useRef, useCallback, useEffect) power all new components |
| zustand | 5.0.11 | State management | Already installed; store actions (`submitHoleStrokes`, `goToHole`, `goToNextHole`) are ready to wire |
| tailwindcss | 4.x | Styling | Already installed; mobile-first utility classes, `active:scale-*` for tap feedback |
| tw-animate-css | 1.4.0 | CSS animations | Already installed; provides `animate-in`, `fade-in`, `slide-in-from-bottom` for confirmation flash |
| lucide-react | 0.563.0 | Icons | Already installed; `ChevronLeft`, `ChevronRight`, `Check`, `Trophy`, `Zap` already imported in play page |
| sonner | 2.0.7 | Toast notifications | Already installed; used for validation warnings from store |

### Supporting (no install needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native Touch Events API | Browser built-in | Swipe detection | `touchstart`/`touchend` event listeners for left/right hole navigation |
| Navigator Vibration API | Browser built-in | Haptic feedback | `navigator.vibrate(50)` on score submission; no-op on unsupported browsers |
| SVG `<polyline>` | Browser built-in | Sparkline rendering | Inline SVG element for 5-point score trend visualization |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `useSwipe` hook | react-swipeable (7.0.2, ~478K weekly downloads) | react-swipeable adds ~3.9kb gzipped for a full-featured swipe handler. Our use case is trivial -- detect left/right swipe with velocity threshold on a single container. A custom hook is ~30 lines and zero bundle impact. |
| Custom `useSwipe` hook | motion (framer-motion) drag gestures | motion's `domMax` feature package adds +25kb for drag/pan support. Massive overkill for simple left/right swipe detection. Consider motion in Phase 4 (rich results animations) instead. |
| Hand-rolled SVG sparkline | react-sparklines / react-sparkline-svg | These libraries solve general sparkline rendering with configurable dimensions, colors, fill, etc. Our sparkline is always exactly 5 data points, fixed 60x20px, single color. A ~30-line component using `<polyline>` is simpler and zero-dependency. |
| Hand-rolled SVG sparkline | Recharts / Chart.js | Heavyweight charting libraries (30-60kb+). Appropriate for Phase 4 (score trend chart across all holes) but absurd for a 5-point inline sparkline. |

**Installation:**
```bash
# No installation needed -- all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── play/
│       └── page.tsx           # Redesigned: fast input + mini-leaderboard + swipe nav
├── components/
│   ├── shared/
│   │   ├── number-stepper.tsx # KEEP (still used by handicap/turbo setup pages)
│   │   ├── stroke-input.tsx   # NEW: single-tap preset number row for one player
│   │   ├── mini-leaderboard.tsx # NEW: ranked player list with sparklines
│   │   ├── sparkline.tsx      # NEW: inline SVG sparkline component
│   │   └── ...existing...
│   └── ui/
│       └── ...existing shadcn...
├── hooks/
│   └── use-swipe.ts           # NEW: custom swipe detection hook
└── lib/
    └── ...existing (no changes)...
```

### Pattern 1: Preset Number Row (Single-Tap Stroke Input)
**What:** A horizontal row of large, tappable number buttons (3, 4, 5, 6, 7) replacing the +/- stepper for stroke entry. The "3" and "7" buttons also serve as decrement/increment for outlier values (< 3 or > 7).
**When to use:** When the input domain has a known common range and speed matters more than precision.
**Example:**
```typescript
// StrokeInput component concept
// Preset range: 3-7 (covers ~95% of golf hole strokes)
// Left arrow button decrements below 3, right arrow increments above 7
// Active number is visually highlighted (emerald bg)
// Minimum tap target: 48x48px (WCAG 2.5.5 AAA)

interface StrokeInputProps {
  playerName: string;
  value: number;
  onChange: (value: number) => void;
}

// Renders: [player name]  [-] [3] [4] [5] [6] [7] [+]
// The selected number gets prominent styling
// Tapping a number sets the value immediately (single tap)
// [-] and [+] handle outlier values (1, 2, 8, 9, etc.)
```

### Pattern 2: Custom useSwipe Hook
**What:** A lightweight React hook that detects horizontal swipe gestures using native touch events.
**When to use:** When you need simple directional swipe detection without drag animations or complex gesture recognition.
**Example:**
```typescript
// Source: common pattern from multiple React gesture tutorials
import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 50 // minimum px to count as swipe
): SwipeHandlers {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - startX.current;
    const deltaY = e.changedTouches[0].clientY - startY.current;

    // Only trigger if horizontal movement exceeds vertical (not a scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) onSwipeRight();
      else onSwipeLeft();
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchEnd };
}
```

### Pattern 3: Inline SVG Sparkline
**What:** A minimal SVG component that renders a polyline through normalized data points.
**When to use:** When displaying a small trend indicator (5-10 data points) where a full charting library is overkill.
**Example:**
```typescript
// Source: adapted from rousek.name/articles/svg-sparklines-with-no-dependencies
interface SparklineProps {
  data: number[];  // e.g., [0, -1, 1, 0, 2] (last 5 cumulative scores)
  width?: number;
  height?: number;
  color?: string;
}

function Sparkline({ data, width = 60, height = 20, color = "#34d399" }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // avoid division by zero

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2; // 2px padding
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

### Pattern 4: Progressive Enhancement Haptic Feedback
**What:** Wrapping `navigator.vibrate()` in a safe utility that no-ops on unsupported browsers.
**When to use:** Any time you want tactile feedback on interaction without blocking the action.
**Example:**
```typescript
// Source: MDN Web Docs - Navigator.vibrate()
export function vibrate(pattern: number | number[] = 50): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail -- progressive enhancement
    }
  }
}
```

### Anti-Patterns to Avoid
- **Over-engineering swipe detection:** Do NOT pull in motion/framer-motion (25kb+ for drag features) or react-swipeable (3.9kb) for simple left/right swipe detection. The custom hook is 20 lines.
- **Charting library for 5 data points:** Do NOT install recharts, chart.js, or even react-sparklines for a tiny inline trend indicator. A `<polyline>` SVG is faster to render and zero bundle cost.
- **Blocking on vibration support:** Do NOT conditionally render UI or change flow based on `navigator.vibrate` availability. The vibration is purely progressive enhancement -- fire-and-forget.
- **Rewriting the store for Phase 2:** The Zustand store already has all needed actions (`submitHoleStrokes`, `goToHole`, `goToNextHole`). Do NOT add new store actions for auto-advance; handle the advance timing in the component with `setTimeout` + store's `goToNextHole`.
- **Separate leaderboard page/route:** The mini-leaderboard must be always visible below the input area on the same screen, not a toggle or separate view. The current "Board" toggle button approach should be replaced.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Score validation | Custom validation logic | Existing store validation in `submitHoleStrokes` | Store already validates strokes 0-20, hole number bounds, and runs zero-sum check (Phase 1 work) |
| Running totals computation | Manual accumulation | `getRunningTotals()` from `scoring.ts` | Already tested with 86 passing tests; handles all edge cases |
| Player ranking/sorting | Custom sort logic | `getFinalRankings()` from `scoring.ts` | Already handles ties, returns sorted array with rank numbers |
| Pair generation | Manual pair logic | `generatePairs()` from `pairs.ts` | Already generates all C(n,2) pairs with consistent PairKey sorting |
| Toast notifications | Custom notification system | `sonner` via `toast()` | Already wired in layout.tsx, used by store for validation warnings |
| CSS animations | JavaScript animation timers | `tw-animate-css` utility classes | Already installed; provides `animate-in`, `fade-in`, `slide-in-from-*` |

**Key insight:** Phase 2 is primarily a UI/component redesign. The entire scoring engine and state management layer from Phase 1 is ready to use. The temptation to "improve" the store while building new UI should be resisted -- store changes belong in future phases.

## Common Pitfalls

### Pitfall 1: Tap Targets Too Small for Outdoor Use
**What goes wrong:** Number buttons are sized for indoor/desk use (e.g., 32x32px) and become impossible to tap accurately in bright sunlight while walking.
**Why it happens:** Developers test on desktop with mouse clicks, not on phones in direct sunlight.
**How to avoid:** Enforce minimum 48x48px touch targets (WCAG 2.5.5 Target Size AAA). The preset number row buttons should be at least 48px tall with generous horizontal padding. Test on a real phone outdoors.
**Warning signs:** Any button/tap target under 44px in the stroke input area.

### Pitfall 2: Auto-Advance Without Confirmation Causes Confusion
**What goes wrong:** User submits strokes and the screen immediately jumps to the next hole with no feedback, leaving them unsure if their scores were saved.
**Why it happens:** The advance happens too fast, or the confirmation is too subtle.
**How to avoid:** Show a brief (800-1200ms) confirmation overlay/flash (green checkmark + "Hole X saved") before advancing. Use the existing `animate-fade-up` CSS class. The confirmation must be clearly visible even in bright sunlight (high contrast green on dark bg).
**Warning signs:** Users repeatedly going back to the previous hole to check if scores were saved.

### Pitfall 3: Swipe Gesture Conflicts with Browser Scroll
**What goes wrong:** Horizontal swipe to change holes also triggers vertical scroll, or vertical scroll also triggers hole changes.
**Why it happens:** Not checking the angle of the swipe gesture.
**How to avoid:** In the `useSwipe` hook, only trigger the swipe callback when `Math.abs(deltaX) > Math.abs(deltaY)` AND `Math.abs(deltaX) > threshold`. This ensures a clearly horizontal gesture.
**Warning signs:** Accidentally changing holes while scrolling down the page.

### Pitfall 4: Sparkline Renders Flat Line When All Scores Are Equal
**What goes wrong:** When all 5 cumulative scores are 0 (early in the game), the sparkline renders as a flat line at the top or bottom of the SVG, or crashes on division by zero.
**Why it happens:** `max - min === 0` causes division by zero in normalization.
**How to avoid:** Guard with `const range = max - min || 1` and center the flat line in the middle of the SVG height. Alternatively, don't render the sparkline until at least 2 holes have been scored (show a placeholder instead).
**Warning signs:** Sparkline disappearing or rendering at SVG boundary.

### Pitfall 5: Leaderboard Re-Sorting Animation Jank
**What goes wrong:** When players swap positions in the leaderboard after a hole, the UI "jumps" without animation, making it hard to track who moved where.
**Why it happens:** React re-renders list items in place based on key, so position changes appear instant.
**How to avoid:** Use player ID as the React key (already likely). For Phase 2, accept the instant reorder -- animated reordering is a Phase 7 polish item. The leaderboard is small (2-6 rows) so the jump is manageable.
**Warning signs:** N/A -- this is acceptable in Phase 2.

### Pitfall 6: Navigator.vibrate() Throws on iOS
**What goes wrong:** Calling `navigator.vibrate()` on iOS Safari doesn't just no-op, it could throw in some edge cases (older iOS versions, restricted contexts).
**Why it happens:** iOS Safari has never implemented the Vibration API. The property may not exist or may behave unpredictably.
**How to avoid:** Always check `"vibrate" in navigator` before calling, and wrap in try/catch. The utility function in the Architecture Patterns section handles this correctly.
**Warning signs:** Uncaught errors in console on iOS devices.

## Code Examples

Verified patterns from official sources:

### Auto-Advance Flow (Component Logic)
```typescript
// After submitting strokes for the current hole:
const handleSubmitAndAdvance = useCallback(() => {
  if (!config) return;

  // 1. Submit strokes to store
  const holeData: HoleStrokes = {
    holeNumber: currentHole,
    strokes: { ...localStrokes },
  };
  submitHoleStrokes(holeData);

  // 2. Haptic feedback (progressive enhancement)
  vibrate(50);

  // 3. Show confirmation flash
  setShowConfirmation(true);

  // 4. Auto-advance after brief delay
  setTimeout(() => {
    setShowConfirmation(false);
    if (currentHole < config.numberOfHoles) {
      goToNextHole();
    }
  }, 1000); // 1 second delay for confirmation visibility
}, [config, currentHole, localStrokes, submitHoleStrokes, goToNextHole]);
```

### Mini-Leaderboard Data Derivation
```typescript
// Derive leaderboard data from existing store state
// No new store actions needed -- pure computation from existing data
const leaderboardData = useMemo(() => {
  if (!config) return [];

  const totals = getRunningTotals(playerScores, currentHole);
  const lastNHoles = 5; // sparkline window

  return config.players
    .map((player) => {
      // Get cumulative scores for last N holes for sparkline
      const sparklineData: number[] = [];
      let cumulative = 0;
      const startHole = Math.max(1, currentHole - lastNHoles + 1);
      for (let h = startHole; h <= currentHole; h++) {
        const score = playerScores.find(
          (s) => s.playerId === player.id && s.holeNumber === h
        );
        cumulative += score?.holeScore ?? 0;
        sparklineData.push(cumulative);
      }

      return {
        player,
        total: totals[player.id] ?? 0,
        sparklineData,
      };
    })
    .sort((a, b) => b.total - a.total); // rank by total descending
}, [config, playerScores, currentHole]);
```

### Confirmation Flash Overlay
```typescript
// Confirmation flash that appears briefly after submitting scores
{showConfirmation && (
  <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
    <div className="animate-in fade-in zoom-in duration-200 bg-emerald-500/20 backdrop-blur-sm rounded-3xl px-8 py-6 flex flex-col items-center gap-2">
      <Check className="h-10 w-10 text-emerald-400" />
      <span className="text-lg font-bold text-emerald-400">
        Hole {currentHole} saved
      </span>
    </div>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| framer-motion package | motion package (motion.dev) | 2024 | Same API, rebranded. Still 34kb min for full features, 4.6kb with LazyMotion. Not needed for our simple swipe. |
| react-swipeable-views | CSS scroll-snap or react-swipeable | 2023+ | react-swipeable-views is unmaintained and incompatible with React 18+. For simple swipe detection, custom hooks or react-swipeable are preferred. |
| Chart.js/Recharts for sparklines | Inline SVG polyline | Always valid | For <10 data points, hand-rolled SVG is always more appropriate than a charting library. |
| tailwindcss-animate plugin (JS) | tw-animate-css (pure CSS) | 2024 (Tailwind v4) | tw-animate-css is the Tailwind v4-compatible replacement. Already installed in this project. |

**Deprecated/outdated:**
- `react-swipeable-views`: Unmaintained since 2021, incompatible with React 18+. Do not use.
- `tailwindcss-animate`: JavaScript plugin, incompatible with Tailwind v4's CSS-first approach. Use `tw-animate-css` instead (already installed).

## Open Questions

1. **Should auto-advance skip already-scored holes?**
   - What we know: The current play page allows navigating back to re-score holes. Auto-advance after submission should go to the next sequential hole.
   - What's unclear: If the user re-scores hole 5, should auto-advance go to hole 6 (next sequential) or hole 8 (next unscored)?
   - Recommendation: Go to next sequential hole (currentHole + 1). Simpler to implement, matches user mental model. If they want to jump to an unscored hole, they can swipe or tap the hole navigator.

2. **Sparkline: cumulative score or per-hole score?**
   - What we know: LIVE-02 says "cumulative score trend" for the sparkline.
   - What's unclear: Should the sparkline show the running total at each of the last 5 holes (e.g., [0, -1, -2, -1, 0]) or the per-hole delta (e.g., [0, -1, -1, +1, +1])?
   - Recommendation: Use cumulative (running total at each hole). This shows the trend direction more clearly -- an upward slope means the player is gaining, downward means losing. This matches the requirement text "cumulative score trend."

3. **Last hole behavior: auto-advance to results or show "Finish Game"?**
   - What we know: Current play page shows a "Finish Game" button on the last hole. INPT-02 says "auto-advances to the next hole."
   - What's unclear: On the last hole, there is no "next hole" -- should it auto-navigate to results?
   - Recommendation: On the last hole, show the confirmation flash but do NOT auto-navigate to results. Instead, show a prominent "View Results" CTA. Accidentally triggering the end of a round would be frustrating and there's no undo.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/lib/game-store.ts`, `src/lib/scoring.ts`, `src/lib/pairs.ts`, `src/lib/types.ts` -- store actions, scoring functions, type definitions
- Codebase inspection: `src/app/play/page.tsx` -- current play page implementation (540 lines, identifies what to replace)
- Codebase inspection: `src/components/shared/number-stepper.tsx` -- current input component (to be replaced on play page, kept for setup pages)
- Codebase inspection: `package.json` -- confirms all needed dependencies already installed
- [MDN: Navigator.vibrate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) -- API reference, browser support
- [Can I Use: Vibration API](https://caniuse.com/vibration) -- 80.84% global support, NOT supported in any Safari version
- SVG sparkline approach: [rousek.name/articles/svg-sparklines-with-no-dependencies](https://rousek.name/articles/svg-sparklines-with-no-dependencies) -- verified polyline technique

### Secondary (MEDIUM confidence)
- [motion.dev/docs/react-gestures](https://motion.dev/docs/react-gestures) -- Motion gesture API, bundle size (34kb full, 4.6kb LazyMotion, +25kb for domMax/drag)
- [motion.dev/docs/react-reduce-bundle-size](https://motion.dev/docs/react-reduce-bundle-size) -- LazyMotion feature packages
- [github.com/FormidableLabs/react-swipeable](https://github.com/FormidableLabs/react-swipeable) -- v7.0.2, ~478K weekly downloads, ~3.9kb gzipped
- [github.com/Wombosvideo/tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) -- tw-animate-css animation utilities (already installed)
- [alexplescan.com/posts/2023/07/08/easy-svg-sparklines/](https://alexplescan.com/posts/2023/07/08/easy-svg-sparklines/) -- SVG sparkline fundamentals

### Tertiary (LOW confidence)
- Golf scorecard UX best practices: [lightspeedhq.com/blog/golf-scorecard-design-best-practices/](https://www.lightspeedhq.com/blog/golf-scorecard-design-best-practices/) -- general UX principles (not React-specific)
- [doodleblue.com/success-stories/golf/](https://www.doodleblue.com/success-stories/golf/) -- golf app UI/UX case study (one-handed use emphasis)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies needed; all libraries already installed and verified in Phase 1
- Architecture: HIGH -- patterns verified against codebase; store API confirmed by reading actual code and 86 passing tests
- Pitfalls: HIGH -- touch target sizes from WCAG spec, vibration API limitations from MDN/CanIUse, swipe conflict avoidance from standard gesture handling patterns
- Sparkline approach: HIGH -- verified from multiple independent sources; simple SVG polyline is well-documented
- Swipe approach: MEDIUM -- custom hook pattern is well-established but not tested in this specific codebase yet; threshold tuning may need iteration

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable domain; no fast-moving dependencies)
