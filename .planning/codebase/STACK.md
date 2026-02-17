# Technology Stack

**Analysis Date:** 2026-02-17

## Languages

**Primary:**
- TypeScript 5 - All source code in `src/`, strict mode enabled

**Secondary:**
- JavaScript (ESNext) - Build configuration files (`.mjs` files)

## Runtime

**Environment:**
- Node.js (target ES2017) - Development and build time
- Browser (modern, PWA-capable) - Runtime execution
- No specific Node version pinned (inferred from Next.js 16.1.6 compatibility)

**Package Manager:**
- npm 10+ (inferred from `package-lock.json` presence)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.1.6 - React meta-framework with App Router (SSR/SSG, all pages prerendered)
- React 19.2.3 - UI rendering library
- React DOM 19.2.3 - DOM binding for React

**UI & Styling:**
- Tailwind CSS 4 - Utility-first CSS framework (new `@import` syntax via `@tailwindcss/postcss` 4)
- shadcn/ui 3.8.4 - Accessible component library (New York style, installed via `npx shadcn@latest add`)
- Lucide React 0.563.0 - Icon library (512+ icons for UI)

**State Management:**
- Zustand 5.0.11 - Lightweight state container with `persist` middleware for localStorage

**Component Utilities:**
- class-variance-authority 0.7.1 - Type-safe CSS class composition
- clsx 2.1.1 - Conditional className concatenation
- tailwind-merge 3.4.0 - Prevents conflicting Tailwind classes

**Animation:**
- tw-animate-css 1.4.0 - Animation utilities for Tailwind CSS

## Key Dependencies

**Critical:**
- Zustand `persist` middleware - Powers game state persistence to localStorage (key: `"golf-handicap-game"`)
- Radix UI 1.4.3 - Headless UI primitives for accessible components (underlying shadcn/ui)
- Next.js App Router - All routes in `src/app/` use server/client components with prerendering

**Infrastructure:**
- PostCSS 4 - CSS transformation (via `@tailwindcss/postcss`)
- TypeScript compiler - Type checking and transpilation (v5, strict)

## Configuration

**Environment:**
- No `.env` file detected - App is fully static, no secrets/API keys needed
- No runtime environment variables required
- All configuration is local to client state (localStorage via Zustand)

**Build:**
- `next.config.ts` - Next.js build configuration (empty template, no custom config)
- `tsconfig.json` - TypeScript compiler options (target ES2017, strict mode, path aliases)
- `postcss.config.mjs` - PostCSS plugins configuration (Tailwind CSS only)
- `eslint.config.mjs` - ESLint v9 flat config with Next.js + TypeScript rules
- `components.json` - shadcn/ui configuration (New York style, Tailwind with CSS variables)

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- shadcn/ui aliases: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`

## Platform Requirements

**Development:**
- Node.js 18+ (inferred from Next.js 16 + TypeScript 5 support)
- npm or compatible package manager
- Git for version control

**Production:**
- Vercel platform (primary deployment target)
  - Auto-deploy from `main` branch (indicated by `.vercel/` directory)
  - Supports Next.js out-of-the-box
  - No backend required (fully static/prerendered site)
- Browser with PWA support (for offline functionality)
  - Service Worker API
  - Cache Storage API
  - localStorage API

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (localhost:3000) with hot reload |
| `npm run build` | Production build (optimized for Vercel deployment) |
| `npm run start` | Run production server locally |
| `npm run lint` | Run ESLint with Next.js + TypeScript rules |

## PWA Configuration

**Service Worker:**
- Location: `public/sw.js`
- Strategy: Network-first for navigation, cache-first for assets
- Precaches all routes: `/`, `/setup`, `/handicap`, `/turbo`, `/play`, `/results`
- Cache name: `"golf-handicap-v1"`

**Web App Manifest:**
- Location: `public/manifest.json`
- App name: "Golf Handicap Scorer"
- Short name: "Golf Score"
- Start URL: `/`
- Display: `standalone` (full-screen PWA mode)
- Icons: 192×192 and 512×512 PNG (in `public/`)
- Theme color: `#15803d` (green)
- Background color: `#15803d`

**Apple Web App Meta Tags:**
- Registered in `src/app/layout.tsx`
- Capable of standalone mode
- Status bar: black-translucent
- Apple touch icon: 192×192 (`public/icon-192.png`)

## Fonts

**Google Fonts:**
- Geist Sans - Default font family (via `next/font/google`)
- Geist Mono - Monospace font (via `next/font/google`)
- Configured in `src/app/layout.tsx` with CSS variables

---

*Stack analysis: 2026-02-17*
