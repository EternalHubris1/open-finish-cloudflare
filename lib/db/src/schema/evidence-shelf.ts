import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { activityLogsTable } from "./activity-logs";

export const evidenceShelfTable = pgTable(
  "evidence_shelf",
  {
    id: serial("id").primaryKey(),
    activityLogId: integer("activity_log_id")
      .notNull()
      .references(() => activityLogsTable.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("evidence_shelf_activity_log_id_unique").on(
      table.activityLogId,
    ),
    uniqueIndex("evidence_shelf_position_unique").on(table.position),
  ],
);

export type EvidenceShelfRow = typeof evidenceShelfTable.$inferSelect;
