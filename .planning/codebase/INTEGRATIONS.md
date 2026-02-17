# External Integrations

**Analysis Date:** 2026-02-17

## APIs & External Services

**None detected.**

This application has no external API integrations. It is a fully client-side, offline-capable PWA with no backend dependencies.

## Data Storage

**Databases:**
- None - Application uses localStorage only

**Local Storage:**
- localStorage key: `"golf-handicap-game"`
- Managed by: Zustand `persist` middleware
- Contents: Complete game state (players, handicaps, scores, hole data)
- Scope: Single browser/device (no cloud sync)

**File Storage:**
- Local filesystem only - PWA assets cached by Service Worker
- No cloud storage or file upload capability

**Caching:**
- Browser Cache API (via Service Worker in `public/sw.js`)
- Cache name: `"golf-handicap-v1"`
- Cached routes: `/`, `/setup`, `/handicap`, `/turbo`, `/play`, `/results`
- Cached assets: JavaScript, CSS, fonts, icons

**Session/In-Memory:**
- React component state via `useState`
- Zustand store in memory during session
- Persisted to localStorage on state change

## Authentication & Identity

**Auth Provider:**
- None - No user authentication

**Authorization:**
- Not applicable - Single-device, no multi-user or account system

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Browser console only (no structured logging)
- No log aggregation or remote error reporting

## CI/CD & Deployment

**Hosting:**
- Vercel (primary platform)
- Auto-deploy from `main` branch (inferred from `.vercel/` directory presence)
- No custom deployment configuration visible

**CI Pipeline:**
- Vercel's default Next.js pipeline
- Build: `npm run build`
- No explicit GitHub Actions or other CI config

**Build Environment:**
- Next.js 16.1.6 auto-configures for Vercel
- Pre-rendering strategy: Static Generation (all routes prerendered at build time)
- Output: Fully static HTML/CSS/JS (no server-side rendering needed)

## Environment Configuration

**Required env vars:**
- None - Application requires no environment variables

**Secrets location:**
- Not applicable - No secrets or API keys needed

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Service Workers & Browser APIs

**Service Worker Registered:**
- Path: `public/sw.js`
- Registration: On page load (via inline script in `src/app/layout.tsx`)
- Lifecycle events handled:
  - `install` - Precache all routes
  - `activate` - Clean up old caches
  - `fetch` - Intercept requests (network-first nav, cache-first assets)

**Browser Storage APIs Used:**
- `localStorage` - Game state persistence via Zustand
- `Cache API` - Service Worker asset caching
- `navigator.storage.persist()` - Request persistent storage (fallback for users denying quota)

**Browser Permissions Requested:**
- PWA installation prompt capture (via `beforeinstallprompt` event in `src/app/layout.tsx`)
- None that require user approval (no Geolocation, Camera, Microphone, etc.)

## Third-Party Services

**CDN & Fonts:**
- Google Fonts (Geist Sans, Geist Mono) - Via Next.js font optimization
- Vercel's CDN (for deployment assets)

**Icon Library:**
- Lucide React - Bundled locally, no external API calls

**UI Component Library:**
- shadcn/ui - Bundled locally, no external API calls

## Network Behavior

**All network traffic:**
- None for application logic
- Only Service Worker fetch for:
  - Navigation requests (network-first with fallback to cache)
  - Asset requests (cache-first with fallback to network)
  - Initial page loads from server (on new visits or hard refresh)

**Offline capability:**
- Full offline support after first visit
- All routes precached
- Game state persisted to localStorage
- No online-only features

---

*Integration audit: 2026-02-17*
