import { env as cloudflareEnv } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import { createApp } from "../artifacts/api-server/src/app";

interface Env {
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  DATABASE_URL?: string;
}

/**
 * Cloudflare provides bindings to the fetch handler. The Express application
 * holds getter functions, so it resolves the current Worker bindings only when
 * a request reaches the API rather than copying a secret into global setup.
 */
let runtimeEnv: Env | undefined;

const app = createApp({
  getDatabaseUrl: () => runtimeEnv?.DATABASE_URL ?? cloudflareEnv.DATABASE_URL,
  getAdminPassword: () =>
    runtimeEnv?.ADMIN_PASSWORD ?? cloudflareEnv.ADMIN_PASSWORD,
  getSessionSecret: () =>
    runtimeEnv?.SESSION_SECRET ?? cloudflareEnv.SESSION_SECRET,
});

app.listen(3000);
const nodeHandler = httpServerHandler({ port: 3000 });

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    runtimeEnv = env;
    return nodeHandler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
