import { useMemo } from "react";
import { Link } from "wouter";
import {
  getGetCalendarQueryKey,
  useGetCalendar,
  useListActivities,
  useListStreaks,
} from "@workspace/api-client-react";
import { addDays, format, startOfWeek, subWeeks } from "date-fns";
import { Activity, CalendarDay } from "@workspace/api-client-react";
import { Flame, Plus, RefreshCw, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DailyActivityChart,
  DailyActivityPoint,
} from "@/components/daily-activity-chart";

const WEEKS_TO_SHOW = 12;

function buildDays(
  start: Date,
  activity: Activity,
  calendarDays: CalendarDay[],
): DailyActivityPoint[] {
  const minutesByDate = new Map<string, number>();
  calendarDays.forEach((day) => {
    const minutes = day.logs
      .filter((log) => log.activityId === activity.id)
      .reduce((sum, log) => sum + log.durationMinutes, 0);
    minutesByDate.set(day.date, minutes);
  });

  return Array.from({ length: WEEKS_TO_SHOW * 7 }, (_, index) => {
    const date = format(addDays(start, index), "yyyy-MM-dd");
    return { date, minutes: minutesByDate.get(date) ?? 0 };
  });
}

export default function Streaks() {
  const rangeStart = useMemo(
    () =>
      startOfWeek(subWeeks(new Date(), WEEKS_TO_SHOW - 1), { weekStartsOn: 1 }),
    [],
  );
  const rangeEnd = useMemo(
    () => addDays(rangeStart, WEEKS_TO_SHOW * 7 - 1),
    [rangeStart],
  );
  const start = format(rangeStart, "yyyy-MM-dd");
  const end = format(rangeEnd, "yyyy-MM-dd");

  const activitiesQuery = useListActivities();
  const streaksQuery = useListStreaks();
  const calendarQuery = useGetCalendar(
    { start, end },
    { query: { queryKey: getGetCalendarQueryKey({ start, end }) } },
  );

  const activities = activitiesQuery.data ?? [];
  const streaks = streaksQuery.data ?? [];
  const calendarDays = calendarQuery.data ?? [];
  const isLoading =
    activitiesQuery.isLoading ||
    streaksQuery.isLoading ||
    calendarQuery.isLoading;
  const isError =
    activitiesQuery.isError || streaksQuery.isError || calendarQuery.isError;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:p-8">
        <Skeleton className="h-14 w-64 rounded-3xl bg-white/5" />
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-72 rounded-3xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 text-center">
        <div className="w-full rounded-3xl border border-red-500/20 bg-red-950/20 p-10">
          <Flame className="mx-auto mb-4 h-10 w-10 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">
            Couldn’t load streaks
          </h1>
          <p className="mb-6 text-sm text-white/50">
            Your activity is still saved. Check the connection and try again.
          </p>
          <Button
            onClick={() =>
              Promise.all([
                activitiesQuery.refetch(),
                streaksQuery.refetch(),
                calendarQuery.refetch(),
              ])
            }
            className="gap-2 rounded-2xl bg-red-600 text-white hover:bg-red-500"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto min-h-screen max-w-6xl space-y-8 px-4 py-6 pb-28 md:p-8 md:pb-20">
      <div className="border-b border-white/10 pb-6">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-red-400">
          <Flame className="h-4 w-4" /> Independent momentum
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Streaks
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
          Each activity has its own rhythm. A day counts when you log anything
          for that activity — you never have to finish everything at once.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] p-12 text-center">
          <Target className="mx-auto mb-4 h-10 w-10 text-white/20" />
          <h2 className="mb-2 text-xl font-bold text-white">
            Create an activity to begin
          </h2>
          <p className="mb-6 text-sm text-white/40">
            Its daily diagram and streak will appear here.
          </p>
          <Link href="/activities">
            <Button className="gap-2 rounded-2xl bg-red-600 text-white hover:bg-red-500">
              <Plus className="h-4 w-4" /> New activity
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {activities.map((activity) => {
            const streak = streaks.find(
              (item) => item.activityId === activity.id,
            );
            const days = buildDays(rangeStart, activity, calendarDays);
            const activeDays = days.filter((day) => day.minutes > 0).length;

            return (
              <section
                key={activity.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[rgba(15,15,20,0.88)] shadow-2xl backdrop-blur-xl"
              >
                <div className="flex flex-col gap-5 border-b border-white/5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                  <div className="flex items-center gap-4">
                    <span
                      className="h-12 w-1.5 rounded-full"
                      style={{ backgroundColor: activity.color }}
                    />
                    <div>
                      <Link
                        href={`/activities/${activity.id}`}
                        className="text-2xl font-bold text-white transition-colors hover:text-red-400"
                      >
                        {activity.name}
                      </Link>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-white/30">
                        {activity.category}
                        <span
                          className={
                            activity.activityType === "sport"
                              ? "ml-2 text-[#72c6b3]"
                              : "ml-2 text-white/20"
                          }
                        >
                          {activity.activityType}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 md:flex">
                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-center md:min-w-28">
                      <div className="flex items-center justify-center gap-1 text-orange-400">
                        <Flame className="h-4 w-4" />
                        <span className="text-2xl font-bold">
                          {streak?.currentStreak ?? 0}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                        current
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center md:min-w-28">
                      <div className="flex items-center justify-center gap-1 text-white/80">
                        <Trophy className="h-4 w-4" />
                        <span className="text-2xl font-bold">
                          {streak?.longestStreak ?? 0}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                        best
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center md:min-w-28">
                      <p className="text-2xl font-bold text-white/80">
                        {activeDays}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                        active days
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <DailyActivityChart days={days} color={activity.color} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
