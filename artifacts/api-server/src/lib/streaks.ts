import { eq } from "drizzle-orm";
import { db, streaksTable, activityLogsTable } from "@workspace/db";
import { reconcileAchievements } from "./achievements";

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

  await reconcileAchievements();
}
