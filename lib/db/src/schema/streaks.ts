import { date, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { activitiesTable } from "./activities";

export const streaksTable = pgTable(
  "streaks",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activitiesTable.id, { onDelete: "cascade" }),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastLoggedDate: date("last_logged_date", { mode: "string" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [unique().on(t.activityId)],
);

export const insertStreakSchema = createInsertSchema(streaksTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertStreak = z.infer<typeof insertStreakSchema>;
export type Streak = typeof streaksTable.$inferSelect;
