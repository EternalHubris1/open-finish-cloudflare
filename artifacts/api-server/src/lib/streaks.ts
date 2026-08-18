import { eq } from "drizzle-orm";
import {
  db,
  streaksTable,
  achievementsTable,
  activityLogsTable,
  activitiesTable,
} from "@workspace/db";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / DAY_MS);
}

export function calculateStreak(
  logDates: string[],
  today: string,
): {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string | null;
} {
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
    if (
      dayNumber(datesThroughToday[i]) - dayNumber(datesThroughToday[i - 1]) !==
      1
    ) {
      break;
    }
    currentStreak += 1;
  }

  return { currentStreak, longestStreak, lastLoggedDate };
}

export async function updateStreak(
  activityId: number,
  today: string,
): Promise<void> {
  const logs = await db
    .select({ logDate: activityLogsTable.logDate })
    .from(activityLogsTable)
    .where(eq(activityLogsTable.activityId, activityId));
  const summary = calculateStreak(
    logs.map((log) => log.logDate),
    today,
  );

  if (!summary.lastLoggedDate) {
    await db
      .delete(streaksTable)
      .where(eq(streaksTable.activityId, activityId));
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

async function checkAndUnlockAchievements(
  activityId: number,
  currentStreak: number,
): Promise<void> {
  // Count total logs across all activities
  const logs = await db.select().from(activityLogsTable);
  const totalLogs = logs.length;

  const allAchievements = await db.select().from(achievementsTable);
  const types = new Set(allAchievements.map((a) => a.type));

  const toUnlock: Array<{
    type: string;
    title: string;
    description: string;
    icon: string;
    activityId: number | null;
  }> = [];

  if (currentStreak >= 30 && !types.has(`streak_30_${activityId}`)) {
    const [act] = await db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, activityId));
    toUnlock.push({
      type: `streak_30_${activityId}`,
      title: "A Month of Return",
      description: `You returned to ${act?.name ?? "this direction"} across 30 consecutive days.`,
      icon: "crown",
      activityId,
    });
  }

  if (totalLogs >= 50 && !types.has("sessions_50")) {
    toUnlock.push({
      type: "sessions_50",
      title: "Fifty Returns",
      description: "Fifty learning sessions now form part of your history.",
      icon: "medal",
      activityId: null,
    });
  }

  if (totalLogs >= 100 && !types.has("sessions_100")) {
    toUnlock.push({
      type: "sessions_100",
      title: "One Hundred Returns",
      description:
        "One hundred learning sessions now form part of your history.",
      icon: "award",
      activityId: null,
    });
  }

  for (const achievement of toUnlock) {
    await db.insert(achievementsTable).values(achievement);
  }
}
