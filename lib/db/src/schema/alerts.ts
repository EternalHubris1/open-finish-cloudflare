import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { activitiesTable } from "./activities";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activitiesTable.id, { onDelete: "cascade" }),
  timeOfDay: text("time_of_day").notNull(),
  daysOfWeek: integer("days_of_week").array().notNull(),
  enabled: boolean("enabled").notNull().default(true),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
