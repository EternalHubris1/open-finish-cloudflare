import { useMemo } from "react";
import { Link } from "wouter";
import {
  getGetCalendarQueryKey,
  useGetCalendar,
  useListActivities,
  useListStreaks,
} from "@workspace/api-client-react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { Activity, CalendarDay } from "@workspace/api-client-react";
import { Flame, Plus, RefreshCw, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import templePath from "@/assets/environments/optimized/streaks-temple-path.webp";
import armoryRoom from "@/assets/environments/optimized/cabinet-armory-room.webp";
import samuraiArmor from "@assets/samurai-weapons-armor/samurai-armor.png";
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
  const openLines = streaks.filter((streak) => streak.currentStreak > 0).length;
  const strongestCurrentLine = streaks.reduce(
    (best, streak) => Math.max(best, streak.currentStreak),
    0,
  );
  const longestRecordedLine = streaks.reduce(
    (best, streak) => Math.max(best, streak.longestStreak),
    0,
  );

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
      <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/[.08] bg-[#0a1019]/86 px-5 py-6 shadow-[0_18px_46px_rgba(0,0,0,.18)] md:px-7">
        <img
          src={templePath}
          alt=""
          aria-hidden="true"
          className="room-motif-image pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
        />
        <div className="room-motif-overlay pointer-events-none absolute inset-0" />
        <div className="relative z-10">
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
      </div>
      {activities.length > 0 && (
        <section className="signal-surface relative isolate overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92 px-5 py-5 shadow-[0_18px_46px_rgba(0,0,0,.18)] md:px-7 md:py-6">
          <img
            src={armoryRoom}
            alt=""
            aria-hidden="true"
            className="room-motif-image pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
            style={{ opacity: 0.42 }}
          />
          <div className="room-motif-overlay pointer-events-none absolute inset-0" />
          <img
            src={samuraiArmor}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 right-10 hidden h-48 w-auto select-none object-contain opacity-[.3] mix-blend-screen grayscale md:block"
          />
          <div className="relative z-10 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.2em] text-[#ffc268]">
                <Trophy className="h-3.5 w-3.5" /> Rhythm overview
              </div>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Keep the line visible, not perfect.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/48">
                This is the shared record of returns across directions. The individual maps below keep the detail.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2.5 md:min-w-[22rem]">
              <div className="rounded-2xl border border-white/[.08] bg-black/[.16] px-3 py-3 text-center">
                <span className="text-[8px] font-bold uppercase tracking-[.14em] text-white/36">Open lines</span>
                <strong className="mt-1 block text-2xl font-semibold tabular-nums text-white">{openLines}</strong>
              </div>
              <div className="rounded-2xl border border-[#ff9b84]/18 bg-[#ff7868]/[.06] px-3 py-3 text-center">
                <span className="text-[8px] font-bold uppercase tracking-[.14em] text-[#ffb1a7]/65">Strongest</span>
                <strong className="mt-1 block text-2xl font-semibold tabular-nums text-white">{strongestCurrentLine}d</strong>
              </div>
              <div className="rounded-2xl border border-[#ffc268]/18 bg-[#ffc268]/[.06] px-3 py-3 text-center">
                <span className="text-[8px] font-bold uppercase tracking-[.14em] text-[#ffe0a5]/65">Best record</span>
                <strong className="mt-1 block text-2xl font-semibold tabular-nums text-white">{longestRecordedLine}d</strong>
              </div>
            </div>
          </div>
        </section>
      )}
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
            const weeklyRhythm = Array.from(
              { length: WEEKS_TO_SHOW },
              (_, weekIndex) => {
                const week = days.slice(weekIndex * 7, (weekIndex + 1) * 7);
                return week.filter((day) => day.minutes > 0).length;
              },
            );
            const activeWeeks = weeklyRhythm.filter((count) => count > 0).length;
            const lastReturn = [...days]
              .reverse()
              .find((day) => day.minutes > 0);
            const returnGap = lastReturn
              ? Math.max(
                  0,
                  differenceInCalendarDays(new Date(), parseISO(lastReturn.date)),
                )
              : null;
            const returnLabel =
              returnGap === null
                ? "No return yet"
                : returnGap === 0
                  ? "Logged today"
                  : returnGap === 1
                    ? "Last return yesterday"
                    : `Last return ${returnGap}d ago`;

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
                  <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem]">
                    <div className="rounded-2xl border border-white/[.07] bg-black/[.13] px-4 py-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[8px] font-bold uppercase tracking-[.16em] text-white/38">
                          Path signal · 12 weeks
                        </span>
                        <span className="text-[9px] font-semibold tabular-nums text-white/62">
                          {activeWeeks}/{WEEKS_TO_SHOW} active
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-12 gap-1.5">
                        {weeklyRhythm.map((count, weekIndex) => (
                          <span
                            key={`${activity.id}-${weekIndex}`}
                            title={`Week ${weekIndex + 1}: ${count} active day${count === 1 ? "" : "s"}`}
                            className="h-3 rounded-sm border border-white/[.06] transition-transform duration-200 hover:scale-y-125"
                            style={{
                              backgroundColor: activity.color,
                              opacity: count ? 0.26 + (count / 7) * 0.74 : 0.12,
                              boxShadow: count
                                ? `0 0 ${Math.round(5 + count)}px ${activity.color}55`
                                : "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/[.07] bg-white/[.025] px-4 py-3.5">
                      <span className="text-[8px] font-bold uppercase tracking-[.16em] text-white/38">
                        Return signal
                      </span>
                      <strong className="mt-2 block text-sm font-semibold text-white/88">
                        {returnLabel}
                      </strong>
                      <span className="mt-1 block text-[9px] font-medium uppercase tracking-[.12em] text-[#ffc268]/75">
                        {streak?.currentStreak
                          ? `${streak.currentStreak} day line open`
                          : "Next return opens the line"}
                      </span>
                    </div>
                  </div>
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
