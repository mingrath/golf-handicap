# Feature Research

**Domain:** Mobile pairwise handicap golf scoring (match play variant, group format)
**Researched:** 2026-02-17
**Confidence:** MEDIUM — based on analysis of 15+ golf scoring apps (Golf GameBook, VPAR, PlayThru, Skins App, Beezer Golf, Kodiak Golf, Golf Pad, 18Birdies, mScorecard, TheGrint, Hole19, Arccos, Squabbit, GolfStatus, BlueGolf), NN/g input stepper guidelines, and mobile UX research. Confidence is MEDIUM (not HIGH) because most competitor analysis is from marketing pages and app store listings, not hands-on testing of each app.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| T1 | **Fast stroke input (< 3 taps per player per hole)** | Every golf app competitor achieves this. Golf Pad Quick Score does it in 2 taps. Current v1 uses +/- stepper which is slow for values far from default. | MEDIUM | Replace NumberStepper with direct-tap number row (3-7 as presets, tap to select). One tap per player. Par-based default (tap "4", done) is the gold standard. |
| T2 | **Auto-advance to next hole after submit** | Golf GameBook, PlayThru, Beezer all auto-advance. Users expect flow: enter scores -> submit -> land on next hole. Current v1 requires manual "Next Hole" tap. | LOW | Submit action should auto-navigate to hole+1. Add a brief flash confirmation (already exists) then advance. |
| T3 | **Clear "who's winning" leaderboard during play** | Every live scoring app (VPAR, PlayThru, Squabbit) shows rankings prominently. Current v1 hides scoreboard behind a toggle. | MEDIUM | Show mini-leaderboard (ranked list with running totals) directly below stroke input, always visible. No toggle needed. Use color coding (green = leading, red = trailing). |
| T4 | **Winner spotlight on results** | Current v1 already has this (Crown icon, glowing animation). Standard across Golf GameBook, VPAR. | DONE | Already implemented. Enhance with richer animation or confetti. |
| T5 | **Score editing with live recalculation** | Current v1 has this on results page. Standard across mScorecard, TheGrint. | DONE | Already implemented. Consider adding edit capability during play (tap any previous hole to re-enter). |
| T6 | **Offline operation (PWA)** | Golf courses have spotty signal. All serious golf apps work offline. | DONE | Already implemented via service worker. Needs testing verification (noted in CONCERNS.md). |
| T7 | **Game resume after app close** | LocalStorage persistence. Standard expectation. | DONE | Already implemented via Zustand persist. Needs hydration guard and state versioning. |
| T8 | **Hole-by-hole score trend visualization** | 18Birdies, mScorecard, Beezer Golf all show score-over-holes line charts. Users want to see momentum swings. | MEDIUM | Line chart showing each player's cumulative score across holes. Use Recharts (lightweight, SVG-based, ~45KB gzipped). Canvas not needed for 6-player x 36-hole datasets. |
| T9 | **Head-to-head pair breakdowns** | Core to this app's pairwise scoring model. VPAR Matchplay shows hole-by-hole timelines. Skins App shows per-match results. | MEDIUM | For each pair: show final score, who won which holes, handicap-adjusted strokes side-by-side. Collapsible accordion per pair on results page. |
| T10 | **Game history (list of past rounds)** | mScorecard, 18Birdies, TheGrint all store unlimited round history. Users expect to look back at past games. | MEDIUM | Save completed games to localStorage (or IndexedDB if storage grows). Show list with date, players, winner, course name (optional). |
| T11 | **Basic stats across rounds** | Golf GameBook tracks scoring averages, birdie counts. Beezer Golf tracks games won/lost. 18Birdies shows improvement over time. | MEDIUM | Win rate per player, average score per round, best/worst rounds. Depends on T10 (game history). |
| T12 | **Input validation at store level** | Not visible to users but prevents corrupt state. All production apps validate. Current v1 has zero validation (CONCERNS.md). | MEDIUM | Validate strokes (0-20), handicaps, hole numbers, player count (2-6) at Zustand action level. Return errors. |
| T13 | **State versioning with migration** | Required for safe upgrades. Current v1 has none. | LOW | Add `version: number` to persisted state. Implement migration map. Standard Zustand persist pattern. |
| T14 | **Hydration guard (loading state)** | Prevents flash of wrong state on page load. Current v1 redirects on missing config but has no loading state. | LOW | Add `isHydrated` flag to store. Show skeleton/spinner until hydrated. Prevents layout shift. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| D1 | **Swipe-based hole navigation** | Golf Pad and Beezer Golf use swipe left/right for hole navigation. More natural than tapping numbered circles. Current v1 has a scrollable hole navigator bar. | LOW | Add swipe gesture detection on the stroke input card. Swipe left = next hole, swipe right = previous. Keep numbered circles as secondary nav. |
| D2 | **Quick-setup with player presets** | No competitor focuses on this. Setup is always from scratch. For a friend group that plays weekly, re-entering names is annoying. | LOW | "Play again with same players" button on home screen. Store last-used player list. One tap to start same group. |
| D3 | **Score storytelling on results (narrative results)** | Most apps show flat tables. No competitor generates narrative summaries like "Ohm dominated holes 10-14 to overtake Mingrath." This is the biggest UX gap in the market. | HIGH | Generate text highlights: biggest comeback, longest winning streak, closest matchup, turbo hole drama. Requires post-game analysis algorithm. |
| D4 | **Results share as image** | Golf GameBook, mScorecard, 9Holes all support sharing. 9Holes even generates video scorecards. Most use screenshot or built-in share. | MEDIUM | Generate a styled results card (canvas-to-image or html2canvas). Use Web Share API for native sharing. Fallback to download PNG. |
| D5 | **Player-vs-player historical stats** | Beezer Golf tracks "games won and lost." No app shows lifetime head-to-head records between specific players. This is unique to pairwise scoring. | MEDIUM | "You vs Mingrath: 12 wins, 8 losses, 3 draws across 23 rounds." Requires T10 (game history) and player identity persistence across rounds. |
| D6 | **Animated results podium** | Kahoot!-style podium reveal is engaging and memorable. No golf app does this. Current v1 has a static winner display. | LOW | Staggered animation: 3rd place slides in, then 2nd, then 1st with celebration. CSS animations only, no heavy library needed. |
| D7 | **Haptic feedback on score submission** | Native feel on mobile. Subtle vibration on submit confirms action without looking at screen. Standard in iOS/Android native apps but rare in PWAs. | LOW | Use `navigator.vibrate()` API on score submit and game finish. Progressive enhancement (no-op if unsupported). |
| D8 | **Dark/light theme toggle** | Current v1 is dark-only. Golf is played in bright sunlight where dark themes can be hard to read. High-contrast light theme improves outdoor readability. | MEDIUM | Add light theme variant with high-contrast colors. Auto-detect system preference. Toggle in settings. Tailwind dark mode support makes this straightforward. |
| D9 | **Score trend sparklines in mini-leaderboard** | During play, show tiny inline trend lines next to each player's running total. At a glance: is this player trending up or down? No competitor does this during play. | MEDIUM | Tiny SVG sparklines (no library needed, 20-30 lines of code for basic path). Show last 5 holes of cumulative score. |
| D10 | **Undo last submission** | No golf scoring app has undo during play. Current v1 allows re-editing but not reverting. | LOW | Store previous hole state before submit. "Undo" button appears for 10 seconds after submit. Reverts to pre-submit state. |

### Anti-Features (Deliberately NOT Building)

Features that seem good but create problems for this specific product.

| # | Feature | Why Requested | Why Problematic | Alternative |
|---|---------|---------------|-----------------|-------------|
| A1 | **GPS course maps and distances** | Every major golf app has GPS. Seems like table stakes for "golf apps." | Completely different product category. Adds massive complexity (course database, map rendering, location services). This app is a scoring tool, not a rangefinder. Users already have a separate GPS app or watch. | Stay focused on scoring. Link to external GPS apps if needed. |
| A2 | **Real-time multiplayer / cloud sync** | Users might want to score from separate phones. | Requires backend, authentication, conflict resolution, real-time infrastructure. Massively increases complexity for a local friend-group tool. One phone is always the scorer in practice. | Keep single-device. If needed later, export/import game state as JSON for manual sync. |
| A3 | **User accounts and authentication** | Needed for cloud features. | Adds login friction to a tool that should launch in 2 seconds. No backend to manage. Privacy concerns for a casual scoring app. | Use device-local player profiles. Identify players by name, not accounts. |
| A4 | **Official USGA/R&A handicap calculation** | Users might expect "real" handicap tracking. | USGA Handicap Index requires 20+ round history, slope/course ratings, and is legally regulated. Implementing it incorrectly creates liability. This app uses per-round pairwise handicaps (strokes given), not official handicaps. | Clearly label handicaps as "strokes given for this round." Link to official handicap apps (TheGrint, GHIN) for official tracking. |
| A5 | **Tournament mode (brackets, flights, multiple rounds)** | Natural extension of group scoring. Golf GameBook, Golfify, Unknown Golf all support tournaments. | Exponential complexity increase. Bracket management, tee time scheduling, multi-round aggregation, elimination logic. Completely different UX flow. | Focus on single-round experience. If tournament demand is real, build as separate product/mode after v2 stabilizes. |
| A6 | **Shot-by-shot tracking (fairways, greens, putts)** | Arccos, Shot Scope, 18Birdies all track detailed shot data. | Completely different input model (per-shot vs per-hole). Slows down the scoring flow which is this app's core value. Users who want shot tracking already use dedicated apps. | Keep input as strokes-per-hole only. This is the app's speed advantage. |
| A7 | **Social feed / comments / likes** | Golf GameBook has a social feed with likes and comments. | Requires backend, moderation, user accounts. Distracts from the core on-course scoring experience. This is a utility, not a social network. | Share results via image export (D4) to existing social platforms (iMessage, LINE, WhatsApp). |
| A8 | **Betting / money tracking** | Skins App and GolfApp track bets and settle wagers. Popular feature request. | Legal gray area in many jurisdictions. Adds complexity to results display. Distracts from scoring clarity. | The pairwise scoring already maps to "who owes whom." Add optional "points value" per point in settings if users want to calculate payouts manually. |
| A9 | **Apple Watch / wearable companion** | Squabbit and Golf Pad have Watch apps. Convenient for on-course use. | Requires native app (not PWA). Different development stack. Small screen limits input options. Maintenance burden. | Optimize the phone PWA for maximum speed. The phone is already in the cart or pocket. |
| A10 | **AI-powered game analysis** | Emerging trend (Arccos AI caddie, Circles AI analysis). | Requires ML infrastructure, large datasets, backend processing. Overkill for a local pairwise scoring tool. | Simple rule-based highlights work fine (D3). "Player X won 5 straight holes" doesn't need AI. |

---

## Feature Dependencies

```
[T10] Game History
    |
    +--requires--> [T12] Input Validation (clean data for history)
    +--requires--> [T13] State Versioning (safe schema evolution)
    |
    +--enables--> [T11] Basic Stats Across Rounds
    |                 |
    |                 +--enables--> [D5] Player-vs-Player Historical Stats
    |
    +--enables--> [D4] Results Share as Image

[T1] Fast Stroke Input
    +--enhances--> [T2] Auto-advance After Submit
    +--enhances--> [D1] Swipe-based Hole Navigation
    +--enhances--> [D7] Haptic Feedback

[T3] Clear Live Leaderboard
    +--enhances--> [D9] Score Trend Sparklines

[T8] Score Trend Chart
    +--requires--> chart library (Recharts recommended)
    +--enhances--> [T9] Head-to-Head Pair Breakdowns

[T14] Hydration Guard
    +--requires--> [T13] State Versioning

[D2] Quick-setup Presets
    +--requires--> [T10] Game History (to remember players)

[D3] Score Storytelling
    +--requires--> [T9] Head-to-Head Pair Breakdowns (data source)
    +--requires--> [T8] Score Trend Chart (momentum data)

[D6] Animated Results Podium
    +--independent (CSS-only, no deps)

[D8] Dark/Light Theme
    +--independent (Tailwind config, no deps)

[D10] Undo Last Submission
    +--independent (store-level state snapshot)
```

### Dependency Notes

- **T10 (Game History) requires T12 + T13:** Saving games to history with bad data or no migration path creates permanent corruption. Validation and versioning must come first.
- **T11 (Stats) requires T10:** Can't compute cross-round stats without stored history.
- **D5 (Player-vs-Player History) requires T10 + T11:** Needs both history storage and stats computation to compare players across rounds.
- **D2 (Quick Presets) requires T10:** Remembering "last used players" requires game history storage.
- **D3 (Storytelling) requires T8 + T9:** Narrative generation needs both trend data and pair breakdown data as input.
- **T14 (Hydration Guard) requires T13:** Migration must run before the app can determine if state is valid.

---

## MVP Definition

### Launch With (v2.0)

Minimum viable improvement over v1 -- what justifies calling it v2.

- [x] **T1 — Fast stroke input** — Core value prop is speed. This is the #1 pain point.
- [x] **T2 — Auto-advance after submit** — Removes unnecessary tap, compounds speed gain.
- [x] **T3 — Clear live leaderboard** — Answers "who's winning?" without toggling views.
- [x] **T8 — Score trend chart** — Most requested visualization. Shows momentum.
- [x] **T9 — Head-to-head pair breakdowns** — Core to the pairwise model. Without this, pair results are invisible.
- [x] **T12 — Input validation** — Foundation for data integrity. Must ship before game history.
- [x] **T13 — State versioning** — Required for all future upgrades. Must ship early.
- [x] **T14 — Hydration guard** — Prevents confusing flash states.
- [x] **D6 — Animated results podium** — Low cost, high delight. Makes results memorable.
- [x] **D7 — Haptic feedback** — One line of code, noticeable improvement.

### Add After Validation (v2.x)

Features to add once core v2 is working and being used on the course.

- [ ] **T10 — Game history** — Add when v2 scoring is stable. Trigger: users ask "what was last week's score?"
- [ ] **T11 — Basic stats** — Add alongside game history. Trigger: 5+ games stored.
- [ ] **D1 — Swipe navigation** — Add when fast input is validated. Trigger: users still find hole-switching slow.
- [ ] **D2 — Quick-setup presets** — Add when game history exists. Trigger: same group plays 3+ times.
- [ ] **D4 — Results share as image** — Add when results page is finalized. Trigger: users screenshot results manually.
- [ ] **D8 — Dark/light theme** — Add when outdoor usability is tested. Trigger: sunlight readability complaints.
- [ ] **D10 — Undo last submission** — Add when scoring flow is validated. Trigger: users report accidental submissions.

### Future Consideration (v3+)

Features to defer until product-market fit is established.

- [ ] **D3 — Score storytelling** — Complex algorithm. Defer until results page design is mature and user expectations are understood.
- [ ] **D5 — Player-vs-player historical stats** — Requires player identity persistence across rounds (name matching or player profiles). Defer until game history has 20+ entries in real usage.
- [ ] **D9 — Score trend sparklines** — Nice polish but not critical. Defer until mini-leaderboard design is finalized.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| T1 Fast stroke input | HIGH | MEDIUM | **P1** |
| T2 Auto-advance | HIGH | LOW | **P1** |
| T3 Clear live leaderboard | HIGH | MEDIUM | **P1** |
| T12 Input validation | HIGH | MEDIUM | **P1** |
| T13 State versioning | HIGH | LOW | **P1** |
| T14 Hydration guard | MEDIUM | LOW | **P1** |
| T8 Score trend chart | HIGH | MEDIUM | **P1** |
| T9 Head-to-head breakdowns | HIGH | MEDIUM | **P1** |
| D6 Animated podium | MEDIUM | LOW | **P1** |
| D7 Haptic feedback | LOW | LOW | **P1** |
| T10 Game history | HIGH | MEDIUM | **P2** |
| T11 Basic stats | MEDIUM | MEDIUM | **P2** |
| D1 Swipe navigation | MEDIUM | LOW | **P2** |
| D2 Quick-setup presets | MEDIUM | LOW | **P2** |
| D4 Results share image | MEDIUM | MEDIUM | **P2** |
| D8 Dark/light theme | MEDIUM | MEDIUM | **P2** |
| D10 Undo submission | LOW | LOW | **P2** |
| D3 Score storytelling | HIGH | HIGH | **P3** |
| D5 Player history stats | HIGH | MEDIUM | **P3** |
| D9 Sparklines | LOW | MEDIUM | **P3** |

**Priority key:**
- **P1:** Must have for v2 launch
- **P2:** Should have, add in v2.x iterations
- **P3:** Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Golf GameBook | VPAR | Skins App | Beezer Golf | This App (v2) |
|---------|--------------|------|-----------|-------------|---------------|
| Score input speed | 2-3 taps/player | 2-3 taps/player | 2-3 taps/player | 1-2 taps/player (swipe) | **1 tap/player** (preset row) |
| Match play support | Yes (20+ formats) | Yes (matchplay mode) | Yes (13 game types) | Yes (20 side games) | **Pairwise only** (all C(n,2) pairs) |
| Live leaderboard | Yes | Yes (dynamic) | Yes | Yes | **Yes, always visible** |
| Head-to-head breakdown | Limited | Hole-by-hole timeline | Per-match results | Win/loss tracking | **Full pair analysis with adjusted strokes** |
| Score trend chart | Basic | No | No | "Eye-pleasing graphics" | **Per-player cumulative line chart** |
| Game history | Yes (unlimited) | Yes | Yes | Yes | **Yes (localStorage)** |
| Cross-round stats | Scoring averages | Basic | Basic (money won) | Games won/lost | **Win rates, avg score, trends** |
| Results sharing | Social feed + share | Share via app | Share | Share | **Image export + Web Share API** |
| Handicap model | USGA/WHS | Official | Per-game | Per-game | **Per-pair strokes given** |
| Setup speed | Moderate (course selection required) | Slow (GPS/course) | Moderate | Moderate | **Fast (no course needed)** |
| Offline support | Partial | Partial | Yes | Yes | **Full PWA offline** |
| Unique strength | Social features, format variety | GPS + live events | Money game tracking | Game format breadth | **Pairwise scoring depth, speed, pair breakdowns** |

### Competitive Position

This app occupies a niche that no major competitor serves well: **pairwise group scoring with handicaps, optimized for speed**. The big apps (GameBook, VPAR, 18Birdies) focus on GPS, official handicaps, and social features. The betting apps (Skins, Beezer) focus on game format variety. None of them prioritize the "enter scores as fast as possible and see pairwise results" workflow.

The differentiation strategy should be:
1. **Fastest input** -- beat every competitor on taps-per-hole
2. **Deepest pairwise analysis** -- no one else shows all C(n,2) pair breakdowns
3. **Most engaging results** -- storytelling and animation make results worth discussing

---

## Sources

- [Golf GameBook](https://www.golfgamebook.com/) — Feature list, scorecard format, social features, 20+ game formats
- [VPAR](https://vpar.com/) — GPS, matchplay mode, dynamic leaderboards, live scoring
- [PlayThru](https://www.golfplaythru.com/) — Live leaderboards, tournament scoring, mobile scorecard
- [Skins App](https://skinsapp.com/) — Nassau rules, 13 game types, money game tracking
- [Beezer Golf](https://www.beezergolf.com/) — 20 side games, stat tracking, trend visualization
- [Kodiak Golf](https://kodiakgolf.app/) — Scoring, games, GPS, stat tracking, head-to-head
- [Golf Pad Quick Score](https://support.golfpadgps.com/support/solutions/articles/6000225549-keeping-score-in-quick-score) — Score input UX: 2-tap flow, swipe navigation
- [18Birdies](https://18birdies.com/) — Stat analysis charts, score-over-time visualization, social competitions
- [mScorecard](https://www.mscorecard.com/) — Full round history, advanced statistics, cross-platform sharing
- [TheGrint](https://thegrint.com/) — USGA handicap tracking, detailed scorecard, improvement tracking
- [Hole19](https://www.hole19golf.com/) — Clean UX, accurate yardages, fast scorekeeping, minimal distractions
- [8 Top Golf Scoring Apps Compared](https://www.golfplaythru.com/blog/8-of-the-top-golf-scoring-apps-compared) — Feature comparison across PlayThru, Golfify, Squabbit, GameBook, VPAR, GolfStatus, BlueGolf, Golf Genius
- [NN/g Input Stepper Guidelines](https://www.nngroup.com/articles/input-steppers/) — Min 1cm x 1cm targets, hold-to-increment, text-field stepper hybrid, Fitts' Law considerations
- [Golf App UX Best Practices 2025](https://www.golfcoursetechnologyreviews.org/buying-guide/comprehensive-buying-guide-to-golf-course-mobile-apps-in-2025) — One-handed use, battery life, rhythm-preserving UX
- [PWA Offline Storage Patterns](https://web.dev/learn/pwa/offline-data) — IndexedDB for structured data, localStorage for small key-value, storage quotas
- [React Chart Libraries 2026](https://blog.logrocket.com/best-react-chart-libraries-2025/) — Recharts (lightweight, SVG), Chart.js (Canvas), performance comparison

---
*Feature research for: Golf Handicap Scorer v2 — mobile pairwise handicap scoring PWA*
*Researched: 2026-02-17*
