import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, alertsTable, activitiesTable } from "@workspace/db";
import {
  ListAlertsResponse,
  CreateAlertBody,
  CreateAlertResponse,
  UpdateAlertParams,
  UpdateAlertBody,
  UpdateAlertResponse,
  DeleteAlertParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getAlertsWithActivityName() {
  const alerts = await db.select().from(alertsTable).orderBy(alertsTable.createdAt);
  const activities = await db.select().from(activitiesTable);
  const actMap = new Map(activities.map((a) => [a.id, a.name]));
  return alerts.map((a) => ({
    ...a,
    activityName: actMap.get(a.activityId) ?? null,
  }));
}

router.get("/alerts", async (_req, res): Promise<void> => {
  const alerts = await getAlertsWithActivityName();
  res.json(ListAlertsResponse.parse(alerts));
});

router.post("/alerts", async (req, res): Promise<void> => {
  const parsed = CreateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [activity] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, parsed.data.activityId));

  if (!activity) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  const [alert] = await db
    .insert(alertsTable)
    .values({
      ...parsed.data,
      enabled: parsed.data.enabled ?? true,
    })
    .returning();

  res.status(201).json(CreateAlertResponse.parse({
    ...alert,
    activityName: activity.name,
  }));
});

router.patch("/alerts/:id", async (req, res): Promise<void> => {
  const params = UpdateAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(alertsTable)
    .set(parsed.data)
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  const [activity] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, updated.activityId));

  res.json(UpdateAlertResponse.parse({
    ...updated,
    activityName: activity?.name ?? null,
  }));
});

router.delete("/alerts/:id", async (req, res): Promise<void> => {
  const params = DeleteAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(alertsTable)
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
