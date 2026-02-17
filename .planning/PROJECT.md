# Golf Handicap Scorer v2

## What This Is

A mobile-first PWA for pairwise handicap golf scoring. Groups of 2-6 players compete in all C(n,2) pairs with configurable handicaps and optional turbo (2x) holes. Rebuilt from a working v1 to fix UX friction, improve scoring clarity, add rich results, and introduce game history with stats.

## Core Value

Fast, clear scoring on the course — enter strokes quickly after each hole and always know who's winning at a glance.

## Requirements

### Validated

<!-- Shipped and confirmed valuable in v1. -->

- ✓ Pairwise zero-sum scoring engine (+1/-1/0 per pair per hole) — v1
- ✓ Configurable handicaps per pair with hole distribution — v1
- ✓ Turbo holes (2x scoring multiplier) — v1
- ✓ 2-6 player support with dynamic pair generation — v1
- ✓ 1-36 hole support — v1
- ✓ PWA with offline support and installability — v1
- ✓ Game resume from localStorage — v1
- ✓ Score editing on results page with recalculation — v1

### Active

<!-- Current scope: rebuild for v2. -->

- [ ] Streamlined setup flow — same features (players, handicaps, turbo) but faster to complete
- [ ] Redesigned play screen with fast stroke input (minimal taps per player)
- [ ] Clear live scoring display — who's winning at a glance during play
- [ ] Rich results: winner spotlight with clear visual hierarchy
- [ ] Rich results: head-to-head pair breakdowns showing how each matchup went
- [ ] Rich results: hole-by-hole score trend graph
- [ ] Game history — save completed rounds, view past games
- [ ] Stats across rounds — win rates, score trends, improvement tracking
- [ ] Input validation at store level (strokes, handicaps, hole numbers)
- [ ] State versioning with migration for safe upgrades
- [ ] Hydration guard (loading state until store is ready)
- [ ] Test coverage for scoring logic and pair generation

### Out of Scope

- Real-time multiplayer / cloud sync — local-only is fine for now
- User accounts / authentication — single-device app
- Tournament mode — focus on single-round experience first
- Video or photo capture — not relevant to scoring
- Par-based scoring (stroke play) — this is pairwise match play only

## Context

This is a brownfield rebuild. The v1 app works and is deployed on Vercel. The core scoring engine (zero-sum pairwise with handicaps) is sound but lacks tests. The main problems are UX: setup takes too many taps, the play screen's +1/-1 numbers are hard to parse on the course, and results are a flat table with no storytelling.

The app is used on the golf course between holes — speed and clarity under sunlight on a phone screen are critical. Typical usage: 4 players, 18 holes, entering scores immediately after each hole while walking to the next tee.

Existing codebase analysis is in `.planning/codebase/` (7 documents covering stack, architecture, structure, conventions, testing, integrations, and concerns).

## Constraints

- **Tech stack**: Next.js 16 + React 19 + Zustand 5 + Tailwind CSS 4 + shadcn/ui — keep existing stack, no backend
- **Platform**: PWA deployed on Vercel — must remain offline-capable
- **Data**: localStorage only (no database) — game history stored locally
- **Device**: Mobile-first, used outdoors in sunlight — high contrast, large tap targets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep existing tech stack | Working well, no reason to change frameworks | — Pending |
| localStorage for history | No backend needed, keeps simplicity | — Pending |
| Rebuild in-place (not from scratch) | Reuse scoring engine and domain logic, improve UI layers | — Pending |

---
*Last updated: 2026-02-17 after initialization*
