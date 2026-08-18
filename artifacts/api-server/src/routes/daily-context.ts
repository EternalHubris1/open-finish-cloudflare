import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { activitiesTable, dailyContextsTable, db } from "@workspace/db";
import {
  GetTodayContextResponse,
  PutTodayContextBody,
  PutTodayContextResponse,
} from "@workspace/api-zod";
import { todayForRequest } from "../lib/calendar";
import { normalizeExternalHttpUrl } from "../lib/external-url";

const router: IRouter = Router();

async function readContext(contextDate: string) {
  const [row] = await db
    .select({
      id: dailyContextsTable.id,
      contextDate: dailyContextsTable.contextDate,
      focusActivityId: dailyContextsTable.focusActivityId,
      focusActivityName: activitiesTable.name,
      focusActivityColor: activitiesTable.color,
      intention: dailyContextsTable.intention,
      externalUrl: dailyContextsTable.externalUrl,
      createdAt: dailyContextsTable.createdAt,
      updatedAt: dailyContextsTable.updatedAt,
    })
    .from(dailyContextsTable)
    .leftJoin(
      activitiesTable,
      eq(activitiesTable.id, dailyContextsTable.focusActivityId),
    )
    .where(eq(dailyContextsTable.contextDate, contextDate));
  return row
    ? {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    : null;
}

router.get("/context/today", async (req, res): Promise<void> => {
  res.json(
    GetTodayContextResponse.parse(await readContext(todayForRequest(req))),
  );
});

router.put("/context/today", async (req, res): Promise<void> => {
  const parsed = PutTodayContextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const externalUrl = normalizeExternalHttpUrl(parsed.data.externalUrl);
  if (parsed.data.externalUrl?.trim() && !externalUrl) {
    res.status(400).json({ error: "Context link must use http or https" });
    return;
  }
  if (parsed.data.focusActivityId != null) {
    const [activity] = await db
      .select({ id: activitiesTable.id })
      .from(activitiesTable)
      .where(eq(activitiesTable.id, parsed.data.focusActivityId));
    if (!activity) {
      res.status(400).json({ error: "Choose an existing direction" });
      return;
    }
  }
  const contextDate = todayForRequest(req);
  const now = new Date();
  await db
    .insert(dailyContextsTable)
    .values({
      contextDate,
      focusActivityId: parsed.data.focusActivityId ?? null,
      intention: parsed.data.intention?.trim() || null,
      externalUrl,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: dailyContextsTable.contextDate,
      set: {
        focusActivityId: parsed.data.focusActivityId ?? null,
        intention: parsed.data.intention?.trim() || null,
        externalUrl,
        updatedAt: now,
      },
    });
  res.json(PutTodayContextResponse.parse(await readContext(contextDate)));
});

export default router;
