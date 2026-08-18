import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Client, Pool } = pg;

export type Database = NodePgDatabase<typeof schema>;

interface WorkerDatabaseConnection {
  client: pg.Client;
  db: Database;
}

const databaseContext = new AsyncLocalStorage<Database>();

/**
 * The original Node deployment uses a process-level connection pool. It is kept
 * for Drizzle migration scripts and local Node development. Workers instead
 * attach a Hyperdrive-backed client to the request context.
 */
const nodePool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const nodeDatabase = nodePool ? drizzle(nodePool, { schema }) : null;

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
    "Database access requires DATABASE_URL for Node.js or a Hyperdrive request context in Cloudflare Workers.",
  );
}

/**
 * Existing route modules import `db` directly. The proxy resolves that import
 * to the per-request Drizzle client in Workers while preserving the original
 * Node.js pool for scripts and local development.
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const target = currentDatabase();
    const value = Reflect.get(target, property);
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export async function connectHyperdrive(
  connectionString: string,
): Promise<WorkerDatabaseConnection> {
  const client = new Client({ connectionString });
  await client.connect();

  return {
    client,
    db: drizzle(client, { schema }),
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
