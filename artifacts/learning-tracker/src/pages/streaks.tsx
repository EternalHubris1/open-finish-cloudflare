import { useMemo, useState } from "react";
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
import {
  ChevronDown,
  Flame,
  Plus,
  RefreshCw,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import templePath from "@/assets/environments/optimized/streaks-temple-path.webp";
import katanaVerticalSignal from "@/assets/icons/katana-vertical-signal.png";
import { Skeleton } from "@/components/ui/skeleton";
import { previewActivities, previewStreaks } from "./dashboard-exploration";
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

export default function Streaks({ embedded = false }: { embedded?: boolean }) {
  const preview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("preview");
  const [expandedActivityId, setExpandedActivityId] = useState<number | null>(
    null,
  );
  const rangeStart = useMemo(
    () =>
      startOfWeek(subWeeks(new Date(), WEEKS_TO_SHOW - 1), {
        weekStartsOn: 1,
      }),
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

  const activities = preview
    ? previewActivities
    : Array.isArray(activitiesQuery.data)
      ? activitiesQuery.data
      : [];
  const streaks = preview
    ? previewStreaks
    : Array.isArray(streaksQuery.data)
      ? streaksQuery.data
      : [];
  const calendarDays = Array.isArray(calendarQuery.data)
    ? calendarQuery.data
    : [];
  const isLoading =
    !preview && (activitiesQuery.isLoading ||
    streaksQuery.isLoading ||
    calendarQuery.isLoading);
  const isError =
    !preview && (activitiesQuery.isError || streaksQuery.isError || calendarQuery.isError);
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
        <Skeleton className="h-52 rounded-[1.75rem] bg-white/5" />
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-24 rounded-3xl bg-white/5" />
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
    <div className={embedded ? "relative z-10 space-y-5" : "relative z-10 mx-auto min-h-screen max-w-6xl space-y-5 px-4 py-6 pb-28 md:p-8 md:pb-20"}>
      <section className={`relative isolate overflow-hidden px-5 py-6 md:px-7 ${embedded ? "" : "rounded-[1.75rem] border border-white/[.08] bg-[#0a1019]/86 shadow-[0_18px_46px_rgba(0,0,0,.18)]"}`}>
        {!embedded && <>
          <img
            src={templePath}
            alt=""
            aria-hidden="true"
            className="room-motif-image pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
          />
          <div className="room-motif-overlay pointer-events-none absolute inset-0" />
        </>}
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-red-400">
            <img
              src={katanaVerticalSignal}
              alt=""
              aria-hidden="true"
              className="h-8 w-8 shrink-0 rotate-180 object-contain opacity-90 grayscale brightness-[1.8] contrast-[.72] drop-shadow-[0_0_10px_rgba(255,139,124,.16)]"
            />
            Independent momentum
          </div>
          {embedded ? <h2 className="text-3xl font-bold tracking-tight text-white">Return streaks</h2> : <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Streaks</h1>}
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/48">
            Each direction has its own rhythm. Open a line to read its recent
            returns, then close it again when you only need the current state.
          </p>

          {activities.length > 0 && (
            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2.5 sm:gap-3">
              <div className="rounded-2xl border border-white/[.09] bg-black/[.16] px-3 py-3 backdrop-blur-sm">
                <span className="block text-[8px] font-bold uppercase tracking-[.14em] text-white/38">
                  Open lines
                </span>
                <strong className="mt-1.5 block text-xl font-semibold tabular-nums text-white">
                  {openLines}
                </strong>
              </div>
              <div className="rounded-2xl border border-[#ff9b84]/18 bg-[#ff7868]/[.06] px-3 py-3 backdrop-blur-sm">
                <span className="block text-[8px] font-bold uppercase tracking-[.14em] text-[#ffb1a7]/70">
                  Strongest
                </span>
                <strong className="mt-1.5 block text-xl font-semibold tabular-nums text-white">
                  {strongestCurrentLine}d
                </strong>
              </div>
              <div className="rounded-2xl border border-[#ffc268]/18 bg-[#ffc268]/[.06] px-3 py-3 backdrop-blur-sm">
                <span className="block text-[8px] font-bold uppercase tracking-[.14em] text-[#ffe0a5]/70">
                  Best record
                </span>
                <strong className="mt-1.5 block text-xl font-semibold tabular-nums text-white">
                  {longestRecordedLine}d
                </strong>
              </div>
            </div>
          )}
        </div>
      </section>

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
        <section aria-label="Activity rhythms" className="activity-lines-console space-y-2 rounded-2xl border border-[#8fd1cd]/20 bg-[#071019]/72 p-3 shadow-[inset_0_1px_rgba(169,223,217,.08)]">
          <div className="flex items-center justify-between gap-4 border-b border-[#8fd1cd]/12 px-1 pb-3">
            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-[.2em] text-[#a9dfd9]">
                Activity lines
              </p>
              <p className="mt-1 text-[11px] text-white/38">
                Twelve-week paths · open a channel for its day-level read.
              </p>
            </div>
            <span className="hidden text-[9px] font-bold uppercase tracking-[.14em] text-white/30 sm:block">
              {activities.length} directions
            </span>
          </div>

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
            const activeWeeks = weeklyRhythm.filter(
              (count) => count > 0,
            ).length;
            const lastReturn = [...days]
              .reverse()
              .find((day) => day.minutes > 0);
            const returnGap = lastReturn
              ? Math.max(
                  0,
                  differenceInCalendarDays(
                    new Date(),
                    parseISO(lastReturn.date),
                  ),
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
            const isExpanded = expandedActivityId === activity.id;
            const detailId = `streak-detail-${activity.id}`;

            return (
              <section
                key={activity.id}
                className="overflow-hidden rounded-xl border border-[#8fd1cd]/14 bg-[#0a141d]/90 shadow-[inset_0_1px_rgba(169,223,217,.04)] transition-[border-color,box-shadow] duration-200 hover:border-[#8fd1cd]/28"
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={detailId}
                  onClick={() =>
                    setExpandedActivityId((current) =>
                      current === activity.id ? null : activity.id,
                    )
                  }
                  className="group flex w-full flex-col gap-3 p-3 text-left transition-colors duration-150 hover:bg-[#8fd1cd]/[.025] active:scale-[.995] sm:px-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <span className="flex min-w-0 items-center gap-3.5">
                    <span
                      className="h-11 w-1.5 shrink-0 rounded-full shadow-[0_0_16px_currentColor]"
                      style={{
                        backgroundColor: activity.color,
                        color: activity.color,
                      }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-lg font-semibold text-white sm:text-xl">
                        {activity.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[.13em] text-white/34">
                        <span>{activity.category}</span>
                        <span
                          className={
                            activity.activityType === "sport"
                              ? "text-[#8bd2c2]/75"
                              : "text-white/24"
                          }
                        >
                          {activity.activityType}
                        </span>
                        <span className="text-[#ffc268]/68">{returnLabel}</span>
                      </span>
                    </span>
                  </span>

                  <span className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      <span className="min-w-[4.5rem] rounded-xl border border-[#ff9b84]/18 bg-[#ff7868]/[.07] px-2.5 py-2 text-center">
                        <span className="block text-[7px] font-bold uppercase tracking-[.12em] text-[#ffb1a7]/68">
                          current
                        </span>
                        <strong className="mt-0.5 block text-base font-semibold tabular-nums text-white">
                          {streak?.currentStreak ?? 0}d
                        </strong>
                      </span>
                      <span className="min-w-[4.5rem] rounded-xl border border-white/[.07] bg-black/[.12] px-2.5 py-2 text-center">
                        <span className="block text-[7px] font-bold uppercase tracking-[.12em] text-white/34">
                          best
                        </span>
                        <strong className="mt-0.5 block text-base font-semibold tabular-nums text-white">
                          {streak?.longestStreak ?? 0}d
                        </strong>
                      </span>
                      <span className="min-w-[4.5rem] rounded-xl border border-white/[.07] bg-black/[.12] px-2.5 py-2 text-center">
                        <span className="block text-[7px] font-bold uppercase tracking-[.12em] text-white/34">
                          active
                        </span>
                        <strong className="mt-0.5 block text-base font-semibold tabular-nums text-white">
                          {activeDays}
                        </strong>
                      </span>
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.035] text-white/45 transition-[background-color,transform,color] duration-200 group-hover:bg-white/[.08] group-hover:text-white/82">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </span>
                  </span>
                </button>

                <div
                  id={detailId}
                  aria-hidden={!isExpanded}
                  inert={!isExpanded ? true : undefined}
                  className="of-disclosure-collapse"
                  data-open={isExpanded ? "true" : "false"}
                >
                  <div className="of-disclosure-collapse__inner">
                    <div className="border-t border-white/[.07] bg-black/[.07] p-4 sm:p-5">
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem]">
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
                                  opacity: count
                                    ? 0.26 + (count / 7) * 0.74
                                    : 0.12,
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

                      <div className="mt-4 rounded-2xl border border-white/[.06] bg-black/[.1] p-3.5 sm:p-4">
                        <DailyActivityChart
                          days={days}
                          color={activity.color}
                        />
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Link
                          href={`/activities/${activity.id}`}
                          className="rounded-xl px-3 py-2 text-[9px] font-bold uppercase tracking-[.13em] text-white/45 transition-colors hover:bg-white/[.06] hover:text-white"
                        >
                          Open direction
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </section>
      )}
    </div>
  );
}
