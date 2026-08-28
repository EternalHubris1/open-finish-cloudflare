import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import {
  getGetCalendarQueryKey,
  getListActivitiesQueryKey,
  useGetCalendar,
  useListActivities,
} from "@workspace/api-client-react";
import type { Activity, CalendarDay } from "@workspace/api-client-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity as ActivityIcon,
  CalendarDays,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  differenceInCalendarDays,
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
import zenGarden from "@/assets/environments/optimized/history-zen-garden.webp";
import historyOrnament from "@/assets/patterns/japanese-ornament-transparent-v2-cropped.png";
import { chronologicalSessions, recordedTime } from "@/lib/session-timeline";

type Period = "week" | "month" | "12weeks";
type AggregationMetric = "practice" | "sport" | "combined";
type TelemetrySlice = "volume" | "sessions" | "longest";

const TELEMETRY_SLICES: Record<
  TelemetrySlice,
  { label: string; description: string; unit: "minutes" | "count" }
> = {
  volume: {
    label: "Volume",
    description: "Recorded minutes on each day",
    unit: "minutes",
  },
  sessions: {
    label: "Sessions",
    description: "Number of recorded returns",
    unit: "count",
  },
  longest: {
    label: "Longest return",
    description: "Largest single session on each day",
    unit: "minutes",
  },
};

const AGGREGATION_METRICS: Record<
  AggregationMetric,
  { label: string; color: string }
> = {
  practice: { label: "Practice", color: "#ff8b7c" },
  sport: { label: "Sport", color: "#62bca8" },
  combined: { label: "Combined", color: "#ffc268" },
};

const PERIOD_LABELS: Record<Period, string> = {
  week: "Week",
  month: "Month",
  "12weeks": "12 weeks",
};

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
                createdAt: `${dateString}T08:15:00Z`,
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
                createdAt: `${dateString}T10:30:00Z`,
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
                createdAt: `${dateString}T15:45:00Z`,
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
  const [aggregationMetric, setAggregationMetric] =
    useState<AggregationMetric>("practice");
  const [telemetrySlice, setTelemetrySlice] =
    useState<TelemetrySlice>("volume");
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("date"),
  );
  const range = useMemo(() => getRange(period), [period]);
  const start = format(range.start, "yyyy-MM-dd");
  const end = format(range.end, "yyyy-MM-dd");
  const comparisonStart = format(
    subDays(range.start, differenceInCalendarDays(range.end, range.start) + 1),
    "yyyy-MM-dd",
  );

  const activitiesQuery = useListActivities({
    query: { enabled: !preview, queryKey: getListActivitiesQueryKey() },
  });
  const calendarQuery = useGetCalendar(
    { start: comparisonStart, end },
    {
      query: {
        enabled: !preview,
        queryKey: getGetCalendarQueryKey({
          start: comparisonStart,
          end,
        }),
      },
    },
  );
  const activities = preview
    ? [previewActivities[0], previewActivities[1], previewActivities[3]]
    : Array.isArray(activitiesQuery.data)
      ? activitiesQuery.data
      : [];
  const allCalendarDays = useMemo(
    () =>
      preview
        ? previewCalendar(comparisonStart, end)
        : Array.isArray(calendarQuery.data)
          ? calendarQuery.data
          : [],
    [calendarQuery.data, comparisonStart, end, preview],
  );
  const calendarDays = useMemo(
    () => allCalendarDays.filter((day) => day.date >= start),
    [allCalendarDays, start],
  );
  const previousCalendarDays = useMemo(
    () => allCalendarDays.filter((day) => day.date < start),
    [allCalendarDays, start],
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

  const focusMinutes = calendarDays.reduce(
    (sum, day) => sum + day.focusMinutes,
    0,
  );
  const sportMinutes = calendarDays.reduce(
    (sum, day) => sum + day.sportMinutes,
    0,
  );
  const longestSession = Math.max(
    0,
    ...calendarDays.flatMap((day) =>
      day.logs.map((log) => log.durationMinutes),
    ),
  );
  const previousFocusMinutes = previousCalendarDays.reduce(
    (sum, day) => sum + day.focusMinutes,
    0,
  );
  const previousSportMinutes = previousCalendarDays.reduce(
    (sum, day) => sum + day.sportMinutes,
    0,
  );
  const periodDayCount = Math.max(chartDays.length, 1);
  const metricConfig = AGGREGATION_METRICS[aggregationMetric];
  const metricTotal =
    aggregationMetric === "practice"
      ? focusMinutes
      : aggregationMetric === "sport"
        ? sportMinutes
        : focusMinutes + sportMinutes;
  const previousMetricTotal =
    aggregationMetric === "practice"
      ? previousFocusMinutes
      : aggregationMetric === "sport"
        ? previousSportMinutes
        : previousFocusMinutes + previousSportMinutes;
  const metricActivityType =
    aggregationMetric === "practice"
      ? "practice"
      : aggregationMetric === "sport"
        ? "sport"
        : null;
  const telemetryDays = chartDays.map((day) => {
    const scopedLogs = (dayMap.get(day.date)?.logs ?? []).filter((log) =>
      metricActivityType
        ? log.activityType === metricActivityType
        : log.activityType !== "friction",
    );
    const volume =
      aggregationMetric === "practice"
        ? day.minutes
        : aggregationMetric === "sport"
          ? day.sportMinutes
          : day.minutes + day.sportMinutes;
    return {
      date: day.date,
      volume,
      sessions: scopedLogs.length,
      longest: Math.max(0, ...scopedLogs.map((log) => log.durationMinutes)),
    };
  });
  const metricActiveDays = telemetryDays.filter((day) => day.volume > 0).length;
  const metricAverageReturn = metricActiveDays
    ? Math.round(metricTotal / metricActiveDays)
    : 0;
  const metricDeltaMinutes = metricTotal - previousMetricTotal;
  const metricDeltaPercent = previousMetricTotal
    ? Math.round((metricDeltaMinutes / previousMetricTotal) * 100)
    : null;
  const metricPeakDay = telemetryDays.reduce(
    (peak, day) => (day.volume > peak.volume ? day : peak),
    telemetryDays[0] ?? { date: end, volume: 0, sessions: 0, longest: 0 },
  );
  const sortedActiveVolumes = telemetryDays
    .map((day) => day.volume)
    .filter((value) => value > 0)
    .sort((left, right) => left - right);
  const metricMedianReturn = sortedActiveVolumes.length
    ? sortedActiveVolumes[Math.floor(sortedActiveVolumes.length / 2)]
    : 0;
  const metricConsistency = Math.round(
    (metricActiveDays / periodDayCount) * 100,
  );
  const longestQuietRun = telemetryDays.reduce(
    (state, day) => {
      const current = day.volume > 0 ? 0 : state.current + 1;
      return { current, longest: Math.max(state.longest, current) };
    },
    { current: 0, longest: 0 },
  ).longest;
  const telemetryConfig = TELEMETRY_SLICES[telemetrySlice];
  const telemetryPeak = telemetryDays.reduce(
    (peak, day) => (day[telemetrySlice] > peak[telemetrySlice] ? day : peak),
    telemetryDays[0] ?? { date: end, volume: 0, sessions: 0, longest: 0 },
  );
  const telemetryMax = Math.max(
    telemetryConfig.unit === "minutes" ? 30 : 1,
    ...telemetryDays.map((day) => day[telemetrySlice]),
  );
  const selectedTelemetry = telemetryDays.find(
    (day) => day.date === selectedDate,
  );
  const metricDistribution = activities
    .filter((activity) =>
      metricActivityType
        ? activity.activityType === metricActivityType
        : activity.activityType !== "friction",
    )
    .map((activity) => ({
      activity,
      minutes: calendarDays.reduce(
        (sum, day) =>
          sum +
          day.logs
            .filter((log) => log.activityId === activity.id)
            .reduce((logSum, log) => logSum + log.durationMinutes, 0),
        0,
      ),
    }))
    .filter((item) => item.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 6);

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
  const dailyEffortActiveDays = chartDays.filter(
    (day) => day.minutes > 0 || day.sportMinutes > 0,
  ).length;
  const peakEffortDay = chartDays.reduce(
    (peak, day) =>
      day.minutes + day.sportMinutes > peak.minutes + peak.sportMinutes
        ? day
        : peak,
    chartDays[0] ?? { date: end, minutes: 0, sportMinutes: 0 },
  );
  const selectedSessions = chronologicalSessions(selectedDay?.logs ?? []);
  const selectedActivityIds = [
    ...new Set(selectedSessions.map((log) => log.activityId)),
  ];
  const selectedRows = selectedActivityIds.map((id) => {
    const logs = selectedSessions.filter((log) => log.activityId === id);
    return {
      activity: logs[0],
      minutes: logs.reduce((sum, log) => sum + log.durationMinutes, 0),
      count: logs.length,
    };
  });

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
      <header className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/[.08] bg-[#0a1019]/86 px-5 py-6 shadow-[0_18px_46px_rgba(0,0,0,.18)] md:flex md:items-end md:justify-between md:gap-5 md:px-7">
        <img
          src={zenGarden}
          alt=""
          aria-hidden="true"
          className="room-motif-image pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
          style={{ opacity: 0.64 }}
        />
        <div className="room-motif-overlay pointer-events-none absolute inset-0" />
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-[#ffb1a7]">
            <span
              className="history-orbit-beacon"
              role="img"
              aria-label="Activity analytics signal"
            >
              <span className="history-orbit-beacon-orbit">
                <span className="history-orbit-beacon-marker" />
              </span>
              <span className="history-orbit-beacon-needle" />
            </span>
            Activity analytics
          </div>
          <h1 className="text-3xl font-semibold tracking-[-.035em] text-white md:text-4xl">
            History
          </h1>
          <p className="mt-2 text-sm text-white/40">
            See where your time went — every active day counts.
          </p>
        </div>
        <div className="relative z-10 mt-4 flex w-fit rounded-2xl border border-white/10 bg-white/[0.03] p-1 md:mt-0">
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

      <details
        className="history-analytics-disclosure history-telemetry-console signal-surface relative isolate overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92 p-4 shadow-[0_18px_46px_rgba(0,0,0,.16)] md:p-5"
        style={
          {
            "--history-activity-ratio": `${(metricActiveDays / periodDayCount) * 100}%`,
          } as CSSProperties
        }
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ff8b7c]/45 to-transparent" />
        <summary className="relative z-10 flex flex-wrap cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-2 py-1.5 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-[8px] font-bold uppercase tracking-[.18em] text-[#ffc268]">
              Period analytics
            </span>
            <span className="mt-1 block text-base font-semibold text-white">
              {metricConfig.label} · {formatMinutes(metricTotal)}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="rounded-full border border-white/[.08] bg-white/[.035] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-white/42">
              {metricActiveDays} active{" "}
              {metricActiveDays === 1 ? "day" : "days"}
            </span>
            <span className="history-disclosure-indicator flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.035] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[.12em] text-white/58">
              <span className="history-disclosure-closed">Open analytics</span>
              <span className="history-disclosure-open">Hide analytics</span>
              <ChevronDown className="history-disclosure-chevron h-3.5 w-3.5" />
            </span>
          </span>
        </summary>

        <div className="relative z-10 mt-4 border-t border-white/[.06] pt-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#ffc268]">
                Period analytics
              </p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-white/42">
                Switch the measure, compare it with the prior period, then open
                any recorded day below.
              </p>
            </div>
            <div className="flex w-full rounded-2xl border border-white/[.1] bg-black/[.16] p-1 lg:w-auto">
              {(Object.keys(AGGREGATION_METRICS) as AggregationMetric[]).map(
                (value) => {
                  const option = AGGREGATION_METRICS[value];
                  const active = aggregationMetric === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAggregationMetric(value)}
                      className={`signal-button min-w-0 flex-1 rounded-xl px-3 py-2 text-[9px] font-bold uppercase tracking-[.13em] transition-[color,background-color,box-shadow] duration-150 lg:flex-none ${active ? "text-[#071019] shadow-[0_8px_20px_rgba(0,0,0,.2)]" : "text-white/38 hover:bg-white/[.05] hover:text-white"}`}
                      style={
                        active ? { backgroundColor: option.color } : undefined
                      }
                    >
                      {option.label}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="relative z-10 mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
            <section className="history-telemetry-volume rounded-2xl border border-white/[.07] bg-black/[.12] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[.16em] text-white/38">
                    Instrument readout
                  </p>
                  <p className="mt-1 text-xs text-white/48">
                    Distinct statistical cuts for the selected measure — not
                    another total.
                  </p>
                </div>
                <span className="rounded-full border border-white/[.08] bg-white/[.03] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-white/42">
                  {metricActiveDays} active days
                </span>
              </div>
              <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-white/[.07] bg-white/[.07] sm:grid-cols-2">
                <div className="bg-[#0b111a]/92 p-4">
                  <dt className="text-[8px] font-bold uppercase tracking-[.14em] text-white/34">
                    Avg. active day
                  </dt>
                  <dd className="mt-2 text-lg font-semibold tabular-nums text-white">
                    {formatMinutes(metricAverageReturn)}
                  </dd>
                </div>
                <div className="bg-[#0b111a]/92 p-4">
                  <dt className="text-[8px] font-bold uppercase tracking-[.14em] text-white/34">
                    Longest quiet run
                  </dt>
                  <dd className="mt-2 text-lg font-semibold tabular-nums text-white">
                    {longestQuietRun}d
                  </dd>
                </div>
                <div className="bg-[#0b111a]/92 p-4">
                  <dt className="text-[8px] font-bold uppercase tracking-[.14em] text-white/34">
                    Highest-volume day
                  </dt>
                  <dd className="mt-2 text-lg font-semibold tabular-nums text-[#ffc268]">
                    {formatMinutes(metricPeakDay.volume)}
                  </dd>
                </div>
                <div className="bg-[#0b111a]/92 p-4">
                  <dt className="text-[8px] font-bold uppercase tracking-[.14em] text-white/34">
                    Longest single session
                  </dt>
                  <dd className="mt-2 text-lg font-semibold tabular-nums text-white">
                    {formatMinutes(longestSession)}
                  </dd>
                </div>
              </dl>
            </section>

            <aside className="history-telemetry-selected rounded-2xl border border-[#ffc268]/16 bg-[linear-gradient(155deg,rgba(255,194,104,.08),rgba(8,13,20,.68))] p-4">
              <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#ffe0a5]/72">
                Selected signal
              </p>
              <strong className="mt-2 block text-2xl font-semibold tabular-nums text-white">
                {telemetryConfig.unit === "minutes"
                  ? formatMinutes(selectedTelemetry?.[telemetrySlice] ?? 0)
                  : `${selectedTelemetry?.[telemetrySlice] ?? 0}`}
              </strong>
              <span className="mt-1 block text-[9px] font-medium uppercase tracking-[.12em] text-white/38">
                {telemetryConfig.unit === "count"
                  ? "sessions"
                  : telemetryConfig.label}
              </span>
              <p className="mt-3 text-xs leading-5 text-white/45">
                {selectedDate
                  ? format(parseISO(selectedDate), "EEEE, MMM d")
                  : "No day selected"}
              </p>
              <div className="mt-5 space-y-3 border-t border-white/[.08] pt-4 text-[9px] font-bold uppercase tracking-[.14em] text-white/34">
                <div className="flex items-center justify-between gap-3">
                  <span>Trace peak</span>
                  <span className="text-white/72">
                    {telemetryConfig.unit === "minutes"
                      ? formatMinutes(telemetryPeak[telemetrySlice])
                      : `${telemetryPeak[telemetrySlice]} sessions`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Prior delta</span>
                  <span
                    className={
                      metricDeltaMinutes >= 0
                        ? "text-[#72c6b3]"
                        : "text-[#ff9a89]"
                    }
                  >
                    {previousMetricTotal
                      ? `${metricDeltaMinutes >= 0 ? "+" : "−"}${formatMinutes(Math.abs(metricDeltaMinutes))}`
                      : "new baseline"}
                  </span>
                </div>
              </div>
            </aside>
          </div>

          <div className="history-telemetry-distribution relative z-10 mt-3 rounded-2xl border border-white/[.07] bg-black/[.11] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.16em] text-white/38">
                  Direction matrix
                </p>
                <p className="mt-1 text-xs text-white/42">
                  Share of the selected measure by active direction.
                </p>
              </div>
              <span className="text-[9px] font-semibold tabular-nums text-white/46">
                {formatMinutes(metricTotal)} total
              </span>
            </div>
            {metricDistribution.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {metricDistribution.map(({ activity, minutes }, index) => {
                  const share = metricTotal
                    ? Math.round((minutes / metricTotal) * 100)
                    : 0;
                  const cells = Math.max(1, Math.round(share / 10));
                  const color = activityColors.get(activity.id) ?? "#ff8b7c";
                  return (
                    <article
                      key={activity.id}
                      className="rounded-xl border border-white/[.07] bg-[#0b111a]/86 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold text-white/76">
                            {activity.name}
                          </p>
                          <p className="mt-1 text-[8px] font-bold uppercase tracking-[.13em] text-white/32">
                            channel {String(index + 1).padStart(2, "0")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums text-white">
                            {formatMinutes(minutes)}
                          </p>
                          <p className="text-[8px] font-bold uppercase tracking-[.12em] text-white/36">
                            {share}%
                          </p>
                        </div>
                      </div>
                      <div
                        className="mt-3 grid grid-cols-10 gap-1"
                        aria-label={`${activity.name} share ${share}%`}
                      >
                        {Array.from({ length: 10 }, (_, cell) => (
                          <span
                            key={cell}
                            className="h-1.5 rounded-sm"
                            style={{
                              backgroundColor:
                                cell < cells ? color : "rgba(255,255,255,.07)",
                              boxShadow:
                                cell < cells ? `0 0 8px ${color}55` : undefined,
                            }}
                          />
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/34">
                Log a return to build this direction matrix.
              </p>
            )}
          </div>
        </div>

        <section className="history-signal-field mt-3 overflow-hidden rounded-2xl border border-white/[.07] bg-black/[.12]">
          <div className="flex flex-col gap-4 border-b border-white/[.06] p-4 md:flex-row md:items-end md:justify-between md:p-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#72c6b3]">
                Signal trace
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Daily change, not another bar chart.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">
                Choose the analytical slice, then select any node to inspect its
                recorded day.
              </p>
            </div>
            <div className="flex rounded-2xl border border-white/[.1] bg-black/[.16] p-1">
              {(Object.keys(TELEMETRY_SLICES) as TelemetrySlice[]).map(
                (slice) => {
                  const active = telemetrySlice === slice;
                  return (
                    <button
                      key={slice}
                      type="button"
                      onClick={() => setTelemetrySlice(slice)}
                      className={`signal-button rounded-xl px-3 py-2 text-[9px] font-bold uppercase tracking-[.13em] ${active ? "bg-[#72c6b3] text-[#07120f] shadow-[0_8px_20px_rgba(98,188,168,.16)]" : "text-white/38 hover:bg-white/[.05] hover:text-white"}`}
                    >
                      {TELEMETRY_SLICES[slice].label}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="px-4 py-5 md:px-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-[.14em] text-white/36">
              <span>{telemetryConfig.description}</span>
              <span>
                peak{" "}
                {telemetryConfig.unit === "minutes"
                  ? formatMinutes(telemetryPeak[telemetrySlice])
                  : `${telemetryPeak[telemetrySlice]} sessions`}
              </span>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={telemetryDays}
                  margin={{ top: 12, right: 14, left: 0, bottom: 0 }}
                  onClick={(state) => {
                    if (state?.activeLabel)
                      setSelectedDate(String(state.activeLabel));
                  }}
                >
                  <defs>
                    <linearGradient
                      id="history-signal-fill"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={metricConfig.color}
                        stopOpacity={0.48}
                      />
                      <stop
                        offset="88%"
                        stopColor={metricConfig.color}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="2 5"
                    stroke="rgba(255,255,255,0.08)"
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
                    minTickGap={18}
                  />
                  <YAxis
                    domain={[0, telemetryMax]}
                    tickFormatter={(value) =>
                      telemetryConfig.unit === "minutes"
                        ? formatMinutes(Number(value))
                        : String(value)
                    }
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip
                    cursor={{ stroke: "rgba(255,194,104,0.5)", strokeWidth: 1 }}
                    labelFormatter={(date) =>
                      format(parseISO(String(date)), "EEEE, MMMM d")
                    }
                    formatter={(value) => [
                      telemetryConfig.unit === "minutes"
                        ? formatMinutes(Number(value))
                        : `${value} sessions`,
                      telemetryConfig.label,
                    ]}
                    contentStyle={{
                      backgroundColor: "#090d14",
                      border: "1px solid rgba(255,194,104,0.18)",
                      borderRadius: "1rem",
                      color: "#fff",
                      boxShadow: "0 18px 50px rgba(0,0,0,.32)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={telemetrySlice}
                    stroke={metricConfig.color}
                    strokeWidth={2.5}
                    fill="url(#history-signal-fill)"
                    activeDot={{
                      r: 5,
                      strokeWidth: 2,
                      stroke: "#090d14",
                      fill: metricConfig.color,
                    }}
                    dot={{ r: 2.5, strokeWidth: 0, fill: metricConfig.color }}
                    isAnimationActive={!reducedMotion}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </details>

      <section
        id="selected-day"
        className={`signal-surface overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92 ${navigationContext.fromDashboard && navigationContext.date === selectedDate ? "spatial-arrival" : ""}`}
      >
        <div className="flex flex-col gap-5 border-b border-white/[.06] p-6 xl:flex-row xl:items-end xl:justify-between md:p-8">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#ff9a89]">
              Return field
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Daily effort</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/44">
              Each day keeps its own mark. Warm autumn leaves carry practice; a
              separate teal line records sport.
            </p>
          </div>
          <div className="flex shrink-0 self-start items-center gap-2 rounded-2xl border border-white/[.08] bg-black/15 px-3 py-2 text-[9px] font-bold uppercase tracking-[.14em] text-white/55">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff8b7c] shadow-[0_0_9px_rgba(255,139,124,.7)]" />
            Select a day to read it
          </div>
        </div>

        <div className="grid min-w-0 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start md:p-8">
          <DailyActivityChart
            days={chartDays.map((day) => ({
              date: day.date,
              minutes: day.minutes,
              secondaryMinutes: day.sportMinutes,
            }))}
            ornamentSrc={historyOrnament}
            secondaryColor="#62bca8"
            intensityThresholds={[30, 90, 180]}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <aside className="relative overflow-hidden rounded-2xl border border-white/[.08] bg-[linear-gradient(150deg,rgba(255,120,104,.1),rgba(8,13,20,.78)_55%,rgba(98,188,168,.07))] p-5">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ff7868]/[.09] blur-3xl" />
            <div className="relative z-10">
              <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#ffb1a7]">
                Selected return
              </p>
              <h3 className="mt-2 text-base font-semibold text-white">
                {selectedDate
                  ? format(parseISO(selectedDate), "EEEE, MMM d")
                  : "Choose a day"}
              </h3>
              <p className="mt-5 text-3xl font-semibold tabular-nums text-white">
                {formatMinutes(selectedDay?.focusMinutes ?? 0)}
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[.15em] text-white/38">
                Deliberate practice
              </p>
              {(selectedDay?.sportMinutes ?? 0) > 0 && (
                <p className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#72c6b3]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#62bca8] shadow-[0_0_8px_rgba(98,188,168,.65)]" />
                  Sport · {formatMinutes(selectedDay?.sportMinutes ?? 0)}
                </p>
              )}
              <div className="mt-5 space-y-3 border-t border-white/[.08] pt-4 text-[9px] font-bold uppercase tracking-[.14em] text-white/34">
                <div className="flex items-center justify-between gap-3">
                  <span>Field coverage</span>
                  <span className="text-white/70">
                    {dailyEffortActiveDays} days
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Period peak</span>
                  <span className="text-[#ff9a89]">
                    {formatMinutes(
                      peakEffortDay.minutes + peakEffortDay.sportMinutes,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
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
          <div className="space-y-6">
            <div
              aria-label="Selected day activity totals"
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
            >
              {selectedRows.map(({ activity, minutes, count }) => (
                <div
                  key={activity.activityId}
                  className="rounded-xl border border-white/[.1] bg-white/[.035] px-4 py-3"
                >
                  <p className="text-xs font-semibold text-white/85">
                    {activity.activityName}
                  </p>
                  <p className="mt-1 text-[11px] text-white/60">
                    {formatMinutes(minutes)} · {count}{" "}
                    {count === 1 ? "session" : "sessions"} ·{" "}
                    {activity.activityType}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <h3 className="mb-3 text-xs font-medium text-white/60">
                Session order · recording time in Moscow
              </h3>
              <ol
                className="space-y-2"
                aria-label="Sessions in recording order"
              >
                {selectedSessions.map((log, index) => (
                  <li
                    key={log.id}
                    className="flex items-start gap-3 rounded-2xl border border-white/[.07] bg-[#090d14]/80 p-4"
                  >
                    <span className="mt-1 w-5 shrink-0 text-[11px] tabular-nums text-white/45">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-1 h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: log.activityColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="break-words text-sm font-semibold text-white">
                          {log.activityName}
                        </p>
                        <span className="text-sm tabular-nums text-white/80">
                          {formatMinutes(log.durationMinutes)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-white/55">
                        {recordedTime(log.createdAt) ? (
                          <time dateTime={log.createdAt} title={log.createdAt}>
                            Logged {recordedTime(log.createdAt)} MSK
                          </time>
                        ) : (
                          "Recording time unavailable"
                        )}
                        {" · "}
                        {log.activityType}
                      </p>
                      {log.notes && (
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/65">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>

      <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-white/20">
        Longest session in this period: {formatMinutes(longestSession)}
      </p>
    </div>
  );
}
