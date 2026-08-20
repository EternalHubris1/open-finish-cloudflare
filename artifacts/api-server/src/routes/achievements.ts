import { Router, type IRouter } from "express";
import { db, achievementsTable, activitiesTable } from "@workspace/db";
import { ListAchievementsResponse } from "@workspace/api-zod";
import { reconcileAchievements } from "../lib/achievements";

const router: IRouter = Router();

router.post("/achievements/reconcile", async (_req, res): Promise<void> => {
  const unlocked = await reconcileAchievements();
  res.status(200).json({ unlocked });
});

router.get("/achievements", async (_req, res): Promise<void> => {
  const achievements = await db
    .select()
    .from(achievementsTable)
    .orderBy(achievementsTable.unlockedAt);

  const activities = await db.select().from(activitiesTable);
  const actMap = new Map(activities.map((a) => [a.id, a.name]));

  res.json(
    ListAchievementsResponse.parse(
      achievements.map((a) => ({
        ...a,
        unlockedAt: a.unlockedAt.toISOString(),
        activityName: a.activityId ? (actMap.get(a.activityId) ?? null) : null,
      })),
    ),
  );
});

export default router;
