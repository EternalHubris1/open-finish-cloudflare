import type { CalendarDay } from "@workspace/api-client-react";

export function buildHistoryComposition(
  calendar: CalendarDay[],
  dates: string[],
) {
  const allowedDates = new Set(dates);
  const channels = new Map<
    number,
    {
      id: number;
      name: string;
      color: string;
      type: "practice" | "sport";
      minutes: number;
    }
  >();
  const values = new Map<string, Map<number, number>>();
  for (const day of calendar) {
    if (!allowedDates.has(day.date)) continue;
    const byActivity = values.get(day.date) ?? new Map<number, number>();
    values.set(day.date, byActivity);
    for (const log of day.logs) {
      if (log.activityType !== "practice" && log.activityType !== "sport")
        continue;
      if (!Number.isFinite(log.durationMinutes) || log.durationMinutes <= 0)
        continue;
      const channel = channels.get(log.activityId) ?? {
        id: log.activityId,
        name: log.activityName,
        color: log.activityColor,
        type: log.activityType,
        minutes: 0,
      };
      channel.minutes += log.durationMinutes;
      channels.set(channel.id, channel);
      byActivity.set(
        channel.id,
        (byActivity.get(channel.id) ?? 0) + log.durationMinutes,
      );
    }
  }
  const ordered = [...channels.values()].sort(
    (a, b) => b.minutes - a.minutes || a.id - b.id,
  );
  const days = dates.map((date) => {
    const segments = ordered.map((channel) => ({
      ...channel,
      minutes: values.get(date)?.get(channel.id) ?? 0,
    }));
    return {
      date,
      segments,
      practice: segments
        .filter((s) => s.type === "practice")
        .reduce((sum, s) => sum + s.minutes, 0),
      sport: segments
        .filter((s) => s.type === "sport")
        .reduce((sum, s) => sum + s.minutes, 0),
    };
  });
  return { channels: ordered, days };
}
