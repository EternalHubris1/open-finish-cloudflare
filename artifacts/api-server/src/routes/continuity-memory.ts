import { Router, type IRouter } from "express";
import { asc, desc, eq, inArray } from "drizzle-orm";
import {
  activitiesTable,
  activityLogsTable,
  db,
  evidenceShelfTable,
  weeklyReflectionsTable,
} from "@workspace/db";
import {
  GetEvidenceShelfResponse,
  ListWeeklyReflectionsResponse,
  PutEvidenceShelfBody,
  PutEvidenceShelfResponse,
  PutWeeklyReflectionBody,
  PutWeeklyReflectionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function readEvidenceShelf() {
  const rows = await db
    .select({
      id: activityLogsTable.id,
      activityId: activityLogsTable.activityId,
      activityName: activitiesTable.name,
      activityColor: activitiesTable.color,
      logDate: activityLogsTable.logDate,
      recallNote: activityLogsTable.recallNote,
      whatMoved: activityLogsTable.whatMoved,
      whatLearned: activityLogsTable.whatLearned,
      nextContinuation: activityLogsTable.nextContinuation,
      savedAt: evidenceShelfTable.savedAt,
    })
    .from(evidenceShelfTable)
    .innerJoin(
      activityLogsTable,
      eq(activityLogsTable.id, evidenceShelfTable.activityLogId),
    )
    .innerJoin(
      activitiesTable,
      eq(activitiesTable.id, activityLogsTable.activityId),
    )
    .orderBy(asc(evidenceShelfTable.position));

  return rows.flatMap((row) => {
    const evidence = row.nextContinuation
      ? { text: row.nextContinuation, kind: "Continuation" as const }
      : row.whatLearned
        ? { text: row.whatLearned, kind: "Learned" as const }
        : row.whatMoved
          ? { text: row.whatMoved, kind: "Moved" as const }
          : row.recallNote
            ? { text: row.recallNote, kind: "Recall" as const }
            : null;
    return evidence
      ? [
          {
            id: row.id,
            activityId: row.activityId,
            activityName: row.activityName,
            activityColor: row.activityColor,
            logDate: row.logDate,
            ...evidence,
            savedAt: row.savedAt.toISOString(),
          },
        ]
      : [];
  });
}

router.get("/evidence-shelf", async (_req, res): Promise<void> => {
  res.json(GetEvidenceShelfResponse.parse(await readEvidenceShelf()));
});

router.put("/evidence-shelf", async (req, res): Promise<void> => {
  const parsed = PutEvidenceShelfBody.safeParse(req.body);
  if (
    !parsed.success ||
    new Set(parsed.success ? parsed.data.activityLogIds : []).size !==
      (parsed.success ? parsed.data.activityLogIds.length : -1)
  ) {
    res
      .status(400)
      .json({
        error: parsed.success
          ? "Evidence shelf entries must be unique"
          : parsed.error.message,
      });
    return;
  }
  const ids = parsed.data.activityLogIds;
  const valid = ids.length
    ? await db
        .select({ id: activityLogsTable.id })
        .from(activityLogsTable)
        .where(inArray(activityLogsTable.id, ids))
    : [];
  if (valid.length !== ids.length) {
    res
      .status(400)
      .json({ error: "One or more reflection entries no longer exist" });
    return;
  }
  await db.transaction(async (tx) => {
    const existing = await tx.select().from(evidenceShelfTable);
    const savedAt = new Map(
      existing.map((entry) => [entry.activityLogId, entry.savedAt]),
    );
    await tx.delete(evidenceShelfTable);
    if (ids.length)
      await tx
        .insert(evidenceShelfTable)
        .values(
          ids.map((activityLogId, position) => ({
            activityLogId,
            position,
            savedAt: savedAt.get(activityLogId) ?? new Date(),
          })),
        );
  });
  res.json(PutEvidenceShelfResponse.parse(await readEvidenceShelf()));
});

const formatWeekly = (row: typeof weeklyReflectionsTable.$inferSelect) => ({
  ...row,
  savedAt: row.savedAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

router.get("/weekly-reflections", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(weeklyReflectionsTable)
    .orderBy(desc(weeklyReflectionsTable.weekStart));
  res.json(ListWeeklyReflectionsResponse.parse(rows.map(formatWeekly)));
});

router.put("/weekly-reflections", async (req, res): Promise<void> => {
  const parsed = PutWeeklyReflectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  if (
    new Set(body.evidenceIds).size !== body.evidenceIds.length ||
    new Set(body.keptEvidenceIds).size !== body.keptEvidenceIds.length
  ) {
    res
      .status(400)
      .json({ error: "Weekly reflection evidence must be unique" });
    return;
  }
  if (body.keptEvidenceIds.length) {
    const keptRows = await db
      .select({ activityLogId: evidenceShelfTable.activityLogId })
      .from(evidenceShelfTable)
      .where(inArray(evidenceShelfTable.activityLogId, body.keptEvidenceIds));
    if (keptRows.length !== body.keptEvidenceIds.length) {
      res
        .status(400)
        .json({
          error:
            "Weekly reflection can only keep evidence that is currently on the shelf",
        });
      return;
    }
  }
  const now = new Date();
  const [row] = await db
    .insert(weeklyReflectionsTable)
    .values({
      ...body,
      notice: body.notice.trim(),
      carry: body.carry.trim(),
      savedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: weeklyReflectionsTable.weekStart,
      set: {
        notice: body.notice.trim(),
        carry: body.carry.trim(),
        evidenceIds: body.evidenceIds,
        keptEvidenceIds: body.keptEvidenceIds,
        updatedAt: now,
      },
    })
    .returning();
  res.json(PutWeeklyReflectionResponse.parse(formatWeekly(row)));
});

export default router;
