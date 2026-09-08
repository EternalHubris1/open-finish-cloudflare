import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db, dayMarkersTable } from "@workspace/db";

function isMissingTable(error: unknown): boolean {
  const value = error as { code?: string; cause?: { code?: string } };
  return value?.code === "42P01" || value?.cause?.code === "42P01";
}

export async function ensureDayMarkersTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "day_markers" (
      "id" serial PRIMARY KEY NOT NULL,
      "marker_date" date NOT NULL,
      "kind" text NOT NULL DEFAULT 'rest',
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "day_markers_date_kind_unique"
      ON "day_markers" ("marker_date", "kind")
  `);
}

export async function listRestDayDates(
  start?: string,
  end?: string,
): Promise<string[]> {
  try {
    const conditions = [eq(dayMarkersTable.kind, "rest")];
    if (start) conditions.push(gte(dayMarkersTable.markerDate, start));
    if (end) conditions.push(lte(dayMarkersTable.markerDate, end));
    const rows = await db
      .select({ date: dayMarkersTable.markerDate })
      .from(dayMarkersTable)
      .where(and(...conditions));
    return rows.map((row) => row.date);
  } catch (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
}

export { isMissingTable };
