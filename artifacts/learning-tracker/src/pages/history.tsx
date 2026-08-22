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
import verticalOrnament from "@/assets/patterns/japanese-ornament-transparent-v2-cropped.png";
import { SamuraiStatusIcon } from "@/components/samurai-status-icon";

type Period = "week" | "month" | "12weeks";
type AggregationMetric = "practice" | "sport" | "combined";

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
  scenePosition,
  sceneScale,
  showOrnament = false,
}: {
  label: string;
  value: string;
  icon: typeof Clock3;
  scenePosition: string;
  sceneScale: number;
  showOrnament?: boolean;
}) {
  return (
    <div className="history-telemetry-cell signal-surface relative isolate overflow-hidden rounded-3xl border border-white/[.1] bg-[#0c1119]/74 p-5 shadow-[0_14px_32px_rgba(0,0,0,.14)]">
      <img
        src={zenGarden}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        style={{
          opacity: 0.58,
          filter: "brightness(.92) contrast(.96) saturate(.88)",
          objectPosition: scenePosition,
          transform: `scale(${sceneScale})`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,20,.84)_0%,rgba(8,13,20,.5)_53%,rgba(8,13,20,.18)_100%)]" />
      {showOrnament && (
        <img
          src={verticalOrnament}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-8 h-[15rem] w-auto select-none opacity-[.22] brightness-[1.16] saturate-[.76]"
        />
      )}
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-[#ff8b7c]/45 via-white/[.14] to-transparent" />
      <div className="relative z-10">
        <div className="mb-4 flex min-h-8 items-start gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/34">
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
  const [aggregationMetric, setAggregationMetric] =
    useState<AggregationMetric>("practice");
  const [hiddenActivityIds, setHiddenActivityIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("date"),
  );
  const range = useMemo(() => getRange(period), [period]);
  const start = format(range.start, "yyyy-MM-dd");
  const end = format(range.end, "yyyy-MM-dd");
  const comparisonStart = format(
    subDays(
      range.start,
      differenceInCalendarDays(range.end, range.start) + 1,
    ),
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

  const stackedData = useMemo(
    () =>
      chartDays.map((day) => {
        const calendarDay = dayMap.get(day.date);
        const row: Record<string, string | number> = {
          date: day.date,
          totalMinutes: day.minutes,
        };
        activities
          .filter((activity) => activity.activityType === "practice")
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
  const metricDays = chartDays.map((day) => ({
    date: day.date,
    value:
      aggregationMetric === "practice"
        ? day.minutes
        : aggregationMetric === "sport"
          ? day.sportMinutes
          : day.minutes + day.sportMinutes,
  }));
  const metricActiveDays = metricDays.filter((day) => day.value > 0).length;
  const metricAverageReturn = metricActiveDays
    ? Math.round(metricTotal / metricActiveDays)
    : 0;
  const metricDeltaMinutes = metricTotal - previousMetricTotal;
  const metricDeltaPercent = previousMetricTotal
    ? Math.round((metricDeltaMinutes / previousMetricTotal) * 100)
    : null;
  const metricPeakDay = metricDays.reduce(
    (peak, day) => (day.value > peak.value ? day : peak),
    metricDays[0] ?? { date: end, value: 0 },
  );
  const metricMaxValue = Math.max(1, ...metricDays.map((day) => day.value));
  const selectedMetricDay = metricDays.find((day) => day.date === selectedDate);
  const metricActivityType =
    aggregationMetric === "practice"
      ? "practice"
      : aggregationMetric === "sport"
        ? "sport"
        : null;
  const metricDistribution = activities
    .filter((activity) => !metricActivityType || activity.activityType === metricActivityType)
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
    .slice(0, 4);
  const maxDailyMinutes = Math.max(60, ...chartDays.map((day) => day.minutes));
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
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#ff8b7c]">
            <SamuraiStatusIcon
              status="active"
              label="Activity analytics signal"
              className="h-7 w-7 shrink-0"
              animate={!reducedMotion}
            />
            Activity analytics
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            History
          </h1>
          <p className="mt-2 text-sm text-white/40">
            See where your time went — every active day counts.
          </p>
        </div>
        <div className="relative z-10 flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
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

      <section
        className="history-telemetry-console signal-surface relative isolate overflow-hidden rounded-[2rem] border border-white/[.08] bg-[#0c1119]/92 p-5 shadow-[0_18px_46px_rgba(0,0,0,.16)] md:p-6"
        style={{ "--history-activity-ratio": `${(metricActiveDays / periodDayCount) * 100}%` } as CSSProperties}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ff8b7c]/45 to-transparent" />
        <div className="relative z-10 flex flex-col gap-4 border-b border-white/[.06] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#ffc268]">
              Period telemetry
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Recorded effort, read as one system.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/42">
              Switch the measure, compare it with the prior period, then open any recorded day below.
            </p>
          </div>
          <div className="flex w-full rounded-2xl border border-white/[.1] bg-black/[.16] p-1 lg:w-auto">
            {(Object.keys(AGGREGATION_METRICS) as AggregationMetric[]).map((value) => {
              const option = AGGREGATION_METRICS[value];
              const active = aggregationMetric === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAggregationMetric(value)}
                  className={`signal-button min-w-0 flex-1 rounded-xl px-3 py-2 text-[9px] font-bold uppercase tracking-[.13em] transition-[color,background-color,box-shadow] duration-150 lg:flex-none ${active ? "text-[#071019] shadow-[0_8px_20px_rgba(0,0,0,.2)]" : "text-white/38 hover:bg-white/[.05] hover:text-white"}`}
                  style={active ? { backgroundColor: option.color } : undefined}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard
            label={`${metricConfig.label} logged`}
            value={formatMinutes(metricTotal)}
            icon={Clock3}
            scenePosition="6% 66%"
            sceneScale={1.3}
          />
          <SummaryCard
            label={`Days with ${metricConfig.label.toLowerCase()}`}
            value={`${metricActiveDays} / ${periodDayCount}`}
            icon={CalendarDays}
            scenePosition="48% 12%"
            sceneScale={1.3}
            showOrnament
          />
          <SummaryCard
            label="Avg. per active day"
            value={formatMinutes(metricAverageReturn)}
            icon={ActivityIcon}
            scenePosition="52% 84%"
            sceneScale={1.3}
            showOrnament
          />
          <SummaryCard
            label="Change vs prior period"
            value={
              previousMetricTotal
                ? `${metricDeltaMinutes >= 0 ? "+" : "−"}${formatMinutes(Math.abs(metricDeltaMinutes))}`
                : "New"
            }
            icon={RefreshCw}
            scenePosition="94% 48%"
            sceneScale={1.3}
            showOrnament
          />
        </div>

        <div className="relative z-10 mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.72fr)]">
          <div className="history-telemetry-volume rounded-2xl border border-white/[.07] bg-black/[.12] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.16em] text-white/38">
                  Daily volume
                </p>
                <p className="mt-1 text-xs text-white/48">
                  Select any bar to inspect that recorded day below.
                </p>
              </div>
              <span className="rounded-full border border-white/[.08] bg-white/[.03] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-white/42">
                {metricActiveDays} active
              </span>
            </div>
            <div className="mt-5 flex h-24 items-end gap-1.5 overflow-x-auto pb-1">
              {metricDays.map((day) => {
                const active = day.date === selectedDate;
                const barHeight = day.value ? Math.max(10, Math.round((day.value / metricMaxValue) * 100)) : 4;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    title={`${format(parseISO(day.date), "EEE, MMM d")} · ${formatMinutes(day.value)}`}
                    aria-label={`Open ${format(parseISO(day.date), "EEE, MMM d")}: ${formatMinutes(day.value)}`}
                    className="group relative flex h-full min-w-3 flex-1 items-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#ffc268]"
                  >
                    <span
                      className={`w-full rounded-sm transition-[height,opacity,box-shadow] duration-300 ${active ? "opacity-100 shadow-[0_0_14px_currentColor]" : day.value ? "opacity-75 group-hover:opacity-100" : "opacity-25"}`}
                      style={{ height: `${barHeight}%`, backgroundColor: metricConfig.color, color: metricConfig.color }}
                    />
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[8px] font-bold uppercase tracking-[.12em] text-white/28">
              <span>{format(range.start, period === "week" ? "EEE" : "MMM d")}</span>
              <span>{format(range.end, period === "week" ? "EEE" : "MMM d")}</span>
            </div>
          </div>

          <aside className="history-telemetry-selected rounded-2xl border border-[#ffc268]/16 bg-[linear-gradient(155deg,rgba(255,194,104,.08),rgba(8,13,20,.68))] p-4">
            <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#ffe0a5]/72">
              Selected day
            </p>
            <strong className="mt-2 block text-lg font-semibold tabular-nums text-white">
              {selectedMetricDay ? formatMinutes(selectedMetricDay.value) : "0m"}
            </strong>
            <span className="mt-1 block text-[9px] font-medium uppercase tracking-[.12em] text-white/38">
              {selectedDate ? format(parseISO(selectedDate), "EEE, MMM d") : "No day selected"}
            </span>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[.08] pt-3">
              <div>
                <span className="text-[8px] font-bold uppercase tracking-[.12em] text-white/34">Highest-volume day</span>
                <strong className="mt-1 block text-sm font-semibold tabular-nums text-white/82">{formatMinutes(metricPeakDay.value)}</strong>
              </div>
              <div>
                <span className="text-[8px] font-bold uppercase tracking-[.12em] text-white/34">Longest single session</span>
                <strong className="mt-1 block text-sm font-semibold tabular-nums text-white/82">{formatMinutes(longestSession)}</strong>
              </div>
            </div>
          </aside>
        </div>

        <div className="history-telemetry-distribution relative z-10 mt-3 rounded-2xl border border-white/[.07] bg-black/[.11] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[8px] font-bold uppercase tracking-[.16em] text-white/38">
              {metricConfig.label} by direction
            </p>
            <span className="text-[9px] font-semibold tabular-nums text-white/46">
              {formatMinutes(metricTotal)} total
            </span>
          </div>
          {metricDistribution.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {metricDistribution.map(({ activity, minutes }) => {
                const share = metricTotal ? Math.round((minutes / metricTotal) * 100) : 0;
                return (
                  <div key={activity.id}>
                    <div className="flex items-center justify-between gap-3 text-[10px]">
                      <span className="min-w-0 truncate font-medium text-white/70">{activity.name}</span>
                      <span className="shrink-0 tabular-nums text-white/42">{formatMinutes(minutes)} · {share}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${share}%`, backgroundColor: activityColors.get(activity.id), boxShadow: `0 0 12px ${activityColors.get(activity.id)}80` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/34">Log a return to build this distribution.</p>
          )}
        </div>
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
                  .filter((activity) => activity.activityType === "practice")
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
        </div>

        <div className="max-h-36 overflow-y-auto border-t border-white/5 px-6 py-5 md:px-8">
          <div className="flex flex-wrap gap-2">
            {activities
              .filter((activity) => activity.activityType === "practice")
              .map((activity) => {
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
        className={`signal-surface overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92 ${navigationContext.fromDashboard && navigationContext.date === selectedDate ? "spatial-arrival" : ""}`}
      >
        <div className="flex flex-col gap-5 border-b border-white/[.06] p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#ff9a89]">
              Return field
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Daily effort</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/44">
              The field keeps the shape of your practice. Coral and gold carry
              deliberate work; a quiet green edge records sport.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/[.08] bg-black/15 px-3 py-2 text-[9px] font-bold uppercase tracking-[.14em] text-white/42">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff8b7c] shadow-[0_0_9px_rgba(255,139,124,.7)]" />
            Select a day to read it
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start md:p-8">
          <DailyActivityChart
            days={chartDays.map((day) => ({
              date: day.date,
              minutes: day.minutes,
              secondaryMinutes: day.sportMinutes,
            }))}
            colorScale={HEATMAP_SCALE}
            secondaryColor="#62bca8"
            intensityThresholds={[30, 90, 180]}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <aside className="relative overflow-hidden rounded-2xl border border-white/[.08] bg-[linear-gradient(150deg,rgba(255,120,104,.1),rgba(8,13,20,.78)_55%,rgba(98,188,168,.07))] p-5">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ffc268]/[.09] blur-3xl" />
            <div className="relative">
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
                  <span className="text-[#ffc268]">
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
