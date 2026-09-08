import { eq } from "drizzle-orm";
import {
  db,
  streaksTable,
  activityLogsTable,
  activitiesTable,
} from "@workspace/db";
import { reconcileAchievements } from "./achievements";
import { listRestDayDates } from "./day-markers";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / DAY_MS);
}

function dateFromDayNumber(value: number): string {
  return new Date(value * DAY_MS).toISOString().slice(0, 10);
}

function gapIsRest(left: string, right: string, restDates: Set<string>): boolean {
  for (let day = dayNumber(left) + 1; day < dayNumber(right); day += 1) {
    if (!restDates.has(dateFromDayNumber(day))) return false;
  }
  return true;
}

export function calculateStreak(
  logDates: string[],
  today: string,
  restDayDates: string[] = [],
): {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string | null;
} {
  const dates = [...new Set(logDates)].sort();
  const restDates = new Set(restDayDates);
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastLoggedDate: null };
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i += 1) {
    if (gapIsRest(dates[i - 1], dates[i], restDates)) {
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
  if (daysSinceLastLog > 1 && !gapIsRest(lastLoggedDate, today, restDates)) {
    return { currentStreak: 0, longestStreak, lastLoggedDate };
  }

  let currentStreak = 1;
  for (let i = datesThroughToday.length - 1; i > 0; i -= 1) {
    if (
      !gapIsRest(
        datesThroughToday[i - 1],
        datesThroughToday[i],
        restDates,
      )
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
  reconcile = true,
): Promise<void> {
  const [logs, restDayDates] = await Promise.all([
    db
      .select({ logDate: activityLogsTable.logDate })
      .from(activityLogsTable)
      .where(eq(activityLogsTable.activityId, activityId)),
    listRestDayDates(),
  ]);
  const summary = calculateStreak(
    logs.map((log) => log.logDate),
    today,
    restDayDates,
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

  if (reconcile) await reconcileAchievements();
}

export async function updateAllStreaks(today: string): Promise<void> {
  const activities = await db.select({ id: activitiesTable.id }).from(activitiesTable);
  for (const activity of activities) {
    await updateStreak(activity.id, today, false);
  }
  await reconcileAchievements();
}
