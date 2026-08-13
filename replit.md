# Learning Tracker

A personal learning task manager for tracking progress, maintaining streaks, and celebrating milestones across multiple learning activities.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/learning-tracker run dev` — run the frontend (port 18714)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, TanStack Query, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod v4, `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — database tables (profiles, activities, activity-logs, streaks, achievements, alerts)
- `artifacts/api-server/src/routes/` — API route handlers per domain
- `artifacts/api-server/src/lib/streaks.ts` — streak calculation + achievement unlock logic
- `artifacts/learning-tracker/src/` — React frontend

## Architecture decisions

- **Single-user personal app**: There is one profile (id=1), created on first request. No auth needed.
- **Streak calculation**: Handled server-side in `streaks.ts` after every log POST. Compares `lastLoggedDate` to today/yesterday to increment/reset.
- **Achievements**: Automatically unlocked inside `streaks.ts` after each log based on thresholds (first log, 3/7/30-day streaks, session count milestones, marathon sessions).
- **Zod v4**: Catalog pinned to `^4.0.0` because Orval 8.23 generates zod v4 syntax (`zod.int()`). Do not downgrade.
- **No query param on `GET /activities/{id}/logs`**: Removed to avoid Orval TS2308 collision between generated Zod schema and TypeScript interface both named `ListActivityLogsParams`.

## Product

- **Dashboard** (`/`) — today's streak, total minutes, weekly progress grid per activity, quick-log buttons
- **Activities** (`/activities`) — CRUD for learning activities with streak indicators
- **Activity Detail** (`/activities/:id`) — full log history, streak calendar, session log form
- **Achievements** (`/achievements`) — unlocked badges + locked milestones
- **Alerts** (`/alerts`) — per-activity reminders with day/time pickers
- **Profile** (`/profile`) — avatar, bio, stats summary

## User preferences

- In this chat, keep responses as concise as possible.

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` then `pnpm run typecheck:libs` before touching the api-server.
- Zod must stay at v4+. Orval 8.23 generates `zod.int()` which only exists in v4.
- Body component names must be entity-shaped (e.g. `ActivityInput`), not operation-shaped (e.g. `CreateActivityBody`) — see openapi.md for the full rule.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
