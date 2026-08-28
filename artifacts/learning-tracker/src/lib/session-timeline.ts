import { MOSCOW_TIME_ZONE } from "./operational-date";

type RecordedSession = { id: number; createdAt?: string };

/** Operational dates are editable; recording timestamps are not session start times. */
export function recordedTime(createdAt?: string): string | null {
  if (!createdAt || !Number.isFinite(Date.parse(createdAt))) return null;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MOSCOW_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

export function chronologicalSessions<T extends RecordedSession>(
  sessions: T[],
): T[] {
  // Older API responses may not include timestamps. IDs preserve recording order
  // for the entire list in that case, keeping the comparator transitive.
  const hasTimestamps = sessions.every(
    (session) =>
      session.createdAt && Number.isFinite(Date.parse(session.createdAt)),
  );
  return [...sessions].sort(
    (a, b) =>
      (hasTimestamps
        ? Date.parse(a.createdAt!) - Date.parse(b.createdAt!)
        : 0) || a.id - b.id,
  );
}

export function practiceMinutesToday(
  totalMinutes: number,
  sportMinutes: number,
): number {
  return Math.max(0, totalMinutes - sportMinutes);
}
