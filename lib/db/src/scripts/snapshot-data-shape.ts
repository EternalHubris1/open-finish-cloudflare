import { pool } from "../index";

const userDataTables = [
  "profiles",
  "activities",
  "activity_logs",
  "streaks",
  "achievements",
  "alerts",
  "daily_contexts",
  "evidence_shelf",
  "weekly_reflections",
] as const;

try {
  const existingResult = await pool.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])`,
    [userDataTables],
  );
  const existing = new Set(existingResult.rows.map((row) => row.table_name));

  const tables: Record<
    string,
    {
      rows: number;
      minimumId: number | null;
      maximumId: number | null;
      idDigest: string;
    }
  > = {};

  for (const table of userDataTables) {
    if (!existing.has(table)) continue;
    const result = await pool.query<{
      rows: number;
      minimum_id: number | null;
      maximum_id: number | null;
      id_digest: string;
    }>(
      `SELECT COUNT(*)::int AS rows,
              MIN(id)::int AS minimum_id,
              MAX(id)::int AS maximum_id,
              MD5(COALESCE(STRING_AGG(id::text, ',' ORDER BY id), '')) AS id_digest
         FROM "${table}"`,
    );
    const row = result.rows[0];
    tables[table] = {
      rows: row.rows,
      minimumId: row.minimum_id,
      maximumId: row.maximum_id,
      idDigest: row.id_digest,
    };
  }

  console.log(
    JSON.stringify({ capturedAt: new Date().toISOString(), tables }, null, 2),
  );
} finally {
  await pool.end();
}
