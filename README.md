# Open Finish on Cloudflare Workers

**Open Finish** is a personal operating system for long-term mastery. It supports daily learning practice through activities, session logs, continuity notes, progress history, achievements, alerts, and a profile.

This repository is an independently deployable migration of the original Open Finish application to **Cloudflare Workers**. It serves the React single-page application and its same-origin Express API from one Worker deployment while keeping the existing PostgreSQL database through the official **Neon serverless driver**.

> The original database schema and API contracts are preserved. The Worker reads a pooled Neon connection string from the Cloudflare `DATABASE_URL` secret, so this migration does not require a database-engine rewrite.

## Architecture

| Layer | Implementation | Deployment role |
| --- | --- | --- |
| Client | React, Vite, Tailwind CSS | Built to `artifacts/learning-tracker/dist/public` and uploaded as Worker static assets. |
| API | Express 5 via Cloudflare's Node HTTP adapter | Handles `/api/*` on the same origin as the client. |
| Data | Drizzle ORM, Neon serverless driver, PostgreSQL | Uses a request-scoped Neon WebSocket client from `DATABASE_URL`. |
| Hosting | Cloudflare Workers and Wrangler | Publishes client assets and API as one deployment. |
| Secrets | Cloudflare Worker secrets | Stores `ADMIN_PASSWORD` and `DATABASE_URL`; neither is committed to the repository. |

The Worker static-assets configuration sends `/api/*` to Express first and returns `index.html` for other SPA routes. The frontend continues to call relative `/api/*` URLs, so no CORS or API base URL change is required.

## Repository structure

```text
artifacts/
  api-server/        Existing Express API, adapted for Neon request context
  learning-tracker/  React frontend and Vite build
lib/
  api-spec/          OpenAPI contract and generated API hooks
  db/                Drizzle PostgreSQL schema and Neon serverless database layer
worker/
  index.ts           Cloudflare Worker entrypoint using Express' Node HTTP adapter
wrangler.jsonc       Worker, static-assets and non-secret variable configuration
```

## Prerequisites

You need Node.js 24 or newer, PNPM 10.11.1, a Cloudflare account with Workers access, and an existing reachable PostgreSQL database. The target database should already contain the Open Finish schema and data, or it can be migrated using the existing Drizzle scripts from a Node environment.

## Local development

Install dependencies, create an untracked local-secret file, and build the application.

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm run build
```

Set `ADMIN_PASSWORD` to a strong local value and set `DATABASE_URL` to the pooled Neon connection string for `open_finish_recovery` in the untracked `.dev.vars` file. Never commit either value.

Start the Worker runtime with:

```bash
pnpm run dev
```

The command serves the SPA and the API on one local URL. The unauthenticated endpoint `GET /api/auth/session` can be checked before the database is attached; data routes require a valid login and the Neon database secret.

## First Cloudflare deployment

Configure the two production secrets in the Cloudflare Worker dashboard. `ADMIN_USERNAME` is optional and defaults to `Admin` through `wrangler.jsonc`. For `DATABASE_URL`, use Neon's pooled connection string for `open_finish_recovery`; do **not** put either secret in the repository.

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put DATABASE_URL
```

Build and publish the worker once from a trusted machine.

```bash
pnpm run deploy
```

After the first publication, Cloudflare Workers Builds can deploy from GitHub. Connect this repository to a Worker and use the following build settings.

| Cloudflare setting | Value |
| --- | --- |
| Root directory | `/` |
| Build command | `pnpm run build` |
| Deploy command | `pnpm exec wrangler deploy` |
| Production branch | `main` |

The Worker configuration and asset directory are kept in `wrangler.jsonc`. Configure `ADMIN_PASSWORD` and `DATABASE_URL` as Cloudflare secrets in the Worker dashboard; never add either value to `vars` or commit `.dev.vars`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run build` | Typecheck the workspace and build deployable React assets. |
| `pnpm run dev` | Start the Worker locally through Wrangler. |
| `pnpm run deploy` | Build and publish the Worker and static assets. |
| `pnpm run cf-typegen` | Generate Worker binding types after updating `wrangler.jsonc`. |
| `pnpm run typecheck` | Typecheck libraries, frontend, and API. |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks and Zod schemas from OpenAPI. |
| `pnpm --filter @workspace/db run migrate` | Run existing PostgreSQL migrations from a Node environment with `DATABASE_URL`. |

## Important operational notes

The `HYPERDRIVE` binding must be attached before protected API routes can access data. Each Worker request receives a Drizzle client backed by Hyperdrive, while the existing Node-oriented migration scripts continue to use `DATABASE_URL` when explicitly run outside Workers.

The original app used Pino HTTP logging, which is not compatible with the Workers runtime in this dependency combination. The API therefore writes structured, cookie-free request logs through the Workers console. Authentication cookies remain `httpOnly`, `secure` in production, and `sameSite=strict`.

## References

The implementation follows Cloudflare's official guidance for [Express on Workers](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/), [Drizzle ORM with Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/drizzle-orm/), [Worker static assets](https://developers.cloudflare.com/workers/static-assets/), and [Worker environment variables and secrets](https://developers.cloudflare.com/workers/configuration/environment-variables/).
