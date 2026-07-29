import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, activityLogsTable, activitiesTable } from "@workspace/db";
import {
  ListActivityLogsParams,
  ListActivityLogsResponse,
  LogActivityParams,
  LogActivityBody,
  LogActivityResponse,
  DeleteLogParams,
} from "@workspace/api-zod";
import { updateStreak } from "../lib/streaks";

const router: IRouter = Router();

function formatLog(log: typeof activityLogsTable.$inferSelect) {
  return {
    ...log,
    createdAt: log.createdAt.toISOString(),
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

router.get("/activities/:id/logs", async (req, res): Promise<void> => {
  const params = ListActivityLogsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const logs = await db
    .select()
    .from(activityLogsTable)
    .where(eq(activityLogsTable.activityId, params.data.id))
    .orderBy(desc(activityLogsTable.logDate));

  res.json(ListActivityLogsResponse.parse(logs.map(formatLog)));
});

router.post("/activities/:id/logs", async (req, res): Promise<void> => {
  const params = LogActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = LogActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  const logDate = parsed.data.logDate ?? todayStr();

  const [log] = await db
    .insert(activityLogsTable)
    .values({
      activityId: params.data.id,
      durationMinutes: parsed.data.durationMinutes,
      notes: parsed.data.notes,
      logDate,
    })
    .returning();

  // Update streak after logging
  await updateStreak(params.data.id, logDate);

  res.status(201).json(LogActivityResponse.parse(formatLog(log)));
});

router.delete("/logs/:id", async (req, res): Promise<void> => {
  const params = DeleteLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(activityLogsTable)
    .where(eq(activityLogsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Log not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
