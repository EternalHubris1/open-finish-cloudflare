import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lessonTitles, lessonWrite, curriculumKey } from "./learning-sprint";
import { trainerId, trainerWrite } from "./algorithm-trainer";
const state = () => ({
  status: "not_started",
  viewed: false,
  practiced: false,
  criterionConfirmed: false,
  notes: "",
  solution: "",
  solutionUrl: "",
  plannedDate: null,
  sessions: [],
});
test("server title order agrees with canonical JSON; dates and legacy practice IDs stay compatible", () => {
  const source = JSON.parse(
    readFileSync(
      new URL(
        "../../../../modules/learning-sprints/linear-models.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(curriculumKey, source.id);
  assert.deepEqual(
    lessonTitles,
    source.days.map((day: { title: string }) => day.title),
  );
  assert.ok(lessonWrite.safeParse({ version: 0, state: state() }).success);
  assert.ok(
    lessonWrite.safeParse({
      version: 1,
      state: { ...state(), plannedDate: "2026-09-20" },
    }).success,
  );
  assert.equal(
    lessonWrite.safeParse({
      version: 1,
      state: { ...state(), plannedDate: "2026-02-30" },
    }).success,
    false,
  );
  assert.ok(
    trainerId.safeParse(`dojo-${curriculumKey}-day-01-practice-01`).success,
  );
  assert.ok(
    trainerWrite.safeParse({
      version: 0,
      state: {
        code: "Ручной вывод",
        notes: "Ссылка на тетрадь",
        queued: false,
        nextReview: null,
        attempts: [],
      },
    }).success,
  );
});
test("completion gates, URL safety and bounded editable session history", () => {
  assert.equal(
    lessonWrite.safeParse({
      version: 0,
      state: { ...state(), status: "completed", viewed: true },
    }).success,
    false,
  );
  assert.ok(
    lessonWrite.safeParse({
      version: 0,
      state: {
        ...state(),
        status: "completed",
        viewed: true,
        practiced: true,
        criterionConfirmed: true,
      },
    }).success,
  );
  assert.equal(
    lessonWrite.safeParse({
      version: 0,
      state: { ...state(), solutionUrl: "javascript:alert(1)" },
    }).success,
    false,
  );
  assert.equal(
    lessonWrite.safeParse({
      version: 0,
      state: { ...state(), solutionUrl: "https://user:pass@example.com" },
    }).success,
    false,
  );
  const session = {
    id: crypto.randomUUID(),
    recordedAt: new Date().toISOString(),
    minutes: 25,
    note: "Первая половина",
  };
  assert.ok(
    lessonWrite.safeParse({
      version: 0,
      state: { ...state(), sessions: [session] },
    }).success,
  );
  assert.equal(
    lessonWrite.safeParse({
      version: 0,
      state: { ...state(), sessions: [session, session] },
    }).success,
    false,
  );
});
