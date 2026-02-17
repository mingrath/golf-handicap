# Stack Research

**Domain:** Golf scoring PWA -- additional libraries for v2 milestone (charting, persistence, testing, mobile UX)
**Researched:** 2026-02-17
**Confidence:** HIGH

## Existing Stack (no changes needed)

These are already in place and should NOT be modified:

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | App Router, static prerendering |
| React | 19.2.3 | UI framework |
| Zustand | 5.0.11 | Client state management with localStorage persist |
| Tailwind CSS | 4.x | Utility-first CSS |
| shadcn/ui | 3.8.4 (CLI) | Component library (New York style) |
| lucide-react | 0.563.0 | Icons |

## Recommended Additions

### 1. Charting -- Recharts via shadcn/ui Chart component

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| recharts | ^3.7.0 | SVG chart rendering (line, bar, area, pie) | shadcn/ui's official chart system is built on Recharts. Using it gives us pre-styled chart components (`ChartContainer`, `ChartTooltip`, `ChartLegend`) that match the existing design system out of the box. React 19 is explicitly supported via peer deps. |
| react-is | ^19.2.4 | Recharts peer dependency | Required by recharts 3.x. Must be installed explicitly. |

**Confidence:** HIGH -- verified via npm registry and shadcn/ui official docs.

**Installation:**
```bash
npx shadcn@latest add chart
npm install react-is
```

The `shadcn add chart` command installs recharts and creates `src/components/ui/chart.tsx` with `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, and `ChartLegendContent` components.

**What we need for this project:**
- `LineChart` / `AreaChart` -- score trends over holes (per player)
- `BarChart` -- game history comparison, player win rates
- `ResponsiveContainer` -- mobile-responsive chart sizing (built into `ChartContainer`)

**Bundle size note:** Recharts 3.x added `@reduxjs/toolkit`, `react-redux`, `immer`, and `reselect` as runtime dependencies. This adds ~40-50 KB gzipped. For a PWA this is a real cost, but the shadcn/ui integration, React 19 support, and ecosystem dominance (54M+ weekly downloads) make it the clear choice. The Redux deps are tree-shaken to only what recharts uses internally.

### 2. Local Database -- Dexie.js (IndexedDB)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| dexie | ^4.3.0 | IndexedDB wrapper for game history storage | Fluent query API with versioned schema migrations, `useLiveQuery` hook for reactive React bindings, and built-in indexing. Game history needs querying (by date, by player, by course) which raw `idb` cannot do ergonomically. |
| dexie-react-hooks | ^4.2.0 | React hooks for Dexie (`useLiveQuery`) | Reactive queries that re-render components when IndexedDB data changes. Peer deps: `dexie >=4.2.0`, `react >=16` -- both satisfied by our stack. |

**Confidence:** HIGH -- versions verified via npm. Peer deps confirmed compatible with React 19.

**Installation:**
```bash
npm install dexie dexie-react-hooks
```

**Why Dexie over alternatives:**
- **vs `idb` (8.0.3):** idb is a thin promise wrapper. You get `db.get(key)` and `db.put(key, value)` but no fluent querying, no schema versioning, no reactive hooks. Game history needs `WHERE date >= X ORDER BY date DESC LIMIT 20` -- idb cannot express this.
- **vs `localForage`:** localStorage-like key-value API. Same problem as idb -- no querying, no indexes, no schema migrations. Also largely unmaintained.
- **vs keeping localStorage:** localStorage has a 5-10 MB limit, is synchronous (blocks main thread), and cannot index data. A history of 100+ games with per-hole breakdowns will exceed this.

**Why NOT Dexie Cloud:** The commercial sync add-on is unnecessary. This is a fully offline PWA with no backend. Pure Dexie.js is free and open source.

**Schema design consideration:** The Zustand store (current game state) stays in localStorage via `persist` middleware. Dexie stores completed game history only. On game completion, serialize the final `GameState` into Dexie. This keeps the hot path (active game) fast and simple while giving history proper querying.

### 3. Testing -- Vitest + React Testing Library

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| vitest | ^4.0.18 | Test runner and assertion library | Next.js officially recommends Vitest for unit testing. Native ESM/TypeScript support, no transpilation config needed. Vitest 4.x has `@types/node >=20` peer dep which matches our setup. |
| @testing-library/react | ^16.3.2 | React component testing | Standard for testing React components via user-visible behavior. Supports React 18 and 19 via peer deps. |
| @testing-library/jest-dom | ^6.9.1 | DOM assertion matchers (`toBeInTheDocument`, `toHaveTextContent`) | Extends Vitest with readable DOM assertions. |
| @vitejs/plugin-react | ^5.1.4 | Vite plugin for React JSX transform | Required by Vitest to handle JSX in test files. |
| vite-tsconfig-paths | ^6.1.1 | Resolves `@/*` path alias in Vitest | Our tsconfig maps `@/*` to `./src/*`. Without this plugin, imports like `@/lib/scoring` fail in tests. |
| jsdom | ^28.1.0 | Browser environment simulation | Vitest needs a DOM environment for component tests. jsdom is the standard choice. |
| fake-indexeddb | ^6.2.5 | In-memory IndexedDB for testing | Dexie tests need IndexedDB. `fake-indexeddb` provides a complete in-memory implementation that works in Node.js/jsdom. |
| @vitest/coverage-v8 | ^4.0.18 | Code coverage via V8 | Lightweight coverage reporting. Version must match vitest version. |

**Confidence:** HIGH -- all verified via npm registry and Next.js official testing guide.

**Installation:**
```bash
npm install -D vitest @vitejs/plugin-react jsdom vite-tsconfig-paths \
  @testing-library/react @testing-library/dom @testing-library/jest-dom \
  fake-indexeddb @vitest/coverage-v8
```

**Configuration (`vitest.config.mts`):**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/components/**'],
    },
  },
})
```

**Setup file (`vitest.setup.ts`):**
```typescript
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
```

**package.json scripts:**
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

**Testing priority for this project:**
1. `src/lib/scoring.ts` -- pure functions, highest ROI, test all pair comparison logic
2. `src/lib/pairs.ts` -- pure functions, test pair generation and handicap distribution
3. Dexie history store -- test CRUD operations with fake-indexeddb
4. Component tests -- results page rendering, chart data transformation

**Limitation:** Vitest does not support testing async Server Components. All our pages are client-side (`"use client"` or static), so this is not a blocker.

### 4. Mobile UX -- No Additional Libraries Needed

| Decision | Rationale |
|----------|-----------|
| No separate mobile input library | shadcn/ui + Tailwind CSS 4 already provide mobile-optimized primitives. The existing `NumberStepper` component handles score input. Adding libraries like `react-mobile-picker` or `react-swipeable` would add dependencies for problems we can solve with CSS and native browser APIs. |
| Use native `<input type="number">` with `inputMode="numeric"` | Triggers numeric keyboard on mobile. Combined with the existing `NumberStepper` (+/- buttons), this covers golf score entry. |
| CSS `touch-action` and `scroll-snap` | Native CSS properties for swipe navigation between holes. No library needed. |
| `prefers-reduced-motion` media query | Already available via Tailwind's `motion-reduce:` variant for animation control. |

**Confidence:** HIGH -- based on existing codebase analysis. The v1 already has working mobile input; v2 improvements are CSS/component-level, not library-level.

**If we later need gesture handling:** Consider `@use-gesture/react` (^10.3.1, 2.2 KB gzipped) -- the lightest touch gesture library. But defer unless we add swipe-to-navigate-holes, which is a UX feature decision, not a stack decision.

### 5. Supporting Utility -- date-fns (conditional)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| date-fns | ^4.1.0 | Date formatting for game history timestamps | Tree-shakeable, ESM-native. Only import `format`, `formatDistanceToNow`, `isThisWeek` -- adds < 3 KB. |

**Confidence:** MEDIUM -- we may not need this if game history UI only shows "Feb 17, 2026" style dates, which `Intl.DateTimeFormat` handles natively. Add only if we need relative dates ("3 days ago") or complex date math.

**Decision rule:** Try `Intl.DateTimeFormat` first. Add date-fns only if native APIs become unwieldy.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Charts | Recharts 3.x (via shadcn/ui) | Victory 37.x | Victory has 40x fewer downloads, no shadcn/ui integration, and requires learning a different composable API. Recharts is what shadcn/ui chose. |
| Charts | Recharts 3.x | Nivo 0.88.x | Nivo is powerful but heavy, server-render focused, and has a steep learning curve for simple line/bar charts. Overkill for score trends. |
| Charts | Recharts 3.x | Chart.js + react-chartjs-2 | Canvas-based (not SVG), harder to style with Tailwind CSS variables, no shadcn/ui integration. |
| Charts | Recharts 3.x | Recharts 2.15.4 | v2 does not support React 19 in peer deps (only `^18`). Would require `--legacy-peer-deps`. Also, shadcn/ui is upgrading to Recharts v3. |
| IndexedDB | Dexie 4.x | idb 8.x | idb is a thin wrapper -- no query builder, no schema versioning, no reactive hooks. Fine for key-value storage, insufficient for game history queries. |
| IndexedDB | Dexie 4.x | localForage | Key-value only, no indexes or queries. Largely unmaintained. |
| Testing | Vitest 4.x | Jest | Jest requires separate config for ESM/TypeScript, slower startup, and Next.js docs now recommend Vitest. |
| Testing | jsdom | happy-dom | happy-dom is faster but has edge cases with SVG rendering (relevant for Recharts tests). jsdom is safer. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Redux / Redux Toolkit | Already using Zustand. Adding Redux for state management would create dual state systems. (Recharts includes it internally but that is not exposed to our code.) | Zustand 5 (already in place) |
| PouchDB | Full database with sync protocol. Massive overkill (159 KB min+gzip) for offline-only game history. | Dexie 4.x |
| Playwright / Cypress for unit tests | E2E tools are heavy and slow. Unit/component tests should use Vitest. Add E2E only if needed later. | Vitest + RTL |
| react-native-chart-kit | React Native library, not React web. Common mistake in search results. | Recharts |
| localForage | Unmaintained, localStorage-like API, no querying capability. | Dexie 4.x |
| Recharts 2.x | Peer deps do not include React 19. Would require `--legacy-peer-deps` flag. shadcn/ui is migrating to v3. | Recharts 3.x |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| recharts@3.7.0 | react@^19, react-dom@^19 | Peer dep explicitly includes `^19.0.0`. Requires `react-is@^19` as peer dep. |
| dexie@4.3.0 | No peer deps | Pure JS library, framework-agnostic. |
| dexie-react-hooks@4.2.0 | react@>=16, dexie@>=4.2.0 | Broad React support. Works with React 19. |
| vitest@4.0.18 | @types/node@^20 | Our project uses `@types/node@^20`, compatible. |
| @testing-library/react@16.3.2 | react@^18 \|\| ^19, react-dom@^18 \|\| ^19 | Explicitly supports React 19. |
| @vitejs/plugin-react@5.1.4 | vite@^4 \|\| ^5 \|\| ^6 | Compatible with Vitest 4.x's internal Vite. |
| fake-indexeddb@6.2.5 | No peer deps | Standalone in-memory IndexedDB implementation. |

## Installation Summary

```bash
# Production dependencies
npm install recharts react-is dexie dexie-react-hooks

# Dev dependencies
npm install -D vitest @vitejs/plugin-react jsdom vite-tsconfig-paths \
  @testing-library/react @testing-library/dom @testing-library/jest-dom \
  fake-indexeddb @vitest/coverage-v8

# shadcn chart component (creates src/components/ui/chart.tsx)
npx shadcn@latest add chart
```

## Stack Patterns

**If game history needs server sync later:**
- Dexie Cloud add-on can be layered on without changing the Dexie schema or queries
- Alternative: export/import JSON files for manual backup

**If charts need to render on server (SSR/prerender):**
- Recharts is SVG-based and can render on server, but chart data comes from IndexedDB (client-only)
- Wrap chart components in client boundary (`"use client"`) -- this is already how the app works

**If bundle size becomes a concern:**
- Recharts 3.x adds ~40-50 KB gzipped via Redux internals
- Dexie adds ~27 KB gzipped
- Total new JS: ~70-80 KB gzipped -- acceptable for a PWA that caches aggressively
- If needed: lazy-load chart components via `next/dynamic` with `ssr: false`

## Sources

- [npm registry: recharts@3.7.0](https://www.npmjs.com/package/recharts) -- version, peer deps, dependencies verified
- [npm registry: dexie@4.3.0](https://www.npmjs.com/package/dexie) -- version verified
- [npm registry: dexie-react-hooks@4.2.0](https://www.npmjs.com/package/dexie-react-hooks) -- peer deps verified
- [npm registry: vitest@4.0.18](https://www.npmjs.com/package/vitest) -- version, peer deps verified
- [npm registry: @testing-library/react@16.3.2](https://www.npmjs.com/package/@testing-library/react) -- React 19 peer dep verified
- [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/radix/chart) -- Recharts integration, installation command
- [Next.js Testing Guide: Vitest](https://nextjs.org/docs/app/guides/testing/vitest) -- official setup instructions
- [npm trends: dexie vs idb vs localforage](https://npmtrends.com/dexie-vs-idb-vs-idb-wrapper-vs-localforage-vs-pouchdb) -- download comparison
- [Recharts bundle size discussion](https://github.com/recharts/recharts/issues/3697) -- v3 dependency concerns
- [npm registry: fake-indexeddb@6.2.5](https://www.npmjs.com/package/fake-indexeddb) -- testing IndexedDB

---
*Stack research for: Golf Handicap Scorer v2 -- subsequent milestone additions*
*Researched: 2026-02-17*
