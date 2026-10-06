import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { ensureSprintSchema } from "./rhythms";
import {
  curriculumKey,
  lessonTitles,
  lessonWrite,
} from "../lib/learning-sprint";
const router: IRouter = Router();
let ready: Promise<void> | undefined;
async function ensureSchema() {
  await ensureSprintSchema();
  ready ??= (async () => {
    // Existing dates stay intact; only unscheduled curriculum steps use NULL.
    await db.execute(
      sql`ALTER TABLE sprints ALTER COLUMN start_date DROP NOT NULL, ALTER COLUMN due_date DROP NOT NULL`,
    );
    await db.execute(
      sql`ALTER TABLE sprint_steps ALTER COLUMN planned_date DROP NOT NULL`,
    );
    await db.execute(
      sql`ALTER TABLE sprint_steps ADD COLUMN IF NOT EXISTS learning_state jsonb, ADD COLUMN IF NOT EXISTS learning_version integer NOT NULL DEFAULT 0`,
    );
  })().catch((error) => {
    ready = undefined;
    throw error;
  });
  return ready;
}
router.get("/sprints/curricula/:key", async (req, res, next) => {
  if (req.params.key !== curriculumKey) {
    res.status(404).json({ error: "Учебный спринт не найден" });
    return;
  }
  try {
    await ensureSchema();
    // Reading never creates a sprint or user progress.
    const result =
      await db.execute(sql`SELECT st.position + 1 AS "lessonNumber", st.learning_version AS version, st.learning_state AS state
      FROM sprint_steps st JOIN sprints s ON s.id = st.sprint_id
      WHERE s.curriculum_key = ${curriculumKey} AND st.learning_state IS NOT NULL ORDER BY st.position`);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});
router.put(
  "/sprints/curricula/:key/lessons/:number",
  async (req, res, next) => {
    const number = Number(req.params.number);
    const parsed = lessonWrite.safeParse(req.body);
    if (
      req.params.key !== curriculumKey ||
      !Number.isInteger(number) ||
      number < 1 ||
      number > lessonTitles.length ||
      !parsed.success
    ) {
      res
        .status(400)
        .json({
          error: parsed.success
            ? "Проверьте номер занятия"
            : parsed.error.issues.map((issue) => issue.message).join("; "),
        });
      return;
    }
    try {
      await ensureSchema();
      const result = await db.transaction(async (transaction) => {
        await transaction.execute(sql`INSERT INTO sprints (title,outcome,status,curriculum_key,start_date,due_date)
        VALUES ('Линейные модели и матричные произведения','Матспринт · часть 2','active',${curriculumKey},NULL,NULL)
        ON CONFLICT (curriculum_key) DO NOTHING`);
        const parent = await transaction.execute(
          sql`SELECT id FROM sprints WHERE curriculum_key = ${curriculumKey} FOR UPDATE`,
        );
        const sprintId = Number(parent.rows[0].id);
        for (const [position, title] of lessonTitles.entries()) {
          await transaction.execute(sql`INSERT INTO sprint_steps (sprint_id,title,kind,planned_date,position,status)
          VALUES (${sprintId},${title},'task',NULL,${position},'pending') ON CONFLICT (sprint_id,position) DO NOTHING`);
        }
        const { state, version } = parsed.data;
        const updated = await transaction.execute(sql`UPDATE sprint_steps
        SET learning_state = ${JSON.stringify(state)}::jsonb, learning_version = learning_version + 1,
          planned_date = ${state.plannedDate}::date, status = ${state.status === "completed" ? "complete" : "pending"},
          completed_at = CASE WHEN ${state.status === "completed"} THEN COALESCE(completed_at,now()) ELSE NULL END
        WHERE sprint_id = ${sprintId} AND position = ${number - 1} AND learning_version = ${version}
        RETURNING position + 1 AS "lessonNumber", learning_version AS version, learning_state AS state`);
        if (!updated.rows.length) throw new Error("LESSON_CONFLICT");
        return updated.rows[0];
      });
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "LESSON_CONFLICT") {
        res
          .status(409)
          .json({
            error:
              "Занятие изменено в другой вкладке. Экспортируйте черновик, затем перезагрузите страницу.",
          });
        return;
      }
      next(error);
    }
  },
);
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
          "Не удалось сохранить или загрузить спринт. Оставьте страницу открытой, экспортируйте черновик и повторите.",
      });
  },
);
export default router;
