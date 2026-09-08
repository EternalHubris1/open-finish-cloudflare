import {
  date,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const dayMarkersTable = pgTable(
  "day_markers",
  {
    id: serial("id").primaryKey(),
    markerDate: date("marker_date", { mode: "string" }).notNull(),
    kind: text("kind").notNull().default("rest"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("day_markers_date_kind_unique").on(
      table.markerDate,
      table.kind,
    ),
  ],
);

export type DayMarker = typeof dayMarkersTable.$inferSelect;
