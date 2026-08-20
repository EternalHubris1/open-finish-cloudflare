import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findPendingAchievements } from "./achievements";

const activities = [
  {
    id: 1,
    name: "Programming",
    category: "Learning",
    activityType: "practice",
  },
  { id: 2, name: "Sport", category: "Sport", activityType: "sport" },
  { id: 3, name: "Reading", category: "Reading", activityType: null },
];

describe("achievement reconciliation", () => {
  it("finds meaningful early marks from already recorded work", () => {
    const logs = Array.from({ length: 10 }, (_, index) => ({
      activityId: index % 3 === 1 ? 2 : index % 3 === 2 ? 3 : 1,
      durationMinutes: 30,
      logDate: `2026-08-${String(index + 1).padStart(2, "0")}`,
    }));

    const pending = findPendingAchievements({
      activities,
      logs,
      streaks: [{ activityId: 1, currentStreak: 3 }],
      unlockedTypes: new Set(),
    });

    assert.deepEqual(
      pending.map((achievement) => achievement.type),
      [
        "first_log",
        "sessions_10",
        "directions_3",
        "active_days_7",
        "streak_3_1",
      ],
    );
  });

  it("does not return marks that are already stored", () => {
    const logs = [
      { activityId: 1, durationMinutes: 30, logDate: "2026-08-01" },
    ];
    const pending = findPendingAchievements({
      activities,
      logs,
      streaks: [],
      unlockedTypes: new Set(["first_log"]),
    });

    assert.deepEqual(pending, []);
  });
});
