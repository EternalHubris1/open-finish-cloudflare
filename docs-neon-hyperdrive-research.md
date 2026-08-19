# Neon / Hyperdrive fallback research

## Confirmed Hyperdrive result

Cloudflare Build log at 2026-08-19T15:37:08Z used the new binding `60e91892-5590-47f4-a969-c027d0501ae2` and still failed to generate the Hyperdrive binding with `Request to sqc-config failed with status code 400` (Workers API validation error 10021). The fault therefore persists after the Worker configuration was updated to use a direct Neon endpoint and dedicated role.

## Official sources

1. Cloudflare Hyperdrive pricing, https://developers.cloudflare.com/hyperdrive/platform/pricing/
   - Hyperdrive is included on Free and Paid Workers plans. The Free plan allows 100,000 database queries per day.
2. Cloudflare Hyperdrive limits, https://developers.cloudflare.com/hyperdrive/platform/limits/
   - Free plans permit 10 configured databases per account. The documented connection and query limits do not explain the observed deployment-time `sqc-config` 400.
3. Cloudflare Hyperdrive troubleshooting, https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/
   - Configuration creation and updates perform a background test connection and an empty PostgreSQL query. The generic internal-error advice is to check service status and contact Cloudflare Support.
4. Cloudflare status, https://www.cloudflarestatus.com/
   - At check time, all Cloudflare systems were reported operational, with no active maintenance.
5. Cloudflare Hyperdrive issue #4338, https://github.com/cloudflare/workers-sdk/issues/4338
   - A historical deployment-time `sqc-config` failure was attributed to a Cloudflare incident and later resolved, supporting a provider-side diagnosis where inputs are valid.
6. Neon Cloudflare Workers guide, https://neon.com/docs/guides/cloudflare-workers
   - Neon explicitly documents a supported alternative to Hyperdrive: the Neon serverless driver with a pooled `DATABASE_URL` secret for Cloudflare Workers.
7. Neon serverless driver, https://neon.com/docs/serverless/serverless-driver
   - The driver supports Cloudflare Workers over HTTP or WebSockets. WebSocket Pool/Client mode is appropriate for node-postgres-compatible usage and interactive transactions, provided the pool is created and closed per request.
8. Drizzle <> Neon, https://orm.drizzle.team/docs/connect-neon
   - Drizzle supports `drizzle-orm/neon-serverless` for WebSocket-based Neon serverless driver access.

## Fallback architecture

Use the Neon serverless WebSocket driver and Drizzle's `neon-serverless` adapter inside a request-scoped database context. Store the pooled Neon connection string only as Cloudflare Worker secret `DATABASE_URL`. This eliminates the Hyperdrive binding but preserves the PostgreSQL database, Drizzle schema, API contracts, and transactional route behavior.
