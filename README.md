# Progress Checker

A personal learning tracker for logging study/practice sessions, keeping streaks alive, and visualizing progress across multiple activities (coding, reading, languages, etc.).

## Features

- **Dashboard** — today's streak, total minutes, weekly progress grid per activity, quick-log buttons
- **Activities** — create and manage learning activities, each with its own streak
- **History** — monthly calendar and bar-chart view of past sessions, color-coded against your daily goal (green = goal met, red = under, purple = heavily exceeded); edit or delete past sessions
- **Achievements** — unlocked badges for streak and session milestones
- **Alerts** — per-activity reminders with day/time pickers
- **Profile** — avatar, bio, and stats summary

## Tech stack

- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React + Vite, Tailwind CSS, TanStack Query, wouter (`artifacts/learning-tracker`)
- **API:** Express 5 (`artifacts/api-server`)
- **Database:** PostgreSQL + Drizzle ORM (`lib/db`)
- **Validation:** Zod v4 + `drizzle-zod`
- **API codegen:** Orval, generated from the OpenAPI spec at `lib/api-spec/openapi.yaml`

## Project structure

```
artifacts/
  api-server/        Express API (routes, business logic)
  learning-tracker/  React frontend
  mockup-sandbox/    Component preview sandbox (design tooling)
lib/
  api-spec/          OpenAPI contract + generated client hooks
  db/                Drizzle schema and DB access
scripts/             Workspace tooling scripts
```

## Getting started

Requires a PostgreSQL database — set the `DATABASE_URL` environment variable before running.

```bash
pnpm install

# Run the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Run the frontend (port 18714)
pnpm --filter @workspace/learning-tracker run dev
```

## Useful scripts

| Command | Purpose |
| --- | --- |
| `pnpm run typecheck` | Typecheck all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks/Zod schemas from the OpenAPI spec |
| `pnpm --filter @workspace/db run push` | Push DB schema changes (dev only) |
| `pnpm run build:deploy` | Build the production frontend and API used by Replit |
| `pnpm run start:deploy` | Start the single production server |

## Replit deployment

The checked-in `.replit` config uses an Autoscale deployment. Add `DATABASE_URL`
and `ADMIN_PASSWORD` to Replit Deployment Secrets. `ADMIN_USERNAME` is optional
and defaults to `Admin`. Run `pnpm --filter @workspace/db run push` once if the
database is new, then publish. The Express server serves both `/api/*` and the
built React app from the deployment `PORT`.

## Notes

- Single-user app — no authentication, one profile is created automatically on first request.
- API schema changes flow through `lib/api-spec/openapi.yaml` → Orval codegen; don't hand-write client types.

See [`replit.md`](./replit.md) for deeper architecture notes and gotchas.
