import {
  date,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const weeklyReflectionsTable = pgTable(
  "weekly_reflections",
  {
    id: serial("id").primaryKey(),
    weekStart: date("week_start", { mode: "string" }).notNull(),
    notice: text("notice").notNull().default(""),
    carry: text("carry").notNull().default(""),
    evidenceIds: jsonb("evidence_ids").$type<string[]>().notNull().default([]),
    keptEvidenceIds: jsonb("kept_evidence_ids")
      .$type<number[]>()
      .notNull()
      .default([]),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("weekly_reflections_week_start_unique").on(table.weekStart),
  ],
);

export type WeeklyReflection = typeof weeklyReflectionsTable.$inferSelect;
