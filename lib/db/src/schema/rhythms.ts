import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { activitiesTable } from "./activities";

export const milestonesTable = pgTable("milestones", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  detail: text("detail"),
  period: text("period").notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const sprintsTable = pgTable("sprints", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activitiesTable.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  outcome: text("outcome").notNull().default(""),
  startDate: date("start_date", { mode: "string" }).notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const sprintStepsTable = pgTable(
  "sprint_steps",
  {
    id: serial("id").primaryKey(),
    sprintId: integer("sprint_id")
      .notNull()
      .references(() => sprintsTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    plannedDate: date("planned_date", { mode: "string" }).notNull(),
    position: integer("position").notNull(),
    status: text("status").notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sprint_steps_sprint_position_unique").on(
      table.sprintId,
      table.position,
    ),
  ],
);

export const periodReflectionsTable = pgTable(
  "period_reflections",
  {
    id: serial("id").primaryKey(),
    milestoneId: integer("milestone_id")
      .notNull()
      .references(() => milestonesTable.id, { onDelete: "cascade" }),
    notice: text("notice").notNull().default(""),
    carry: text("carry").notNull().default(""),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("period_reflections_milestone_id_unique").on(table.milestoneId),
  ],
);

export const dojoCabinetItemsTable = pgTable("dojo_cabinet_items", {
  id: serial("id").primaryKey(),
  periodReflectionId: integer("period_reflection_id").references(
    () => periodReflectionsTable.id,
    { onDelete: "set null" },
  ),
  title: text("title").notNull(),
  url: text("url"),
  note: text("note").notNull().default(""),
  kind: text("kind").notNull().default("link"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Milestone = typeof milestonesTable.$inferSelect;
export type Sprint = typeof sprintsTable.$inferSelect;
export type SprintStep = typeof sprintStepsTable.$inferSelect;
export type PeriodReflection = typeof periodReflectionsTable.$inferSelect;
export type DojoCabinetItem = typeof dojoCabinetItemsTable.$inferSelect;
