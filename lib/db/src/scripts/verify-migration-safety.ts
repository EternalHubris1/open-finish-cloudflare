import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const migrationsFolder = fileURLToPath(
  new URL("../../migrations", import.meta.url),
);

const destructiveSql = [
  /\bDROP\s+(?:TABLE|COLUMN|SCHEMA|DATABASE|INDEX|CONSTRAINT)\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bUPDATE\s+[^;]+\bSET\b/i,
  /\bALTER\s+TABLE\b[^;]*\bRENAME\b/i,
  /\bCREATE\s+OR\s+REPLACE\b/i,
];

const files = (await readdir(migrationsFolder))
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of files) {
  const sql = await readFile(path.join(migrationsFolder, file), "utf8");
  const violation = destructiveSql.find((pattern) => pattern.test(sql));
  if (violation) {
    throw new Error(
      `Migration ${file} contains an operation blocked by the data-preservation gate (${violation}). ` +
        "Use an explicitly reviewed data migration and a verified backup instead of deploy startup.",
    );
  }
}

console.info(
  `Migration safety check passed for ${files.length} additive migration file(s).`,
);
