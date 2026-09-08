import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, dayMarkersTable } from "@workspace/db";
import {
  DeleteRestDayParams,
  PutRestDayParams,
  PutRestDayResponse,
} from "@workspace/api-zod";
import { isCalendarDate, todayForRequest } from "../lib/calendar";
import {
  ensureDayMarkersTable,
  isMissingTable,
} from "../lib/day-markers";
import { updateAllStreaks } from "../lib/streaks";

const router: IRouter = Router();

router.put("/day-markers/:date/rest", async (req, res): Promise<void> => {
  const params = PutRestDayParams.safeParse(req.params);
  if (!params.success || !isCalendarDate(params.data?.date ?? "")) {
    res.status(400).json({ error: "Provide a valid calendar date" });
    return;
  }
  if (params.data.date > todayForRequest(req)) {
    res.status(400).json({ error: "A future day cannot be marked as rest" });
    return;
  }

  await ensureDayMarkersTable();
  const [created] = await db
    .insert(dayMarkersTable)
    .values({ markerDate: params.data.date, kind: "rest" })
    .onConflictDoNothing({
      target: [dayMarkersTable.markerDate, dayMarkersTable.kind],
    })
    .returning();
  const marker =
    created ??
    (
      await db
        .select()
        .from(dayMarkersTable)
        .where(
          and(
            eq(dayMarkersTable.markerDate, params.data.date),
            eq(dayMarkersTable.kind, "rest"),
          ),
        )
    )[0];

  if (!marker) {
    res.status(500).json({ error: "Rest day could not be saved" });
    return;
  }

  await updateAllStreaks(todayForRequest(req));

  res.json(
    PutRestDayResponse.parse({
      date: marker.markerDate,
      kind: "rest",
      createdAt: marker.createdAt.toISOString(),
    }),
  );
});

router.delete("/day-markers/:date/rest", async (req, res): Promise<void> => {
  const params = DeleteRestDayParams.safeParse(req.params);
  if (!params.success || !isCalendarDate(params.data?.date ?? "")) {
    res.status(400).json({ error: "Provide a valid calendar date" });
    return;
  }
  try {
    await db
      .delete(dayMarkersTable)
      .where(
        and(
          eq(dayMarkersTable.markerDate, params.data.date),
          eq(dayMarkersTable.kind, "rest"),
        ),
      );
  } catch (error) {
    if (!isMissingTable(error)) throw error;
  }
  await updateAllStreaks(todayForRequest(req));
  res.status(204).send();
});

export default router;
