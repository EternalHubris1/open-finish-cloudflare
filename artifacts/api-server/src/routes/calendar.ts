import { Router, type IRouter } from "express";
import { and, gte, lte } from "drizzle-orm";
import { db, activitiesTable, activityLogsTable } from "@workspace/db";
import { GetCalendarQueryParams, GetCalendarResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// A day is considered "heavily exceeded" once total logged minutes reach this
// multiple of the day's combined goal.
const OVER_GOAL_MULTIPLIER = 1.5;

router.get("/calendar", async (req, res): Promise<void> => {
  const query = GetCalendarQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { start, end } = query.data;

  const activities = await db.select().from(activitiesTable);
  const activityMap = new Map(activities.map((a) => [a.id, a]));
  const goalMinutes = activities.reduce((sum, a) => sum + a.targetMinutesPerDay, 0);

  const logs = await db
    .select()
    .from(activityLogsTable)
    .where(and(gte(activityLogsTable.logDate, start), lte(activityLogsTable.logDate, end)));

  const logsByDate = new Map<string, typeof logs>();
  for (const log of logs) {
    const existing = logsByDate.get(log.logDate);
    if (existing) {
      existing.push(log);
    } else {
      logsByDate.set(log.logDate, [log]);
    }
  }

  const days = Array.from(logsByDate.entries())
    .map(([date, dayLogs]) => {
      const totalMinutes = dayLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
      const status: "under" | "met" | "over" =
        goalMinutes > 0 && totalMinutes >= goalMinutes * OVER_GOAL_MULTIPLIER
          ? "over"
          : totalMinutes >= goalMinutes
            ? "met"
            : "under";

      return {
        date,
        totalMinutes,
        goalMinutes,
        status,
        logs: dayLogs
          .map((l) => {
            const activity = activityMap.get(l.activityId);
            return {
              id: l.id,
              activityId: l.activityId,
              activityName: activity?.name ?? "Unknown",
              activityColor: activity?.color ?? "#dc2626",
              durationMinutes: l.durationMinutes,
              notes: l.notes,
              logDate: l.logDate,
            };
          })
          .sort((a, b) => a.activityName.localeCompare(b.activityName)),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json(GetCalendarResponse.parse(days));
});

export default router;
