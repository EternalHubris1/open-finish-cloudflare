import express, { type Express } from "express";
import cors from "cors";
import { connectNeon, runWithDatabase } from "@workspace/db";
import router from "./routes";

interface AppOptions {
  databaseUrl?: string;
}

/**
 * The same Express API can run locally with DATABASE_URL or on Workers with a
 * Neon serverless connection string stored as a Cloudflare secret. Static SPA
 * hosting is intentionally delegated to Wrangler assets so the Worker receives
 * only /api/* requests.
 */
export function createApp(options: AppOptions = {}): Express {
  const app: Express = express();
  app.set("trust proxy", 1);

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
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  if (options.databaseUrl) {
    app.use("/api", async (_req, res, next) => {
      try {
        const connection = connectNeon(options.databaseUrl!);
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

  // The Cloudflare deployment is intentionally public.
  app.use("/api", router);

  return app;
}

export default createApp();
