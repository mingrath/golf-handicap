# Phase 1: Store Hardening & Test Foundation - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the state layer trustworthy: validate all inputs at the store level, version persisted state for safe upgrades, replace weak ID generation, wire zero-sum verification, fix the setup reset bug, add hydration guard, and cover all pure logic with tests. This phase touches `game-store.ts`, `scoring.ts`, `pairs.ts`, `types.ts`, and page-level store usage — no new features, no UI redesign.

</domain>

<decisions>
## Implementation Decisions

### Validation behavior
- Accept invalid input at the UI level, then show a toast notification warning — don't prevent typing/tapping, but require correction before submission proceeds
- Handicap values are capped at the current hole count (dynamic max, not fixed 18) — can't give more strokes than holes being played
- Stroke values validated to 0-20 range
- Player count validated to 2-6 at store level
- Hole numbers validated against game config
- Corrupted v1 data: attempt to recover what's salvageable, warn about anything lost via toast

### Loading/hydration UX
- Show app logo + centered spinner while store hydrates from storage
- Target under 200ms for hydration — if it takes longer, treat as an error condition and show recovery options
- No skeleton layout — keep it simple with the branded loading screen

### Migration strategy
- This is mostly a personal app (user + friends), not a large user base
- v2 starts with a clean slate — no migration of v1 game data into new history system
- State versioning still needed for future v2.x upgrades
- Zustand persist `version` field with cascading `if (version < N)` migration pattern

### Test coverage scope
- Full coverage of pure scoring functions: calculatePairHoleResult, getRunningTotals, getFinalRankings, verifyZeroSum
- Full coverage of pair generation: generatePairs, makePairKey, parsePairKey, distributeHandicapHoles
- Integration-level tests for store actions: submitHoleStrokes, setHandicap, resetGame
- Edge case coverage: 6 players x 36 holes, all ties, max handicap, turbo on every hole
- Pre-commit hook to run tests before every commit (safety net)
- Framework: Vitest

### Claude's Discretion
- Toast notification library choice (shadcn/ui toast or custom)
- Exact error messages wording
- Test file organization (co-located vs `__tests__` directory)
- Pre-commit hook implementation (husky, simple-git-hooks, or lint-staged)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The key constraint is that validation should not slow down the on-course scoring flow (Phase 2 builds on this).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-store-hardening-and-test-foundation*
*Context gathered: 2026-02-17*
