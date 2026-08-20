import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import { createApp } from "../artifacts/api-server/src/app";

interface Env {
  ADMIN_PASSWORD?: string;
  DATABASE_URL?: string;
}

/**
 * Cloudflare's Node HTTP adapter lets the existing Express router run inside a
 * Worker. Static client assets bypass this handler except for /api/* paths,
 * which are configured in wrangler.jsonc. DATABASE_URL is a Cloudflare secret
 * that is passed to Neon's request-scoped serverless driver.
 */
const app = createApp({
  databaseUrl: (env as Env).DATABASE_URL,
  adminPassword: (env as Env).ADMIN_PASSWORD,
});

app.listen(3000);

export default httpServerHandler({ port: 3000 });
