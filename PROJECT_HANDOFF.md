# PROJECT_HANDOFF.md

Generated 2026-09-18 by an AI assistant analyzing the current state of the `/Users/root1/NFT` repository (project: **monvravex-frontend**). This document is self-contained: read it, then explore the repo directly. Where this document and the existing internal docs (`README.md`, `AGENT.md`, `API.md`, `ARCHITECTURE.md`, `DESIGN.md`, `FRONTEND_PARITY.md`, `IMPLEMENTATION_STATUS.md`, `TODO.md`, `USER_FLOW.md`, `ACTION_MAP.md`) disagree with the actual code, **the code is the source of truth**.

---

## 1. Project Overview

**Monvravex** is a custodial NFT marketplace frontend (a from-scratch React SPA rewrite of a pre-existing production Next.js app). The product lets users:

- browse/discover NFT collections and individual NFTs (`home`, `collection`, `nft` pages),
- authenticate (login/signup/password reset/account activation) via cookie-based sessions,
- manage a custodial balance (top up / withdraw funds),
- view owned NFTs (`owns`) and transaction history,
- manage profile (identity, security, settings),
- use a referral system,
- receive notifications.

**Current stage:** early/mid implementation. The React SPA has been built essentially from scratch against a reverse-engineered API contract (the original production frontend's source is not in this repo — only its compiled bundle was available for analysis). All routes/pages exist, are typed, pass lint/typecheck/build/tests, and follow the documented design system. **However, almost nothing has been verified against a live, authenticated backend session** — there are no test credentials/invite code available to the team yet.

**Main current blocker / top priority:** obtaining test credentials (or a staging account/invite) to verify auth flows and, critically, financial mutations (buy/sell/topup/withdraw) against the real backend. Until that happens, this code is "implemented but unverified" for most authenticated functionality.

---

## 2. Tech Stack

- **Language:** TypeScript 5.9.3, strict mode (`strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`)
- **Framework:** React 19.3.0 (function components, hooks, `React.lazy` for route splitting)
- **Routing:** React Router 7.18.4 (data-less route table, no loaders/actions used — plain component routes)
- **Build tool:** Vite 8.3.0 (`@vitejs/plugin-react`), target `es2022`, sourcemaps on
- **Validation:** Zod 4.6.5 — all API responses parsed/validated against Zod schemas
- **Styling:** plain CSS via design tokens in `src/app/globals.css` (1154 lines) — no CSS-in-JS, no Tailwind, no CSS modules
- **State management:** no global store (no Redux/Zustand/Jotai). Auth is a single React Context (`AuthProvider`). Server/page data is local per-page state via a custom `useApiResource` hook. Search/filter state lives in URL query params.
- **API layer:** hand-written `fetch`-based client (`apiRequest`) + typed service methods, no axios/react-query/SWR
- **Icons:** lucide-react 1.46.0
- **Localization:** none. UI copy is hardcoded Russian throughout; no i18n library, despite the backend storing a per-user language preference (flagged as unaddressed in `TODO.md`)
- **Testing:** Vitest 5.0.1 + @testing-library/react 16.3.3 + jsdom — 5 test files, 14 tests, all passing
- **Linting/formatting:** ESLint 9.39.2 (flat config, `eslint.config.mjs`) + typescript-eslint 8.57.1 + eslint-plugin-react-hooks; Prettier 3.9.7 present as devDependency
- **Deployment:** Vercel (`vercel.json`) — SPA rewrites + strict CSP/security headers; dev-time API proxy in `vite.config.ts` and prod-time rewrite in `vercel.json` both point `/api/*` → `https://back.monvravex.com/api/*`
- **Package manager:** npm (package-lock.json present, `node_modules` already installed)
- **Node requirement:** `>=22.12.0` (see `package.json` engines)

---

## 3. Repository Structure

```
src/
  main.tsx                 entry point — mounts <App> wrapped in AuthProvider
  app.tsx                  route table (React Router 7), all pages lazy-loaded
  app/
    globals.css             design-token CSS (colors, type scale, spacing, components)
    c/[code]/                EMPTY directory — leftover Next.js-style scaffold artifact, no files, harmless cruft
  auth/
    auth-context.tsx         AuthProvider — discriminated-union auth state, login/signup/logout/refresh
    route-guards.tsx          ProtectedRoute / PublicOnlyRoute wrappers used in app.tsx
  components/
    client-layout.tsx         authenticated app shell (nav, theme toggle)
    activation-gate.tsx, brand.tsx, collection-card.tsx, nft-card.tsx, notifications-menu.tsx
    ui/                       button.tsx, text-field.tsx, page-state.tsx (loading/empty/error), safe-media.tsx
  pages/                    one file per route (landing, auth, activation, home, collection, nft, owns, payments, profile, history, referral, not-found)
  lib/
    api/
      client.ts               apiRequest() — transport: base URL resolution, credentials:"include", 15s timeout via AbortController, dispatches an AUTH_INVALID_EVENT on 401
      services.ts              api.* — one typed method per backend endpoint
      schemas.ts               Zod schemas for every response shape (largest file in src/, 181 lines)
      errors.ts                ApiError class + getUserFacingError() → Russian user-safe messages
    hooks/
      use-api-resource.ts      generic hook for fetching + AbortController lifecycle per page
      use-debounced-value.ts
    formatters.ts              number/money/date/address formatting
    validation.ts, navigation.ts, form-data.ts, ui.ts
  test/setup.ts               vitest setup
```

Architecture is deliberately small and flat — no file in `src/` exceeds ~180 lines (`AGENT.md` mandates this kind of discipline). There is no `src/features/` or domain-module split; pages import directly from `lib/api` and `components/`.

### Most important architectural files
- `src/app.tsx` — the entire route map; read this first to know what pages exist and which are protected.
- `src/auth/auth-context.tsx` — all session/auth logic and the auth state machine.
- `src/lib/api/client.ts` — the single chokepoint all network requests go through (timeout, credentials, auth-invalid handling).
- `src/lib/api/services.ts` + `src/lib/api/schemas.ts` — the API contract as understood by the frontend; **this is a reverse-engineered contract, not a backend-confirmed one** (see `API.md`).
- `src/app/globals.css` — the entire visual design system in one file.

---

## 4. Current Git State

- **Repository has zero commits** (`git log` fails: "your current branch 'dev' does not have any commits yet").
- Current branch: `dev`. No other branches exist. No remotes configured.
- **Every file in the repo is untracked** — nothing has ever been staged or committed. Working tree is effectively "initial import, not yet committed."
- Untracked files include all source (`src/`), all docs, and all config files listed in the git status snapshot (`.env.example`, `.gitignore`, `*.md` docs, `eslint.config.mjs`, `index.html`, `package.json`/`package-lock.json`, `tsconfig.json`, `vercel.json`, `vite.config.ts`, `vitest.config.ts`).
- **`AGENT.md` policy (already documented, must be respected):** all commits/pushes are restricted to the `dev` branch; `main` may only be touched when the user's current message explicitly contains the word "main."
- No PRs, no CI configuration currently in the repo.

---

## 5. Current Implementation Status

### Completed
- Full route/page scaffold for every planned screen (landing, auth flows, activation, home/discovery, collection detail, NFT detail, owned NFTs, topup/withdraw, profile w/ identity+security+settings+history, referral). Files: `src/app.tsx`, `src/pages/*`.
- Auth state machine and route guards (unauthenticated/authenticated/unknown states, protected vs. public-only routes). Files: `src/auth/*`.
- Typed API transport + full service layer + Zod validation for every known endpoint. Files: `src/lib/api/*`.
- Design system implementation (dark/light tokens, typography, spacing, component styles) matching `DESIGN.md`. File: `src/app/globals.css`.
- Unit test suite: 5 test files, 14 tests, all passing (covers auth context, API transport/error mapping, route guards — see `.test.tsx`/`.test.ts` files next to their subjects).
- Lint, typecheck, and build all pass cleanly with zero errors/warnings (verified fresh, see §13).
- Security header configuration for production (`vercel.json`: strict CSP, no inline scripts, frame-ancestors none, etc.).

### Partially Completed
- **Authenticated-flow verification** — code paths exist and are typed, but per `IMPLEMENTATION_STATUS.md`/`TODO.md`, have never been exercised against a real authenticated backend session (no test credentials available). This covers: login/signup/activation, avatar upload, notifications (mark-read), payment check lifecycle (5s-interval polling up to 10 min), and — most critically — buy/sell/unsell mutations. Files: `src/pages/payments.tsx`, `src/pages/profile.tsx`, `src/components/notifications-menu.tsx`, `src/lib/api/services.ts`.
- **API response schemas** — `Zod` schemas in `src/lib/api/schemas.ts` are reconstructed from the production bundle's runtime behavior, since the backend's published OpenAPI spec (`https://back.monvravex.com/openapi.json`) declares response bodies as empty `{}`. Real shapes are unconfirmed by the backend team.
- **Integration test coverage** — auth restore and basic validation are covered, but timeout, malformed-payload, and mutation-error cases are not yet tested (per `TODO.md` High priority).

### Not Started (per TODO.md / doc review, and confirmed absent in code)
- Localization/i18n — UI is Russian-only; no i18n library, no translation keys system, despite backend storing per-user language.
- CSRF-protection confirmation (this is a backend-side task the frontend depends on but cannot implement itself).
- SPA fallback verification on the actual production hosting target (Vercel config exists but is unverified live).
- Branch protection for `main` on the Git hosting side.
- Route-level code splitting beyond the existing `React.lazy` per-page split (e.g., further chunk optimization).
- E2E test suite (Playwright/Cypress or similar) — none present, only unit tests.
- WCAG keyboard/screen-reader manual audit (only automated lint checks exist).
- Visual regression testing across breakpoints.
- Media/CDN proxy policy for external NFT images.
- Performance budgets in CI (no CI exists yet).

---

## 6. Pages / Routes

All routes defined in `src/app.tsx`, all components lazy-loaded via `React.lazy`.

| Route | Component | Purpose | State | Guard |
|---|---|---|---|---|
| `/` | `pages/landing` | Marketing/entry landing page | Implemented | Public |
| `/auth/login` | `pages/auth` (`mode="login"`) | Login | Implemented, unverified live | PublicOnly |
| `/auth/signup` | `pages/auth` (`mode="signup"`) | Registration | Implemented, unverified live | PublicOnly |
| `/auth/reset-password` | `pages/auth` (`mode="reset"`) | Password reset | Implemented, unverified live | PublicOnly |
| `/auth/activate` | `pages/activation` | Account activation | Implemented, unverified live | PublicOnly |
| `/login`, `/register` | — | Legacy redirects → `/auth/login`, `/auth/signup` | Implemented | — |
| `/item/:nftId` | — | Legacy redirect → `/client/collectible/:nftId` | Implemented | — |
| `/profile` | — | Legacy redirect → `/client/profile` | Implemented | — |
| `/c/:code` | (empty `app/c/[code]/` dir — page unclear) | Likely invite/referral code entry point; directory has no files, needs investigation | **Needs investigation** | Public |
| `/client/main` | `pages/home` | Marketplace discovery/home | Implemented, unverified live | Protected |
| `/client/collection/:collectionId` | `pages/collection` | Collection detail | Implemented, unverified live | Protected |
| `/client/collectible/:nftId` | `pages/nft` | NFT detail | Implemented, unverified live | Protected |
| `/client/owns` | `pages/owns` | Owned NFTs | Implemented, unverified live | Protected |
| `/client/topup` | `pages/payments` (`mode="topup"`) | Add funds | Implemented, **financial mutation unverified** | Protected |
| `/client/withdraw` | `pages/payments` (`mode="withdraw"`) | Withdraw funds | Implemented, **financial mutation unverified** | Protected |
| `/client/profile` | `pages/profile` (`section="identity"`) | Profile identity | Implemented, unverified live | Protected |
| `/client/profile/security` | `pages/profile` (`section="security"`) | Security settings | Implemented, unverified live | Protected |
| `/client/profile/settings` | `pages/profile` (`section="settings"`) | Account settings | Implemented, unverified live | Protected |
| `/client/profile/history` | `pages/profile` (`section="history"`) / `pages/history` | Transaction history | Implemented, unverified live | Protected |
| `/client/referral` | `pages/referral` | Referral program | Implemented, unverified live | Protected |
| `*` | `pages/not-found` | 404 | Implemented | Public |

**Known issue:** `src/app/c/[code]/` is an empty directory with no files — appears to be leftover scaffold (likely a stale Next.js-style dynamic route folder never populated or already migrated into `app.tsx`'s `/c/:code` route). Worth confirming whether it's dead cruft to delete or an unfinished page.

---

## 7. Current UI / Design State

Defined in `DESIGN.md` and implemented in `src/app/globals.css` (single 1154-line token/component stylesheet — no CSS-in-JS or modules).

- **Layout:** SPA shell via `src/components/client-layout.tsx` for authenticated routes (nav + theme toggle); landing/auth pages likely use their own simpler layout (not yet audited component-by-component).
- **Theme:** dark/light mode toggle, persisted to `localStorage` under key `"theme"`.
- **Design references:** OpenSea/Magic Eden cited as *UX* references only, explicitly not visual clones.
- **Components documented in DESIGN.md:** header, cards (`collection-card.tsx`, `nft-card.tsx`), tables, buttons (`ui/button.tsx`), forms (`ui/text-field.tsx`), page states (`ui/page-state.tsx` — unified loading/empty/error UI), safe media handling (`ui/safe-media.tsx` — guards against unsafe image URLs).
- **Explicit "forbidden patterns"** per `DESIGN.md`: no fake/mock data shown as real, no color-only status indicators (accessibility), no critical actions hidden behind hover-only affordances.
- No component library / design-system package is used — everything is hand-rolled to spec.
- Since this is a from-scratch rewrite, there is no "old design residue" in the code itself — the old frontend isn't in this repo at all (only its compiled bundle was used as a reference during analysis, per `ARCHITECTURE.md`).

---

## 8. Functional Systems

- **Authentication:** `src/auth/auth-context.tsx`. Discriminated-union state (`unknown` / `unauthenticated` / `authenticated`). Cookie-based session (`auth_token`, HttpOnly, set server-side) — **no tokens stored in localStorage** (AGENT.md security rule followed). Listens for a custom `AUTH_INVALID_EVENT` dispatched by the API client on 401/"Not authenticated" responses, to trigger logout/redirect. `route-guards.tsx` provides `ProtectedRoute`/`PublicOnlyRoute`. **Status: implemented, live-unverified** (no test account).
- **API/data loading:** `src/lib/api/client.ts` → `services.ts` → Zod validation (`schemas.ts`) → consumed via `use-api-resource.ts` hook directly in pages, no caching layer. 15-second request timeout via combined `AbortController` (caller signal + timeout signal). Base URL resolved from `VITE_API_BASE_URL` env var, falling back to same-origin `/api` (proxied in dev via Vite, rewritten in prod via Vercel).
- **Forms:** handled per-page with local component state; `lib/form-data.ts` and `lib/validation.ts` provide shared helpers. No form library (no react-hook-form/formik).
- **Payments (topup/withdraw):** `src/pages/payments.tsx`, mode-switched. Includes a documented 5-second polling loop for payment status, capped at 10 minutes. **Financial mutations are the single highest-risk unverified area** — real money-equivalent operations with zero live testing so far.
- **Notifications:** `src/components/notifications-menu.tsx`. UI wired to backend, but translation/copy keys for titles/descriptions are not yet published by backend — currently unverified content correctness.
- **Localization/languages:** not implemented (see §5/§9).
- **Persistence/localStorage:** only `theme` (UI preference) and a temporary `invite_code` (cleared after signup) — nothing sensitive stored client-side.
- **Loading/error states:** unified via `src/components/ui/page-state.tsx`, used consistently across pages per `DESIGN.md`'s forbidden-patterns rule (no silent failures).
- **Error handling:** `src/lib/api/errors.ts` — `ApiError` class + `getUserFacingError()` mapping raw errors to safe, Russian-language user-facing messages (prevents leaking backend internals).
- **Referral system:** `src/pages/referral.tsx` — implemented but unverified live; `/c/:code` route's actual purpose/component is unclear (see §6 known issue).

---

## 9. Data Flow / Architecture

```
Backend (https://back.monvravex.com)
   ↓ (fetch, credentials:"include", via /api proxy in dev / Vercel rewrite in prod)
src/lib/api/client.ts  (apiRequest: timeout, abort, auth-invalid event dispatch)
   ↓
src/lib/api/services.ts  (typed method per endpoint, e.g. api.getCollection(id))
   ↓
src/lib/api/schemas.ts  (Zod .parse() — throws/normalizes on shape mismatch)
   ↓
src/lib/hooks/use-api-resource.ts  (per-page fetch lifecycle, loading/error/data state)
   ↓
src/pages/*.tsx  (renders via src/components/*, src/components/ui/*)
```

- **No global client-side state/store.** Each page owns its own server-state fetch. The only cross-cutting state is auth (`AuthProvider`, app-wide) and URL query params (search/filter state).
- **Tightly coupled parts:** `client.ts` is a single chokepoint — every network call and the global "session became invalid" signal flows through it, so changes there affect the entire app. `schemas.ts` is equally central: since backend response shapes are *reconstructed, not officially confirmed*, any real-world mismatch between `schemas.ts` and the actual backend response will surface as a runtime Zod validation failure across whichever page hits that endpoint. This is the single biggest architectural risk area (see §14/§15).
- **Potentially dangerous changes:** modifying `src/lib/api/schemas.ts` or `client.ts` without a live backend to test against is high-risk — there's no way to confirm correctness until real credentials exist.

---

## 10. Important Files

- `src/app.tsx` — entry point for understanding what exists: full route table.
- `src/main.tsx` — app bootstrap (AuthProvider wrapping).
- `src/auth/auth-context.tsx` — all session/auth logic; read before touching anything auth-related.
- `src/auth/route-guards.tsx` — protected/public route logic.
- `src/lib/api/client.ts` — network transport chokepoint (timeout, credentials, auth-invalid signaling).
- `src/lib/api/services.ts` — canonical list of every backend endpoint the frontend calls.
- `src/lib/api/schemas.ts` — the (unconfirmed) API response contract; biggest source of runtime risk.
- `src/lib/api/errors.ts` — user-facing error message mapping.
- `src/lib/hooks/use-api-resource.ts` — the pattern every page follows for data fetching.
- `src/app/globals.css` — entire design system in one file.
- `vite.config.ts` / `vercel.json` — dev/prod API proxying and security headers; must stay in sync if the backend origin ever changes.
- `.env.example` — the only required env var is `VITE_API_BASE_URL` (empty by default = same-origin `/api`).
- `AGENT.md` — mandatory ruleset for any AI/dev working on this repo (Russian-language; covers coding standards, git policy, security rules — read this in full before making changes).
- `API.md`, `ARCHITECTURE.md`, `DESIGN.md` — detailed reference docs, largely accurate as of 2026-09-17.

---

## 11. Environment / Configuration

`.env.example` (only file/variable present):
```
VITE_API_BASE_URL=<optional, empty by default>
```
- If empty, the app falls back to same-origin `/api`, which is proxied to `https://back.monvravex.com` by `vite.config.ts` (dev) or rewritten by `vercel.json` (prod).
- `.gitignore` excludes `.env`, `.env.local`, `.env.*.local` (secrets kept out of git), plus `dist/`, `.vite/`, `node_modules/`, `coverage/`, `*.tsbuildinfo`, `*.log`, `.DS_Store`.
- No other environment variables are declared or referenced in the codebase (single-var config surface).
- **Production API origin:** `https://back.monvravex.com` (hardcoded in `vite.config.ts` and `vercel.json`, not env-driven — changing backend origin requires editing both files).
- Production CSP is strict (`connect-src 'self' https://back.monvravex.com`) — any new external service/API call will require a CSP header update in `vercel.json`.

---

## 12. How to Run the Project

```bash
npm install          # dependencies (already installed in this checkout)
npm run dev           # start Vite dev server on port 3000, proxies /api to backend
npm run build          # tsc -b && vite build → production bundle
npm run preview        # preview the production build locally
npm run lint            # eslint .
npm run typecheck        # tsc --noEmit
npm run test             # vitest (watch mode)
npm run test:run          # vitest run (CI mode, single pass)
npm run check              # runs lint + typecheck + test:run + build, in sequence
```

---

## 13. Build / Test Status

All checks run fresh against the current working tree (2026-09-18):

| Check | Result |
|---|---|
| `npm run typecheck` | **PASS** — zero errors |
| `npm run lint` | **PASS** — zero errors/warnings |
| `npm run test:run` | **PASS** — 5 test files, 14 tests, all passing |
| `npm run build` | **PASS** — builds in ~345ms, main chunk ~370KB (~114KB gzip) + route-split chunks, sourcemaps generated |

No failures to report. Note: `IMPLEMENTATION_STATUS.md` claims "Unit tests: DONE (9 tests)" — this is **stale**; actual current count is 14.

---

## 14. Known Bugs / Problems

No functional bugs were found in static analysis, lint, typecheck, build, or the existing unit test suite — all pass cleanly. Issues below are about **unverified functionality** and **documentation staleness**, not confirmed defects.

### Critical
- **No live verification of authenticated flows or financial mutations** (buy/sell/unsell/topup/withdraw). This is the single biggest open risk — code is typed and unit-tested but has never executed against a real backend session. Files: `src/pages/payments.tsx`, `src/pages/nft.tsx` (buy/sell), `src/auth/auth-context.tsx`. Blocked on obtaining test credentials/invite.

### High
- **API response schemas are reconstructed, not backend-confirmed** — the backend's published OpenAPI spec returns `{}` for response bodies. Any real mismatch will surface as a Zod parse failure at runtime for that endpoint. File: `src/lib/api/schemas.ts`.
- **CSRF protection is unconfirmed** on the backend side for cookie-auth mutation endpoints — frontend cannot enforce this itself.

### Medium
- **Empty `src/app/c/[code]/` directory** — unclear if dead scaffold cruft or an unfinished page for the `/c/:code` route. Needs investigation before either deleting or implementing.
- **`IMPLEMENTATION_STATUS.md` is stale** on at least one data point (claims 9 unit tests; actual is 14).
- **SPA fallback hosting behavior unverified** in the actual production Vercel deployment (config exists, not live-tested).

### Low
- No localization — UI hardcoded to Russian despite backend storing per-user language preference.
- No CI configured yet (no `.github/workflows` or equivalent found).

---

## 15. Technical Debt / Risks

- **`src/lib/api/schemas.ts` and `client.ts` are the highest-leverage, highest-risk files** — nearly every page depends on them, and their correctness against the real backend is unconfirmed. Any edit here has wide blast radius across the whole app.
- **No integration/E2E tests** — the 14 unit tests cover auth context, API transport, and error mapping in isolation, but nothing exercises a full page against a real or mocked backend end-to-end. Regressions in page-level composition (e.g., a page passing the wrong prop into `use-api-resource`) would not be caught today.
- **Single-file CSS design system (1154 lines)** — not modularized per component; large, but per `AGENT.md`'s architecture rules this seems intentional rather than accidental debt. Still, it's a single point of contention if multiple people/agents edit styling concurrently.
- **Hardcoded production API origin** in two separate config files (`vite.config.ts`, `vercel.json`) — must be kept manually in sync; no single source of truth for the backend URL besides the optional `VITE_API_BASE_URL` env override.
- **No CI/CD pipeline present** — `npm run check` exists as the intended pre-merge gate but nothing enforces it automatically yet.
- **Leftover empty directory** (`src/app/c/[code]/`) suggests a partial migration or scaffold step that wasn't cleaned up — low risk on its own, but a reminder that a quick audit of `src/app/` for other stray artifacts might be worthwhile.

---

## 16. Recent Work

Since there is no git history (zero commits), "recent work" is inferred from doc timestamps and content, not commit log:

- All internal docs (`README.md` through `ACTION_MAP.md`) are dated **2026-09-17**, indicating a single recent, large push: a production/API audit of the old frontend, followed by building the entire new React SPA scaffold from scratch in one sustained effort.
- The immediately preceding step (per `ARCHITECTURE.md`) was reverse-engineering the old Next.js frontend's compiled bundle plus the backend's OpenAPI spec to reconstruct the API contract (`API.md`), since no old frontend source was available in this repo.
- The logical next step, already identified by the project's own `TODO.md`, is verification against a live backend — specifically obtaining test/staging credentials, which is explicitly called out as the top Critical-priority blocker.
- This repository has never been committed to git — the very first commit (or commits) for this codebase have not yet been made. That is itself notable "recent state": everything here is pre-commit, pre-review.

---

## 17. Recommended Next Tasks

### P0 — necessary now
1. `[HANDOFF-001] Obtain test/staging credentials or invite code`
   - What: Acquire a working test account, invite code, or staging environment access from whoever controls `https://back.monvravex.com`.
   - Where: N/A (external dependency, not code).
   - Why: Every other verification task (auth, payments, notifications, avatar upload) is blocked on this. It is the single highest-leverage unblock in the whole project.
   - Dependencies: none — this should happen before any further coding work on authenticated flows.
   - Acceptance criteria: a working login succeeds against the real backend and returns an authenticated session cookie.

2. `[HANDOFF-002] Verify auth flows against live backend`
   - What: Manually (or via a quick script) exercise login/signup/activate/reset-password against the real backend using credentials from HANDOFF-001; confirm `auth-context.tsx` state transitions match reality.
   - Where: `src/auth/auth-context.tsx`, `src/pages/auth.tsx`, `src/pages/activation.tsx`.
   - Why: `IMPLEMENTATION_STATUS.md` flags this as entirely unverified; it's the gateway to every other authenticated feature.
   - Dependencies: HANDOFF-001.
   - Acceptance criteria: each auth flow completes successfully end-to-end against production/staging, and any schema mismatches found in `schemas.ts` are corrected.

3. `[HANDOFF-003] Verify buy/sell/unsell and topup/withdraw mutations on safe test data`
   - What: Carefully test financial mutation endpoints with minimal, reversible amounts/items, per `TODO.md`'s explicit warning that these "cannot be repeated automatically."
   - Where: `src/pages/payments.tsx`, `src/pages/nft.tsx`, `src/lib/api/services.ts`.
   - Why: Highest financial/product risk area in the whole codebase; currently zero real-world confirmation.
   - Dependencies: HANDOFF-001, HANDOFF-002.
   - Acceptance criteria: at least one successful topup, one withdraw, one buy, and one sell/unsell completed and confirmed correct against backend state, with no unexpected side effects.

4. `[HANDOFF-004] Investigate and resolve the empty src/app/c/[code]/ directory`
   - What: Determine whether this is dead scaffold or an unimplemented page for the `/c/:code` route; either delete it or implement the intended page.
   - Where: `src/app/c/[code]/`, `src/app.tsx`.
   - Why: Ambiguous state — could be confusing to future contributors and may indicate a missed route implementation.
   - Dependencies: none.
   - Acceptance criteria: directory either removed with a clear commit message, or populated with a working page matching `/c/:code`'s intended purpose (referral/invite code entry, per naming convention).

### P1 — after P0
1. `[HANDOFF-005] Confirm CSRF protection on backend, document frontend assumptions`
   - What: Coordinate with backend to confirm Origin/SameSite/CSRF policy for cookie-auth mutation endpoints; document the confirmed policy.
   - Where: `API.md`, backend coordination (external).
   - Why: Frontend cannot self-verify this; currently an open security assumption.
   - Dependencies: backend team access.
   - Acceptance criteria: `API.md` updated with confirmed CSRF policy details.

2. `[HANDOFF-006] Add integration tests for API error/edge cases`
   - What: Add tests for request timeout, malformed payload, and mutation error responses in `lib/api`.
   - Where: `src/lib/api/*.test.ts`.
   - Why: Currently only happy-path/auth-restore cases are covered.
   - Dependencies: none.
   - Acceptance criteria: new tests cover at least timeout, malformed JSON, and a representative mutation failure; `npm run test:run` still passes.

3. `[HANDOFF-007] Verify SPA fallback and headers on actual Vercel deployment`
   - What: Deploy to a real Vercel project and confirm direct navigation to `/client/*` routes returns `index.html`, and that CSP/security headers don't break the app in a real browser.
   - Where: `vercel.json`.
   - Why: Config exists but has never been tested against real hosting.
   - Dependencies: Vercel project access.
   - Acceptance criteria: direct URL loads for at least 2-3 nested `/client/*` routes work correctly in production.

4. `[HANDOFF-008] Update IMPLEMENTATION_STATUS.md test count and re-audit for other staleness`
   - What: Correct "9 tests" → current count (14 at time of writing, may have changed) and re-check other status claims against current code.
   - Where: `IMPLEMENTATION_STATUS.md`.
   - Why: Doc accuracy matters since it's used as a status source of truth by contributors/AI agents.
   - Dependencies: none.
   - Acceptance criteria: doc numbers match `npm run test:run` output exactly.

### P2 — polish / improvement
1. `[HANDOFF-009] Add localization (i18n) infrastructure`
   - What: Introduce an i18n library and extract hardcoded Russian strings into translation keys, at minimum supporting the languages the backend already tracks per-user.
   - Where: all `src/pages/*`, `src/components/*`.
   - Why: Explicitly flagged as not started in `TODO.md`; backend already supports per-user language.
   - Dependencies: none, but large surface area — should be scheduled after P0/P1 stabilize.
   - Acceptance criteria: at least one non-Russian locale fully renders the home/auth flow correctly.

2. `[HANDOFF-010] Set up CI pipeline running npm run check`
   - What: Add CI config (e.g., GitHub Actions) to run lint/typecheck/test/build on every push/PR to `dev`.
   - Where: new `.github/workflows/` file.
   - Why: No automated gate currently exists; relies entirely on manual discipline.
   - Dependencies: none.
   - Acceptance criteria: CI runs and passes on a test push.

3. `[HANDOFF-011] Route-level code splitting refinement / bundle size review`
   - What: Review chunk sizes post-build and consider further splitting if any single chunk grows large.
   - Where: `vite.config.ts`, `src/app.tsx`.
   - Why: Noted as Medium priority in `TODO.md`; current build is small (~370KB main chunk) so this is genuinely low urgency right now.
   - Dependencies: none.
   - Acceptance criteria: no single route chunk exceeds a reasonable threshold (e.g., 200KB gzip) as the app grows.

---

## 18. Suggested Parallelization

**Agent A — Backend verification track:**
- HANDOFF-001, HANDOFF-002, HANDOFF-003 (auth + financial mutation verification). Touches mostly `src/auth/`, `src/pages/payments.tsx`, `src/pages/nft.tsx`, and potentially `src/lib/api/schemas.ts` if mismatches are found.

**Agent B — Cleanup / infra track:**
- HANDOFF-004 (empty directory investigation), HANDOFF-008 (doc staleness fix), HANDOFF-010 (CI setup). Low overlap with Agent A's files.

**Reviewer:**
- Should review any changes to `src/lib/api/schemas.ts` or `src/lib/api/client.ts` especially carefully — these are the highest-blast-radius files, and if Agent A modifies schemas based on live backend findings, those changes should be reviewed against `API.md` for consistency and documented there too.

**Do NOT run in parallel:**
- HANDOFF-002 and HANDOFF-003 should be sequential, not parallel — both may touch `src/lib/api/schemas.ts` if live testing reveals contract mismatches, and running them concurrently risks conflicting schema edits.
- HANDOFF-009 (localization) should not start until P0/P1 stabilize — it touches nearly every page file, which would conflict with almost anything else in progress.

---

## 19. Do Not Break

- **No stubs, mocks, or fake data presented as real in production code** — this is an explicit, currently-honored rule (`AGENT.md`; confirmed via grep: zero mock/fake/placeholder patterns in non-test `src/` files). Keep it that way.
- **No sensitive tokens in localStorage** — auth uses HttpOnly cookies only; only `theme` and a temporary `invite_code` belong in localStorage. Do not add auth tokens or other sensitive data there.
- **Git policy**: all work stays on `dev` branch; `main` is only touched when the user's message explicitly contains the word "main" (per `AGENT.md`).
- **Strict TypeScript** — `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride` are all enabled; do not weaken `tsconfig.json` to make errors go away.
- **File size discipline** — no file in `src/` currently exceeds ~180 lines (excluding CSS); this reflects a deliberate architectural choice, not an accident — keep new code similarly modular rather than growing single files unboundedly.
- **Single API transport chokepoint** — all network calls go through `src/lib/api/client.ts`; don't introduce a second parallel fetch mechanism (e.g., a raw `fetch()` call in a page component) that bypasses timeout/credentials/auth-invalid handling.
- **CSP compliance** — `vercel.json`'s Content-Security-Policy is strict (no inline scripts, `connect-src` allowlist). Any new external script/API/resource must be added to the CSP or it will silently break in production.
- **`npm run check` must stay green** — lint + typecheck + test:run + build all currently pass; don't merge changes that break any of them.
- **Financial mutation caution** — per `TODO.md`, buy/sell/topup/withdraw testing must use safe/reversible test data; these are real financial operations against a real backend, not simulated.

---

## START HERE — Context for the next AI

You're picking up **monvravex-frontend**, a custodial NFT marketplace SPA built with React 19 + Vite 8 + TypeScript 5.9 (strict) + React Router 7 + Zod. It lives at `/Users/root1/NFT`, on git branch `dev`, and — important to know immediately — **the repository has zero commits**. Every file you see is untracked. This isn't corruption; it's simply that no commit has ever been made here. If you're asked to commit, that will be the very first commit in this repo's history, and it must go to `dev` (never `main`, unless the user's message literally contains the word "main" — this is a hard rule from `AGENT.md`, read that file in full before making any git decisions).

**What this project is:** a from-scratch rewrite of an existing production NFT marketplace frontend. The old frontend's source code isn't in this repo — the team only had access to its compiled production bundle, which they reverse-engineered (along with the backend's OpenAPI spec, which unhelpfully declares all response bodies as empty `{}`) to reconstruct the API contract now implemented in `src/lib/api/schemas.ts` and `services.ts`. Read `ARCHITECTURE.md` and `API.md` for the full story on how that contract was derived — treat it as informed reconstruction, not backend-confirmed truth.

**Where things stand:** the entire application scaffold is built. Every planned route exists (`src/app.tsx` is your map — landing, auth flows, activation, home/discovery, collection and NFT detail pages, owned-NFTs, topup/withdraw, profile with sub-sections, referral, 404). Auth uses cookie-based sessions via `src/auth/auth-context.tsx`, with route guards in `src/auth/route-guards.tsx`. All network traffic flows through one chokepoint, `src/lib/api/client.ts`, into typed service methods (`services.ts`) validated by Zod schemas (`schemas.ts`). There's no global state store — auth context is the only app-wide state, everything else is per-page local fetching via a shared `use-api-resource` hook. The design system is fully implemented in one CSS file, `src/app/globals.css`, matching the spec in `DESIGN.md`. I verified fresh: `npm run typecheck`, `npm run lint`, `npm run test:run` (14 tests, 5 files), and `npm run build` **all pass cleanly, zero errors**. There's no mock/fake data anywhere in production code — I grepped and confirmed the team's "no stubs presented as real" rule (from `AGENT.md`) is actually being followed, not just documented.

**What's broken:** functionally, nothing is confirmed broken — because almost nothing authenticated has ever been tested against the real backend. That's the crux of where this project actually is: fully coded, fully typed, fully unit-tested in isolation, and essentially **zero-percent verified against reality**. There is no test account, invite code, or staging credentials available to the team as of this writing. Every authenticated page — login through logout, profile management, notifications, and especially the financial mutations (buy, sell, unsell an NFT; topup and withdraw funds) — is "implemented, live-unverified." This is flagged repeatedly and consistently across `IMPLEMENTATION_STATUS.md`, `FRONTEND_PARITY.md`, and `TODO.md`, and it's the single most important fact about this project's current state. Getting test credentials and then walking through these flows one by one, fixing whatever schema mismatches surface along the way, is unambiguously the highest-value next work.

**What must not be broken:** the "no fake data" discipline; the cookie-only auth token storage (no sensitive data in localStorage — only a `theme` preference and a transient `invite_code` belong there); strict TypeScript settings; the single API-transport chokepoint pattern (don't add parallel `fetch()` calls that bypass `client.ts`'s timeout/credentials/auth-invalid handling); the strict CSP in `vercel.json` (any new external resource needs a CSP update or it'll silently fail in production); and the git branch policy.

**Files to read first, in this order:** `AGENT.md` (mandatory rules, Russian-language, read in full before writing any code or making git decisions), `src/app.tsx` (the route map), `src/auth/auth-context.tsx` (session logic), `src/lib/api/client.ts` and `src/lib/api/schemas.ts` (the network layer and its biggest risk surface), and `TODO.md` (the team's own prioritized backlog, which closely matches what I've reconstructed in §17 of this document).

**What to do next:** if you have — or can obtain — test/staging credentials for `https://back.monvravex.com`, start there: run through login, then each authenticated page, and fix any `schemas.ts` mismatches you find as you go, in small verifiable commits. If you don't have credentials, the most useful things you can do without them are: (1) investigate and resolve the empty, purposeless `src/app/c/[code]/` directory (§6/§14/§17 HANDOFF-004), (2) correct the stale test count in `IMPLEMENTATION_STATUS.md` (it says 9, the real number is 14 as of this writing — re-check it, it may have changed further), (3) add integration tests for API error edge cases (timeouts, malformed payloads) that don't require a live backend, or (4) set up a CI pipeline running `npm run check`. Do not start on localization (P2, HANDOFF-009) yet — it touches nearly every page file and should wait until the P0/P1 verification work has stabilized, to avoid merge conflicts with whatever schema/page fixes come out of live testing.

**End goal:** a fully verified, production-ready NFT marketplace SPA where every user flow — especially the financial ones — has been confirmed correct against the real backend, committed to git with a clean history on `dev`, gated by CI, and eventually localized beyond Russian-only. Right now you're much closer to that goal on the "code exists and is clean" axis than on the "code has been proven correct against reality" axis — keep that distinction in mind as you prioritize.
