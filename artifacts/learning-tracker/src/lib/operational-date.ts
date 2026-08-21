import { subDays } from "date-fns";

export const MOSCOW_TIME_ZONE = "Europe/Moscow";
export const MOSCOW_DAY_ROLLOVER_HOUR = 5;

/**
 * The personal practice day stays open until 05:00 Moscow time. This keeps a
 * late-night session on the day it belongs to instead of splitting it at 00:00.
 */
export function moscowOperationalDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MOSCOW_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const date = `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
  const hour = Number(values.get("hour"));
  if (hour >= MOSCOW_DAY_ROLLOVER_HOUR) return date;

  return subDays(new Date(`${date}T00:00:00.000Z`), 1)
    .toISOString()
    .slice(0, 10);
}
