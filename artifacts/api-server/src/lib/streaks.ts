import { eq } from "drizzle-orm";
import {
  db,
  streaksTable,
  achievementsTable,
  activityLogsTable,
  activitiesTable,
} from "@workspace/db";

const DAY_MS = 24 * 60 * 60 * 1000;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayNumber(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / DAY_MS);
}

export function calculateStreak(
  logDates: string[],
  today = todayStr(),
): { currentStreak: number; longestStreak: number; lastLoggedDate: string | null } {
  const dates = [...new Set(logDates)].sort();
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastLoggedDate: null };
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i += 1) {
    if (dayNumber(dates[i]) - dayNumber(dates[i - 1]) === 1) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 1;
    }
  }

  const datesThroughToday = dates.filter((date) => date <= today);
  const lastLoggedDate = datesThroughToday.at(-1) ?? null;
  if (!lastLoggedDate) {
    return { currentStreak: 0, longestStreak, lastLoggedDate: null };
  }

  const daysSinceLastLog = dayNumber(today) - dayNumber(lastLoggedDate);
  if (daysSinceLastLog > 1) {
    return { currentStreak: 0, longestStreak, lastLoggedDate };
  }

  let currentStreak = 1;
  for (let i = datesThroughToday.length - 1; i > 0; i -= 1) {
    if (dayNumber(datesThroughToday[i]) - dayNumber(datesThroughToday[i - 1]) !== 1) {
      break;
    }
    currentStreak += 1;
  }

  return { currentStreak, longestStreak, lastLoggedDate };
}

export async function updateStreak(activityId: number): Promise<void> {
  const logs = await db
    .select({ logDate: activityLogsTable.logDate })
    .from(activityLogsTable)
    .where(eq(activityLogsTable.activityId, activityId));
  const summary = calculateStreak(logs.map((log) => log.logDate));

  if (!summary.lastLoggedDate) {
    await db.delete(streaksTable).where(eq(streaksTable.activityId, activityId));
    return;
  }

  await db
    .insert(streaksTable)
    .values({ activityId, ...summary })
    .onConflictDoUpdate({
      target: streaksTable.activityId,
      set: summary,
    });

  await checkAndUnlockAchievements(activityId, summary.currentStreak);
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
