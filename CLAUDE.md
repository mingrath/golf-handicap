# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint with Next.js + TypeScript rules
```

No test framework is configured.

## Architecture

**Golf Handicap Scorer** — a mobile-first PWA for pairwise handicap golf scoring. Players compete in all C(n,2) pairs with configurable handicaps and optional turbo (2x) holes.

### Tech Stack

- Next.js 16 (App Router, all pages are static/prerendered)
- React 19, TypeScript 5
- Zustand 5 with `persist` middleware (localStorage key: `"golf-handicap-game"`)
- Tailwind CSS 4 (new `@import` syntax), shadcn/ui (New York style)
- PWA: custom service worker (`public/sw.js`), manifest (`public/manifest.json`)
- Deployed on Vercel with auto-deploy from `main` branch

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

### App Flow (4-step wizard)

| Route | Step | Purpose |
|-------|------|---------|
| `/` | — | Home: new game or resume |
| `/setup` | 1 | Add 2–6 players, set 1–36 holes |
| `/handicap` | 2 | Set handicap per pair, choose handicap holes |
| `/turbo` | 3 | Select turbo holes (2x scoring) |
| `/play` | 4 | Enter strokes per hole, view live results |
| `/results` | — | Final rankings and scorecards |

### Key Modules (`src/lib/`)

- **`game-store.ts`** — Zustand store: single source of truth for game config, current hole, strokes, pair results, player scores. All game mutations go through store actions.
- **`scoring.ts`** — Pure functions for handicap adjustment, pair-vs-pair comparison (+1/−1/0), player score aggregation, running totals, final rankings. Scoring is always zero-sum per hole.
- **`pairs.ts`** — Generates all player pairs, creates/parses `PairKey` strings (`"idA::idB"`), distributes handicap holes evenly.
- **`types.ts`** — Core domain types: `Player`, `PairKey`, `PairHandicap`, `HoleStrokes`, `PairHoleResult`, `PlayerHoleScore`, `GameConfig`, `GameState`.

### Components (`src/components/`)

- **`ui/`** — shadcn/ui primitives (button, card, dialog). Add new ones via `npx shadcn@latest add <component>`.
- **`shared/`** — Reusable game UI: `game-header`, `step-indicator` (4-step progress), `number-stepper` (+/− control).

### Scoring Model

For each hole, for each pair: compare adjusted strokes (raw strokes ± handicap on designated holes). Winner gets +1, loser gets −1, tie is 0. Turbo holes multiply by 2. A player's hole score is the sum of all their pair results. Total scores always sum to zero across all players per hole.

### PWA Details

Service worker uses network-first for navigation, cache-first for assets. Precaches all route pages on install. Layout registers the service worker on page load and includes Apple Web App meta tags.
