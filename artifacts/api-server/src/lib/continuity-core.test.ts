import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calendarDateAt, requestTimeZone, shiftCalendarDate } from "./calendar";
import { normalizeExternalHttpUrl } from "./external-url";
import { buildReflectionUpdate } from "./reflection-update";
import { rankFrequentActivities } from "./activity-frequency";
import { resolveActivityType } from "./activity-type";

describe("continuity calendar model", () => {
  it("uses the user's IANA time zone across the UTC day boundary", () => {
    const instant = new Date("2026-08-17T21:30:00.000Z");
    assert.equal(calendarDateAt(instant, "UTC"), "2026-08-17");
    assert.equal(calendarDateAt(instant, "Europe/Moscow"), "2026-08-18");
  });

  it("accepts valid zones and safely rejects invalid ones", () => {
    assert.equal(
      requestTimeZone({ get: () => "Europe/Moscow" }),
      "Europe/Moscow",
    );
    assert.equal(requestTimeZone({ get: () => "not/a-zone" }), "UTC");
    assert.equal(shiftCalendarDate("2024-02-28", 1), "2024-02-29");
  });
});

describe("continuity data protection", () => {
  it("updates only reflection fields that were actually sent", () => {
    assert.deepEqual(
      buildReflectionUpdate({ whatLearned: "A clearer model" }),
      { whatLearned: "A clearer model" },
    );
    assert.deepEqual(buildReflectionUpdate({ nextContinuation: null }), {
      nextContinuation: null,
    });
  });

  it("accepts web context links and rejects unsafe protocols", () => {
    assert.equal(
      normalizeExternalHttpUrl(" https://docs.google.com/document/d/1 "),
      "https://docs.google.com/document/d/1",
    );
    assert.equal(normalizeExternalHttpUrl("javascript:alert(1)"), null);
    assert.equal(normalizeExternalHttpUrl("file:///tmp/plan"), null);
  });
});

describe("dashboard continuation choices", () => {
  it("ranks by sessions, invested time, then recency", () => {
    assert.deepEqual(
      rankFrequentActivities([
        { activityId: 2, durationMinutes: 20, logDate: "2026-08-16" },
        { activityId: 1, durationMinutes: 60, logDate: "2026-08-15" },
        { activityId: 2, durationMinutes: 25, logDate: "2026-08-17" },
        { activityId: 1, durationMinutes: 5, logDate: "2026-08-18" },
        { activityId: 3, durationMinutes: 120, logDate: "2026-08-18" },
      ]),
      [
        {
          activityId: 1,
          sessionCount: 2,
          totalMinutes: 65,
          lastLoggedDate: "2026-08-18",
        },
        {
          activityId: 2,
          sessionCount: 2,
          totalMinutes: 45,
          lastLoggedDate: "2026-08-17",
        },
        {
          activityId: 3,
          sessionCount: 1,
          totalMinutes: 120,
          lastLoggedDate: "2026-08-18",
        },
      ],
    );
  });
});

describe("activity domains", () => {
  it("keeps sport on a separate clock while preserving legacy fitness data", () => {
    assert.equal(
      resolveActivityType({ activityType: "sport", category: "Work" }),
      "sport",
    );
    assert.equal(
      resolveActivityType({ activityType: null, category: "Fitness" }),
      "sport",
    );
    assert.equal(
      resolveActivityType({ activityType: null, category: "Running" }),
      "sport",
    );
    assert.equal(
      resolveActivityType({ activityType: null, category: "Learning" }),
      "practice",
    );
  });
});
