# Coding Conventions

**Analysis Date:** 2025-02-17

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `StepIndicator.tsx`, `GameHeader.tsx`)
- Utilities/helpers: camelCase (e.g., `game-store.ts`, `scoring.ts`, `utils.ts`)
- Page routes: lowercase with hyphens for multi-word routes (e.g., `/setup`, `/handicap`, `/turbo`)
- UI components: PascalCase (e.g., `button.tsx`, `card.tsx`, `dialog.tsx`)

**Functions:**
- camelCase for all exported functions (e.g., `generatePairs`, `calculatePairHoleResult`, `getHandicapAdjustment`)
- Internal helper functions also camelCase (e.g., `makeId`, `handleNext`)
- React components are functions with PascalCase names

**Variables:**
- camelCase for all variable/constant names (e.g., `currentHole`, `numberOfHoles`, `playerScores`)
- Store state keys use snake_case in localStorage: `"golf-handicap-game"`
- boolean variables often prefixed with "is" or "has" (e.g., `isTurbo`, `hasActiveGame`, `installReady`)
- Plural form for arrays/collections (e.g., `players`, `pairs`, `handicaps`, `turboHoles`)

**Types:**
- PascalCase for all type/interface names (e.g., `Player`, `PairKey`, `GameConfig`, `GameState`)
- Type names are descriptive and domain-specific (e.g., `PairHandicap`, `HoleStrokes`, `PairHoleResult`)
- Branded type: `PairKey` is a string type alias with custom formatting

## Code Style

**Formatting:**
- ESLint configured with Next.js + TypeScript rules (see `eslint.config.mjs`)
- No Prettier config; ESLint handles formatting with core-web-vitals and TypeScript linting
- Run linting with: `npm run lint`

**Linting:**
- Tool: ESLint 9 with `eslint-config-next` (core-web-vitals + typescript configs)
- Key rules: Enforces Next.js best practices, TypeScript type safety, accessibility (a11y)
- Config extends: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- Global ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

**Quote Style:**
- Double quotes used for all strings in JSX/TSX (standard Next.js/shadcn convention)
- Example from `src/lib/utils.ts`: `import { clsx, type ClassValue } from "clsx"`

## Import Organization

**Order:**
1. External libraries (`react`, `zustand`, `next`, icon libraries)
2. Internal absolute imports using `@/` alias
3. Named vs default imports follow their usage patterns

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in tsconfig.json)
- Used throughout for readable imports: `import { useGameStore } from "@/lib/game-store"`

**Example from `src/components/shared/step-indicator.tsx`:**
```typescript
"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps { ... }

export function StepIndicator({ ... }) { ... }
```

## Error Handling

**Patterns:**
- Null coalescing with optional chaining: `strokes.strokes[playerAId] ?? 0`
- Guard clauses in store actions return early with empty object: `if (!state.config) return {};`
- Fallback values for missing data: `players.find((p) => p.id === playerId)?.name ?? playerId`
- No try/catch patterns in current codebase; pure functions with defensive defaults

**Example from `src/lib/scoring.ts`:**
```typescript
export function calculatePlayerHoleScores(
  players: Player[],
  pairResults: PairHoleResult[],
  holeNumber: number,
  previousTotals: Record<string, number>
): PlayerHoleScore[] {
  return players.map((player) => {
    let holeScore = 0;
    for (const result of pairResults) {
      if (result.holeNumber !== holeNumber) continue;
      if (result.playerAId === player.id) {
        holeScore += result.playerAScore;
      } else if (result.playerBId === player.id) {
        holeScore += result.playerBScore;
      }
    }
    return {
      playerId: player.id,
      holeNumber,
      holeScore,
      runningTotal: (previousTotals[player.id] ?? 0) + holeScore,
    };
  });
}
```

## Logging

**Framework:** `console` only (no logging library; codebase is a client-side PWA)

**Patterns:**
- No logging currently in use; would be added if server features are introduced
- Client-side debugging uses browser console

## Comments

**When to Comment:**
- Functions with non-obvious logic include JSDoc comments
- Complex scoring rules are explained inline
- State management operations have brief explanatory comments

**JSDoc/TSDoc:**
- Used for public functions in utility modules (e.g., `src/lib/scoring.ts`, `src/lib/pairs.ts`)
- Format: `/** comment text */` on line above function

**Examples from `src/lib/scoring.ts`:**
```typescript
/**
 * Get the handicap adjustment for a specific hole in a pair.
 * Returns: { playerAAdj: number, playerBAdj: number }
 * The player who receives strokes gets -1 on their adjusted score.
 */
export function getHandicapAdjustment(...)

/**
 * Calculate the result for one pair on one hole.
 * Returns +1/-1/0 scores (multiplied by 2 if turbo).
 */
export function calculatePairHoleResult(...)
```

## Function Design

**Size:** Generally 10-50 lines; pure functions in `scoring.ts` are small and focused

**Parameters:**
- Destructured props in React components (e.g., `{ steps, currentStep }`)
- Full parameters (non-destructured) in utility functions for explicitness
- Type annotations required for all parameters

**Return Values:**
- Explicit return types on all exported functions
- React components return JSX.Element implicitly
- Store actions return void

**Example from `src/lib/pairs.ts`:**
```typescript
export function makePairKey(playerAId: string, playerBId: string): PairKey {
  return [playerAId, playerBId].sort().join("::");
}

export function generatePairs(
  players: Player[]
): { pairKey: PairKey; playerAId: string; playerBId: string }[] {
  // implementation
}
```

## Module Design

**Exports:**
- Named exports preferred (e.g., `export function`, `export interface`)
- Single default exports only for page components and layout
- Store exported as single `useGameStore` hook

**Barrel Files:**
- Not used; imports are direct from specific modules
- Example: `import { Player, PairKey } from "@/lib/types"` (not from index)

**Client vs Server:**
- `"use client"` directive at top of all interactive components
- Example: `src/app/page.tsx`, `src/components/shared/game-header.tsx`
- Hooks (React, Zustand) require client components

---

*Convention analysis: 2025-02-17*
