export function rankFrequentActivities(
  logs: Array<{ activityId: number; durationMinutes: number; logDate: string }>,
) {
  const frequency = new Map<
    number,
    { sessionCount: number; totalMinutes: number; lastLoggedDate: string }
  >();
  for (const log of logs) {
    const current = frequency.get(log.activityId) ?? {
      sessionCount: 0,
      totalMinutes: 0,
      lastLoggedDate: log.logDate,
    };
    current.sessionCount += 1;
    current.totalMinutes += log.durationMinutes;
    if (log.logDate > current.lastLoggedDate)
      current.lastLoggedDate = log.logDate;
    frequency.set(log.activityId, current);
  }
  return [...frequency.entries()]
    .map(([activityId, totals]) => ({ activityId, ...totals }))
    .sort(
      (a, b) =>
        b.sessionCount - a.sessionCount ||
        b.totalMinutes - a.totalMinutes ||
        b.lastLoggedDate.localeCompare(a.lastLoggedDate) ||
        a.activityId - b.activityId,
    );
}
