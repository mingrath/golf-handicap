# Golf Handicap Scorer v2

## What This Is

A mobile-first PWA for pairwise handicap golf scoring. Groups of 2-6 players compete in all C(n,2) pairs with configurable handicaps and optional turbo (2x) holes. Features fast single-tap stroke input, always-visible live leaderboard, rich results with animated podium and shareable image cards, persistent game history with cross-round statistics, and dark/light theme support.

## Core Value

Fast, clear scoring on the course -- enter strokes quickly after each hole and always know who's winning at a glance.

## Requirements

### Validated

- ✓ Pairwise zero-sum scoring engine (+1/-1/0 per pair per hole) -- v1
- ✓ Configurable handicaps per pair with hole distribution -- v1
- ✓ Turbo holes (2x scoring multiplier) -- v1
- ✓ 2-6 player support with dynamic pair generation -- v1
- ✓ 1-36 hole support -- v1
- ✓ PWA with offline support and installability -- v1
- ✓ Game resume from localStorage -- v1
- ✓ Store validates inputs (strokes 0-20, handicaps, player count 2-6) -- v1.0
- ✓ State versioning with cascading migration -- v1.0
- ✓ Hydration gate (loading skeleton until store ready) -- v1.0
- ✓ 86 Vitest tests covering scoring.ts, pairs.ts, game-store.ts -- v1.0
- ✓ Single-tap stroke input with preset number row -- v1.0
- ✓ Auto-advance with confirmation flash and haptic feedback -- v1.0
- ✓ Swipe hole navigation during play -- v1.0
- ✓ Always-visible mini-leaderboard with sparklines -- v1.0
- ✓ Streamlined setup flow (3 steps to play with smart defaults) -- v1.0
- ✓ Rich results: score trend chart, head-to-head pair breakdowns -- v1.0
- ✓ Animated winner podium with confetti -- v1.0
- ✓ Shareable results image card via Web Share API -- v1.0
- ✓ Game history persisted to IndexedDB via Dexie -- v1.0
- ✓ History list page with date, players, winner -- v1.0
- ✓ Play-again shortcut from home page -- v1.0
- ✓ Cross-round statistics: win rates, averages, best/worst -- v1.0
- ✓ Dark/light theme with system detection and manual toggle -- v1.0
- ✓ Undo last score submission (10-second floating banner) -- v1.0
- ✓ Free-type stroke input (1–20), defaults to 4 per hole -- v1.1
- ✓ Tap-to-edit any hole during play with full score replay -- v1.1
- ✓ Edit strokes and handicap on results page, auto-updates saved history -- v1.1
- ✓ Storytelling engine with 6 narrative detectors -- v1.1
- ✓ Lifetime head-to-head records across saved games -- v1.1

### Active

<!-- v1.2 milestone scope -->

- [ ] Raw stroke input grid visible during play and on results (verify what was entered per hole per player)
- [ ] Handicap hole assignments visible in audit grid (verify which holes carry strokes per pair)
- [ ] Tap-to-edit from audit grid (jump to any hole directly)
- [ ] "Play Again" restores full config including handicap settings (not just names + holes)
- [ ] "Play Again" shortcut accessible directly from results page

### Out of Scope

- Real-time multiplayer / cloud sync -- one phone is the scorer, no backend
- User accounts / authentication -- single-device app, no login friction
- Tournament mode (brackets, flights) -- focus on single-round experience
- Shot-by-shot tracking -- slows down scoring, different input model
- Official USGA/R&A handicap calculation -- legally regulated, requires 20+ rounds
- Apple Watch companion -- requires native app, not PWA
- AI-powered analysis -- rule-based highlights work fine

## Current Milestone: v1.2 Score Transparency & Fast Setup

**Goal:** Let users verify what was entered when scores look wrong, and eliminate handicap re-entry on repeat games.

**Target features:**
- Raw stroke input audit grid (play screen + results page)
- Handicap assignment visibility in audit grid
- Tap-to-jump from audit grid to any hole
- "Play Again" restores full config including handicap settings
- "Play Again" shortcut on results page

## Context

Shipped v1.0 on 2026-02-17 with 6,289 LOC TypeScript/CSS across 7 phases and 12 plans.

**v1.1 user feedback (2026-02-22):** Real users reported: (1) preset stroke row caps at 6, need higher numbers since many score >7; (2) can't edit scorecard or handicap on results page if mistakes made; (3) can't edit scores during play — two people record and cross-check each hole, need immediate correction ability.

**v1.2 user feedback (2026-02-23):** After real course use: (1) Computed scores don't match paper scorecard, can't tell if wrong strokes or wrong handicap — need a raw input verification view; (2) Setup takes too long re-entering handicaps — Play Again only restores names/holes, not handicap settings; (3) Stroke input during play works well.

**Tech stack:** Next.js 16 (App Router, static prerendered), React 19, TypeScript 5, Zustand 5 (persist/localStorage), Dexie 4 (IndexedDB), Tailwind CSS 4, shadcn/ui (New York), next-themes 0.4.6, Recharts, Vitest 4.

**Two-store architecture:** Zustand/localStorage for live game state, Dexie/IndexedDB for persistent history. Player identity across rounds by case-insensitive name matching.

**Deployment:** Vercel with auto-deploy from `main` branch. Custom service worker for PWA with network-first navigation, cache-first assets.

Existing codebase analysis in `.planning/codebase/` (7 documents).

## Constraints

- **Tech stack**: Next.js 16 + React 19 + Zustand 5 + Tailwind CSS 4 + shadcn/ui -- keep existing stack, no backend
- **Platform**: PWA deployed on Vercel -- must remain offline-capable
- **Data**: localStorage for live game, IndexedDB for history -- no server storage
- **Device**: Mobile-first, used outdoors in sunlight -- high contrast, large tap targets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep existing tech stack | Working well, no reason to change frameworks | ✓ Good |
| Two-store separation (Zustand + Dexie) | localStorage 5MB limit insufficient for history; IndexedDB for persistence | ✓ Good |
| Rebuild in-place (not from scratch) | Reuse scoring engine and domain logic, improve UI layers | ✓ Good |
| Zero-sum verification warns but doesn't block | Prevents scoring bugs from corrupting game but doesn't halt play | ✓ Good |
| Confirmation flash as centered fixed overlay | Outdoor sunlight visibility -- must be obvious | ✓ Good |
| Share card uses inline hex styles | Reliable html-to-image capture regardless of CSS loading | ✓ Good |
| Case-insensitive player name matching | Cross-round stats must work despite capitalization differences | ✓ Good |
| next-themes with attribute="class" | De-facto standard for Next.js theming, handles FOUC/SSR/system detection | ✓ Good |
| Undo via Zustand snapshot (not zundo) | Single-action 10s undo doesn't need full undo/redo history | ✓ Good |
| Glass-card two-block CSS approach | oklch(from ...) not well-supported; explicit light/dark blocks are reliable | ✓ Good |

---
*Last updated: 2026-02-23 after v1.2 milestone start*
