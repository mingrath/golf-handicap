# Architecture

**Analysis Date:** 2025-02-17

## Pattern Overview

**Overall:** Multi-step wizard with pairwise scoring engine

**Key Characteristics:**
- Single-page app using Next.js App Router (all routes are static/prerendered)
- 4-step wizard pattern: Setup → Handicap → Turbo → Play → Results
- Centralized state management via Zustand with localStorage persistence
- Pure scoring functions separate from UI (functional core, imperative shell)
- Zero-sum scoring: each hole's player scores always sum to zero
- PWA-enabled with offline support via service worker

## Layers

**Presentation Layer (Pages):**
- Purpose: Route handlers and page-level orchestration
- Location: `src/app/*/page.tsx`
- Contains: React client components that mount Zustand store and render UI
- Depends on: `useGameStore`, shared components, scoring utilities
- Used by: Next.js router

**Component Layer (Reusable UI):**
- Purpose: Composable, domain-agnostic UI elements
- Location: `src/components/ui/*` (shadcn primitives), `src/components/shared/*` (game-specific controls)
- Contains: Button, Card, Dialog, NumberStepper, GameHeader, StepIndicator
- Depends on: Tailwind CSS, lucide-react icons
- Used by: All pages

**State Management (Zustand Store):**
- Purpose: Single source of truth for game config, player strokes, scores
- Location: `src/lib/game-store.ts`
- Contains: GameStore interface with actions and GameState schema
- Depends on: Types, scoring functions, pair utilities
- Used by: All pages via `useGameStore()` hook

**Domain Logic (Business Rules):**
- Purpose: Pure functions for scoring, pair generation, handicap calculation
- Location: `src/lib/scoring.ts`, `src/lib/pairs.ts`
- Contains: Zero-sum score calculation, ranking, handicap hole distribution
- Depends on: Types only
- Used by: Store actions and pages

**Types (Domain Model):**
- Purpose: Shared TypeScript interfaces for type safety
- Location: `src/lib/types.ts`
- Contains: Player, PairKey, PairHandicap, HoleStrokes, GameConfig, GameState
- Depends on: Nothing
- Used by: All other layers

## Data Flow

**Game Setup Flow:**

1. HomePage (`/`) — check for active game in store, offer resume or new game
2. SetupPage (`/setup`) — collect players (2-6) and hole count (1-36)
3. Store `setPlayers()`, `setNumberOfHoles()` → updates `config`
4. HandicapPage (`/handicap`) — for each C(n,2) pair, set handicap value and holes
5. Store `setHandicap()`, `setHandicapHoles()` → updates `config.handicaps`
6. TurboPage (`/turbo`) — select holes that count double (multiply results by 2)
7. Store `setTurboHoles()` → updates `config.turboHoles`

**Game Play Flow:**

1. PlayPage (`/play`) — for each hole, enter raw strokes per player
2. User clicks "Submit" or "Finish" with stroke values
3. Store `submitHoleStrokes()` triggers calculation:
   - Calls `generatePairs()` to get all player pairs
   - For each pair, `calculatePairHoleResult()` applies handicap adjustment and compares strokes
   - Calls `calculatePlayerHoleScores()` to sum each player's pair results for the hole
   - Calls `getRunningTotals()` to compute cumulative scores
   - Updates `playerScores`, `pairResults`, `holeStrokes`
4. After final hole, `completeGame()` sets `isComplete: true`
5. ResultsPage (`/results`) displays final rankings via `getFinalRankings()`
6. User can edit individual strokes, which resubmits and recalculates

**State Management:**

- Store uses `persist` middleware to save all state to localStorage key `"golf-handicap-game"`
- On page load, Zustand hydrates from localStorage automatically
- `hasActiveGame()` checks if `config !== null && holeStrokes.length > 0`
- `resetGame()` clears all state and returns to initial values

## Key Abstractions

**PairKey:**
- Purpose: Immutable identifier for two-player matchup
- Format: `"playerA_id::playerB_id"` (sorted alphabetically for consistency)
- Examples: `"alice::bob"`, `"alice::charlie"`
- Pattern: `makePairKey()` creates from two IDs, `parsePairKey()` extracts them

**Scoring Model (Zero-Sum):**
- Purpose: Track head-to-head results, ensure all scores sum to zero per hole
- Pair result: player wins (+1), loses (-1), ties (0)
- Turbo holes multiply by 2: win becomes +2, loss becomes -2
- Player total: sum of all their pair results across that hole
- Verified with `verifyZeroSum()` function

**Handicap Adjustment:**
- Purpose: Give weaker player strokes on designated holes
- Value semantics: positive = player A is stronger, negative = player B is stronger
- Application: on handicap holes, weaker player's stroke count is decremented by 1
- Distribution: `distributeHandicapHoles()` spreads N handicap strokes evenly across H holes

## Entry Points

**Home Route (`/`):**
- Location: `src/app/page.tsx`
- Triggers: User loads app, navigates home
- Responsibilities: Display "New Game" / "Resume Game" buttons, manage PWA install prompt

**Setup Route (`/setup`):**
- Location: `src/app/setup/page.tsx`
- Triggers: User clicks "New Game" (triggers `resetGame()`)
- Responsibilities: Collect player names and hole count, validate inputs, advance to handicap step

**Handicap Route (`/handicap`):**
- Location: `src/app/handicap/page.tsx`
- Triggers: User completes setup step
- Responsibilities: Initialize handicaps for all pairs, let user set values and handicap holes per pair

**Turbo Route (`/turbo`):**
- Location: `src/app/turbo/page.tsx`
- Triggers: User completes handicap step
- Responsibilities: Let user toggle holes as "turbo" (2x scoring)

**Play Route (`/play`):**
- Location: `src/app/play/page.tsx`
- Triggers: User starts game
- Responsibilities: Present scoring UI per hole, submit strokes, display live scoreboard, navigate holes

**Results Route (`/results`):**
- Location: `src/app/results/page.tsx`
- Triggers: User submits final hole
- Responsibilities: Display final rankings, scorecards, allow score editing, offer new game or home

## Error Handling

**Strategy:** Defensive null checks and graceful fallbacks

**Patterns:**
- Pages check `if (!config?.players?.length)` and redirect to setup if missing
- Store mutations check `if (!state.config) return {}` to silently ignore invalid actions
- Missing player names default to `"Player N"` on submission
- Missing handicap entries default to 0 (equal match)
- Player/handicap queries use `?? 0` or `?? playerId` fallbacks

## Cross-Cutting Concerns

**Logging:** Not implemented (development via console.log if needed)

**Validation:**
- Setup page: requires 2-6 players with non-empty names, hole count > 0
- Handicap page: requires each pair's handicap holes count match handicap value
- Play page: any stroke value ≥ 0 accepted, no par-based validation
- Results page: allows score editing with immediate recalculation

**Authentication:** Not applicable (local single-user app)

**Persistence:**
- Zustand `persist` middleware with localStorage key `"golf-handicap-game"`
- Entire `GameState` serialized and hydrated automatically
- No server sync, fully offline-capable

---

*Architecture analysis: 2025-02-17*
