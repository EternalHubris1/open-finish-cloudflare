import express, { type Express } from "express";
import { connectNeon, runWithDatabase } from "@workspace/db";
import router from "./routes";
import { createAuth } from "./auth";

interface AppOptions {
  databaseUrl?: string;
  adminPassword?: string;
  sessionSecret?: string;
  getDatabaseUrl?: () => string | undefined;
  getAdminPassword?: () => string | undefined;
  getSessionSecret?: () => string | undefined;
}

const API_SECURITY_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

/**
 * The same Express API can run locally with DATABASE_URL or on Workers with a
 * Neon serverless connection string stored as a Cloudflare secret. Static SPA
 * hosting is intentionally delegated to Wrangler assets so the Worker receives
 * only /api/* requests.
 */
export function createApp(options: AppOptions = {}): Express {
  const app: Express = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.once("finish", () => {
      console.log(
        JSON.stringify({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    });
    next();
  });

  // The browser application and API share one origin. Do not grant arbitrary
  // third-party websites permission to read or mutate private activity data.
  app.use("/api", (_req, res, next) => {
    res.set(API_SECURITY_HEADERS);
    next();
  });
  app.use(express.json({ limit: "64kb" }));
  app.use(express.urlencoded({ extended: true, limit: "64kb" }));

  const auth = createAuth({
    password: options.adminPassword,
    sessionSecret: options.sessionSecret,
    getPassword: options.getAdminPassword,
    getSessionSecret: options.getSessionSecret,
  });
  app.use("/api", auth.router);
  app.use("/api", auth.requirePassword);

  if (options.databaseUrl || options.getDatabaseUrl) {
    app.use("/api", async (_req, res, next) => {
      try {
        const databaseUrl = options.getDatabaseUrl?.() ?? options.databaseUrl;
        if (!databaseUrl) {
          res.status(503).json({ error: "Database access has not been configured" });
          return;
        }
        const connection = connectNeon(databaseUrl);
        let closed = false;
        const closeConnection = () => {
          if (closed) return;
          closed = true;
          void connection.client.end();
        };

        res.once("finish", closeConnection);
        res.once("close", closeConnection);
        runWithDatabase(connection.db, next);
      } catch (error) {
        next(error);
      }
    });
  }

  // Application-level password access is independent of Replit and stored only
  // in the Cloudflare ADMIN_PASSWORD secret. Cloudflare Access can be added as
  // a separate defence-in-depth gate around the entire Worker.
  app.use("/api", router);

  return app;
}

export default createApp();
