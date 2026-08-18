export const TIME_ZONE_HEADER = "x-open-finish-time-zone";
const FALLBACK_TIME_ZONE = process.env.OPEN_FINISH_TIME_ZONE ?? "UTC";

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function requestTimeZone(req: {
  get(name: string): string | undefined;
}): string {
  const requested = req.get(TIME_ZONE_HEADER)?.trim();
  if (requested && isValidTimeZone(requested)) return requested;
  return isValidTimeZone(FALLBACK_TIME_ZONE) ? FALLBACK_TIME_ZONE : "UTC";
}

export function calendarDateAt(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export function todayForRequest(
  req: { get(name: string): string | undefined },
  now = new Date(),
): string {
  return calendarDateAt(now, requestTimeZone(req));
}

export function shiftCalendarDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(shifted.getTime()))
    throw new Error(`Invalid calendar date: ${date}`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}
