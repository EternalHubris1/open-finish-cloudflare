import assert from "node:assert/strict";
import test from "node:test";
import { calculateStreak } from "./streaks";

test("rest days bridge activity dates without increasing the streak", () => {
  const result = calculateStreak(
    ["2026-09-05", "2026-09-07"],
    "2026-09-08",
    ["2026-09-06", "2026-09-08"],
  );
  assert.equal(result.currentStreak, 2);
  assert.equal(result.longestStreak, 2);
});

test("an unmarked quiet day still breaks the streak", () => {
  const result = calculateStreak(
    ["2026-09-04", "2026-09-07"],
    "2026-09-08",
    ["2026-09-05"],
  );
  assert.equal(result.currentStreak, 1);
  assert.equal(result.longestStreak, 1);
});

test("activity logged on a rest-marked date still counts normally", () => {
  const result = calculateStreak(
    ["2026-09-06", "2026-09-07"],
    "2026-09-08",
    ["2026-09-07"],
  );
  assert.equal(result.currentStreak, 2);
  assert.equal(result.longestStreak, 2);
});
