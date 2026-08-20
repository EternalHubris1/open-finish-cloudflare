import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  getGetCalendarQueryKey,
  getListActivitiesQueryKey,
  useGetCalendar,
  useListActivities,
} from "@workspace/api-client-react";
import type { Activity, CalendarDay } from "@workspace/api-client-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity as ActivityIcon,
  CalendarDays,
  Clock3,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  eachDayOfInterval,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyActivityChart } from "@/components/daily-activity-chart";
import { previewActivities } from "@/pages/dashboard-exploration";

type Period = "week" | "month" | "12weeks";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Week",
  month: "Month",
  "12weeks": "12 weeks",
};

const HEATMAP_SCALE = ["#18202d", "#403238", "#76403f", "#d4584f", "#efb45f"];
const ACTIVITY_SIGNAL_COLORS = [
  "#e45a50",
  "#6f8fbf",
  "#d2a15d",
  "#719486",
  "#a77f72",
];

function getRange(period: Period) {
  const end = new Date();
  if (period === "week") return { start: subDays(end, 6), end };
  if (period === "month") return { start: startOfMonth(end), end };
  return { start: startOfWeek(subWeeks(end, 11), { weekStartsOn: 1 }), end };
}

function activityKey(id: number): string {
  return `activity_${id}`;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function previewCalendar(start: string, end: string): CalendarDay[] {
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map(
    (date, index) => {
      const dateString = format(date, "yyyy-MM-dd");
      const quietDay = index % 9 === 2 || index % 13 === 0;
      const writing = quietDay ? 0 : 32 + ((index * 37) % 142);
      const research =
        quietDay || index % 3 === 0 ? 0 : 18 + ((index * 19) % 76);
      const sport = quietDay || index % 2 === 0 ? 0 : 25 + ((index * 11) % 55);
      const logs = [
        ...(writing
          ? [
              {
                id: index * 3 + 1,
                activityId: previewActivities[0].id,
                activityName: previewActivities[0].name,
                activityColor: ACTIVITY_SIGNAL_COLORS[0],
                activityType: "practice" as const,
                durationMinutes: writing,
                notes:
                  index % 5 === 0 ? "A difficult section became clear." : null,
                logDate: dateString,
              },
            ]
          : []),
        ...(research
          ? [
              {
                id: index * 3 + 2,
                activityId: previewActivities[1].id,
                activityName: previewActivities[1].name,
                activityColor: ACTIVITY_SIGNAL_COLORS[1],
                activityType: "practice" as const,
                durationMinutes: research,
                notes: null,
                logDate: dateString,
              },
            ]
          : []),
        ...(sport
          ? [
              {
                id: index * 3 + 3,
                activityId: previewActivities[3].id,
                activityName: previewActivities[3].name,
                activityColor: "#3f9d96",
                activityType: "sport" as const,
                durationMinutes: sport,
                notes: null,
                logDate: dateString,
              },
            ]
          : []),
      ];
      const focusMinutes = writing + research;
      return {
        date: dateString,
        totalMinutes: focusMinutes + sport,
        focusMinutes,
        sportMinutes: sport,
        goalMinutes: 180,
        status: focusMinutes >= 180 ? "met" : "under",
        logs,
      };
    },
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Clock3;
}) {
  return (
    <div className="signal-surface rounded-3xl border border-white/[.08] bg-[#0c1119]/88 p-5">
      <div className="mb-4 flex min-h-8 items-start gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8b7c]" />
        <span className="line-clamp-2" title={label}>
          {label}
        </span>
      </div>
      <p
        className="line-clamp-2 text-2xl font-semibold text-white"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export default function History() {
  const preview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("preview");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const navigationContext = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      fromDashboard: params.get("from") === "dashboard",
      date: params.get("date"),
    };
  }, []);
  const [period, setPeriod] = useState<Period>("month");
  const [hiddenActivityIds, setHiddenActivityIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("date"),
  );
  const range = useMemo(() => getRange(period), [period]);
  const start = format(range.start, "yyyy-MM-dd");
  const end = format(range.end, "yyyy-MM-dd");

  const activitiesQuery = useListActivities({
    query: { enabled: !preview, queryKey: getListActivitiesQueryKey() },
  });
  const calendarQuery = useGetCalendar(
    { start, end },
    {
      query: {
        enabled: !preview,
        queryKey: getGetCalendarQueryKey({ start, end }),
      },
    },
  );
  const activities = preview
    ? [previewActivities[0], previewActivities[1], previewActivities[3]]
    : Array.isArray(activitiesQuery.data)
      ? activitiesQuery.data
      : [];
  const calendarDays = useMemo(
    () =>
      preview
        ? previewCalendar(start, end)
        : Array.isArray(calendarQuery.data)
          ? calendarQuery.data
          : [],
    [calendarQuery.data, end, preview, start],
  );
  const isLoading =
    !preview && (activitiesQuery.isLoading || calendarQuery.isLoading);
  const isError =
    !preview && (activitiesQuery.isError || calendarQuery.isError);
  const hasCachedData =
    preview ||
    (activitiesQuery.data !== undefined && calendarQuery.data !== undefined);
  const activityColors = useMemo(
    () =>
      new Map(
        activities.map((activity, index) => [
          activity.id,
          activity.color ||
            ACTIVITY_SIGNAL_COLORS[index % ACTIVITY_SIGNAL_COLORS.length],
        ]),
      ),
    [activities],
  );

  const dayMap = useMemo(
    () => new Map(calendarDays.map((day) => [day.date, day])),
    [calendarDays],
  );
  const chartDays = useMemo(
    () =>
      eachDayOfInterval(range).map((date) => {
        const dateString = format(date, "yyyy-MM-dd");
        return {
          date: dateString,
          minutes: dayMap.get(dateString)?.focusMinutes ?? 0,
          sportMinutes: dayMap.get(dateString)?.sportMinutes ?? 0,
        };
      }),
    [dayMap, range],
  );

  const stackedData = useMemo(
    () =>
      chartDays.map((day) => {
        const calendarDay = dayMap.get(day.date);
        const row: Record<string, string | number> = {
          date: day.date,
          totalMinutes: day.minutes,
        };
        activities
          .filter((activity) => activity.activityType !== "sport")
          .forEach((activity) => {
            row[activityKey(activity.id)] =
              calendarDay?.logs
                .filter((log) => log.activityId === activity.id)
                .reduce((sum, log) => sum + log.durationMinutes, 0) ?? 0;
          });
        return row;
      }),
    [activities, chartDays, dayMap],
  );

  const activityTotals = useMemo(() => {
    const totals = new Map(activities.map((activity) => [activity.id, 0]));
    calendarDays.forEach((day) =>
      day.logs.forEach((log) => {
        totals.set(
          log.activityId,
          (totals.get(log.activityId) ?? 0) + log.durationMinutes,
        );
      }),
    );
    return totals;
  }, [activities, calendarDays]);

  const focusMinutes = calendarDays.reduce(
    (sum, day) => sum + day.focusMinutes,
    0,
  );
  const sportMinutes = calendarDays.reduce(
    (sum, day) => sum + day.sportMinutes,
    0,
  );
  const activeDays = calendarDays.filter((day) => day.focusMinutes > 0).length;
  const longestSession = Math.max(
    0,
    ...calendarDays.flatMap((day) =>
      day.logs.map((log) => log.durationMinutes),
    ),
  );
  const topActivity = activities
    .filter((activity) => activity.activityType !== "sport")
    .reduce<Activity | null>((top, activity) => {
      if (!top) return activity;
      return (activityTotals.get(activity.id) ?? 0) >
        (activityTotals.get(top.id) ?? 0)
        ? activity
        : top;
    }, null);
  const maxDailyMinutes = Math.max(60, ...chartDays.map((day) => day.minutes));
  const maxSportMinutes = Math.max(
    30,
    ...chartDays.map((day) => day.sportMinutes),
  );
  const chartWidth = Math.max(
    720,
    chartDays.length * (period === "12weeks" ? 26 : 42),
  );

  useEffect(() => {
    const selectedIsInRange =
      selectedDate && selectedDate >= start && selectedDate <= end;
    if (selectedIsInRange) return;
    setSelectedDate(calendarDays.at(-1)?.date ?? end);
  }, [calendarDays, end, selectedDate, start]);

  useEffect(() => {
    if (
      !navigationContext.fromDashboard ||
      !navigationContext.date ||
      isLoading
    )
      return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const frame = window.requestAnimationFrame(() =>
      document.getElementById("selected-day")?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
      }),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [isLoading, navigationContext]);

  const selectedDay: CalendarDay | undefined = selectedDate
    ? dayMap.get(selectedDate)
    : undefined;
  const selectedRows = activities
    .map((activity) => ({
      activity,
      logs:
        selectedDay?.logs.filter((log) => log.activityId === activity.id) ?? [],
    }))
    .filter((row) => row.logs.length > 0)
    .sort(
      (a, b) =>
        Number(a.activity.activityType === "sport") -
        Number(b.activity.activityType === "sport"),
    );

  const toggleActivity = (activityId: number) => {
    setHiddenActivityIds((current) =>
      current.includes(activityId)
        ? current.filter((id) => id !== activityId)
        : [...current, activityId],
    );
  };

  if (isLoading && !hasCachedData) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:p-8">
        <Skeleton className="h-16 w-72 rounded-3xl bg-white/5" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-28 rounded-3xl bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-[420px] rounded-3xl bg-white/5" />
        <Skeleton className="h-64 rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (isError && !hasCachedData) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 text-center">
        <div className="signal-surface w-full rounded-3xl border border-[#ff7868]/20 bg-[#0c1119]/94 p-10">
          <CalendarDays className="mx-auto mb-4 h-10 w-10 text-[#ff8b7c]" />
          <h1 className="mb-2 text-2xl font-bold text-white">
            Couldn’t load activity analytics
          </h1>
          <p className="mb-6 text-sm text-white/50">
            Your entries are still saved. Check the connection and try again.
          </p>
          <Button
            onClick={() =>
              Promise.all([activitiesQuery.refetch(), calendarQuery.refetch()])
            }
            className="signal-button gap-2 rounded-2xl bg-[#e95448] text-white hover:bg-[#f26456]"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-arrival relative z-10 mx-auto min-h-screen max-w-6xl space-y-8 px-4 py-6 pb-28 md:p-8 md:pb-20">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#ff8b7c]">
            <Sparkles className="h-4 w-4" /> Activity analytics
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            History
          </h1>
          <p className="mt-2 text-sm text-white/40">
            See where your time went — every active day counts.
          </p>
        </div>
        <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`signal-button rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${period === value ? "bg-[#e95448] text-white shadow-[0_8px_24px_rgba(233,84,72,.16)]" : "text-white/35 hover:bg-white/[.04] hover:text-white"}`}
            >
              {PERIOD_LABELS[value]}
            </button>
          ))}
        </div>
      </header>

      {isError && hasCachedData && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#ffc268]/20 bg-[#ffc268]/[.07] px-5 py-4 text-sm text-[#ffe0a5]">
          <span>Showing saved data. Fresh activity could not be loaded.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void calendarQuery.refetch()}
            className="gap-2 text-[#ffe0a5]"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Practice time"
          value={formatMinutes(focusMinutes)}
          icon={Clock3}
        />
        <SummaryCard
          label="Sport · separate"
          value={formatMinutes(sportMinutes)}
          icon={ActivityIcon}
        />
        <SummaryCard
          label="Active days"
          value={String(activeDays)}
          icon={CalendarDays}
        />
        <SummaryCard
          label="Most active"
          value={
            topActivity && (activityTotals.get(topActivity.id) ?? 0) > 0
              ? topActivity.name
              : "—"
          }
          icon={Trophy}
        />
      </section>

      <section className="signal-surface overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92">
        <div className="flex flex-col gap-2 border-b border-white/5 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white">Activity timeline</h2>
          <p className="text-sm text-white/40">
            Daily volume and the activities that made it up.
          </p>
        </div>

        <div className="overflow-x-auto px-4 py-7 md:px-8">
          <div style={{ width: `${chartWidth}px` }} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stackedData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                onClick={(state) => {
                  if (state?.activeLabel)
                    setSelectedDate(String(state.activeLabel));
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    format(
                      parseISO(String(date)),
                      period === "week" ? "EEE" : "d MMM",
                    )
                  }
                  tick={{
                    fill: "rgba(255,255,255,0.35)",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  minTickGap={12}
                />
                <YAxis
                  domain={[0, maxDailyMinutes]}
                  tickFormatter={(minutes) =>
                    `${Math.round(Number(minutes) / 60)}h`
                  }
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  labelFormatter={(date) =>
                    format(parseISO(String(date)), "EEEE, MMMM d")
                  }
                  formatter={(value, name) => {
                    const id = Number(String(name).replace("activity_", ""));
                    return [
                      formatMinutes(Number(value)),
                      activities.find((activity) => activity.id === id)?.name ??
                        "Activity",
                    ];
                  }}
                  contentStyle={{
                    backgroundColor: "#090d14",
                    border: "1px solid rgba(255,194,104,0.18)",
                    borderRadius: "1rem",
                    color: "#fff",
                    boxShadow: "0 18px 50px rgba(0,0,0,.32)",
                  }}
                />
                {activities
                  .filter((activity) => activity.activityType !== "sport")
                  .filter(
                    (activity) => !hiddenActivityIds.includes(activity.id),
                  )
                  .map((activity) => (
                    <Bar
                      key={activity.id}
                      dataKey={activityKey(activity.id)}
                      stackId="activities"
                      fill={activityColors.get(activity.id)}
                      isAnimationActive={!reducedMotion}
                      maxBarSize={30}
                      radius={[3, 3, 0, 0]}
                    />
                  ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            className="mt-4 border-t border-white/[.06] pt-3"
            style={{ width: `${chartWidth}px` }}
          >
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${chartDays.length}, minmax(0, 1fr))`,
              }}
            >
              {chartDays.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  title={`${format(parseISO(day.date), "MMM d")}: ${formatMinutes(day.sportMinutes)} sport`}
                  aria-label={`${format(parseISO(day.date), "MMMM d")}: ${day.sportMinutes} sport minutes`}
                  className="flex h-8 items-center rounded-sm bg-white/[.025] px-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#72c6b3]"
                >
                  <span
                    className="block h-1.5 rounded-full bg-[#62bca8] shadow-[0_0_7px_rgba(98,188,168,.3)]"
                    style={{
                      width: `${(day.sportMinutes / maxSportMinutes) * 100}%`,
                    }}
                  />
                </button>
              ))}
            </div>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[.16em] text-[#72c6b3]/70">
              Sport · separate time lane
            </p>
          </div>
        </div>

        <div className="max-h-36 overflow-y-auto border-t border-white/5 px-6 py-5 md:px-8">
          <div className="flex flex-wrap gap-2">
            {activities.map((activity) => {
              const isVisible = !hiddenActivityIds.includes(activity.id);
              return (
                <button
                  key={activity.id}
                  type="button"
                  aria-pressed={isVisible}
                  onClick={() => toggleActivity(activity.id)}
                  className={`signal-button flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${isVisible ? "border-white/10 bg-white/5 text-white/70" : "border-transparent bg-transparent text-white/20"}`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{
                      backgroundColor: activityColors.get(activity.id),
                      opacity: isVisible ? 1 : 0.25,
                    }}
                  />
                  {activity.name}
                  <span
                    className={
                      activity.activityType === "sport"
                        ? "text-[#72c6b3]/70"
                        : "text-white/20"
                    }
                  >
                    {activity.activityType}
                  </span>
                  <span className="text-white/25">
                    {formatMinutes(activityTotals.get(activity.id) ?? 0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="selected-day"
        className={`signal-surface rounded-3xl border border-white/[.08] bg-[#0c1119]/92 p-6 md:p-8 ${navigationContext.fromDashboard && navigationContext.date === selectedDate ? "spatial-arrival" : ""}`}
      >
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-white">Daily effort</h2>
          <p className="mt-2 text-sm text-white/40">
            Graphite marks quieter days; coral strengthens with effort and gold
            is reserved for exceptional volume.
          </p>
        </div>
        <DailyActivityChart
          days={chartDays}
          colorScale={HEATMAP_SCALE}
          intensityThresholds={[30, 90, 180]}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </section>

      <section className="signal-surface rounded-3xl border border-white/[.08] bg-[#0c1119]/92 p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-3 border-b border-white/5 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff8b7c]">
              {navigationContext.fromDashboard
                ? "Carried from Dashboard"
                : "Selected day"}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              {selectedDate
                ? format(parseISO(selectedDate), "EEEE, MMMM d")
                : "Choose a day"}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {formatMinutes(selectedDay?.focusMinutes ?? 0)}
            </p>
            {(selectedDay?.sportMinutes ?? 0) > 0 && (
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[.14em] text-[#72c6b3]">
                Sport · {formatMinutes(selectedDay?.sportMinutes ?? 0)}
              </p>
            )}
          </div>
        </div>

        {selectedRows.length === 0 ? (
          <div className="py-10 text-center">
            <ActivityIcon className="mx-auto mb-3 h-9 w-9 text-white/15" />
            <p className="text-sm text-white/35">
              No activity recorded. Choose another day or log a session.
            </p>
            <Link href="/">
              <Button
                variant="outline"
                className="mt-5 rounded-2xl border-white/10 bg-white/5 text-white"
              >
                Go to dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedRows.map(({ activity, logs }) => (
              <div
                key={activity.id}
                className="rounded-2xl border border-white/[.07] bg-[#090d14]/80 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-8 w-1.5 rounded-full"
                      style={{
                        backgroundColor: activityColors.get(activity.id),
                      }}
                    />
                    <div>
                      <p className="font-bold text-white">{activity.name}</p>
                      <p
                        className={`text-[8px] font-bold uppercase tracking-wider ${activity.activityType === "sport" ? "text-[#72c6b3]/75" : "text-white/25"}`}
                      >
                        {activity.activityType} · {logs.length}{" "}
                        {logs.length === 1 ? "session" : "sessions"}
                      </p>
                    </div>
                  </div>
                  <p
                    className="font-bold"
                    style={{ color: activityColors.get(activity.id) }}
                  >
                    {formatMinutes(
                      logs.reduce((sum, log) => sum + log.durationMinutes, 0),
                    )}
                  </p>
                </div>
                {logs.some((log) => log.notes) && (
                  <div className="mt-4 space-y-2 border-l border-white/10 pl-4">
                    {logs
                      .filter((log) => log.notes)
                      .map((log) => (
                        <p
                          key={log.id}
                          className="text-sm italic leading-relaxed text-white/45"
                        >
                          “{log.notes}”
                        </p>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-white/20">
        Longest session in this period: {formatMinutes(longestSession)}
      </p>
    </div>
  );
}
