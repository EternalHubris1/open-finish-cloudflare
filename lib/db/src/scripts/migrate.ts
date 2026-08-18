import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../index";

const migrationsFolder = fileURLToPath(
  new URL("../../migrations", import.meta.url),
);

try {
  await migrate(db, { migrationsFolder });
  console.info("Database migrations are current.");
} finally {
  await pool.end();
}
