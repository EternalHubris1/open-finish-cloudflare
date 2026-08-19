import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle as drizzleNeon, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool as NeonPool } from "@neondatabase/serverless";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export type Database =
  | NodePgDatabase<typeof schema>
  | NeonDatabase<typeof schema>;

type WorkerDatabaseConnection = {
  client: NeonPool;
  db: NeonDatabase<typeof schema>;
};

const databaseContext = new AsyncLocalStorage<Database>();

/**
 * The Node deployment retains its process-level pg pool for migration utilities
 * and local Node development. Cloudflare Workers use Neon's serverless WebSocket
 * driver with a new request-scoped pool, so no TCP client or Hyperdrive binding
 * is required in the Worker runtime.
 */
const nodePool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const nodeDatabase = nodePool ? drizzleNode(nodePool, { schema }) : null;

function getNodePool(): pg.Pool {
  if (nodePool) return nodePool;

  throw new Error(
    "DATABASE_URL must be set before running a Node.js database script.",
  );
}

function currentDatabase(): Database {
  const contextualDatabase = databaseContext.getStore();
  if (contextualDatabase) return contextualDatabase;
  if (nodeDatabase) return nodeDatabase;

  throw new Error(
    "Database access requires DATABASE_URL for Node.js or a Neon request context in Cloudflare Workers.",
  );
}

/**
 * Existing route modules import db directly. The proxy resolves that import to
 * a request-scoped Drizzle client in Workers while preserving the original
 * Node.js pool for scripts and local development.
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const target = currentDatabase();
    const value = Reflect.get(target, property);
    return typeof value === "function" ? value.bind(target) : value;
  },
});

/**
 * Uses Neon serverless WebSockets rather than Hyperdrive. WebSocket pools are
 * created inside the request lifecycle and closed when the HTTP response ends.
 * This preserves Drizzle transaction support used by the continuity endpoints.
 */
export function connectNeon(
  connectionString: string,
): WorkerDatabaseConnection {
  const client = new NeonPool({ connectionString });

  return {
    client,
    db: drizzleNeon(client, { schema }),
  };
}

export function runWithDatabase<T>(
  database: Database,
  callback: () => T,
): T {
  return databaseContext.run(database, callback);
}

/**
 * Compatibility wrapper for existing Node.js migration utilities. Access is
 * deferred so importing this package in a Worker never requires DATABASE_URL.
 */
export const pool = new Proxy({} as pg.Pool, {
  get(_target, property) {
    const target = getNodePool();
    const value = Reflect.get(target, property);
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export * from "./schema";
