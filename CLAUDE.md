# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint with Next.js + TypeScript rules
npm test           # Run all tests (vitest run)
npm run test:watch # Run tests in watch mode (vitest)
```

Tests use Vitest with jsdom environment, React plugin, and path aliases. Pre-commit hook runs `vitest run --bail 1` via simple-git-hooks. Set `SKIP_SIMPLE_GIT_HOOKS=1` to bypass.

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

### App Flow (streamlined setup)

| Route | Purpose |
|-------|---------|
| `/` | Home: new game or resume |
| `/setup` | Add 2-6 players, set 1-36 holes, optional collapsible handicap/turbo config, **Start Game** button |
| `/handicap` | Standalone handicap config (accessible from setup, navigates back to /setup) |
| `/turbo` | Standalone turbo config (accessible from setup, navigates back to /setup) |
| `/play` | Enter strokes per hole, view live results |
| `/results` | Final rankings and scorecards |

**Fast path:** New Game -> enter names -> Start Game (3 steps). Handicap and turbo configuration are optional collapsible sections on the setup page.

### Key Modules (`src/lib/`)

- **`game-store.ts`** — Zustand store: single source of truth for game config, current hole, strokes, pair results, player scores. All game mutations go through store actions.
- **`scoring.ts`** — Pure functions for handicap adjustment, pair-vs-pair comparison (+1/−1/0), player score aggregation, running totals, final rankings. Scoring is always zero-sum per hole.
- **`pairs.ts`** — Generates all player pairs, creates/parses `PairKey` strings (`"idA::idB"`), distributes handicap holes evenly.
- **`types.ts`** — Core domain types: `Player`, `PairKey`, `PairHandicap`, `HoleStrokes`, `PairHoleResult`, `PlayerHoleScore`, `GameConfig`, `GameState`.

### Components (`src/components/`)

- **`ui/`** — shadcn/ui primitives (button, card, dialog). Add new ones via `npx shadcn@latest add <component>`.
- **`shared/`** — Reusable game UI: `game-header`, `step-indicator` (unused since setup streamlining), `number-stepper` (+/- control).

### Scoring Model

For each hole, for each pair: compare adjusted strokes (raw strokes ± handicap on designated holes). Winner gets +1, loser gets −1, tie is 0. Turbo holes multiply by 2. A player's hole score is the sum of all their pair results. Total scores always sum to zero across all players per hole.

### PWA Details

Service worker uses network-first for navigation, cache-first for assets. Precaches all route pages on install. Layout registers the service worker on page load and includes Apple Web App meta tags.

<!-- gitnexus:start -->
# GitNexus MCP

This project is indexed by GitNexus as **golf-handicap** (262 symbols, 550 relationships, 17 execution flows).

GitNexus provides a knowledge graph over this codebase — call chains, blast radius, execution flows, and semantic search.

## Always Start Here

For any task involving code understanding, debugging, impact analysis, or refactoring, you must:

1. **Read `gitnexus://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `npx gitnexus analyze` in the terminal first.

## Skills

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/refactoring/SKILL.md` |

## Tools Reference

| Tool | What it gives you |
|------|-------------------|
| `query` | Process-grouped code intelligence — execution flows related to a concept |
| `context` | 360-degree symbol view — categorized refs, processes it participates in |
| `impact` | Symbol blast radius — what breaks at depth 1/2/3 with confidence |
| `detect_changes` | Git-diff impact — what do your current changes affect |
| `rename` | Multi-file coordinated rename with confidence-tagged edits |
| `cypher` | Raw graph queries (read `gitnexus://repo/{name}/schema` first) |
| `list_repos` | Discover indexed repos |

## Resources Reference

Lightweight reads (~100-500 tokens) for navigation:

| Resource | Content |
|----------|---------|
| `gitnexus://repo/{name}/context` | Stats, staleness check |
| `gitnexus://repo/{name}/clusters` | All functional areas with cohesion scores |
| `gitnexus://repo/{name}/cluster/{clusterName}` | Area members |
| `gitnexus://repo/{name}/processes` | All execution flows |
| `gitnexus://repo/{name}/process/{processName}` | Step-by-step trace |
| `gitnexus://repo/{name}/schema` | Graph schema for Cypher |

## Graph Schema

**Nodes:** File, Function, Class, Interface, Method, Community, Process
**Edges (via CodeRelation.type):** CALLS, IMPORTS, EXTENDS, IMPLEMENTS, DEFINES, MEMBER_OF, STEP_IN_PROCESS

```cypher
MATCH (caller)-[:CodeRelation {type: 'CALLS'}]->(f:Function {name: "myFunc"})
RETURN caller.name, caller.filePath
```

<!-- gitnexus:end -->
