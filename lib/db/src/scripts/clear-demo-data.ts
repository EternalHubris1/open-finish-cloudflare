/**
 * One-time cleanup script that removes leftover sample/demo rows left over
 * from development so the app starts with a clean, empty state.
 *
 * This project has no automatic seeding on startup (verified: no code path
 * inserts rows into these tables outside of user-triggered API requests), so
 * this script only needs to run once against an existing database that still
 * has demo rows in it.
 *
 * Usage: pnpm --filter @workspace/db run clear-demo-data
 */
import { db } from "../index";
import { activityLogsTable } from "../schema/activity-logs";
import { achievementsTable } from "../schema/achievements";
import { alertsTable } from "../schema/alerts";
import { streaksTable } from "../schema/streaks";
import { activitiesTable } from "../schema/activities";

async function main() {
  // Order respects foreign keys: children before the `activities` parent.
  const deletedLogs = await db.delete(activityLogsTable).returning({ id: activityLogsTable.id });
  const deletedAchievements = await db.delete(achievementsTable).returning({ id: achievementsTable.id });
  const deletedAlerts = await db.delete(alertsTable).returning({ id: alertsTable.id });
  const deletedStreaks = await db.delete(streaksTable).returning({ id: streaksTable.id });
  const deletedActivities = await db.delete(activitiesTable).returning({ id: activitiesTable.id });

  console.log(
    JSON.stringify({
      deletedActivityLogs: deletedLogs.length,
      deletedAchievements: deletedAchievements.length,
      deletedAlerts: deletedAlerts.length,
      deletedStreaks: deletedStreaks.length,
      deletedActivities: deletedActivities.length,
    }),
  );

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
