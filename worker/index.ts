import * as process from "node:process";
import { httpServerHandler } from "cloudflare:node";
import { createApp } from "../artifacts/api-server/src/app";

/**
 * Secrets are resolved for each API request rather than copied into the global
 * Express setup. This prevents a reused Worker isolate from retaining a stale
 * configuration after a Cloudflare Secret is rotated.
 */
const app = createApp({
  getDatabaseUrl: () => process.env.DATABASE_URL,
  getAdminPassword: () => process.env.ADMIN_PASSWORD,
});

app.listen(3000);

export default httpServerHandler({ port: 3000 });
