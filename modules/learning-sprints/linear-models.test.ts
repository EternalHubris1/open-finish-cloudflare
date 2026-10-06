import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  linearModels,
  sprintKey,
  mathTasks,
  canComplete,
  emptyLesson,
  practiceId,
  taskHref,
  lessonHref,
} from "./linear-models.ts";
import { catalog } from "../../artifacts/learning-tracker/src/modules/algorithm-trainer/catalog.ts";
test("canonical content is complete and has all ordered source tasks and assessments", () => {
  const original = JSON.parse(
    readFileSync(
      new URL(
        "../../design-lab/explorations/linear-models-practicum/source.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.deepEqual(linearModels, original);
  assert.equal(sprintKey, "linear-models-matrix-products-13");
  assert.deepEqual(
    linearModels.days.map((day) => day.number),
    Array.from({ length: 13 }, (_, index) => index + 1),
  );
  assert.equal(
    linearModels.schedule.reduce((sum, item) => sum + item.minutes, 0),
    90,
  );
  assert.equal(
    linearModels.days.reduce((sum, item) => sum + item.estimated_minutes, 0),
    1170,
  );
  assert.equal(linearModels.final_assessment.length, 4);
  assert.equal(mathTasks.length, 30);
  for (const day of linearModels.days)
    for (const [index, statement] of day.practice.entries()) {
      const task = mathTasks.find(
        (task) => task.id === practiceId(day.number, index),
      )!;
      assert.equal(task.statement, statement);
      assert.equal(task.answer, day.answer);
      assert.deepEqual(task.hints, [day.if_stuck]);
    }
  assert.deepEqual(
    mathTasks.slice(-4).map((task) => task.statement),
    linearModels.final_assessment.map((item) => item.task),
  );
  assert.deepEqual(
    mathTasks.slice(-4).map((task) => task.answer),
    linearModels.final_assessment.map((item) => item.answer),
  );
});
test("math stays separate from interview paths, stable crosslinks use existing dojo storage", () => {
  assert.equal(
    new Set([...catalog, ...mathTasks].map((task) => task.id)).size,
    catalog.length + 30,
  );
  assert.ok(
    mathTasks.every(
      (task) =>
        task.manual &&
        task.track === "math" &&
        /^dojo-[a-z0-9-]{1,100}$/.test(task.id),
    ),
  );
  for (const task of mathTasks)
    assert.equal(
      new URL(taskHref(task.id), "https://dojo.test").searchParams.get("task"),
      task.id,
    );
  assert.ok(lessonHref(13).includes(`sprint=${sprintKey}&lesson=13`));
});
test("viewing never implies completion; dates optional; reopening preserves notes and sessions", () => {
  const state = emptyLesson();
  assert.equal(state.plannedDate, null);
  assert.equal(canComplete(state), false);
  assert.equal(canComplete({ ...state, viewed: true }), false);
  assert.equal(canComplete({ ...state, viewed: true, practiced: true }), false);
  assert.equal(
    canComplete({
      ...state,
      viewed: true,
      practiced: true,
      criterionConfirmed: true,
    }),
    true,
  );
});
