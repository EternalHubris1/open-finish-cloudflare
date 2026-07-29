import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { activitiesTable } from "./activities";

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon"),
  activityId: integer("activity_id").references(() => activitiesTable.id, {
    onDelete: "set null",
  }),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievementsTable).omit({
  id: true,
  unlockedAt: true,
});
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievementsTable.$inferSelect;
