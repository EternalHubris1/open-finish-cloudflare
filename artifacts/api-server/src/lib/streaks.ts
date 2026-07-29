import { eq } from "drizzle-orm";
import { db, streaksTable, achievementsTable, activityLogsTable, activitiesTable } from "@workspace/db";

function isYesterday(dateStr: string, today: string): boolean {
  const d = new Date(dateStr);
  const t = new Date(today);
  const diff = t.getTime() - d.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round(diff / dayMs) === 1;
}

function isToday(dateStr: string, today: string): boolean {
  return dateStr === today;
}

export async function updateStreak(activityId: number, logDate: string): Promise<void> {
  const [existing] = await db
    .select()
    .from(streaksTable)
    .where(eq(streaksTable.activityId, activityId));

  if (!existing) {
    // First ever log for this activity
    await db.insert(streaksTable).values({
      activityId,
      currentStreak: 1,
      longestStreak: 1,
      lastLoggedDate: logDate,
    });
    await checkAndUnlockAchievements(activityId, 1);
    return;
  }

  if (isToday(existing.lastLoggedDate ?? "", logDate)) {
    // Already logged today — no streak change
    return;
  }

  let newCurrent: number;
  if (isYesterday(existing.lastLoggedDate ?? "", logDate)) {
    newCurrent = existing.currentStreak + 1;
  } else {
    newCurrent = 1;
  }

  const newLongest = Math.max(existing.longestStreak, newCurrent);

  await db
    .update(streaksTable)
    .set({
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastLoggedDate: logDate,
    })
    .where(eq(streaksTable.activityId, activityId));

  await checkAndUnlockAchievements(activityId, newCurrent);
}

async function checkAndUnlockAchievements(activityId: number, currentStreak: number): Promise<void> {
  // Count total logs across all activities
  const logs = await db.select().from(activityLogsTable);
  const totalLogs = logs.length;

  // Count distinct activities with logs
  const activities = await db.select().from(activitiesTable);
  const totalActivities = activities.length;

  // Check for marathon sessions (60+ min) for this activity
  const activityLogs = logs.filter((l) => l.activityId === activityId);
  const hasMarathon = activityLogs.some((l) => l.durationMinutes >= 60);

  const allAchievements = await db.select().from(achievementsTable);
  const types = new Set(allAchievements.map((a) => a.type));

  const toUnlock: Array<{
    type: string;
    title: string;
    description: string;
    icon: string;
    activityId: number | null;
  }> = [];

  if (totalLogs >= 1 && !types.has("first_log")) {
    toUnlock.push({
      type: "first_log",
      title: "First Steps",
      description: "Logged your very first session. Every journey begins here.",
      icon: "footprints",
      activityId: null,
    });
  }

  if (currentStreak >= 3 && !types.has(`streak_3_${activityId}`)) {
    const [act] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, activityId));
    toUnlock.push({
      type: `streak_3_${activityId}`,
      title: "On a Roll",
      description: `3-day streak on ${act?.name ?? "an activity"}. Keep going!`,
      icon: "flame",
      activityId,
    });
  }

  if (currentStreak >= 7 && !types.has(`streak_7_${activityId}`)) {
    const [act] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, activityId));
    toUnlock.push({
      type: `streak_7_${activityId}`,
      title: "Week Warrior",
      description: `7-day streak on ${act?.name ?? "an activity"}. A full week without breaking!`,
      icon: "trophy",
      activityId,
    });
  }

  if (currentStreak >= 30 && !types.has(`streak_30_${activityId}`)) {
    const [act] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, activityId));
    toUnlock.push({
      type: `streak_30_${activityId}`,
      title: "Month Master",
      description: `30-day streak on ${act?.name ?? "an activity"}. Truly dedicated.`,
      icon: "crown",
      activityId,
    });
  }

  if (totalLogs >= 10 && !types.has("sessions_10")) {
    toUnlock.push({
      type: "sessions_10",
      title: "Getting Serious",
      description: "Logged 10 total sessions across all activities.",
      icon: "star",
      activityId: null,
    });
  }

  if (totalLogs >= 50 && !types.has("sessions_50")) {
    toUnlock.push({
      type: "sessions_50",
      title: "Half Century",
      description: "50 sessions logged. You're building real habits.",
      icon: "medal",
      activityId: null,
    });
  }

  if (totalLogs >= 100 && !types.has("sessions_100")) {
    toUnlock.push({
      type: "sessions_100",
      title: "Century Club",
      description: "100 sessions logged. Consistency is your superpower.",
      icon: "award",
      activityId: null,
    });
  }

  if (totalActivities >= 3 && !types.has("three_activities")) {
    toUnlock.push({
      type: "three_activities",
      title: "Well-Rounded",
      description: "Tracking 3 or more learning activities.",
      icon: "layers",
      activityId: null,
    });
  }

  if (hasMarathon && !types.has(`marathon_${activityId}`)) {
    const [act] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, activityId));
    toUnlock.push({
      type: `marathon_${activityId}`,
      title: "Marathon",
      description: `A single 60+ minute session on ${act?.name ?? "an activity"}. Deep focus!`,
      icon: "zap",
      activityId,
    });
  }

  for (const achievement of toUnlock) {
    await db.insert(achievementsTable).values(achievement);
  }
}
