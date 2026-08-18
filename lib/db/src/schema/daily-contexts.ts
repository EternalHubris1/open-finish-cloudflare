import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { activitiesTable } from "./activities";

export const dailyContextsTable = pgTable(
  "daily_contexts",
  {
    id: serial("id").primaryKey(),
    contextDate: date("context_date", { mode: "string" }).notNull(),
    focusActivityId: integer("focus_activity_id").references(
      () => activitiesTable.id,
      { onDelete: "set null" },
    ),
    intention: text("intention"),
    externalUrl: text("external_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("daily_contexts_context_date_unique").on(table.contextDate),
  ],
);

export type DailyContext = typeof dailyContextsTable.$inferSelect;
