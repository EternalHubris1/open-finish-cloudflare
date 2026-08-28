import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  chronologicalSessions,
  practiceMinutesToday,
  recordedTime,
} from "./session-timeline";

test("recording time uses Moscow, including a session logged after midnight", () => {
  assert.equal(recordedTime("2026-08-28T21:30:00Z"), "00:30");
  assert.equal(recordedTime(undefined), null);
  assert.equal(recordedTime("invalid"), null);
});

test("sessions keep chronological order across activities, with a stable tie break", () => {
  const sessions = [
    { id: 3, createdAt: "2026-08-28T12:00:00Z" },
    { id: 2, createdAt: "2026-08-28T10:00:00Z" },
    { id: 1, createdAt: "2026-08-28T10:00:00Z" },
  ];
  assert.deepEqual(
    chronologicalSessions(sessions).map((s) => s.id),
    [1, 2, 3],
  );
  assert.equal(sessions[0].id, 3);
  assert.deepEqual(chronologicalSessions([{ id: 2 }, { id: 1 }]), [
    { id: 1 },
    { id: 2 },
  ]);
});

test("sport is kept outside deliberate practice, including sport-only and empty days", () => {
  assert.equal(practiceMinutesToday(214, 40), 174);
  assert.equal(practiceMinutesToday(40, 40), 0);
  assert.equal(practiceMinutesToday(0, 0), 0);
});
