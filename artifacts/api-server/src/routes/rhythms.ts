import { Router, type IRouter } from "express";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  activitiesTable,
  dojoCabinetItemsTable,
  milestonesTable,
  periodReflectionsTable,
  sprintStepsTable,
  sprintsTable,
} from "@workspace/db";
import { sprintStatusFromSteps } from "../lib/sprint-model";

const router: IRouter = Router();

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateSchema = z.string().regex(datePattern, "Use YYYY-MM-DD for dates");
const idSchema = z.coerce.number().int().positive();
const periodSchema = z.enum(["week", "month", "custom"]);
const statusSchema = z.enum(["open", "complete", "archived"]);
const sprintStatusSchema = z.enum(["active", "complete", "archived"]);
const sprintStepStatusSchema = z.enum(["pending", "complete"]);
const sprintStepKindSchema = z.enum(["task", "buffer"]);

const milestoneInput = z.object({
  title: z.string().trim().min(1).max(140),
  detail: z.string().trim().max(1200).nullable().optional(),
  period: periodSchema,
  dueDate: dateSchema,
  status: statusSchema.optional(),
});

const milestonePatch = milestoneInput.partial();

const sprintStepInput = z
  .object({
    id: idSchema.optional(),
    title: z.string().trim().max(180),
    kind: sprintStepKindSchema.default("task"),
    plannedDate: dateSchema,
    status: sprintStepStatusSchema.optional(),
  })
  .refine((step) => step.kind === "buffer" || step.title.length > 0, {
    message: "Every task needs a title",
  });

const sprintFields = z.object({
  activityId: idSchema.nullable().optional(),
  title: z.string().trim().min(1).max(140),
  outcome: z.string().trim().max(1200).default(""),
  startDate: dateSchema,
  dueDate: dateSchema,
  steps: z.array(sprintStepInput).min(1).max(62),
});

const sprintInput = sprintFields
  .refine((value) => value.startDate <= value.dueDate, {
    message: "Sprint due date must not precede its start",
  })
  .refine(
    (value) =>
      value.steps.every(
        (step) =>
          step.plannedDate >= value.startDate &&
          step.plannedDate <= value.dueDate,
      ),
    { message: "Every step must fall inside the sprint" },
  )
  .refine((value) => value.steps.some((step) => step.kind === "task"), {
    message: "A sprint needs at least one task",
  });

const sprintPatch = sprintFields.partial().extend({
  status: sprintStatusSchema.optional(),
});

const sprintStepPatch = z.object({ status: sprintStepStatusSchema });

let sprintSchemaReady: Promise<void> | undefined;

function ensureSprintSchema() {
  sprintSchemaReady ??= (async () => {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "sprints" (
        "id" serial PRIMARY KEY NOT NULL,
        "activity_id" integer REFERENCES "activities"("id") ON DELETE set null,
        "title" text NOT NULL,
        "outcome" text NOT NULL DEFAULT '',
        "start_date" date NOT NULL,
        "due_date" date NOT NULL,
        "status" text NOT NULL DEFAULT 'active',
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "completed_at" timestamp with time zone
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "sprint_steps" (
        "id" serial PRIMARY KEY NOT NULL,
        "sprint_id" integer NOT NULL REFERENCES "sprints"("id") ON DELETE cascade,
        "title" text NOT NULL,
        "kind" text NOT NULL DEFAULT 'task',
        "planned_date" date NOT NULL,
        "position" integer NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "completed_at" timestamp with time zone,
        CONSTRAINT "sprint_steps_sprint_position_unique" UNIQUE("sprint_id", "position")
      )
    `);
    await db.execute(sql`
      ALTER TABLE "sprint_steps"
        ADD COLUMN IF NOT EXISTS "kind" text NOT NULL DEFAULT 'task'
    `);
  })().catch((error) => {
    sprintSchemaReady = undefined;
    throw error;
  });
  return sprintSchemaReady;
}

const reflectionInput = z.object({
  notice: z.string().trim().max(1600).default(""),
  carry: z.string().trim().max(1600).default(""),
});

const cabinetObject = z.object({
  periodReflectionId: idSchema.nullable().optional(),
  title: z.string().trim().min(1).max(160),
  url: z.string().trim().max(2048).nullable().optional(),
  note: z.string().trim().max(1200).default(""),
  kind: z.enum(["link", "note", "repository"]).default("link"),
  position: z.number().int().min(0).max(999).optional(),
});

const cabinetInput = cabinetObject.refine(
  (item) => item.kind !== "repository" || Boolean(item.url?.trim()),
  {
    message: "A repository needs a GitHub address",
    path: ["url"],
  },
);

const cabinetPatch = cabinetObject.partial();

function asIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function formatMilestone(row: typeof milestonesTable.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    completedAt: asIso(row.completedAt),
  };
}

function formatSprintStep(row: typeof sprintStepsTable.$inferSelect) {
  return {
    ...row,
    completedAt: asIso(row.completedAt),
  };
}

async function listSprints() {
  const sprintRows = await db
    .select({ sprint: sprintsTable, activityName: activitiesTable.name })
    .from(sprintsTable)
    .leftJoin(activitiesTable, eq(sprintsTable.activityId, activitiesTable.id))
    .orderBy(asc(sprintsTable.dueDate), desc(sprintsTable.createdAt));
  const steps = await db
    .select()
    .from(sprintStepsTable)
    .orderBy(asc(sprintStepsTable.sprintId), asc(sprintStepsTable.position));
  return sprintRows.map(({ sprint, activityName }) => ({
    ...sprint,
    activityName,
    createdAt: sprint.createdAt.toISOString(),
    completedAt: asIso(sprint.completedAt),
    steps: steps
      .filter((step) => step.sprintId === sprint.id)
      .map(formatSprintStep),
  }));
}

function formatReflection(row: typeof periodReflectionsTable.$inferSelect) {
  return {
    ...row,
    savedAt: row.savedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function formatCabinetItem(row: typeof dojoCabinetItemsTable.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
  };
}

function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isGitHubRepositoryUrl(value: string | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    return url.hostname.toLowerCase() === "github.com" && path.length >= 2;
  } catch {
    return false;
  }
}

async function validateReflectionId(reflectionId: number | null | undefined) {
  if (!reflectionId) return true;
  const [reflection] = await db
    .select({ id: periodReflectionsTable.id })
    .from(periodReflectionsTable)
    .where(eq(periodReflectionsTable.id, reflectionId));
  return Boolean(reflection);
}

router.get("/milestones", async (_req, res): Promise<void> => {
  const milestones = await db
    .select()
    .from(milestonesTable)
    .orderBy(asc(milestonesTable.dueDate), desc(milestonesTable.createdAt));
  res.json(milestones.map(formatMilestone));
});

router.post("/milestones", async (req, res): Promise<void> => {
  const parsed = milestoneInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [milestone] = await db
    .insert(milestonesTable)
    .values({
      ...parsed.data,
      detail: parsed.data.detail || null,
      status: parsed.data.status ?? "open",
      completedAt: parsed.data.status === "complete" ? new Date() : null,
    })
    .returning();
  res.status(201).json(formatMilestone(milestone));
});

router.patch("/milestones/:id", async (req, res): Promise<void> => {
  const id = idSchema.safeParse(req.params.id);
  const parsed = milestonePatch.safeParse(req.body);
  if (!id.success || !parsed.success || Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "Provide a valid milestone update" });
    return;
  }
  const patch = {
    ...parsed.data,
    detail:
      parsed.data.detail === undefined ? undefined : parsed.data.detail || null,
    completedAt:
      parsed.data.status === "complete"
        ? new Date()
        : parsed.data.status === "open"
          ? null
          : undefined,
  };
  const [milestone] = await db
    .update(milestonesTable)
    .set(patch)
    .where(eq(milestonesTable.id, id.data))
    .returning();
  if (!milestone) {
    res.status(404).json({ error: "Milestone not found" });
    return;
  }
  res.json(formatMilestone(milestone));
});

router.delete("/milestones/:id", async (req, res): Promise<void> => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid milestone id" });
    return;
  }
  const [deleted] = await db
    .delete(milestonesTable)
    .where(eq(milestonesTable.id, id.data))
    .returning({ id: milestonesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Milestone not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/sprints", async (_req, res): Promise<void> => {
  await ensureSprintSchema();
  res.json(await listSprints());
});

router.post("/sprints", async (req, res): Promise<void> => {
  await ensureSprintSchema();
  const parsed = sprintInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.activityId) {
    const [activity] = await db
      .select({ id: activitiesTable.id })
      .from(activitiesTable)
      .where(eq(activitiesTable.id, parsed.data.activityId));
    if (!activity) {
      res.status(400).json({ error: "Activity not found" });
      return;
    }
  }
  const { steps, ...sprintData } = parsed.data;
  const [sprint] = await db
    .insert(sprintsTable)
    .values({ ...sprintData, activityId: sprintData.activityId ?? null })
    .returning();
  try {
    await db.insert(sprintStepsTable).values(
      steps.map(({ id: _stepId, status, ...step }, position) => ({
        sprintId: sprint.id,
        ...step,
        position,
        status: step.kind === "buffer" ? "pending" : (status ?? "pending"),
      })),
    );
  } catch (error) {
    await db.delete(sprintsTable).where(eq(sprintsTable.id, sprint.id));
    throw error;
  }
  const created = (await listSprints()).find((item) => item.id === sprint.id);
  res.status(201).json(created);
});

router.patch("/sprints/:id", async (req, res): Promise<void> => {
  await ensureSprintSchema();
  const id = idSchema.safeParse(req.params.id);
  const parsed = sprintPatch.safeParse(req.body);
  if (!id.success || !parsed.success || Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "Provide a valid sprint update" });
    return;
  }
  if (parsed.data.activityId) {
    const [activity] = await db
      .select({ id: activitiesTable.id })
      .from(activitiesTable)
      .where(eq(activitiesTable.id, parsed.data.activityId));
    if (!activity) {
      res.status(400).json({ error: "Activity not found" });
      return;
    }
  }
  const existingSprint = (await listSprints()).find(
    (item) => item.id === id.data,
  );
  if (!existingSprint) {
    res.status(404).json({ error: "Sprint not found" });
    return;
  }
  const prospectiveSprint = sprintInput.safeParse({
    ...existingSprint,
    ...parsed.data,
    steps: parsed.data.steps ?? existingSprint.steps,
  });
  if (!prospectiveSprint.success) {
    res.status(400).json({ error: prospectiveSprint.error.message });
    return;
  }
  const { steps, ...sprintData } = parsed.data;
  const previousSteps = existingSprint.steps;
  const previousById = new Map(previousSteps.map((step) => [step.id, step]));
  const suppliedIds =
    steps?.flatMap((step) => (step.id ? [step.id] : [])) ?? [];
  if (
    new Set(suppliedIds).size !== suppliedIds.length ||
    suppliedIds.some((stepId) => !previousById.has(stepId))
  ) {
    res
      .status(400)
      .json({ error: "Sprint contains an invalid step reference" });
    return;
  }
  const sprint = await db.transaction(async (transaction) => {
    const resolvedStatus =
      sprintData.status ??
      (steps
        ? existingSprint.status === "archived"
          ? "archived"
          : sprintStatusFromSteps(steps)
        : undefined);
    const [updatedSprint] = await transaction
      .update(sprintsTable)
      .set({
        ...sprintData,
        status: resolvedStatus,
        completedAt:
          resolvedStatus === "complete"
            ? new Date()
            : resolvedStatus === "active"
              ? null
              : undefined,
      })
      .where(eq(sprintsTable.id, id.data))
      .returning({ id: sprintsTable.id });
    if (!updatedSprint || !steps) return updatedSprint;

    const removedIds = previousSteps
      .map((step) => step.id)
      .filter((stepId) => !suppliedIds.includes(stepId));
    if (removedIds.length) {
      await transaction
        .delete(sprintStepsTable)
        .where(inArray(sprintStepsTable.id, removedIds));
    }

    if (suppliedIds.length) {
      await transaction
        .update(sprintStepsTable)
        .set({ position: sql`${sprintStepsTable.position} + 1000` })
        .where(inArray(sprintStepsTable.id, suppliedIds));
    }

    for (const [position, step] of steps.entries()) {
      const status =
        step.kind === "buffer" ? "pending" : (step.status ?? "pending");
      if (step.id) {
        const previous = previousById.get(step.id)!;
        await transaction
          .update(sprintStepsTable)
          .set({
            title: step.title,
            kind: step.kind,
            plannedDate: step.plannedDate,
            position,
            status,
            completedAt:
              status === previous.status
                ? previous.completedAt
                  ? new Date(previous.completedAt)
                  : null
                : status === "complete"
                  ? new Date()
                  : null,
          })
          .where(eq(sprintStepsTable.id, step.id));
      } else {
        await transaction.insert(sprintStepsTable).values({
          sprintId: id.data,
          title: step.title,
          kind: step.kind,
          plannedDate: step.plannedDate,
          position,
          status,
          completedAt: status === "complete" ? new Date() : null,
        });
      }
    }
    return updatedSprint;
  });
  if (!sprint) {
    res.status(404).json({ error: "Sprint not found" });
    return;
  }
  const updated = (await listSprints()).find((item) => item.id === sprint.id);
  res.json(updated);
});

router.patch(
  "/sprints/:sprintId/steps/:stepId",
  async (req, res): Promise<void> => {
    await ensureSprintSchema();
    const sprintId = idSchema.safeParse(req.params.sprintId);
    const stepId = idSchema.safeParse(req.params.stepId);
    const parsed = sprintStepPatch.safeParse(req.body);
    if (!sprintId.success || !stepId.success || !parsed.success) {
      res.status(400).json({ error: "Provide a valid sprint step update" });
      return;
    }
    const [step] = await db
      .select()
      .from(sprintStepsTable)
      .where(
        and(
          eq(sprintStepsTable.id, stepId.data),
          eq(sprintStepsTable.sprintId, sprintId.data),
        ),
      );
    if (!step) {
      res.status(404).json({ error: "Sprint step not found" });
      return;
    }
    if (step.kind === "buffer") {
      res
        .status(409)
        .json({ error: "Open days do not have a completion state" });
      return;
    }
    if (parsed.data.status === "pending") {
      await db
        .update(sprintStepsTable)
        .set({ status: "pending", completedAt: null })
        .where(eq(sprintStepsTable.id, step.id));
    } else {
      await db
        .update(sprintStepsTable)
        .set({ status: "complete", completedAt: new Date() })
        .where(eq(sprintStepsTable.id, step.id));
    }
    const remaining = await db
      .select({ id: sprintStepsTable.id })
      .from(sprintStepsTable)
      .where(
        and(
          eq(sprintStepsTable.sprintId, sprintId.data),
          eq(sprintStepsTable.kind, "task"),
          eq(sprintStepsTable.status, "pending"),
        ),
      );
    await db
      .update(sprintsTable)
      .set({
        status: remaining.length === 0 ? "complete" : "active",
        completedAt: remaining.length === 0 ? new Date() : null,
      })
      .where(eq(sprintsTable.id, sprintId.data));
    const updated = (await listSprints()).find(
      (item) => item.id === sprintId.data,
    );
    res.json(updated);
  },
);

router.delete("/sprints/:id", async (req, res): Promise<void> => {
  await ensureSprintSchema();
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid sprint id" });
    return;
  }
  const [deleted] = await db
    .delete(sprintsTable)
    .where(eq(sprintsTable.id, id.data))
    .returning({ id: sprintsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Sprint not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/milestones/:id/reflection", async (req, res): Promise<void> => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid milestone id" });
    return;
  }
  const [reflection] = await db
    .select()
    .from(periodReflectionsTable)
    .where(eq(periodReflectionsTable.milestoneId, id.data));
  res.json(reflection ? formatReflection(reflection) : null);
});

router.put("/milestones/:id/reflection", async (req, res): Promise<void> => {
  const id = idSchema.safeParse(req.params.id);
  const parsed = reflectionInput.safeParse(req.body);
  if (!id.success || !parsed.success) {
    res.status(400).json({ error: "Provide a valid period reflection" });
    return;
  }
  const [milestone] = await db
    .select({ id: milestonesTable.id })
    .from(milestonesTable)
    .where(eq(milestonesTable.id, id.data));
  if (!milestone) {
    res.status(404).json({ error: "Milestone not found" });
    return;
  }
  const now = new Date();
  const [reflection] = await db
    .insert(periodReflectionsTable)
    .values({
      milestoneId: id.data,
      ...parsed.data,
      savedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: periodReflectionsTable.milestoneId,
      set: { ...parsed.data, updatedAt: now },
    })
    .returning();
  res.json(formatReflection(reflection));
});

router.get("/dojo-cabinet", async (_req, res): Promise<void> => {
  const items = await db
    .select()
    .from(dojoCabinetItemsTable)
    .orderBy(
      asc(dojoCabinetItemsTable.position),
      desc(dojoCabinetItemsTable.createdAt),
    );
  res.json(items.map(formatCabinetItem));
});

router.post("/dojo-cabinet", async (req, res): Promise<void> => {
  const parsed = cabinetInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const url = normalizeUrl(parsed.data.url);
  if (parsed.data.url && !url) {
    res.status(400).json({ error: "Links must use http or https" });
    return;
  }
  if (parsed.data.kind === "repository" && !isGitHubRepositoryUrl(url)) {
    res.status(400).json({ error: "Use a complete GitHub repository address" });
    return;
  }
  if (!(await validateReflectionId(parsed.data.periodReflectionId))) {
    res.status(400).json({ error: "Period reflection not found" });
    return;
  }
  const [item] = await db
    .insert(dojoCabinetItemsTable)
    .values({
      ...parsed.data,
      url,
      periodReflectionId: parsed.data.periodReflectionId ?? null,
    })
    .returning();
  res.status(201).json(formatCabinetItem(item));
});

router.patch("/dojo-cabinet/:id", async (req, res): Promise<void> => {
  const id = idSchema.safeParse(req.params.id);
  const parsed = cabinetPatch.safeParse(req.body);
  if (!id.success || !parsed.success || Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "Provide a valid cabinet update" });
    return;
  }
  const url = normalizeUrl(parsed.data.url);
  if (parsed.data.url && !url) {
    res.status(400).json({ error: "Links must use http or https" });
    return;
  }
  if (parsed.data.kind === "repository" && !isGitHubRepositoryUrl(url)) {
    res.status(400).json({ error: "Use a complete GitHub repository address" });
    return;
  }
  if (!(await validateReflectionId(parsed.data.periodReflectionId))) {
    res.status(400).json({ error: "Period reflection not found" });
    return;
  }
  const [item] = await db
    .update(dojoCabinetItemsTable)
    .set({
      ...parsed.data,
      url: parsed.data.url === undefined ? undefined : url,
      periodReflectionId:
        parsed.data.periodReflectionId === undefined
          ? undefined
          : parsed.data.periodReflectionId,
    })
    .where(eq(dojoCabinetItemsTable.id, id.data))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Cabinet item not found" });
    return;
  }
  res.json(formatCabinetItem(item));
});

router.delete("/dojo-cabinet/:id", async (req, res): Promise<void> => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid cabinet item id" });
    return;
  }
  const [deleted] = await db
    .delete(dojoCabinetItemsTable)
    .where(eq(dojoCabinetItemsTable.id, id.data))
    .returning({ id: dojoCabinetItemsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Cabinet item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
