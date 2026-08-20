import * as process from "node:process";
import { httpServerHandler } from "cloudflare:node";
import { createApp } from "../artifacts/api-server/src/app";

interface Env {
  ADMIN_PASSWORD?: string;
  DATABASE_URL?: string;
}

/**
 * Express reads credentials through request-time getters. Cloudflare supplies
 * bindings to `fetch`, so mirror the current request's immutable bindings into
 * the Node compatibility environment before dispatching to the HTTP adapter.
 */
const app = createApp({
  getDatabaseUrl: () => process.env.DATABASE_URL,
  getAdminPassword: () => process.env.ADMIN_PASSWORD,
});

app.listen(3000);
const nodeHandler = httpServerHandler({ port: 3000 });

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    process.env.DATABASE_URL = env.DATABASE_URL ?? "";
    process.env.ADMIN_PASSWORD = env.ADMIN_PASSWORD ?? "";
    return nodeHandler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
