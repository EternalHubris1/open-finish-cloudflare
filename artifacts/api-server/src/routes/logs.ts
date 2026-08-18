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
  UpdateLogReflectionParams,
  UpdateLogReflectionBody,
  UpdateLogReflectionResponse,
} from "@workspace/api-zod";
import { updateStreak } from "../lib/streaks";
import { todayForRequest } from "../lib/calendar";
import { buildReflectionUpdate } from "../lib/reflection-update";

const router: IRouter = Router();

function formatLog(log: typeof activityLogsTable.$inferSelect) {
  return {
    ...log,
    createdAt: log.createdAt.toISOString(),
  };
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
    .orderBy(desc(activityLogsTable.logDate), desc(activityLogsTable.id));

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

  const today = todayForRequest(req);
  const logDate = parsed.data.logDate ?? today;
  if (logDate > today) {
    res.status(400).json({ error: "Activity cannot be logged in the future" });
    return;
  }

  const [log] = await db
    .insert(activityLogsTable)
    .values({
      activityId: params.data.id,
      durationMinutes: parsed.data.durationMinutes,
      notes: parsed.data.notes,
      recallNote: parsed.data.recallNote ?? null,
      logDate,
    })
    .returning();

  // Update streak after logging
  await updateStreak(params.data.id, today);

  res.status(201).json(LogActivityResponse.parse(formatLog(log)));
});

router.patch("/logs/:id", async (req, res): Promise<void> => {
  const params = UpdateLogReflectionParams.safeParse(req.params);
  const parsed = UpdateLogReflectionBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const reflectionUpdate = buildReflectionUpdate(parsed.data);
  if (!Object.keys(reflectionUpdate).length) {
    res
      .status(400)
      .json({ error: "Provide at least one reflection field to update" });
    return;
  }
  const [updated] = await db
    .update(activityLogsTable)
    .set(reflectionUpdate)
    .where(eq(activityLogsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Log not found" });
    return;
  }
  res.json(UpdateLogReflectionResponse.parse(formatLog(updated)));
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

  await updateStreak(deleted.activityId, todayForRequest(req));

  res.sendStatus(204);
});

export default router;
