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
  Area,
  AreaChart,
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

type Period = "week" | "month" | "12weeks";
type ConsoleMetric = "practice" | "sport" | "total" | "active";
type ConsoleScope = "all" | number;

const CONSOLE_METRICS: Record<
  ConsoleMetric,
  { label: string; accent: string; unit: "minutes" | "days" }
> = {
  practice: { label: "Practice", accent: "#ff7868", unit: "minutes" },
  sport: { label: "Sport", accent: "#72c6b3", unit: "minutes" },
  total: { label: "All logged", accent: "#ffc268", unit: "minutes" },
  active: { label: "Active days", accent: "#9fa9ff", unit: "days" },
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
}: {
  label: string;
  value: string;
  icon: typeof Clock3;
  scenePosition: string;
}) {
  return (
    <div className="signal-surface relative isolate overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/88 p-5 shadow-[0_14px_32px_rgba(0,0,0,.14)]">
      <img
        src={zenGarden}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full select-none object-cover ${scenePosition}`}
        style={{ opacity: 0.15, filter: "brightness(.56) contrast(.88) saturate(.72)" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,20,.92),rgba(8,13,20,.76)_60%,rgba(8,13,20,.57))]" />
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
  const [consoleMetric, setConsoleMetric] =
    useState<ConsoleMetric>("practice");
  const [consoleScope, setConsoleScope] = useState<ConsoleScope>("all");
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
  const previousActiveDays = previousCalendarDays.filter(
    (day) => day.focusMinutes > 0,
  ).length;
  const focusDeltaMinutes = focusMinutes - previousFocusMinutes;
  const focusDeltaPercent = previousFocusMinutes
    ? Math.round((focusDeltaMinutes / previousFocusMinutes) * 100)
    : null;
  const periodDayCount = Math.max(chartDays.length, 1);
  const weeklyPracticePace = Math.round((focusMinutes / periodDayCount) * 7);
  const averageActiveReturn = activeDays
    ? Math.round(focusMinutes / activeDays)
    : 0;
  const consistencyRate = Math.round((activeDays / periodDayCount) * 100);
  const peakPracticeDay = chartDays.reduce(
    (peak, day) => (day.minutes > peak.minutes ? day : peak),
    chartDays[0] ?? { date: end, minutes: 0, sportMinutes: 0 },
  );
  const practiceDistribution = activities
    .filter((activity) => activity.activityType === "practice")
    .map((activity) => ({
      activity,
      minutes: activityTotals.get(activity.id) ?? 0,
    }))
    .filter((item) => item.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 4);
  const previousDayMap = useMemo(
    () => new Map(previousCalendarDays.map((day) => [day.date, day])),
    [previousCalendarDays],
  );
  const consoleScopeActivities = useMemo(
    () =>
      activities.filter((activity) => {
        if (activity.activityType === "friction") return false;
        if (consoleMetric === "practice")
          return activity.activityType === "practice";
        if (consoleMetric === "sport") return activity.activityType === "sport";
        return true;
      }),
    [activities, consoleMetric],
  );
  const selectedConsoleActivity =
    typeof consoleScope === "number"
      ? activities.find((activity) => activity.id === consoleScope) ?? null
      : null;
  const readConsoleValue = (day: CalendarDay | undefined) => {
    if (!day) return 0;
    if (typeof consoleScope === "number") {
      const minutes = day.logs
        .filter((log) => log.activityId === consoleScope)
        .reduce((sum, log) => sum + log.durationMinutes, 0);
      return consoleMetric === "active" ? Number(minutes > 0) : minutes;
    }
    if (consoleMetric === "practice") return day.focusMinutes;
    if (consoleMetric === "sport") return day.sportMinutes;
    if (consoleMetric === "total") return day.focusMinutes + day.sportMinutes;
    return Number(day.focusMinutes > 0 || day.sportMinutes > 0);
  };
  const consoleSeries = useMemo(
    () =>
      chartDays.map((day) => {
        const previousDate = format(
          subDays(parseISO(day.date), periodDayCount),
          "yyyy-MM-dd",
        );
        return {
          date: day.date,
          current: readConsoleValue(dayMap.get(day.date)),
          previous: readConsoleValue(previousDayMap.get(previousDate)),
        };
      }),
    [
      chartDays,
      consoleMetric,
      consoleScope,
      dayMap,
      periodDayCount,
      previousDayMap,
    ],
  );
  const consoleCurrentTotal = consoleSeries.reduce(
    (sum, point) => sum + point.current,
    0,
  );
  const consoleActivePoints = consoleSeries.filter(
    (point) => point.current > 0,
  ).length;
  const consolePreviousTotal = consoleSeries.reduce(
    (sum, point) => sum + point.previous,
    0,
  );
  const consoleDelta = consoleCurrentTotal - consolePreviousTotal;
  const consoleDeltaPercent = consolePreviousTotal
    ? Math.round((consoleDelta / consolePreviousTotal) * 100)
    : null;
  const consoleMetricMeta = CONSOLE_METRICS[consoleMetric];
  const consoleValueLabel =
    consoleMetricMeta.unit === "days"
      ? String(consoleCurrentTotal)
      : formatMinutes(consoleCurrentTotal);
  const consolePreviousLabel =
    consoleMetricMeta.unit === "days"
      ? String(consolePreviousTotal)
      : formatMinutes(consolePreviousTotal);
  const consoleDeltaLabel =
    consolePreviousTotal === 0
      ? "No prior read"
      : `${consoleDelta >= 0 ? "+" : "−"}${consoleMetricMeta.unit === "days" ? Math.abs(consoleDelta) : formatMinutes(Math.abs(consoleDelta))}`;
  const consoleScopeLabel = selectedConsoleActivity?.name ?? "All directions";
  const topActivity = activities
    .filter((activity) => activity.activityType === "practice")
    .reduce<Activity | null>((top, activity) => {
      if (!top) return activity;
      return (activityTotals.get(activity.id) ?? 0) >
        (activityTotals.get(top.id) ?? 0)
        ? activity
        : top;
    }, null);
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
            <ActivityIcon className="h-4 w-4" aria-hidden="true" />
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

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Practice time"
          value={formatMinutes(focusMinutes)}
          icon={Clock3}
          scenePosition="object-left"
        />
        <SummaryCard
          label="Sport · separate"
          value={formatMinutes(sportMinutes)}
          icon={ActivityIcon}
          scenePosition="object-[38%_center]"
        />
        <SummaryCard
          label="Active days"
          value={String(activeDays)}
          icon={CalendarDays}
          scenePosition="object-[62%_center]"
        />
        <SummaryCard
          label="Most active"
          value={
            topActivity && (activityTotals.get(topActivity.id) ?? 0) > 0
              ? topActivity.name
              : "—"
          }
          icon={Trophy}
          scenePosition="object-right"
        />
      </section>

      <section className="signal-surface relative isolate overflow-hidden rounded-3xl border border-[#ffb1a7]/14 bg-[radial-gradient(circle_at_84%_0%,rgba(255,120,104,.11),transparent_29%),linear-gradient(140deg,rgba(12,20,30,.97),rgba(7,12,19,.98))] shadow-[0_22px_56px_rgba(0,0,0,.22)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffc268]/55 to-transparent" />
        <div className="relative z-10 flex flex-col gap-4 border-b border-white/[.07] p-5 md:flex-row md:items-end md:justify-between md:p-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#ffc268]">
              Analysis console
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Inspect the field, not a fixed summary.
            </h2>
            <p className="mt-2 text-sm text-white/40">
              Pick a metric and a direction. The live trace and comparison below use the same recorded logs as the timeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/[.08] bg-black/[.15] p-1.5">
            {(Object.keys(CONSOLE_METRICS) as ConsoleMetric[]).map((metric) => {
              const selected = consoleMetric === metric;
              return (
                <button
                  key={metric}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setConsoleMetric(metric);
                    setConsoleScope("all");
                  }}
                  className={`signal-button rounded-xl px-3 py-2 text-[9px] font-bold uppercase tracking-[.13em] transition-[color,background-color,box-shadow] ${selected ? "bg-white/[.1] text-white shadow-[0_0_18px_rgba(255,194,104,.08)]" : "text-white/32 hover:bg-white/[.05] hover:text-white/78"}`}
                  style={selected ? { boxShadow: `inset 0 -1px 0 ${CONSOLE_METRICS[metric].accent}88, 0 0 18px ${CONSOLE_METRICS[metric].accent}18` } : undefined}
                >
                  {CONSOLE_METRICS[metric].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 p-5 md:p-6">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              type="button"
              aria-pressed={consoleScope === "all"}
              onClick={() => setConsoleScope("all")}
              className={`signal-button shrink-0 rounded-xl border px-3 py-2 text-[9px] font-bold uppercase tracking-[.13em] ${consoleScope === "all" ? "border-white/[.22] bg-white/[.09] text-white" : "border-white/[.07] bg-black/[.1] text-white/36 hover:border-white/[.16] hover:text-white/78"}`}
            >
              All directions
            </button>
            {consoleScopeActivities.map((activity) => {
              const selected = consoleScope === activity.id;
              return (
                <button
                  key={activity.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setConsoleScope(activity.id)}
                  className={`signal-button shrink-0 rounded-xl border px-3 py-2 text-[9px] font-bold uppercase tracking-[.13em] transition-[color,background-color,border-color] ${selected ? "text-white" : "border-white/[.07] bg-black/[.1] text-white/36 hover:border-white/[.16] hover:text-white/78"}`}
                  style={
                    selected
                      ? {
                          borderColor: `${activityColors.get(activity.id)}a8`,
                          backgroundColor: `${activityColors.get(activity.id)}22`,
                          boxShadow: `0 0 16px ${activityColors.get(activity.id)}18`,
                        }
                      : undefined
                  }
                >
                  {activity.name}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="relative overflow-hidden rounded-2xl border border-white/[.08] bg-[#070c13]/[.68] p-3.5 sm:p-4">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[.16em] text-white/36">
                    {consoleMetricMeta.label} trace · {consoleScopeLabel}
                  </p>
                  <p className="mt-1 text-sm text-white/48">
                    Solid line: current period · dashed line: matched prior period
                  </p>
                </div>
                <span className="rounded-lg border border-white/[.08] bg-white/[.035] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[.13em] text-white/42">
                  Click trace to open day
                </span>
              </div>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={consoleSeries}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    onClick={(state) => {
                      if (state?.activeLabel) setSelectedDate(String(state.activeLabel));
                    }}
                  >
                    <defs>
                      <linearGradient id="history-console-current" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={consoleMetricMeta.accent} stopOpacity={0.42} />
                        <stop offset="100%" stopColor={consoleMetricMeta.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(parseISO(String(date)), period === "week" ? "EEE" : "d MMM")}
                      tick={{ fill: "rgba(255,255,255,.36)", fontSize: 9, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      tickFormatter={(value) => consoleMetricMeta.unit === "days" ? String(value) : formatMinutes(Number(value))}
                      tick={{ fill: "rgba(255,255,255,.3)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      labelFormatter={(date) => format(parseISO(String(date)), "EEEE, MMM d")}
                      formatter={(value, name) => [
                        consoleMetricMeta.unit === "days" ? `${Number(value)} active` : formatMinutes(Number(value)),
                        name === "current" ? "This period" : "Previous period",
                      ]}
                      contentStyle={{ backgroundColor: "#080d14", border: "1px solid rgba(255,194,104,.2)", borderRadius: "1rem", color: "#fff", boxShadow: "0 18px 50px rgba(0,0,0,.4)" }}
                      cursor={{ stroke: "rgba(255,255,255,.18)", strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="previous" stroke="rgba(255,255,255,.32)" strokeDasharray="5 6" fill="transparent" strokeWidth={1.5} isAnimationActive={!reducedMotion} />
                    <Area type="monotone" dataKey="current" stroke={consoleMetricMeta.accent} fill="url(#history-console-current)" strokeWidth={2.5} activeDot={{ r: 4, fill: consoleMetricMeta.accent, stroke: "#0b1018", strokeWidth: 2 }} isAnimationActive={!reducedMotion} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-2xl border border-white/[.08] bg-[linear-gradient(155deg,rgba(255,194,104,.09),rgba(8,13,20,.82)_56%,rgba(114,198,179,.06))] p-4">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ffc268]/[.1] blur-3xl" />
              <div className="relative">
                <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#ffe0a5]/72">
                  Current signal
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/42">
                  {consoleScopeLabel}
                </p>
                <strong className="mt-2 block text-3xl font-semibold tabular-nums tracking-[-.04em] text-white">
                  {consoleValueLabel}
                </strong>
                <span className="mt-1 block text-[9px] font-medium uppercase tracking-[.12em] text-white/38">
                  {consoleMetricMeta.label} · selected range
                </span>
                <div className="mt-5 border-t border-white/[.08] pt-4">
                  <span className="text-[8px] font-bold uppercase tracking-[.14em] text-white/34">
                    Versus prior
                  </span>
                  <strong className="mt-1 block text-lg font-semibold tabular-nums" style={{ color: consoleDelta >= 0 ? consoleMetricMeta.accent : "#ff9b84" }}>
                    {consoleDeltaLabel}
                  </strong>
                  <span className="mt-1 block text-[9px] font-medium uppercase tracking-[.12em] text-white/38">
                    {consolePreviousTotal
                      ? `${consoleDeltaPercent && consoleDeltaPercent > 0 ? "+" : ""}${consoleDeltaPercent ?? 0}% · prior ${consolePreviousLabel}`
                      : "No matching prior record"}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[.08] pt-4">
                  <div>
                    <span className="block text-[7px] font-bold uppercase tracking-[.12em] text-white/30">Coverage</span>
                    <strong className="mt-1 block text-sm font-semibold tabular-nums text-white/84">{consoleActivePoints}/{periodDayCount}</strong>
                  </div>
                  <div>
                    <span className="block text-[7px] font-bold uppercase tracking-[.12em] text-white/30">Selection</span>
                    <strong className="mt-1 block truncate text-sm font-semibold text-white/84">{consoleMetricMeta.label}</strong>
                  </div>
                </div>
              </div>
            </aside>
          </div>
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
