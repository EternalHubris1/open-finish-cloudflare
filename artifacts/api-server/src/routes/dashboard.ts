import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  activitiesTable,
  activityLogsTable,
  achievementsTable,
} from "@workspace/db";
import {
  GetDashboardResponse,
  ListStreaksResponse,
  GetWeeklyProgressResponse,
} from "@workspace/api-zod";
import { calculateStreak } from "../lib/streaks";
import {
  displayDateForRequest,
  shiftCalendarDate,
  todayForRequest,
} from "../lib/calendar";
import { rankFrequentActivities } from "../lib/activity-frequency";
import { resolveActivityType } from "../lib/activity-type";

const router: IRouter = Router();

function getLast7Days(today: string): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    shiftCalendarDate(today, index - 6),
  );
}

router.get("/dashboard", async (req, res): Promise<void> => {
  const today = displayDateForRequest(req);
  const activities = await db.select().from(activitiesTable);
  const todayLogs = await db
    .select()
    .from(activityLogsTable)
    .where(eq(activityLogsTable.logDate, today))
    .orderBy(desc(activityLogsTable.createdAt));
  const allLogs = await db.select().from(activityLogsTable);
  const recentAchievements = await db
    .select()
    .from(achievementsTable)
    .orderBy(desc(achievementsTable.unlockedAt))
    .limit(3);

  const totalActivities = activities.length;
  const activityTypeById = new Map(
    activities.map((activity) => [activity.id, resolveActivityType(activity)]),
  );
  const practiceLogsToday = todayLogs.filter(
    (log) => activityTypeById.get(log.activityId) === "practice",
  );
  const sportLogsToday = todayLogs.filter(
    (log) => activityTypeById.get(log.activityId) === "sport",
  );
  const frictionLogsToday = todayLogs.filter(
    (log) => activityTypeById.get(log.activityId) === "friction",
  );
  const practiceMinutesToday = practiceLogsToday.reduce(
    (sum, log) => sum + log.durationMinutes,
    0,
  );
  const sportMinutesToday = sportLogsToday.reduce(
    (sum, log) => sum + log.durationMinutes,
    0,
  );
  const frictionMinutesToday = frictionLogsToday.reduce(
    (sum, log) => sum + log.durationMinutes,
    0,
  );
  const positiveMinutesToday = practiceMinutesToday + sportMinutesToday;
  const cleanMinutesToday = positiveMinutesToday - frictionMinutesToday;
  const totalMinutesToday = positiveMinutesToday;

  const activityIdsDoneToday = new Set(
    [...practiceLogsToday, ...sportLogsToday].map((log) => log.activityId),
  );
  const activitiesTodayCompleted = activityIdsDoneToday.size;
  const positiveActivities = activities.filter(
    (activity) => resolveActivityType(activity) !== "friction",
  );

  const overallCurrentStreak = calculateStreak(
    allLogs
      .filter((log) => activityTypeById.get(log.activityId) !== "friction")
      .map((log) => log.logDate),
    today,
  ).currentStreak;

  const totalAchievements = (await db.select().from(achievementsTable)).length;

  const allActivities = await db.select().from(activitiesTable);
  const actMap = new Map(allActivities.map((a) => [a.id, a.name]));

  res.json(
    GetDashboardResponse.parse({
      totalActivities,
      totalMinutesToday,
      sportMinutesToday,
      frictionMinutesToday,
      positiveMinutesToday,
      cleanMinutesToday,
      activitiesTodayCompleted,
      activitiesTodayTotal: positiveActivities.length,
      overallCurrentStreak,
      totalAchievements,
      recentAchievements: recentAchievements.map((a) => ({
        ...a,
        unlockedAt: a.unlockedAt.toISOString(),
        activityName: a.activityId ? (actMap.get(a.activityId) ?? null) : null,
      })),
      todayLogs: todayLogs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      frequentActivities: rankFrequentActivities(allLogs),
    }),
  );
});

router.get("/streaks", async (req, res): Promise<void> => {
  const activities = await db.select().from(activitiesTable);
  const logs = await db.select().from(activityLogsTable);
  const today = todayForRequest(req);

  res.json(
    ListStreaksResponse.parse(
      activities
        .map((activity) => ({
          activityId: activity.id,
          activityName: activity.name,
          ...calculateStreak(
            logs
              .filter((log) => log.activityId === activity.id)
              .map((log) => log.logDate),
            today,
          ),
        }))
        .sort((a, b) => b.currentStreak - a.currentStreak),
    ),
  );
});

router.get("/progress/weekly", async (req, res): Promise<void> => {
  const last7 = getLast7Days(todayForRequest(req));
  const activities = await db.select().from(activitiesTable);

  const allLogs = await db.select().from(activityLogsTable);
  const logsInRange = allLogs.filter((l) => last7.includes(l.logDate));

  const result = activities.map((activity) => {
    const days = last7.map((date) => {
      const dayLogs = logsInRange.filter(
        (l) => l.activityId === activity.id && l.logDate === date,
      );
      const minutesLogged = dayLogs.reduce((s, l) => s + l.durationMinutes, 0);
      return {
        date,
        minutesLogged,
        completed: minutesLogged >= activity.targetMinutesPerDay,
      };
    });

    return {
      activityId: activity.id,
      activityName: activity.name,
      color: activity.color,
      activityType: resolveActivityType(activity),
      targetMinutesPerDay: activity.targetMinutesPerDay,
      days,
    };
  });

  res.json(GetWeeklyProgressResponse.parse(result));
});

export default router;
