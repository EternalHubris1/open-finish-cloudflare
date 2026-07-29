import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { GetProfileResponse, UpdateProfileBody, UpdateProfileResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateProfile() {
  const [existing] = await db.select().from(profilesTable).where(eq(profilesTable.id, 1));
  if (existing) return existing;
  const [created] = await db
    .insert(profilesTable)
    .values({ id: 1, username: "Admin" })
    .returning();
  return created;
}

router.get("/profile", async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile();
  res.json(GetProfileResponse.parse({
    ...profile,
    createdAt: profile.createdAt.toISOString(),
  }));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreateProfile();

  const [updated] = await db
    .update(profilesTable)
    .set(parsed.data)
    .where(eq(profilesTable.id, 1))
    .returning();

  res.json(UpdateProfileResponse.parse({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
  }));
});

export default router;
