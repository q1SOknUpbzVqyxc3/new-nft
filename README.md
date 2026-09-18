# Monvravex Frontend

React SPA redesign for the existing Monvravex API.

## Requirements

- Node.js 22.12 or newer compatible LTS;
- npm 10 or newer.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

`VITE_API_BASE_URL` is optional. Leave it empty to use the same-origin `/api` proxy. Do not place secrets in any `VITE_` variable: Vite embeds them into the browser bundle.

## Commands

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run preview
```

## Development workflow

All work, commits and pushes are restricted to `dev`. See `AGENT.md`. The application is a client-side SPA. `vercel.json` provides the production route fallback, security headers and immutable caching for fingerprinted assets.

Architecture and backend mapping are documented in `ARCHITECTURE.md` and `API.md`. Functional migration status is tracked in `FRONTEND_PARITY.md`.
