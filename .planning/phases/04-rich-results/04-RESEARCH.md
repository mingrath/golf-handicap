# Phase 4: Rich Results - Research

**Researched:** 2026-02-17
**Domain:** SVG charting (line chart), CSS staggered animations, DOM-to-image export, Web Share API
**Confidence:** HIGH

## Summary

Phase 4 transforms the existing results page (`/results`) from a basic rankings list + scorecard into a rich, shareable results experience. The current page at `src/app/results/page.tsx` (301 lines) already shows a winner crown, ranked player list with medal colors, and an editable scorecard table. Phase 4 adds four capabilities: (1) a multi-line score trend chart showing each player's cumulative score across all holes, (2) head-to-head pair breakdowns with win/loss/tie details, (3) a staggered animated podium reveal (3rd -> 2nd -> 1st with celebration), and (4) a shareable results image card via Web Share API with PNG download fallback.

The codebase already has all the data infrastructure needed. The scoring engine (`scoring.ts`) provides `getRunningTotals()` for cumulative scores and `getFinalRankings()` for sorted rankings. The store (`game-store.ts`) holds `pairResults: PairHoleResult[]` with per-hole, per-pair win/loss data including adjusted strokes. The existing `Sparkline` component (`sparkline.tsx`) demonstrates the hand-rolled SVG pattern already established in Phase 2. Chart color CSS variables (`--chart-1` through `--chart-5`) are already defined in `globals.css`. No store changes are required for any of the four requirements.

For the line chart (RSLT-01), use the **shadcn/ui `chart` component** which wraps Recharts with the project's existing design system. This avoids a raw Recharts dependency and leverages the shadcn/ui theming (CSS variables, dark mode) already configured. Recharts v2.15+ supports React 19 via peerDependencies. For the share export (RSLT-04), use **html-to-image** (`toPng`) to capture a styled DOM node, then `navigator.share()` with `navigator.canShare()` for feature detection and a fallback download via `<a>` element. For the podium animation (RSLT-03), use **pure CSS keyframes** with `animation-delay` for staggered reveals -- the project already has custom animation keyframes in `globals.css`. For the celebration effect, use **canvas-confetti** (~6kb gzipped, zero dependencies) fired once when the winner is revealed.

**Primary recommendation:** Use shadcn/ui `chart` (Recharts-based) for the line chart, html-to-image + Web Share API for export, pure CSS staggered animations for the podium, and canvas-confetti for the celebration. Two new dependencies total: `recharts` (via shadcn chart) and `canvas-confetti`. The html-to-image library is the third.

## Standard Stack

### Core (new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 2.15+ | SVG line chart rendering | Installed automatically by `shadcn add chart`; React 19 compatible via peerDependencies; shadcn/ui's blessed charting solution |
| html-to-image | 1.11+ | Capture DOM node as PNG data URL | 572+ npm dependents; uses SVG foreignObject for high-fidelity capture; ~5kb minified; no dependencies |
| canvas-confetti | 1.9+ | Celebration particle effect | Zero dependencies; ~6kb gzipped; performant canvas-based animation; disableForReducedMotion built-in |

### Core (already installed -- no changes)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.3 | UI framework | Already installed; hooks power all new components |
| zustand | 5.0.11 | State management | Already installed; store data drives chart and pair breakdowns -- no new actions needed |
| tailwindcss | 4.x | Styling | Already installed; chart colors via CSS variables, responsive layouts, animation utilities |
| tw-animate-css | 1.4.0 | CSS animations | Already installed; provides base animation utilities for fade/slide/zoom |
| lucide-react | 0.563.0 | Icons | Already installed; Crown, Trophy, Share2, Download, etc. |
| sonner | 2.0.7 | Toast notifications | Already installed; used for share error feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts (via shadcn chart) | Hand-rolled SVG multi-line chart | A full multi-line chart with axes, labels, tooltips, and responsive sizing is ~200-400 lines of hand-rolled SVG code. The existing sparkline pattern works for 5-point trend indicators but does not scale to full chart with axes. Recharts via shadcn chart is the idiomatic choice for this project. |
| Recharts (via shadcn chart) | Visx (by Airbnb) | Visx is lower-level and more flexible but requires significantly more code to build a basic line chart. Recharts via shadcn gives a working chart in ~20 lines of JSX with the project's theme automatically applied. |
| html-to-image | html2canvas | html2canvas is more widely used (2.6M weekly downloads) but has known issues with modern CSS features (backdrop-filter, oklch colors, CSS variables). html-to-image uses SVG foreignObject which handles these better. The project uses oklch colors extensively. |
| html-to-image | modern-screenshot | Fork of html-to-image with some improvements; fewer downloads/community. html-to-image is sufficient for our use case. |
| canvas-confetti | CSS-only confetti | CSS confetti is possible but requires dozens of individual elements with separate animations, is harder to control timing/quantity, and lacks the physics-based motion that makes canvas-confetti feel natural. |
| canvas-confetti | No celebration effect | The requirement (RSLT-03) explicitly calls for a "celebration effect" with the winner reveal. A subtle confetti burst matches this without being excessive. |

**Installation:**
```bash
npx shadcn@latest add chart
npm install html-to-image canvas-confetti
npm install -D @types/canvas-confetti
```

Note: `shadcn add chart` installs `recharts` as a dependency and adds the `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent` components to `src/components/ui/chart.tsx`.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── results/
│       └── page.tsx              # REWRITE: orchestrates sections, manages animation state
├── components/
│   ├── results/                  # NEW directory for results-specific components
│   │   ├── score-trend-chart.tsx # NEW: multi-line Recharts LineChart via shadcn chart
│   │   ├── pair-breakdown.tsx    # NEW: head-to-head section for one pair
│   │   ├── winner-podium.tsx     # NEW: animated podium with staggered reveals
│   │   └── share-results-card.tsx # NEW: styled card for export + share button
│   ├── shared/
│   │   ├── sparkline.tsx         # KEEP (used by mini-leaderboard on play page)
│   │   └── ...existing...
│   └── ui/
│       ├── chart.tsx             # NEW (added by shadcn add chart)
│       └── ...existing shadcn...
└── lib/
    ├── scoring.ts                # NO CHANGES (getRunningTotals, getFinalRankings already sufficient)
    ├── pairs.ts                  # NO CHANGES (generatePairs, getPlayerName already sufficient)
    └── share.ts                  # NEW: share utility (html-to-image capture + Web Share API)
```

### Pattern 1: shadcn/ui Chart with Recharts Composition
**What:** Build the multi-line score trend chart using shadcn/ui's `ChartContainer` wrapper around Recharts `LineChart` components. The chart config object maps player IDs to labels and colors.
**When to use:** Any chart in this project -- shadcn chart is the standard.
**Example:**
```typescript
// Source: shadcn/ui chart docs (ui.shadcn.com/docs/components/radix/chart)
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

// Chart config maps data keys to labels and colors
const chartConfig = {
  player1: { label: "Alice", color: "var(--chart-1)" },
  player2: { label: "Bob", color: "var(--chart-2)" },
};

// Data shape: one object per hole with player scores as keys
// [{ hole: 1, player1: 0, player2: 1 }, { hole: 2, player1: -1, player2: 2 }, ...]

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <LineChart data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="hole" />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    {Object.keys(chartConfig).map((key) => (
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        stroke={`var(--color-${key})`}
        strokeWidth={2}
        dot={false}
      />
    ))}
  </LineChart>
</ChartContainer>
```

### Pattern 2: CSS Staggered Podium Animation
**What:** Podium positions appear sequentially using `animation-delay` on CSS keyframe animations. 3rd place appears first, then 2nd, then 1st with increasing drama.
**When to use:** Any sequential reveal where items should appear one after another.
**Example:**
```css
/* Add to globals.css */
@keyframes podium-rise {
  0% { opacity: 0; transform: translateY(40px) scale(0.9); }
  60% { opacity: 1; transform: translateY(-8px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.podium-enter {
  opacity: 0;
  animation: podium-rise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.podium-3rd { animation-delay: 0.3s; }
.podium-2nd { animation-delay: 0.9s; }
.podium-1st { animation-delay: 1.5s; }
```

```typescript
// In winner-podium.tsx
// The component renders all three positions simultaneously with CSS animation-delay
// controlling the staggered appearance. No JavaScript animation state needed.
// After 1st place finishes animating (~2.1s), fire canvas-confetti.
import confetti from "canvas-confetti";

useEffect(() => {
  const timer = setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      disableForReducedMotion: true,
    });
  }, 2100); // fire after 1st place animation completes
  return () => clearTimeout(timer);
}, []);
```

### Pattern 3: HTML-to-Image Export + Web Share API
**What:** Capture a styled DOM element as a PNG data URL using html-to-image, then share via Web Share API or download as fallback.
**When to use:** When users need to export/share a visual summary from the app.
**Example:**
```typescript
// src/lib/share.ts
import { toPng } from "html-to-image";

export async function captureAndShare(
  element: HTMLElement,
  filename: string = "golf-results.png"
): Promise<void> {
  // 1. Capture DOM node as PNG data URL
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2, // retina quality
    backgroundColor: "#0f172a", // slate-950 background
  });

  // 2. Convert data URL to File object
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: "image/png" });

  // 3. Try Web Share API (requires user gesture -- already in click handler)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Golf Results",
    });
    return;
  }

  // 4. Fallback: trigger download
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
```

### Pattern 4: Deriving Pair Breakdown Data from Store
**What:** Computing head-to-head pair statistics from existing `pairResults` and `playerScores` in the store.
**When to use:** Building the RSLT-02 pair breakdown sections.
**Example:**
```typescript
// Pure derivation -- no new store actions needed
import { generatePairs, getPlayerName } from "@/lib/pairs";
import { PairHoleResult, Player, PlayerHoleScore } from "@/lib/types";

interface PairBreakdownData {
  pairKey: string;
  playerAName: string;
  playerBName: string;
  playerAWins: number;
  playerBWins: number;
  ties: number;
  playerATotal: number;
  playerBTotal: number;
  holeResults: PairHoleResult[];
}

function derivePairBreakdowns(
  players: Player[],
  pairResults: PairHoleResult[]
): PairBreakdownData[] {
  const pairs = generatePairs(players);
  return pairs.map((pair) => {
    const results = pairResults.filter((r) => r.pairKey === pair.pairKey);
    let aWins = 0, bWins = 0, ties = 0, aTotal = 0, bTotal = 0;
    for (const r of results) {
      aTotal += r.playerAScore;
      bTotal += r.playerBScore;
      if (r.playerAScore > r.playerBScore) aWins++;
      else if (r.playerBScore > r.playerAScore) bWins++;
      else ties++;
    }
    return {
      pairKey: pair.pairKey,
      playerAName: getPlayerName(players, pair.playerAId),
      playerBName: getPlayerName(players, pair.playerBId),
      playerAWins: aWins,
      playerBWins: bWins,
      ties,
      playerATotal: aTotal,
      playerBTotal: bTotal,
      holeResults: results,
    };
  });
}
```

### Anti-Patterns to Avoid
- **Adding store actions for derived data:** The pair breakdowns and chart data are pure derivations from existing store state (`pairResults`, `playerScores`, `config.players`). Do NOT add new store actions or computed state. Use `useMemo` in components to derive.
- **Installing Recharts directly instead of via shadcn chart:** The shadcn/ui chart component provides ChartContainer, ChartTooltip, ChartLegend wrappers that match the project's design system and CSS variable theming. Installing raw recharts and building custom wrappers duplicates this work.
- **Using framer-motion/motion for the podium animation:** The staggered podium reveal is achievable with pure CSS `animation-delay` and keyframes. Adding motion (34kb+ bundle) for three elements appearing in sequence is overkill. CSS animations are already the pattern established in this project (see `globals.css` custom keyframes).
- **Capturing the entire page for share export:** The share card should be a dedicated, styled component rendered specifically for export -- NOT the full results page screenshot. This gives control over layout, resolution, and content for the shared image.
- **Showing the podium animation on every visit:** The podium animation should only play on first visit after completing a round (check `isComplete` state transition). If the user navigates back to results, show the final state without animation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-line chart with axes, labels, tooltips | Custom SVG chart (200-400 lines) | shadcn/ui `chart` (Recharts) | Axes calculations, tick formatting, responsive resizing, tooltip positioning, line interpolation are all deceptively complex. The sparkline approach does not scale. |
| DOM-to-PNG capture | Canvas drawing API manually rendering DOM | `html-to-image` (`toPng`) | Font loading, CSS variable resolution, pseudo-element rendering, retina scaling -- html-to-image handles all edge cases |
| Confetti particle physics | CSS-only confetti with individual element animations | `canvas-confetti` | Natural-looking confetti requires gravity, air resistance, spin, and color randomization. Canvas-based approach handles 100+ particles at 60fps without DOM overhead. |
| Web Share API feature detection | Raw `navigator.share` calls | Utility function with `canShare()` check + download fallback | Share API support varies (92% global but no Firefox desktop). Must handle graceful degradation. |
| Running totals computation | Manual accumulation loops | `getRunningTotals()` from `scoring.ts` | Already tested with 86+ passing tests |
| Final rankings with ties | Custom sort + rank logic | `getFinalRankings()` from `scoring.ts` | Already handles tie ranking correctly |
| Pair generation | Manual pair iteration | `generatePairs()` from `pairs.ts` | Already generates all C(n,2) pairs with consistent PairKey |
| Player name lookup | Inline find logic | `getPlayerName()` from `pairs.ts` | Consistent pattern already used in play page |

**Key insight:** Phase 4 introduces exactly three pieces of genuinely new functionality: (1) a charting component, (2) a DOM capture + share pipeline, and (3) staggered CSS animations. Everything else -- data derivation, rankings, pair iteration -- reuses the battle-tested scoring engine from Phase 1. Resist the urge to refactor the scoring layer.

## Common Pitfalls

### Pitfall 1: Chart Data Shape Mismatch with Recharts
**What goes wrong:** Recharts expects data as an array of objects where each object represents one X-axis tick (one hole), with player scores as named properties. Passing the wrong shape produces a blank chart with no error.
**Why it happens:** The store's `playerScores` is structured as `PlayerHoleScore[]` (flat array with playerId + holeNumber + holeScore + runningTotal), not the row-per-hole shape Recharts needs.
**How to avoid:** Transform store data into chart format explicitly:
```typescript
// Transform PlayerHoleScore[] -> { hole: number, [playerId]: number }[]
const chartData = Array.from({ length: numberOfHoles }, (_, i) => {
  const hole = i + 1;
  const entry: Record<string, number> = { hole };
  for (const player of players) {
    const score = playerScores.find(
      (s) => s.playerId === player.id && s.holeNumber === hole
    );
    entry[player.id] = score?.runningTotal ?? 0;
  }
  return entry;
});
```
**Warning signs:** Chart renders but shows no lines, or all lines are flat at zero.

### Pitfall 2: html-to-image Fails with oklch Colors
**What goes wrong:** The captured PNG has wrong colors or transparent areas because html-to-image's SVG foreignObject serialization cannot resolve `oklch()` color functions.
**Why it happens:** oklch is a newer CSS color space. The project's `globals.css` defines all theme colors in oklch. When html-to-image serializes the DOM to SVG, some browsers may not resolve oklch values in the serialized context.
**How to avoid:** For the share card component, use explicit hex/rgb fallback colors via Tailwind's standard color palette (e.g., `bg-slate-950` which resolves to a concrete hex value) rather than CSS variable-based oklch colors. Test on real devices.
**Warning signs:** Captured image has black or transparent regions where themed colors should appear.

### Pitfall 3: Web Share API Not Available on Desktop Browsers
**What goes wrong:** Users on desktop (especially Firefox) cannot share results because Web Share API is unsupported.
**Why it happens:** Web Share API has 92% global support but Firefox desktop (and some older Chrome versions) do not support it. Desktop browsers have no native share sheet.
**How to avoid:** Always provide the PNG download fallback as the primary action label ("Download" or "Save"), with share as a progressive enhancement when `navigator.canShare({ files: [file] })` returns true. The button label should change based on capability detection.
**Warning signs:** Share button throws an error or does nothing on Firefox/older browsers.

### Pitfall 4: Podium Animation Replays on Back Navigation
**What goes wrong:** User navigates away from results and comes back -- the staggered podium animation replays from the beginning, which feels wrong.
**Why it happens:** React re-renders the component, re-triggering CSS animations and the confetti effect.
**How to avoid:** Track whether the animation has already played using a component-local `useRef` (not state, to survive re-renders without triggering them). On subsequent visits, render the podium in its final state (opacity: 1, translateY: 0) immediately. Only animate on the first render after `completeGame()`.
**Warning signs:** Confetti fires every time the user switches tabs or navigates back.

### Pitfall 5: Share Card Content Not Visible During Capture
**What goes wrong:** The share card is rendered off-screen or with `display: none` for capture, but html-to-image produces a blank or zero-height image.
**Why it happens:** html-to-image captures the rendered DOM; if the element has zero dimensions or is not in the document flow, the capture fails.
**How to avoid:** Render the share card in the DOM with `position: fixed; left: -9999px;` (off-screen but still laid out) or render it inline with a visible size. After capture, either remove it or keep it hidden with `opacity: 0; pointer-events: none`. Do NOT use `display: none`.
**Warning signs:** Captured image is blank, 0x0 pixels, or shows only background color.

### Pitfall 6: Chart Colors Indistinguishable for 2 Players
**What goes wrong:** With only 2 players, the chart uses chart-1 and chart-2 colors which may not have enough contrast.
**Why it happens:** The CSS variables `--chart-1` through `--chart-5` are generic theme colors, not specifically chosen for line chart contrast.
**How to avoid:** For 2-player games, override to use emerald (winner) and rose (loser) consistent with the app's score coloring convention. For 3+ players, use the chart-N variables.
**Warning signs:** Users cannot tell which line belongs to which player.

## Code Examples

Verified patterns from official sources:

### Transforming Store Data for Recharts
```typescript
// Source: derived from existing scoring.ts API + Recharts data format
import { Player, PlayerHoleScore } from "@/lib/types";

interface ChartDataPoint {
  hole: number;
  [playerId: string]: number;
}

function buildChartData(
  players: Player[],
  playerScores: PlayerHoleScore[],
  numberOfHoles: number
): ChartDataPoint[] {
  return Array.from({ length: numberOfHoles }, (_, i) => {
    const hole = i + 1;
    const entry: ChartDataPoint = { hole };
    for (const player of players) {
      const score = playerScores.find(
        (s) => s.playerId === player.id && s.holeNumber === hole
      );
      // Use runningTotal for cumulative chart, or 0 if hole not yet played
      entry[player.id] = score?.runningTotal ?? 0;
    }
    return entry;
  });
}
```

### Share Card Component Structure
```typescript
// The share card is a styled, self-contained component with fixed dimensions
// optimized for image capture and social sharing. It does NOT use oklch colors
// to avoid capture issues -- uses Tailwind's standard palette instead.
<div
  ref={shareCardRef}
  className="w-[375px] bg-[#0f172a] p-6 rounded-2xl text-white"
  style={{ fontFamily: "var(--font-geist-sans)" }}
>
  {/* App branding */}
  <div className="text-center mb-4">
    <h2 className="text-xl font-bold">Golf Handicap Scorer</h2>
    <p className="text-sm text-gray-400">{numberOfHoles} holes</p>
  </div>

  {/* Winner spotlight */}
  <div className="text-center py-4">
    <span className="text-3xl font-extrabold">{winner.name}</span>
    <span className="text-emerald-400 text-xl font-bold block mt-1">
      +{winner.score} points
    </span>
  </div>

  {/* Rankings list */}
  <div className="space-y-2">
    {rankings.map((entry, idx) => (
      <div key={entry.player.id} className="flex justify-between">
        <span>{idx + 1}. {entry.player.name}</span>
        <span>{entry.totalScore}</span>
      </div>
    ))}
  </div>
</div>
```

### Canvas Confetti with Reduced Motion Respect
```typescript
// Source: canvas-confetti npm docs (npmjs.com/package/canvas-confetti)
import confetti from "canvas-confetti";

function fireCelebration() {
  // Dual burst for richer effect
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x: 0.3, y: 0.6 },
    disableForReducedMotion: true,
  });
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x: 0.7, y: 0.6 },
    disableForReducedMotion: true,
  });
}
```

### Web Share API with Feature Detection
```typescript
// Source: MDN Navigator.share() + Navigator.canShare()
async function shareImage(file: File): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "Golf Results",
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name !== "AbortError") {
        console.warn("Share failed:", err);
      }
      return false;
    }
  }
  return false; // Not supported, caller should use download fallback
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| html2canvas for DOM capture | html-to-image (SVG foreignObject approach) | 2020+ | html-to-image handles modern CSS (variables, backdrop-filter) better than html2canvas's canvas-based approach |
| dom-to-image | html-to-image (maintained fork) | 2021+ | dom-to-image is unmaintained since 2021. html-to-image is the actively maintained successor with same API. |
| Custom Recharts wrappers | shadcn/ui chart component | 2024 | shadcn/ui provides ChartContainer, ChartTooltip, ChartLegend that auto-theme with CSS variables. No need to build custom wrappers. |
| tailwindcss-animate (JS plugin) | tw-animate-css (pure CSS) | 2024 (TW v4) | Already installed in this project; provides animation-in/fade-in/slide-in utilities compatible with Tailwind v4 |
| react-confetti (DOM-based) | canvas-confetti (Canvas 2D) | Always valid | canvas-confetti renders to a canvas overlay, never creates DOM elements per particle. 100+ particles at 60fps with no DOM overhead. |

**Deprecated/outdated:**
- `dom-to-image`: Unmaintained since 2021. Use `html-to-image` instead (same API, active maintenance).
- `tailwindcss-animate`: JS plugin incompatible with Tailwind v4. Already using `tw-animate-css` in this project.
- Raw Recharts without shadcn wrapper: Works, but misses automatic CSS variable theming and design system consistency.

## Open Questions

1. **Should the podium show only top 3 or all players?**
   - What we know: RSLT-03 says "staggered animated podium (3rd -> 2nd -> 1st with celebration)." This implies top 3.
   - What's unclear: For 2-player games, should we show a podium at all (only winner + runner-up)? For 4+ player games, where do 4th, 5th, 6th place appear?
   - Recommendation: Show podium for top 3 (or top N if fewer than 3 players). Show remaining players in a simple ranked list below the podium. For 2-player games, show winner + runner-up without the podium layout (just winner celebration + head-to-head summary).

2. **Share card: miniature chart or rankings only?**
   - What we know: RSLT-04 says "styled image card." No specification of what content goes in the card.
   - What's unclear: Should the share card include a miniature score trend chart, or just textual rankings + winner?
   - Recommendation: Rankings + winner only (no chart in share card). The chart renders via Recharts which produces SVG DOM nodes that html-to-image may struggle to capture perfectly. A text/box-based card is more reliable for capture and more legible at small sizes on social media.

3. **Animation sequencing: should the chart animate/draw?**
   - What we know: RSLT-01 asks for a "line chart" but does not specify animation.
   - What's unclear: Should the chart lines draw progressively (left to right) or appear fully rendered?
   - Recommendation: Render the chart fully without draw animation. Recharts' default behavior shows the chart immediately, which is fine. Progressive draw animation adds complexity (custom Recharts animation config) for minimal user value. The podium animation is the main dramatic moment.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/app/results/page.tsx` -- current results page (301 lines), existing winner display, rankings, scorecard
- Codebase inspection: `src/lib/scoring.ts` -- `getRunningTotals()`, `getFinalRankings()` APIs confirmed
- Codebase inspection: `src/lib/game-store.ts` -- `pairResults`, `playerScores`, `holeStrokes` store shape confirmed
- Codebase inspection: `src/components/shared/sparkline.tsx` -- established hand-rolled SVG pattern
- Codebase inspection: `src/app/globals.css` -- `--chart-1` through `--chart-5` CSS variables already defined; custom keyframes pattern established
- [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/radix/chart) -- ChartContainer, ChartTooltip, installation via `shadcn add chart`
- [MDN: Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) -- File sharing syntax, requirements (HTTPS, user gesture)
- [MDN: Navigator.canShare()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare) -- Feature detection method
- [Can I Use: Web Share API](https://caniuse.com/web-share) -- 92.48% global support, no Firefox desktop
- Recharts package.json (GitHub) -- peerDependencies confirm React 19 support: `"react": "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"`

### Secondary (MEDIUM confidence)
- [html-to-image npm](https://www.npmjs.com/package/html-to-image) -- v1.11.13, 572+ dependents, SVG foreignObject approach
- [canvas-confetti GitHub](https://github.com/catdad/canvas-confetti) -- v1.9+, zero dependencies, `disableForReducedMotion` option
- [CSS-Tricks: Staggered Animations](https://css-tricks.com/different-approaches-for-creating-a-staggered-animation/) -- `animation-delay` with nth-child/class approach
- [web.dev: Web Share API](https://web.dev/web-share/) -- Implementation guide with feature detection pattern
- [shadcn/ui Line Charts](https://ui.shadcn.com/charts/line) -- Line chart examples (multiple variants available)

### Tertiary (LOW confidence)
- Recharts bundle size (~40kb gzipped based on historical reports; exact v2.15+ size not verified via Bundlephobia during this research session)
- html-to-image behavior with oklch colors -- theoretical concern based on SVG foreignObject serialization limitations; needs real-device testing to validate

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- shadcn/ui chart is the project's blessed charting solution; Recharts v2.15+ confirmed React 19 support; html-to-image and canvas-confetti are well-established
- Architecture: HIGH -- all data derivation verified against actual store shape; component structure follows established project patterns (components/shared/, components/ui/)
- Pitfalls: HIGH for Web Share API and animation replay (well-documented); MEDIUM for oklch capture issue (theoretical, needs validation)
- Code examples: HIGH -- derived from actual codebase types and functions; share pattern from MDN official docs

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable domain; Recharts and html-to-image are mature libraries)
