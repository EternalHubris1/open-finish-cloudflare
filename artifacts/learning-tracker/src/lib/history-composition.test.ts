import { strict as assert } from "node:assert";
import { test } from "node:test";
import type {
  CalendarDay,
  CalendarLogEntry,
} from "@workspace/api-client-react";
import { buildHistoryComposition } from "./history-composition";

const log = (
  id: number,
  activityId: number,
  minutes: number,
  type: "practice" | "sport" | "friction" = "practice",
): CalendarLogEntry => ({
  id,
  activityId,
  activityName: `Direction ${activityId}`,
  activityColor: "#af7060",
  activityType: type,
  durationMinutes: minutes,
  logDate: "2026-08-29",
});
const day = (logs: CalendarLogEntry[], date = "2026-08-29"): CalendarDay => ({
  date,
  logs,
  totalMinutes: 0,
  focusMinutes: 0,
  sportMinutes: 0,
  goalMinutes: 0,
  status: "under",
});

test("composition aggregates repeat sessions and retains legacy directions from canonical logs", () => {
  const result = buildHistoryComposition(
    [day([log(1, 91, 40), log(2, 2, 30), log(3, 91, 20)])],
    ["2026-08-29"],
  );
  assert.deepEqual(
    result.channels.map((c) => [c.id, c.minutes]),
    [
      [91, 60],
      [2, 30],
    ],
  );
  assert.equal(result.days[0].practice, 90);
});
test("composition separates sport, excludes friction, and fills quiet calendar days", () => {
  const result = buildHistoryComposition(
    [day([log(1, 1, 20), log(2, 2, 45, "sport"), log(3, 3, 60, "friction")])],
    ["2026-08-28", "2026-08-29"],
  );
  assert.equal(result.channels.length, 2);
  assert.equal(result.days[0].practice, 0);
  assert.equal(result.days[1].practice, 20);
  assert.equal(result.days[1].sport, 45);
});
test("composition excludes out-of-range logs and rejects non-positive durations", () => {
  const calendar = [
    day([log(1, 1, 90)], "2026-08-27"),
    day([log(2, 2, -3), log(3, 3, 0), log(4, 4, Number.NaN), log(5, 5, 15)]),
  ];
  const result = buildHistoryComposition(calendar, ["2026-08-29"]);
  assert.equal(result.channels.length, 1);
  assert.equal(result.days[0].practice, 15);
  assert.equal(calendar[1].logs.length, 4);
});
