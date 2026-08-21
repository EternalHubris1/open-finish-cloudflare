import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  dojoCabinetItemsTable,
  milestonesTable,
  periodReflectionsTable,
} from "@workspace/db";

const router: IRouter = Router();

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateSchema = z.string().regex(datePattern, "Use YYYY-MM-DD for dates");
const idSchema = z.coerce.number().int().positive();
const periodSchema = z.enum(["week", "month", "custom"]);
const statusSchema = z.enum(["open", "complete", "archived"]);

const milestoneInput = z.object({
  title: z.string().trim().min(1).max(140),
  detail: z.string().trim().max(1200).nullable().optional(),
  period: periodSchema,
  dueDate: dateSchema,
  status: statusSchema.optional(),
});

const milestonePatch = milestoneInput.partial();

const reflectionInput = z.object({
  notice: z.string().trim().max(1600).default(""),
  carry: z.string().trim().max(1600).default(""),
});

const cabinetInput = z.object({
  periodReflectionId: idSchema.nullable().optional(),
  title: z.string().trim().min(1).max(160),
  url: z.string().trim().max(2048).nullable().optional(),
  note: z.string().trim().max(1200).default(""),
  kind: z.enum(["link", "note"]).default("link"),
  position: z.number().int().min(0).max(999).optional(),
});

const cabinetPatch = cabinetInput.partial();

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
