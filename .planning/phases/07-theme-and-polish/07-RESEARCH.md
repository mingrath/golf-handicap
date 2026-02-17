# Phase 7: Theme & Polish - Research

**Researched:** 2026-02-17
**Domain:** CSS theming (dark/light mode), undo state management
**Confidence:** HIGH

## Summary

This phase has two independent requirements: (1) dark/light theme support with system preference detection and manual toggle, and (2) an undo button for the last score submission with a 10-second timeout.

For theming, the project is well-positioned: `next-themes` v0.4.6 is already installed but unused, Tailwind CSS v4's `@custom-variant dark` is already declared in `globals.css`, and shadcn/ui components already contain `dark:` variant classes. The main work is adding a light theme color palette to CSS, wrapping the app in `ThemeProvider`, fixing the `@custom-variant` selector, converting ~215 hardcoded `slate-*` / `text-white` color references across 21 files to semantic CSS variables or `dark:` variants, and adding a theme toggle UI.

For undo, the simplest approach is a "snapshot + restore" pattern in the Zustand store. Before applying a hole submission, snapshot the relevant arrays (`holeStrokes`, `pairResults`, `playerScores`, `currentHole`). Show a floating undo button for 10 seconds. If tapped, restore the snapshot. No external library needed.

**Primary recommendation:** Use `next-themes` ThemeProvider with `attribute="class"` for system detection + manual toggle, define light/dark CSS variable palettes in `globals.css`, and migrate hardcoded colors to semantic tokens. Implement undo as a Zustand store action with in-memory snapshot (no third-party undo library needed).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-themes | 0.4.6 | Theme provider, system detection, persistence | Already installed; de-facto standard for Next.js theming; handles FOUC prevention, localStorage, system preference media query |
| tailwindcss | 4.x | Dark mode via `@custom-variant dark` + `dark:` utilities | Already configured; v4 uses CSS-native `@custom-variant` instead of config file |
| sonner | 2.0.7 | Toast with action button for undo | Already installed; supports `action` prop with label + onClick callback |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | 5.0.11 | Undo snapshot state management | Already the app's state manager; store snapshot/restore for undo |
| lucide-react | 0.563.0 | Sun/Moon/Monitor icons for theme toggle | Already installed; provides theme toggle icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual undo snapshot | zundo (undo middleware for zustand) | zundo adds full undo/redo history (~700B gzipped); overkill for single-action undo with timeout |
| Sonner toast for undo | Custom floating button | Sonner toast positions are configurable but the undo needs to co-exist with the play page's confirmation flash; a dedicated floating button is simpler and more visible on the play page |
| next-themes | Manual `prefers-color-scheme` + localStorage | next-themes handles FOUC prevention, SSR hydration, and edge cases; no reason to hand-roll |

**Installation:**
```bash
# No new packages needed -- all dependencies are already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── layout.tsx          # Wrap with ThemeProvider
├── components/
│   └── shared/
│       ├── theme-toggle.tsx # New: theme toggle button
│       └── undo-banner.tsx  # New: undo floating button
├── app/
│   └── globals.css         # Light + dark CSS variable palettes
└── lib/
    └── game-store.ts       # Add undoLastSubmission action + snapshot
```

### Pattern 1: ThemeProvider in Layout (next-themes + App Router)
**What:** Wrap children in ThemeProvider at the layout level with `attribute="class"` so Tailwind's `.dark` class strategy works.
**When to use:** Always -- this is the required setup.
**Example:**
```tsx
// src/app/layout.tsx
// Source: https://github.com/pacocoursey/next-themes#with-app
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Key details:
- `suppressHydrationWarning` on `<html>` prevents React warnings from next-themes' injected script
- `attribute="class"` makes next-themes toggle `.dark` class on `<html>`, matching Tailwind v4's `@custom-variant dark`
- `defaultTheme="system"` auto-detects OS preference on first load
- `disableTransitionOnChange` prevents awkward color transition flash during toggle
- `enableSystem` enables the three-way toggle: light / dark / system

### Pattern 2: CSS Variable Palette (Light/Dark)
**What:** Define semantic CSS variables for both themes using `:root` (light) and `.dark` (dark).
**When to use:** This replaces the current dark-only `:root` variables.
**Example:**
```css
/* Source: shadcn/ui theming pattern + Tailwind v4 docs */
:root {
  --radius: 0.75rem;
  --background: oklch(0.98 0.005 260);
  --foreground: oklch(0.13 0.015 260);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.13 0.015 260);
  /* ... light palette ... */
}

.dark {
  --background: oklch(0.13 0.015 260);
  --foreground: oklch(0.97 0 0);
  --card: oklch(0.18 0.015 260);
  --card-foreground: oklch(0.97 0 0);
  /* ... dark palette (current values) ... */
}
```

### Pattern 3: Theme Toggle Component
**What:** Client component using `useTheme()` with mounted guard to prevent hydration mismatch.
**When to use:** Rendered in the home page or a persistent header/settings area.
**Example:**
```tsx
// Source: https://github.com/pacocoursey/next-themes#usetheme
"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}
```

### Pattern 4: Undo via Zustand Snapshot
**What:** Before `submitHoleStrokes`, snapshot the current state arrays. Expose `undoLastSubmission()` action that restores the snapshot. Clear snapshot after 10 seconds.
**When to use:** On the play page after each score submission.
**Example:**
```typescript
// Conceptual -- in game-store.ts
interface GameStore extends GameState {
  // ... existing actions
  undoLastSubmission: () => void;
  _undoSnapshot: Pick<GameState, "holeStrokes" | "pairResults" | "playerScores" | "currentHole"> | null;
  _undoTimer: ReturnType<typeof setTimeout> | null;
}

submitHoleStrokes: (strokes) => set((state) => {
  // Snapshot BEFORE mutation
  const snapshot = {
    holeStrokes: state.holeStrokes,
    pairResults: state.pairResults,
    playerScores: state.playerScores,
    currentHole: state.currentHole,
  };
  // ... existing calculation logic ...
  return {
    ...calculatedResults,
    _undoSnapshot: snapshot,
  };
}),

undoLastSubmission: () => set((state) => {
  if (!state._undoSnapshot) return {};
  const restored = { ...state._undoSnapshot };
  return { ...restored, _undoSnapshot: null };
}),
```

### Pattern 5: Sonner Theme Integration
**What:** The Sonner `<Toaster>` component accepts a `theme` prop. Instead of hardcoding `"dark"`, pass the resolved theme from next-themes.
**When to use:** In layout.tsx where Toaster is rendered.
**Example:**
```tsx
// Source: https://sonner.emilkowal.ski/toast
"use client";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return <Sonner theme={resolvedTheme === "dark" ? "dark" : "light"} />;
}
```

### Anti-Patterns to Avoid
- **Hardcoded dark colors in JSX:** `bg-slate-950`, `text-white`, `bg-slate-800` etc. should be replaced with semantic tokens (`bg-background`, `text-foreground`, `bg-card`). Direct color references that differ between themes need `dark:` variants or CSS variable mappings.
- **Storing undo state in localStorage/Zustand persist:** The undo snapshot is ephemeral (10 seconds max). It MUST NOT be persisted to localStorage. Use a separate non-persisted field or `partialize` to exclude it.
- **Using `&:is(.dark *)` selector:** Current `globals.css` uses `&:is(.dark *)` which misses styling the `.dark` element itself. Must be `&:where(.dark, .dark *)` per Tailwind v4 docs.
- **Theme toggle without mounted guard:** `useTheme()` returns `undefined` during SSR. Rendering theme-dependent UI without `useEffect(() => setMounted(true), [])` guard causes hydration mismatches.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| System theme detection | Manual `matchMedia` listener + localStorage | next-themes `enableSystem` | Handles edge cases: system changes mid-session, localStorage fallback, SSR |
| FOUC prevention | Inline `<script>` to set class before paint | next-themes injected script | Already battle-tested; handles all SSR frameworks |
| Undo/redo history | Full temporal undo middleware | Simple snapshot in Zustand | Only need single-level undo with 10s timeout; full history is overkill |
| Toast theming | Custom styled toasts | Sonner `theme` prop + next-themes `resolvedTheme` | Sonner natively supports light/dark themes |

**Key insight:** `next-themes` already solves the hard problems (FOUC, hydration, system detection, persistence). The project already has it installed. The work is CSS + wiring, not library selection.

## Common Pitfalls

### Pitfall 1: Hardcoded Colors Everywhere (~215 occurrences)
**What goes wrong:** The app currently has ~215 hardcoded `slate-*` / `text-white` color references across 21 source files. Simply adding a light theme to CSS won't work because components bypass CSS variables.
**Why it happens:** The app was designed as dark-only, so colors were hardcoded directly.
**How to avoid:** Systematically audit and convert colors. Prioritize: (1) page backgrounds (`bg-slate-950`), (2) card backgrounds, (3) text colors, (4) border colors, (5) component-specific colors.
**Warning signs:** If light mode looks correct on the home page but broken on play/results pages, colors are still hardcoded in those components.

### Pitfall 2: glass-card and Custom Utilities Won't Auto-Theme
**What goes wrong:** The `.glass-card` utility in `globals.css` uses hardcoded `rgba(30, 41, 59, 0.7)` which is dark-only. Same for `.text-gradient`, `.score-positive`, `.score-negative`, `.score-neutral`.
**Why it happens:** Custom CSS classes bypass Tailwind's `dark:` variant system.
**How to avoid:** Redefine these utilities with CSS variables or provide `.dark .glass-card` overrides.
**Warning signs:** Glass cards appear as dark rectangles on light backgrounds.

### Pitfall 3: @custom-variant Selector Bug
**What goes wrong:** Current selector `&:is(.dark *)` doesn't match the `.dark` element itself, only its descendants. The `<body>` with `bg-background` won't get dark variables applied if the class is on `<html>`.
**Why it happens:** `&:is(.dark *)` means "an element that is a descendant of .dark". The `<html>` element with `.dark` class isn't its own descendant.
**How to avoid:** Use `&:where(.dark, .dark *)` as recommended by Tailwind v4 docs.
**Warning signs:** `dark:` utilities on the `<html>` or `<body>` element don't apply.

### Pitfall 4: Share Card Uses Inline Styles (Won't Theme)
**What goes wrong:** `share-results-card.tsx` renders an off-screen div with inline `style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}` for html-to-image capture. These inline styles will never respond to theme changes.
**Why it happens:** Prior decision [04-02] explicitly chose inline styles with hex colors for reliable html-to-image capture.
**How to avoid:** Keep the share card dark-only (it's an image export, not interactive UI). Document this as intentional.
**Warning signs:** None -- this is the correct approach. The captured image should be consistent regardless of user theme.

### Pitfall 5: Undo Snapshot Persisted to localStorage
**What goes wrong:** If the undo snapshot is included in Zustand's `persist` middleware, it gets saved to localStorage. On next app load, there's a stale undo snapshot.
**Why it happens:** Zustand persist serializes the entire store by default.
**How to avoid:** Use `partialize` in the persist config to exclude `_undoSnapshot` and `_undoTimer` fields.
**Warning signs:** After closing and reopening the app, an undo button appears for a long-gone submission.

### Pitfall 6: PWA meta theme-color Hardcoded
**What goes wrong:** `layout.tsx` has `themeColor: "#0f172a"` (dark blue) and `manifest.json` has `theme_color: "#15803d"` (green). These don't change with theme.
**Why it happens:** PWA theme-color is set at build time in static metadata.
**How to avoid:** For the `<meta name="theme-color">` tag, next-themes can't change it dynamically (it's in `<head>`). However, Next.js metadata API supports an array format for theme-color with media queries: `themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0f172a" }, { media: "(prefers-color-scheme: light)", color: "#ffffff" }]`.
**Warning signs:** The browser chrome (address bar) stays dark-colored even in light mode.

### Pitfall 7: Confirmation Flash Overlay Hardcoded Colors
**What goes wrong:** The play page's confirmation flash (`showConfirmation`) uses `bg-emerald-500/20 backdrop-blur-sm` with `text-emerald-400`. These are theme-agnostic (emerald works on both themes), but the backdrop blur may look different on light backgrounds.
**Why it happens:** Prior decision [02-01] designed the flash for outdoor sunlight visibility.
**How to avoid:** Test the confirmation flash on both themes. Emerald-on-transparent should work fine on both. May need slight opacity adjustment for light mode.
**Warning signs:** Flash is invisible or too subtle in light mode.

## Code Examples

Verified patterns from official sources:

### Fixing @custom-variant (Tailwind v4)
```css
/* Source: https://tailwindcss.com/docs/dark-mode */
/* BEFORE (current - buggy): */
@custom-variant dark (&:is(.dark *));

/* AFTER (correct): */
@custom-variant dark (&:where(.dark, .dark *));
```

### Light Theme CSS Variables (shadcn/ui neutral base)
```css
/* Source: shadcn/ui theming with oklch */
:root {
  --radius: 0.75rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0.015 260);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0.015 260);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0.015 260);
  --primary: oklch(0.55 0.19 163);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.96 0.005 260);
  --secondary-foreground: oklch(0.24 0.015 260);
  --muted: oklch(0.96 0.005 260);
  --muted-foreground: oklch(0.55 0.01 260);
  --accent: oklch(0.96 0.005 260);
  --accent-foreground: oklch(0.24 0.015 260);
  --destructive: oklch(0.55 0.22 25);
  --border: oklch(0.9 0.005 260);
  --input: oklch(0.9 0.005 260);
  --ring: oklch(0.55 0.19 163);
  --chart-1: oklch(0.55 0.19 163);
  --chart-2: oklch(0.6 0.15 85);
  --chart-3: oklch(0.55 0.22 25);
  --chart-4: oklch(0.55 0.15 250);
  --chart-5: oklch(0.55 0.18 320);
}

.dark {
  /* Move current :root values here */
  --background: oklch(0.13 0.015 260);
  --foreground: oklch(0.97 0 0);
  /* ... etc ... */
}
```

### Sonner Toaster with Dynamic Theme
```tsx
// Source: sonner docs + next-themes docs
"use client";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "next-themes";

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme as "dark" | "light") ?? "dark"}
      className="toaster group"
      {...props}
    />
  );
};

export { Toaster };
```

### Undo with Timeout in Zustand Store
```typescript
// Conceptual pattern for game-store.ts
undoLastSubmission: () =>
  set((state) => {
    if (!state._undoSnapshot) return {};
    return {
      holeStrokes: state._undoSnapshot.holeStrokes,
      pairResults: state._undoSnapshot.pairResults,
      playerScores: state._undoSnapshot.playerScores,
      currentHole: state._undoSnapshot.currentHole,
      _undoSnapshot: null,
    };
  }),
```

### Undo Button Component
```tsx
// Conceptual floating undo button on play page
"use client";
import { useState, useEffect } from "react";
import { Undo2 } from "lucide-react";

export function UndoBanner({ onUndo, durationMs = 10000 }: { onUndo: () => void; durationMs?: number }) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 100) return 0;
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (remaining <= 0) return null;

  return (
    <button
      onClick={onUndo}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-destructive text-white text-sm font-semibold shadow-lg"
    >
      <Undo2 className="h-4 w-4" />
      Undo ({Math.ceil(remaining / 1000)}s)
    </button>
  );
}
```

### Excluding Undo Snapshot from Persist
```typescript
// Source: zustand persist docs
persist(
  (set, get) => ({ /* ... */ }),
  {
    name: "golf-handicap-game",
    version: 1,
    partialize: (state) => {
      // Exclude ephemeral undo fields from persistence
      const { _undoSnapshot, _undoTimer, ...rest } = state;
      return rest;
    },
    // ... existing config
  }
)
```

## Codebase Audit: Hardcoded Colors

Files requiring color migration (21 files, ~215 hardcoded color references):

**High-impact pages (most visible):**
| File | Hardcoded Color Count | Key Patterns |
|------|----------------------|--------------|
| `src/app/page.tsx` | ~12 | `bg-slate-950`, `text-white`, `text-slate-400`, `bg-slate-800/80` |
| `src/app/play/page.tsx` | ~21 | `bg-slate-950`, `bg-slate-900/90`, `text-white`, `text-slate-400/500` |
| `src/app/setup/page.tsx` | ~30 | `bg-slate-950`, `text-white`, `bg-slate-800/80`, `text-slate-500` |
| `src/app/results/page.tsx` | ~29 | `bg-slate-950`, `bg-slate-900/90`, `text-white`, `text-slate-300/400` |
| `src/app/history/page.tsx` | ~16 | `bg-slate-950`, `text-white`, `text-slate-300/400` |
| `src/app/stats/page.tsx` | ~7 | `bg-slate-950`, `text-white` |

**Components:**
| File | Hardcoded Color Count | Key Patterns |
|------|----------------------|--------------|
| `src/components/shared/game-header.tsx` | ~3 | `bg-slate-900/90`, `text-white`, `text-slate-300` |
| `src/components/shared/stroke-input.tsx` | ~7 | `bg-slate-800`, `text-white`, `text-slate-400` |
| `src/components/shared/number-stepper.tsx` | ~6 | `bg-slate-700/80`, `bg-slate-800/50`, `text-white` |
| `src/components/shared/mini-leaderboard.tsx` | ~4 | `bg-white/5`, `text-slate-200/400/500` |
| `src/components/shared/hydration-gate.tsx` | ~3 | `bg-slate-950`, `text-slate-400`, `bg-slate-800/50` |
| `src/components/results/winner-podium.tsx` | ~15 | `text-white`, `text-slate-300/400/500` |
| `src/components/results/pair-breakdown.tsx` | ~13 | `text-slate-200`, `bg-slate-800/50`, `text-slate-500/600` |
| `src/components/results/share-results-card.tsx` | ~1 (button) | `bg-slate-800` (share card itself is intentionally hardcoded) |
| `src/components/results/score-trend-chart.tsx` | ~1 | `text-white` (chart grid/ticks use inline rgba) |
| `src/components/stats/player-stat-card.tsx` | ~17 | `bg-slate-800/40`, `text-white`, `text-slate-400/500` |
| `src/components/stats/win-rate-chart.tsx` | ~1 | `text-white` |

**CSS utilities in `globals.css`:**
| Utility | Issue |
|---------|-------|
| `.glass-card` | Hardcoded `rgba(30, 41, 59, 0.7)` background |
| `.text-gradient` | Hardcoded emerald/teal/cyan gradient (works on both themes) |
| `.score-positive` | Hardcoded `color: #34d399` + `background: rgba(16, 185, 129, 0.1)` |
| `.score-negative` | Hardcoded `color: #fb7185` + `background: rgba(244, 63, 94, 0.1)` |
| `.score-neutral` | Hardcoded `rgba(148, 163, 184, 0.7)` |

**Intentionally NOT migrated:**
- `share-results-card.tsx` inline styles (captured as image -- must stay hardcoded per [04-02])
- Emerald/rose/amber accent colors (positive/negative scores, turbo badges) -- these are semantic and theme-agnostic

## Migration Strategy

**Recommended approach -- two categories of color changes:**

1. **CSS Variable Swap (~60% of changes):** Replace `bg-slate-950` with `bg-background`, `text-white` with `text-foreground`, `bg-slate-800/80` with `bg-card` or `bg-muted`, `text-slate-400` with `text-muted-foreground`, `border-slate-700/50` with `border-border`. These map directly to existing shadcn CSS variables.

2. **Dark-variant additions (~40% of changes):** For colors that don't have a direct CSS variable equivalent (e.g., `bg-slate-900/90` for headers, `bg-slate-700/80` for buttons), add `dark:` paired classes: `bg-white/90 dark:bg-slate-900/90`.

**Color mapping reference:**

| Hardcoded Dark Color | Semantic Replacement | Notes |
|---------------------|---------------------|-------|
| `bg-slate-950` | `bg-background` | Page backgrounds |
| `text-white` | `text-foreground` | Primary text |
| `bg-slate-800`, `bg-slate-800/80` | `bg-card` or `bg-muted` | Card backgrounds, buttons |
| `text-slate-200` | `text-foreground` or `text-card-foreground` | Secondary text |
| `text-slate-300` | `text-muted-foreground` | Tertiary text |
| `text-slate-400` | `text-muted-foreground` | Labels, subtitles |
| `text-slate-500` | `text-muted-foreground` | Dimmed text |
| `border-slate-700/50` | `border-border` | Borders |
| `border-slate-800/50` | `border-border` | Borders |
| `bg-slate-900/90` | `bg-card/90` | Header backgrounds |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 `darkMode: "class"` in config | Tailwind v4 `@custom-variant dark` in CSS | Tailwind v4 (2024) | Config is now CSS-native |
| `next-themes` 0.3.x with Pages Router | `next-themes` 0.4.x with App Router + `suppressHydrationWarning` | 2024 | Cleaner App Router integration |
| Undo via external library (zundo) | Simple snapshot pattern for single-action undo | N/A | Simpler, zero dependencies |

**Deprecated/outdated:**
- `darkMode: "class"` in `tailwind.config.js` -- replaced by `@custom-variant dark` in CSS for Tailwind v4
- `@custom-variant dark (&:is(.dark *))` -- should use `:where()` instead of `:is()` per Tailwind v4 docs (specificity and self-matching reasons)

## Open Questions

1. **Where to place the theme toggle UI?**
   - What we know: The app has no persistent navigation bar. Pages have individual headers.
   - What's unclear: Should the toggle be on the home page only, or accessible from every page?
   - Recommendation: Place on the home page (most natural entry point). Could also be added to the settings/setup page. The home page has visual space for it. Since next-themes persists the choice, users only need to set it once.

2. **Should the undo button replace or coexist with the confirmation flash?**
   - What we know: Currently after submit, a confirmation flash shows for 1 second then auto-advances to next hole. The undo requirement says the button should appear for 10 seconds after submission.
   - What's unclear: Should the 1-second confirmation flash still auto-advance, with the undo button persisting on the next hole? Or should the flow change?
   - Recommendation: Keep the 1-second flash and auto-advance. Show the undo button as a floating element that persists for 10 seconds even after advancing to the next hole. The undo restores both the data AND navigates back to the hole that was undone.

3. **Light theme palette -- how close to shadcn/ui default?**
   - What we know: shadcn/ui provides a default neutral light palette. The app uses a custom dark palette with emerald primary.
   - What's unclear: Should the light theme be a standard shadcn neutral, or custom-designed to feel like a golf app?
   - Recommendation: Start with shadcn/ui neutral light palette (white backgrounds, dark text). Keep the emerald primary color for brand consistency. This gives the fastest path to a working light theme.

## Sources

### Primary (HIGH confidence)
- next-themes GitHub README (https://github.com/pacocoursey/next-themes) - ThemeProvider API, useTheme hook, App Router setup, hydration handling
- Tailwind CSS v4 Dark Mode docs (https://tailwindcss.com/docs/dark-mode) - @custom-variant directive, class-based dark mode setup
- Sonner docs (https://sonner.emilkowal.ski/toast) - Toast action prop, duration, theming

### Secondary (MEDIUM confidence)
- shadcn/ui theming patterns - CSS variable structure verified against project's existing `globals.css` and `components.json`
- Zustand persist docs - `partialize` option for excluding fields from persistence

### Tertiary (LOW confidence)
- None -- all critical claims verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed; API verified against official docs
- Architecture: HIGH - patterns verified against next-themes README and Tailwind v4 docs; codebase fully audited
- Pitfalls: HIGH - identified through direct codebase audit (grep/read every source file); @custom-variant bug verified against Tailwind v4 docs

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days -- all libraries are stable releases)
