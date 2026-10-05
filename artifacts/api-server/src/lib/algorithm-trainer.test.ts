import test from "node:test";
import assert from "node:assert/strict";
import { trainerWrite, trainerId } from "./algorithm-trainer";
const emptyState = (code = "") => ({
  code,
  notes: "",
  queued: false,
  nextReview: null,
  attempts: [],
});
test("trainer validation rejects impossible dates, unsafe ids and excessive drafts", () => {
  assert.equal(trainerId.safeParse("../../profile").success, false);
  assert.equal(
    trainerWrite.safeParse({ version: 0, state: emptyState() }).success,
    true,
  );
  assert.equal(
    trainerWrite.safeParse({
      version: 0,
      state: { ...emptyState(), nextReview: "2026-02-30" },
    }).success,
    false,
  );
  assert.equal(
    trainerWrite.safeParse({ version: -1, state: emptyState() }).success,
    false,
  );
  assert.equal(
    trainerWrite.safeParse({ version: 0, state: emptyState("x".repeat(24001)) })
      .success,
    false,
  );
  const custom = {
    title: "Personal interview",
    topic: "Arrays",
    statement: "Return a sum",
    tests: [{ args: [[1, 2]], expected: 3 }],
    url: "https://github.com/",
  };
  assert.equal(
    trainerWrite.safeParse({ version: 0, state: { ...emptyState(), custom } })
      .success,
    true,
  );
  assert.equal(
    trainerWrite.safeParse({
      version: 0,
      state: {
        ...emptyState(),
        custom: { ...custom, url: "javascript:alert(1)" },
      },
    }).success,
    false,
  );
  assert.equal(
    trainerWrite.safeParse({
      version: 0,
      state: {
        ...emptyState(),
        custom: { ...custom, url: "https://admin:secret@example.com/" },
      },
    }).success,
    false,
  );
});
