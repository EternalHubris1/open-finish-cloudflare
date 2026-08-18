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
async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to clear data in a production environment.");
  }
  if (process.env.OPEN_FINISH_ALLOW_DEMO_DATA_CLEAR !== "DELETE_DEMO_DATA") {
    throw new Error(
      "Refusing to clear data without OPEN_FINISH_ALLOW_DEMO_DATA_CLEAR=DELETE_DEMO_DATA.",
    );
  }

  const [
    { db },
    { activityLogsTable },
    { achievementsTable },
    { alertsTable },
    { streaksTable },
    { activitiesTable },
  ] = await Promise.all([
    import("../index"),
    import("../schema/activity-logs"),
    import("../schema/achievements"),
    import("../schema/alerts"),
    import("../schema/streaks"),
    import("../schema/activities"),
  ]);

  // Order respects foreign keys: children before the `activities` parent.
  const deletedLogs = await db
    .delete(activityLogsTable)
    .returning({ id: activityLogsTable.id });
  const deletedAchievements = await db
    .delete(achievementsTable)
    .returning({ id: achievementsTable.id });
  const deletedAlerts = await db
    .delete(alertsTable)
    .returning({ id: alertsTable.id });
  const deletedStreaks = await db
    .delete(streaksTable)
    .returning({ id: streaksTable.id });
  const deletedActivities = await db
    .delete(activitiesTable)
    .returning({ id: activitiesTable.id });

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
