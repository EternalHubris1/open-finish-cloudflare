import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, activitiesTable, streaksTable } from "@workspace/db";
import {
  ListActivitiesResponse,
  CreateActivityBody,
  CreateActivityResponse,
  GetActivityParams,
  GetActivityResponse,
  UpdateActivityParams,
  UpdateActivityBody,
  UpdateActivityResponse,
  DeleteActivityParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatActivity(a: typeof activitiesTable.$inferSelect) {
  return {
    ...a,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/activities", async (_req, res): Promise<void> => {
  const activities = await db.select().from(activitiesTable).orderBy(activitiesTable.createdAt);
  res.json(ListActivitiesResponse.parse(activities.map(formatActivity)));
});

router.post("/activities", async (req, res): Promise<void> => {
  const parsed = CreateActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [activity] = await db.insert(activitiesTable).values(parsed.data).returning();
  res.status(201).json(CreateActivityResponse.parse(formatActivity(activity)));
});

router.get("/activities/:id", async (req, res): Promise<void> => {
  const params = GetActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [activity] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, params.data.id));

  if (!activity) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  res.json(GetActivityResponse.parse(formatActivity(activity)));
});

router.patch("/activities/:id", async (req, res): Promise<void> => {
  const params = UpdateActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(activitiesTable)
    .set(parsed.data)
    .where(eq(activitiesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  res.json(UpdateActivityResponse.parse(formatActivity(updated)));
});

router.delete("/activities/:id", async (req, res): Promise<void> => {
  const params = DeleteActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(streaksTable).where(eq(streaksTable.activityId, params.data.id));
  const [deleted] = await db
    .delete(activitiesTable)
    .where(eq(activitiesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
