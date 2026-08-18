import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import { createApp } from "../artifacts/api-server/src/app";

interface Env {
  HYPERDRIVE?: Hyperdrive;
}

/**
 * Cloudflare's Node HTTP adapter lets the existing Express router run inside a
 * Worker. Static client assets bypass this handler except for /api/* paths,
 * which are configured in wrangler.jsonc.
 */
const app = createApp({
  hyperdriveConnectionString: (env as Env).HYPERDRIVE?.connectionString,
});

app.listen(3000);

export default httpServerHandler({ port: 3000 });
