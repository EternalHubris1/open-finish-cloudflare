import { Router, type IRouter } from "express";
import { desc, eq, isNotNull, or } from "drizzle-orm";
import { activitiesTable, activityLogsTable, db } from "@workspace/db";
import { ListReflectionsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reflections", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: activityLogsTable.id,
      activityId: activityLogsTable.activityId,
      activityName: activitiesTable.name,
      activityColor: activitiesTable.color,
      durationMinutes: activityLogsTable.durationMinutes,
      recallNote: activityLogsTable.recallNote,
      whatMoved: activityLogsTable.whatMoved,
      whatLearned: activityLogsTable.whatLearned,
      nextContinuation: activityLogsTable.nextContinuation,
      logDate: activityLogsTable.logDate,
      createdAt: activityLogsTable.createdAt,
    })
    .from(activityLogsTable)
    .innerJoin(
      activitiesTable,
      eq(activitiesTable.id, activityLogsTable.activityId),
    )
    .where(
      or(
        isNotNull(activityLogsTable.recallNote),
        isNotNull(activityLogsTable.whatMoved),
        isNotNull(activityLogsTable.whatLearned),
        isNotNull(activityLogsTable.nextContinuation),
      ),
    )
    .orderBy(desc(activityLogsTable.logDate), desc(activityLogsTable.id));

  res.json(
    ListReflectionsResponse.parse(
      rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    ),
  );
});

export default router;
