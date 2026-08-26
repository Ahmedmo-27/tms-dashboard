# AGENTS.md

## Cursor Cloud specific instructions

This repo is **only the frontend** (`tms-dashboard`) — a Next.js 15 (App Router, Turbopack) admin/coach UI for a gym management system. There is **no backend, database, or docker-compose in this repo**. The UI talks to an external TMS backend over REST (`axios`) and Socket.io.

### Required environment variable
- `NEXT_PUBLIC_TMS_API_URL` **must be set**, or the app throws at import time (`src/lib/tms-api.ts`, `src/lib/socket.ts`). It is used as the axios `baseURL` verbatim, so its exact shape matters: some backends expect an `/api` suffix and some serve REST from the root — match whatever the target backend uses (the socket layer strips a trailing `/api` if present). Data calls use paths like `/auth/login` and `/admin/*`.
- It is provided as a Cursor secret and injected into the VM environment. Because it is `NEXT_PUBLIC_*`, the dev server must be started from a shell that already has the secret exported. If you start `npm run dev` inside a pre-existing tmux server that was created before the secret existed, the app will report "NEXT_PUBLIC_TMS_API_URL environment variable is not set"; restart the tmux server (or start dev from a fresh shell) so the pane inherits the secret.
- Do not commit `.env.local`; it is gitignored. Rely on the injected secret instead.
- The configured URL currently points at a **local** backend (`127.0.0.1:5000`) that is **not part of this repo** and must be started separately. For real end-to-end testing you need that backend running plus valid login credentials (phone number + password, provided via the `TMS_TEST_PHONE_NUMBER` / `TMS_TEST_PASSWORD` secrets). Without a running backend, only the frontend UI can be exercised (login fails at the network layer). The login phone number must be exactly 11 digits (`credentialsSchema`).

### Run / lint / build (see `package.json` scripts)
- Dev server: `npm run dev` → http://localhost:3000 (Next.js + Turbopack).
- Lint: `npm run lint`. Note: the codebase currently has many pre-existing `@typescript-eslint/no-explicit-any` lint errors; `next.config.ts` sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true`, so `next build`/`next dev` are not blocked by them.

### Testing without the real backend
- To demo the login flow locally you can run a tiny mock server that answers `POST /api/auth/login` with `{ "data": { "token", "userId", "role": "admin", "name" } }`, `GET /api/auth/verifyToken` with `{ "data": { "user": { "role": "admin" } } }`, and returns `{ "data": [] }` for other `GET /api/admin/*` calls. Point `NEXT_PUBLIC_TMS_API_URL` at it (e.g. `http://localhost:4000/api`).
- Login flow: form → `loginAction` (`src/lib/actions/auth-actions.ts`) → `login()` (`src/lib/data/auth.ts`) → `POST /auth/login` → token stored in an httpOnly `token` cookie → Redux `setCredentials` → redirect `/dashboard` → `/dashboard/scans-monitor`. Auth gating is client-side via Redux (`RequireAuth`), so a successful login response reaches the authenticated shell even if downstream data endpoints are empty.
- The `token` cookie is set with `secure: true` (`src/lib/cookie.ts`); it is stored over plain-HTTP localhost in Chrome during dev, but be aware of this if cookie-dependent flows misbehave.
