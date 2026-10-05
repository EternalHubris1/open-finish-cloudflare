import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, isDue, reviewDate } from "./model.ts";
test("review dates cross month/year boundaries and rest on calendar dates", () => {
  assert.equal(
    reviewDate("assisted", new Date(2026, 11, 30, 12)),
    "2027-01-02",
  );
  assert.equal(
    isDue({ ...emptyState(), nextReview: "2026-10-05" }, "2026-10-05"),
    true,
  );
  assert.equal(
    isDue({ ...emptyState(), nextReview: "2026-10-06" }, "2026-10-05"),
    false,
  );
});
