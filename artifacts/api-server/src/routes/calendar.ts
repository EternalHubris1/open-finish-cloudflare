import { Router, type IRouter } from "express";
import { and, gte, lte } from "drizzle-orm";
import { db, activitiesTable, activityLogsTable } from "@workspace/db";
import {
  GetCalendarQueryParams,
  GetCalendarResponse,
} from "@workspace/api-zod";
import { resolveActivityType } from "../lib/activity-type";

const router: IRouter = Router();

// A practice day is "heavily exceeded" once practice minutes reach this
// multiple of the combined practice goal. Sport never changes this status.
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
  const goalMinutes = activities
    .filter((activity) => resolveActivityType(activity) === "practice")
    .reduce((sum, activity) => sum + activity.targetMinutesPerDay, 0);

  const logs = await db
    .select()
    .from(activityLogsTable)
    .where(
      and(
        gte(activityLogsTable.logDate, start),
        lte(activityLogsTable.logDate, end),
      ),
    );

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
      const focusMinutes = dayLogs.reduce((sum, log) => {
        const activity = activityMap.get(log.activityId);
        return resolveActivityType({
          activityType: activity?.activityType,
          category: activity?.category ?? "",
        }) === "practice"
          ? sum + log.durationMinutes
          : sum;
      }, 0);
      const sportMinutes = dayLogs.reduce((sum, log) => {
        const activity = activityMap.get(log.activityId);
        return resolveActivityType({
          activityType: activity?.activityType,
          category: activity?.category ?? "",
        }) === "sport"
          ? sum + log.durationMinutes
          : sum;
      }, 0);
      const totalMinutes = focusMinutes + sportMinutes;
      const status: "under" | "met" | "over" =
        goalMinutes === 0
          ? "under"
          : focusMinutes >= goalMinutes * OVER_GOAL_MULTIPLIER
            ? "over"
            : focusMinutes >= goalMinutes
              ? "met"
              : "under";

      return {
        date,
        totalMinutes,
        focusMinutes,
        sportMinutes,
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
              activityType: resolveActivityType({
                activityType: activity?.activityType,
                category: activity?.category ?? "",
              }),
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
