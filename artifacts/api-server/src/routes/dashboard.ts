import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, activitiesTable, activityLogsTable, achievementsTable } from "@workspace/db";
import { GetDashboardResponse, ListStreaksResponse, GetWeeklyProgressResponse } from "@workspace/api-zod";
import { calculateStreak } from "../lib/streaks";

const router: IRouter = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

router.get("/dashboard", async (_req, res): Promise<void> => {
  const today = todayStr();
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
  const totalMinutesToday = todayLogs.reduce((s, l) => s + l.durationMinutes, 0);

  const activityIdsDoneToday = new Set(todayLogs.map((l) => l.activityId));
  const activitiesTodayCompleted = activityIdsDoneToday.size;

  const overallCurrentStreak = activities.reduce((max, activity) => {
    const summary = calculateStreak(
      allLogs.filter((log) => log.activityId === activity.id).map((log) => log.logDate),
      today,
    );
    return Math.max(max, summary.currentStreak);
  }, 0);

  const totalAchievements = (await db.select().from(achievementsTable)).length;

  const allActivities = await db.select().from(activitiesTable);
  const actMap = new Map(allActivities.map((a) => [a.id, a.name]));

  res.json(
    GetDashboardResponse.parse({
      totalActivities,
      totalMinutesToday,
      activitiesTodayCompleted,
      activitiesTodayTotal: totalActivities,
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
    }),
  );
});

router.get("/streaks", async (_req, res): Promise<void> => {
  const activities = await db.select().from(activitiesTable);
  const logs = await db.select().from(activityLogsTable);
  const today = todayStr();

  res.json(
    ListStreaksResponse.parse(
      activities
        .map((activity) => ({
          activityId: activity.id,
          activityName: activity.name,
          ...calculateStreak(
            logs.filter((log) => log.activityId === activity.id).map((log) => log.logDate),
            today,
          ),
        }))
        .sort((a, b) => b.currentStreak - a.currentStreak),
    ),
  );
});

router.get("/progress/weekly", async (_req, res): Promise<void> => {
  const last7 = getLast7Days();
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
      targetMinutesPerDay: activity.targetMinutesPerDay,
      days,
    };
  });

  res.json(GetWeeklyProgressResponse.parse(result));
});

export default router;
