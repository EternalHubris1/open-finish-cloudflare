import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { trainerId, trainerWrite } from "../lib/algorithm-trainer";
const router: IRouter = Router();
// Additive, isolated storage. Existing activity/history records are never changed.
async function ensureTable() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS algorithm_practice (
    problem_id text PRIMARY KEY, version integer NOT NULL DEFAULT 1,
    state jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
  )`);
}
router.get("/algorithm-trainer", async (_req, res, next) => {
  try {
    await ensureTable();
    const result = await db.execute(
      sql`SELECT problem_id AS "problemId", version, state FROM algorithm_practice ORDER BY problem_id`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});
router.put("/algorithm-trainer/:id", async (req, res, next) => {
  const id = trainerId.safeParse(req.params.id);
  const input = trainerWrite.safeParse(req.body);
  if (!id.success || !input.success) {
    res
      .status(400)
      .json({ error: "Check the date, draft size and attempt fields." });
    return;
  }
  if (id.data.startsWith("custom-") !== !!input.data.state.custom) {
    res
      .status(400)
      .json({
        error:
          "Personal tasks need their own task details; built-in tasks cannot be replaced.",
      });
    return;
  }
  try {
    await ensureTable();
    const { version, state } = input.data;
    const serialized = JSON.stringify(state);
    // Optimistic concurrency prevents a stale browser tab replacing newer work.
    const result =
      version === 0
        ? await db.execute(sql`INSERT INTO algorithm_practice (problem_id, state) VALUES (${id.data}, ${serialized}::jsonb)
          ON CONFLICT DO NOTHING RETURNING problem_id AS "problemId", version, state`)
        : await db.execute(sql`UPDATE algorithm_practice SET state = ${serialized}::jsonb,
          version = version + 1, updated_at = now() WHERE problem_id = ${id.data} AND version = ${version}
          RETURNING problem_id AS "problemId", version, state`);
    if (!result.rows.length) {
      res
        .status(409)
        .json({
          error:
            "Another tab saved this task. Export your draft, then reload before editing again.",
        });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});
router.use(
  (
    _error: unknown,
    _req: import("express").Request,
    res: import("express").Response,
    _next: import("express").NextFunction,
  ) => {
    res
      .status(503)
      .json({
        error:
          "Progress could not be saved. Keep this page open, export your draft and retry.",
      });
  },
);
export default router;
