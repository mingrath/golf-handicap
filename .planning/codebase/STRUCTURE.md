# Codebase Structure

**Analysis Date:** 2025-02-17

## Directory Layout

```
golf-handicap/
├── .next/                  # Next.js build output (generated, not committed)
├── .planning/              # GSD planning documents
│   └── codebase/           # Architecture/structure analysis docs
├── .vercel/                # Vercel deployment config
├── public/                 # Static assets and PWA files
│   ├── sw.js              # Service worker (offline support)
│   ├── manifest.json      # PWA manifest
│   ├── icon-192.png       # PWA app icon
│   └── [other assets]
├── src/                    # Source code
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx       # Home page (/)
│   │   ├── layout.tsx     # Root layout with PWA setup
│   │   ├── globals.css    # Global styles
│   │   ├── setup/         # Player/hole setup step
│   │   ├── handicap/      # Handicap configuration step
│   │   ├── turbo/         # Turbo hole selection step
│   │   ├── play/          # Hole-by-hole scoring
│   │   ├── results/       # Final rankings and scorecard
│   │   └── (turbo)/       # Layout group (not used as route)
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui primitives (button, card, dialog)
│   │   ├── shared/       # Game-specific reusable controls
│   │   ├── handicap/     # Handicap step components (if any)
│   │   ├── play/         # Play step components (if any)
│   │   ├── results/      # Results step components (if any)
│   │   ├── setup/        # Setup step components (if any)
│   │   └── turbo/        # Turbo step components (if any)
│   └── lib/              # Business logic and utilities
│       ├── game-store.ts  # Zustand store (state + actions)
│       ├── scoring.ts     # Scoring functions (pair results, rankings)
│       ├── pairs.ts       # Pair generation and utilities
│       ├── types.ts       # TypeScript domain types
│       └── utils.ts       # Utility functions (cn for classNames)
├── node_modules/          # Dependencies (not committed)
├── package.json           # Dependencies and scripts
├── package-lock.json      # Locked versions
├── tsconfig.json          # TypeScript config
├── eslint.config.mjs      # ESLint rules
├── next.config.ts         # Next.js config
├── tailwind.config.js     # Tailwind CSS config
├── postcss.config.mjs     # PostCSS config
├── components.json        # shadcn/ui config
└── CLAUDE.md              # Instructions for Claude Code
```

## Directory Purposes

**src/app/**
- Purpose: Next.js App Router pages and layouts
- Contains: Route components (all client-side with `"use client"`)
- Key files:
  - `page.tsx`: Home page with resume/new game
  - `layout.tsx`: Root layout, PWA service worker registration
  - `setup/page.tsx`: Step 1 - Add players, set hole count
  - `handicap/page.tsx`: Step 2 - Set handicap per pair
  - `turbo/page.tsx`: Step 3 - Select turbo holes
  - `play/page.tsx`: Step 4 - Enter strokes, view scoreboard
  - `results/page.tsx`: Final rankings and editable scorecard
  - `globals.css`: Tailwind directives, custom animations

**src/components/ui/**
- Purpose: Unstyled shadcn/ui component primitives
- Contains: Button, Card, Dialog (Add via `npx shadcn@latest add <name>`)
- Pattern: Exported as composable, styled with Tailwind in consumers
- Key files: `button.tsx`, `card.tsx`, `dialog.tsx`

**src/components/shared/**
- Purpose: Game-specific, domain-aware reusable controls
- Contains: UI patterns used across multiple steps
- Key files:
  - `game-header.tsx`: Sticky header with title and back button
  - `step-indicator.tsx`: 4-step progress indicator
  - `number-stepper.tsx`: +/− spinner for numeric input (strokes, holes, handicap)

**src/components/{handicap,play,results,setup,turbo}/**
- Purpose: Step-specific component groups (if needed in future)
- Currently: Empty directories, components live directly in pages
- Pattern: Move complex logic out of page.tsx into these directories when pages exceed ~300 lines

**src/lib/**
- Purpose: Reusable business logic and utilities
- Contains: State management, scoring engine, type definitions
- Key files:
  - `game-store.ts`: Zustand store with full API
  - `scoring.ts`: Pure functions for calculating pair results and rankings
  - `pairs.ts`: Pair generation, PairKey management, handicap distribution
  - `types.ts`: TypeScript interfaces (Player, PairKey, GameState, etc.)
  - `utils.ts`: `cn()` function for classname merging

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Home page, app entry point
- `src/app/layout.tsx`: Root layout, PWA setup, service worker registration

**Configuration:**
- `tsconfig.json`: Path alias `@/*` → `./src/*`
- `next.config.ts`: Next.js settings
- `tailwind.config.js`: Tailwind CSS setup
- `eslint.config.mjs`: ESLint rules

**Core Logic:**
- `src/lib/game-store.ts`: All game state mutations
- `src/lib/scoring.ts`: Scoring calculations
- `src/lib/pairs.ts`: Pair generation and utilities
- `src/lib/types.ts`: Domain model

**Testing:**
- No test framework configured
- No test files present

## Naming Conventions

**Files:**
- Page components: lowercase `page.tsx` (Next.js convention)
- Component files: PascalCase `ComponentName.tsx`
- Utility/library files: lowercase `module-name.ts`
- CSS: global `globals.css`, module scoped via Tailwind

**Directories:**
- Feature directories: lowercase `feature-name/`
- Route directories: lowercase matching route path
- Index directories: `src/components/{ui,shared,etc}/`

**Functions:**
- React components: PascalCase `ComponentName`
- Hooks: camelCase starting with `use` (Zustand: `useGameStore`)
- Utility functions: camelCase `functionName`
- Types: PascalCase `InterfaceName`, `TypeName`

**Variables:**
- Store state: camelCase (`currentHole`, `holeStrokes`, `playerScores`)
- Props: camelCase (`players`, `handicapValue`, `isTurbo`)
- Constants: UPPER_SNAKE_CASE (`STEPS = [...]`, `MEDAL_COLORS`)

## Where to Add New Code

**New Feature (e.g., statistics view):**
- Route page: `src/app/stats/page.tsx`
- Feature logic: `src/lib/stats.ts` (pure functions)
- Store actions: Add to `useGameStore` in `game-store.ts` if state-dependent
- Tests: Not configured, but would be `src/lib/stats.test.ts`

**New Reusable Component:**
- If UI primitive: Add via `npx shadcn@latest add <component>` → `src/components/ui/<component>.tsx`
- If game-specific: `src/components/shared/<component-name>.tsx`
- If step-specific (e.g., setup form): `src/components/setup/<component-name>.tsx`

**Utilities:**
- General utilities: `src/lib/utils.ts`
- Domain-specific helpers: `src/lib/<domain>.ts` (e.g., `pairs.ts`, `scoring.ts`)

**Styles:**
- Global styles: `src/app/globals.css` (Tailwind directives)
- Component styles: Inline Tailwind classes in JSX (no CSS modules used)
- Custom CSS: Add to `globals.css` with `@apply` or custom utilities

## Special Directories

**public/:**
- Purpose: Static assets and PWA configuration
- Generated: No (hand-maintained)
- Committed: Yes
- Contents:
  - `sw.js`: Service worker for offline support
  - `manifest.json`: PWA manifest
  - `icon-192.png`: App icon

**.next/:**
- Purpose: Next.js build artifacts
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in .gitignore)

**.planning/codebase/:**
- Purpose: GSD codebase analysis documents
- Generated: Yes (by `/gsd:map-codebase`)
- Committed: Yes (planning is tracked)
- Contents: ARCHITECTURE.md, STRUCTURE.md (this file), and phase-specific plans

## Import Path Aliases

**Configured:**
- `@/*` → `./src/*`

**Usage:**
```typescript
// Instead of: import { useGameStore } from '../../../lib/game-store'
import { useGameStore } from '@/lib/game-store'

// Instead of: import Button from '../../../components/ui/button'
import { Button } from '@/components/ui/button'
```

---

*Structure analysis: 2025-02-17*
