import assert from "node:assert/strict";
import test from "node:test";
import { sprintStatusFromSteps } from "./sprint-model";

test("open days never block sprint completion", () => {
  assert.equal(
    sprintStatusFromSteps([
      { kind: "task", status: "complete" },
      { kind: "buffer", status: "pending" },
      { kind: "task", status: "complete" },
    ]),
    "complete",
  );
});

test("task order and dates do not determine completion", () => {
  assert.equal(
    sprintStatusFromSteps([
      { kind: "task", status: "complete" },
      { kind: "task", status: "pending" },
    ]),
    "active",
  );
});

test("a route made only of open days is not complete", () => {
  assert.equal(
    sprintStatusFromSteps([{ kind: "buffer", status: "pending" }]),
    "active",
  );
});
