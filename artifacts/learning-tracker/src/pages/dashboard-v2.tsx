import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link, useLocation } from "wouter";
import {
  getGetCalendarQueryKey,
  getListActivityLogsQueryKey,
  useGetCalendar,
  useGetDashboard,
  useListActivities,
  useListActivityLogs,
  useListStreaks,
  type Activity,
  type ActivityLog,
  type CalendarDay,
} from "@workspace/api-client-react";
import { addDays, format, startOfWeek } from "date-fns";
import {
  ArrowUpRight,
  Flame,
  Plus,
  Radio,
  RefreshCw,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { LogActivityDialog } from "@/components/log-activity-dialog";
import { TodayPlan } from "@/components/today-plan";
import { ActivityGlyph } from "@/lib/activity-icons";
import {
  previewActivities,
  previewDashboard,
  previewStreaks,
} from "@/pages/dashboard-exploration";

const MOMENTUM_PALETTES = {
  dark: [
    "oklch(0.31 0.018 255)",
    "oklch(0.47 0.055 20)",
    "oklch(0.59 0.125 22)",
    "oklch(0.69 0.17 28)",
    "oklch(0.82 0.145 72)",
  ],
  light: [
    "oklch(0.82 0.012 255)",
    "oklch(0.72 0.07 15)",
    "oklch(0.65 0.17 22)",
    "oklch(0.61 0.2 29)",
    "oklch(0.76 0.16 76)",
  ],
} as const;

function minutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ""}` : `${rest}m`;
}

function intensityIndex(minutes: number) {
  if (minutes === 0) return 0;
  if (minutes <= 45) return 1;
  if (minutes <= 120) return 2;
  if (minutes <= 240) return 3;
  return 4;
}

function momentumSeries(days: CalendarDay[]) {
  let accumulated = 0;
  return days.map((day) => {
    const dailyEnergy = Math.min(day.focusMinutes / 240, 1);
    accumulated =
      day.focusMinutes === 0
        ? accumulated * 0.52
        : Math.min(1, accumulated * 0.68 + dailyEnergy * 0.52);
    return accumulated;
  });
}

function momentumStatus(values: number[]) {
  const current = values.at(-1) ?? 0;
  const previous = values.at(-2) ?? 0;
  if (current < 0.22) return "Momentum is quiet";
  if (current - previous > 0.08) return "Momentum is building";
  if (previous - current > 0.12) return "Momentum is softening";
  return "Momentum is holding";
}

function previewCalendar(): CalendarDay[] {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const focusTotals = [42, 126, 18, 208, 76, 286, 164];
  const sportTotals = [25, 0, 50, 20, 70, 35, 55];
  return focusTotals.map((focusMinutes, index) => {
    const date = format(addDays(weekStart, index), "yyyy-MM-dd");
    const sportMinutes = sportTotals[index] ?? 0;
    const totalMinutes = focusMinutes + sportMinutes;
    const first = Math.round(focusMinutes * 0.58);
    return {
      date,
      totalMinutes,
      focusMinutes,
      sportMinutes,
      goalMinutes: 235,
      status: focusMinutes >= 235 ? "met" : "under",
      logs: focusMinutes
        ? [
            {
              id: index * 2 + 1,
              activityId: 1,
              activityName: "Writing",
              activityColor: "#df554f",
              activityType: "practice",
              durationMinutes: first,
              notes:
                index === 5
                  ? "The chapter finally found its center."
                  : "Focused continuation",
              logDate: date,
            },
            {
              id: index * 2 + 2,
              activityId: 2,
              activityName: "Research",
              activityColor: "#6f8fbf",
              activityType: "practice",
              durationMinutes: focusMinutes - first,
              notes: null,
              logDate: date,
            },
            ...(sportMinutes
              ? [
                  {
                    id: index * 2 + 100,
                    activityId: 3,
                    activityName: "Strength",
                    activityColor: "#3f9d96",
                    activityType: "sport" as const,
                    durationMinutes: sportMinutes,
                    notes: null,
                    logDate: date,
                  },
                ]
              : []),
          ]
        : [],
    };
  });
}

function TodaySessionsList({
  logs,
  activities,
  light,
}: {
  logs: ActivityLog[];
  activities: Activity[];
  light: boolean;
}) {
  return (
    <section
      className={`w-full rounded-2xl border p-4 ${light ? "border-black/[.08] bg-black/[.025]" : "border-white/[.08] bg-black/10"}`}
      aria-labelledby="today-sessions-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <p
          id="today-sessions-heading"
          className={`text-[9px] font-bold uppercase tracking-[.2em] ${light ? "text-black/45" : "text-white/40"}`}
        >
          Today’s sessions
        </p>
        <span
          className={`text-[10px] font-semibold tabular-nums ${light ? "text-black/45" : "text-white/40"}`}
        >
          {logs.length}
        </span>
      </div>
      {logs.length ? (
        <div
          className="mt-3 max-h-44 space-y-1.5 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,.2)_transparent] [scrollbar-width:thin]"
          role="list"
        >
          {logs.map((log) => {
            const activity = activities.find(
              (candidate) => candidate.id === log.activityId,
            );
            const isSport = activity?.activityType === "sport";
            const accent = isSport
              ? "#62bca8"
              : (activity?.color ?? "#ff7868");
            return (
              <div
                key={log.id}
                className={`rounded-xl px-2.5 py-2 ${light ? "bg-white/65" : "bg-white/[.025]"}`}
                role="listitem"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      color: accent,
                      backgroundColor: `${accent}18`,
                    }}
                  >
                    <ActivityGlyph
                      icon={activity?.icon}
                      activityType={activity?.activityType}
                      category={activity?.category}
                      className="h-3.5 w-3.5"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-xs font-semibold ${light ? "text-black/70" : "text-white/75"}`}
                    >
                      {activity?.name ?? "Activity"}
                    </span>
                    {log.notes && (
                      <span
                        className={`mt-0.5 block truncate text-[10px] italic ${light ? "text-black/35" : "text-white/30"}`}
                      >
                        {log.notes}
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 text-[10px] font-semibold tabular-nums ${isSport ? "text-[#62bca8]" : light ? "text-black/45" : "text-white/45"}`}
                  >
                    {minutesLabel(log.durationMinutes)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p
          className={`mt-3 text-xs leading-5 ${light ? "text-black/35" : "text-white/30"}`}
        >
          No sessions marked yet.
        </p>
      )}
    </section>
  );
}

function Timeline({
  days,
  activities,
  todayLogs,
  light,
  preview = false,
  pulseDate,
}: {
  days: CalendarDay[];
  activities: Activity[];
  todayLogs: ActivityLog[];
  light: boolean;
  preview?: boolean;
  pulseDate?: string;
}) {
  const [, navigate] = useLocation();
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState(days.at(-1)?.date ?? "");
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const selected = days.find((day) => day.date === selectedDate) ?? days.at(-1);
  const max = Math.max(60, ...days.map((day) => day.focusMinutes));
  const maxSport = Math.max(30, ...days.map((day) => day.sportMinutes));
  const palette = light ? MOMENTUM_PALETTES.light : MOMENTUM_PALETTES.dark;
  const momentum = momentumSeries(days);
  const points = momentum
    .map((value, index) => `${50 + index * 100},${210 - value * 164}`)
    .join(" ");
  const selectedIndex = Math.max(
    0,
    days.findIndex((day) => day.date === selected?.date),
  );
  const selectedPoint = {
    x: 50 + selectedIndex * 100,
    y: 210 - (momentum[selectedIndex] ?? 0) * 164,
  };
  const trailStartIndex = Math.max(0, selectedIndex - 1);
  const trailPoints = [trailStartIndex, selectedIndex]
    .map((index) => `${50 + index * 100},${210 - (momentum[index] ?? 0) * 164}`)
    .join(" ");
  const weekTotal = days.reduce((sum, day) => sum + day.focusMinutes, 0);
  const sportWeekTotal = days.reduce((sum, day) => sum + day.sportMinutes, 0);
  const activeDays = days.filter((day) => day.focusMinutes > 0).length;
  const bestDay = Math.max(0, ...days.map((day) => day.focusMinutes));

  useEffect(() => {
    if (window.innerWidth >= 768 || !timelineScrollRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      if (timelineScrollRef.current)
        timelineScrollRef.current.scrollLeft =
          timelineScrollRef.current.scrollWidth;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const selectDay = (day: CalendarDay) => {
    const touchLayout =
      window.innerWidth < 768 || window.matchMedia("(hover: none)").matches;
    if (touchLayout) setSelectedDate(day.date);
    else navigate(`/history?date=${day.date}&from=dashboard`);
  };

  return (
    <section
      className={`signal-surface overflow-hidden rounded-[2rem] border ${light ? "border-black/[.08] bg-white/80" : "border-white/[.08] bg-[#0c1119]/92"}`}
      onMouseLeave={() => setFocusedDate(null)}
    >
      <div className="grid lg:grid-cols-[1.5fr_.5fr]">
        <div className="min-w-0 p-6 md:p-9">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p
                className={`text-[9px] font-bold uppercase tracking-[.28em] ${light ? "text-[#91463f]" : "text-[#ff8b7c]"}`}
              >
                Energy invested
              </p>
              <h2
                className={`mt-2 text-2xl font-semibold md:text-3xl ${light ? "text-[#181719]" : "text-white"}`}
              >
                Minutes invested
              </h2>
              <p
                className={`mt-2 max-w-xl text-xs ${light ? "text-black/40" : "text-white/35"}`}
              >
                Bars show practice and work. A thin vertical sport mark sits
                beneath each day; the line follows practice continuity.
              </p>
              <p className="sr-only">
                Weekly summary: {activeDays} active{" "}
                {activeDays === 1 ? "day" : "days"} of 7,{" "}
                {minutesLabel(weekTotal)} total time logged, and{" "}
                {minutesLabel(bestDay)} on the most active day. Sport is tracked
                separately at {minutesLabel(sportWeekTotal)}.
              </p>
            </div>
            <div
              className={`hidden items-end gap-5 text-right sm:flex ${light ? "text-black/45" : "text-white/35"}`}
            >
              <div>
                <p
                  className={`text-lg font-semibold ${light ? "text-black/75" : "text-white/80"}`}
                >
                  {minutesLabel(weekTotal)}
                </p>
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  this week
                </span>
              </div>
              <div>
                <p
                  className={`text-lg font-semibold ${light ? "text-black/75" : "text-white/80"}`}
                >
                  {activeDays}/7
                </p>
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  active days
                </span>
              </div>
              <div>
                <p
                  className={`text-lg font-semibold ${light ? "text-black/75" : "text-white/80"}`}
                >
                  {minutesLabel(bestDay)}
                </p>
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  best day
                </span>
              </div>
            </div>
          </div>
          <div
            ref={timelineScrollRef}
            className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="relative h-72 min-w-[560px]">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[232px] w-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 700 232"
              >
                <defs>
                  <linearGradient
                    id={`momentum-line-${light ? "light" : "dark"}`}
                    x1="0"
                    x2="1"
                  >
                    <stop offset="0" stopColor={palette[1]} />
                    <stop offset="0.55" stopColor={palette[3]} />
                    <stop offset="1" stopColor={palette[4]} />
                  </linearGradient>
                  <filter
                    id={`momentum-glow-${light ? "light" : "dark"}`}
                    x="-20%"
                    y="-40%"
                    width="140%"
                    height="180%"
                  >
                    <feGaussianBlur stdDeviation={light ? 5 : 8} />
                  </filter>
                </defs>
                <polyline
                  fill="none"
                  filter={`url(#momentum-glow-${light ? "light" : "dark"})`}
                  opacity={light ? 0.16 : 0.34}
                  points={points}
                  stroke={palette[4]}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="12"
                  vectorEffect="non-scaling-stroke"
                />
                <polyline
                  className="momentum-line"
                  fill="none"
                  pathLength="1"
                  points={points}
                  stroke={`url(#momentum-line-${light ? "light" : "dark"})`}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <polyline
                  className="momentum-trail"
                  fill="none"
                  points={trailPoints}
                  stroke={palette[4]}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  vectorEffect="non-scaling-stroke"
                />
                {momentum.map((value, index) => (
                  <circle
                    key={days[index]?.date}
                    cx={50 + index * 100}
                    cy={210 - value * 164}
                    fill={
                      palette[
                        Math.max(
                          1,
                          intensityIndex(days[index]?.focusMinutes ?? 0),
                        )
                      ]
                    }
                    opacity={
                      focusedDate && focusedDate !== days[index]?.date
                        ? 0.18
                        : 1
                    }
                    r={index === momentum.length - 1 ? 4.5 : 2.6}
                    style={{ transition: "opacity 180ms ease" }}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <circle
                  className="momentum-node"
                  cx={50 + (momentum.length - 1) * 100}
                  cy={210 - (momentum.at(-1) ?? 0) * 164}
                  fill="none"
                  opacity={light ? 0.45 : 0.8}
                  r="10"
                  stroke={palette[4]}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={selectedPoint.x}
                  cy={selectedPoint.y}
                  fill="none"
                  r="7"
                  stroke={light ? "oklch(0.32 0.03 20)" : "white"}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div
                className="relative z-10 grid h-full grid-cols-7 gap-4 md:gap-6"
                data-focus-scope
              >
                {days.map((day) => {
                  const exceptional = day.focusMinutes > 240;
                  const selectedDay = selected?.date === day.date;
                  const color = palette[intensityIndex(day.focusMinutes)];
                  return (
                    <button
                      key={day.date}
                      type="button"
                      aria-label={`${format(new Date(`${day.date}T00:00:00`), "EEEE")}: ${day.focusMinutes} practice minutes and ${day.sportMinutes} sport minutes. Open day history.`}
                      onMouseEnter={() => {
                        setSelectedDate(day.date);
                        setFocusedDate(day.date);
                      }}
                      onFocus={() => {
                        setSelectedDate(day.date);
                        setFocusedDate(day.date);
                      }}
                      onBlur={() => setFocusedDate(null)}
                      onClick={() => selectDay(day)}
                      className={`group flex h-full min-w-0 flex-col justify-end gap-3 outline-none ${pulseDate === day.date ? "session-pulse" : ""}`}
                      data-focus-item
                    >
                      <span className="relative flex w-full flex-1 items-end">
                        {selectedDay && (
                          <span
                            className={`absolute inset-x-0 z-30 text-center text-[10px] font-semibold tabular-nums ${light ? "text-black/65" : "text-white/75"}`}
                            style={{
                              bottom: `calc(${Math.max(day.focusMinutes ? 8 : 2, (day.focusMinutes / max) * 100)}% + 12px)`,
                            }}
                          >
                            {minutesLabel(day.focusMinutes)}
                          </span>
                        )}
                        <span
                          className={`signal-bar relative block w-full rounded-t-[.65rem] border border-white/10 group-hover:brightness-110 group-focus-visible:ring-2 ${exceptional ? "exceptional-bloom" : ""}`}
                          style={{
                            height: `${Math.max(day.focusMinutes ? 8 : 2, (day.focusMinutes / max) * 100)}%`,
                            background: `linear-gradient(180deg, color-mix(in oklab, ${color} 94%, white 6%), ${color})`,
                            boxShadow: exceptional
                              ? `0 0 34px color-mix(in oklab, ${color} 38%, transparent), 0 14px 42px color-mix(in oklab, ${color} 24%, transparent)`
                              : "none",
                          }}
                        >
                          {exceptional && (
                            <span className="absolute inset-x-1 bottom-0 h-2/3 bg-gradient-to-t from-white/16 to-transparent" />
                          )}
                        </span>
                      </span>
                      <span
                        className="flex h-9 w-full items-end justify-center"
                        aria-hidden="true"
                      >
                        <span
                          className="block w-1 rounded-full bg-[#62bca8] shadow-[0_0_8px_rgba(98,188,168,.42)] transition-[height]"
                          style={{
                            height: `${day.sportMinutes ? Math.max(12, (day.sportMinutes / maxSport) * 100) : 0}%`,
                          }}
                        />
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-[.14em] ${selectedDay ? (light ? "text-black/75" : "text-white/80") : light ? "text-black/45" : "text-white/40"}`}
                      >
                        {format(new Date(`${day.date}T00:00:00`), "EEE")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div
            className={`mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[.12em] ${light ? "text-black/45" : "text-white/40"}`}
          >
            <span>Minutes logged</span>
            <span>Low</span>
            {palette.slice(0, 4).map((color) => (
              <span
                key={color}
                className="h-2.5 w-6 rounded-full border border-white/10"
                style={{ background: color }}
              />
            ))}
            <span>High</span>
            <span
              className={`mx-1 h-px w-10 ${light ? "bg-[#9d3d36]" : "bg-[#f6b36a]"} shadow-[0_0_8px_currentColor]`}
            />
            <span>Continuity signal</span>
            <span className="mx-1 h-5 w-1 rounded-full bg-[#62bca8]" />
            <span>Sport</span>
          </div>
          <details
            className={`mt-5 rounded-xl border px-3 py-2 text-xs ${light ? "border-black/10 bg-black/[.025] text-black/60" : "border-white/10 bg-white/[.02] text-white/55"}`}
          >
            <summary className="cursor-pointer font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">
              View weekly data table
            </summary>
            <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-current/10">
              <table className="w-full min-w-72 text-left text-xs">
                <caption className="sr-only">
                  Minutes logged for each day this week
                </caption>
                <thead
                  className={`sticky top-0 text-[10px] uppercase tracking-wider ${light ? "bg-[#edf0f3] text-black/45" : "bg-[#17171d] text-white/45"}`}
                >
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Day
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-semibold"
                    >
                      Practice
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-semibold"
                    >
                      Sport
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day.date} className="border-t border-current/10">
                      <th scope="row" className="px-3 py-2 font-medium">
                        {format(
                          new Date(`${day.date}T00:00:00`),
                          "EEEE, MMM d",
                        )}
                      </th>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {minutesLabel(day.focusMinutes)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[#62bca8]">
                        {minutesLabel(day.sportMinutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>

        <aside
          className={`relative flex min-h-[32rem] flex-col border-t p-5 lg:min-h-[35rem] lg:border-l lg:border-t-0 md:p-6 ${light ? "border-black/[.08] bg-[#edf0f3]/60" : "border-white/[.08] bg-[#090d14]/55"}`}
        >
          <TodaySessionsList
            logs={todayLogs}
            activities={activities}
            light={light}
          />
          <div className="mt-auto w-full pt-6">
            <TodayPlan
              activities={activities}
              light={light}
              preview={preview}
              compact
              minimal
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

function ActivityPickerDialog({
  activities,
  open,
  onOpenChange,
  onSelect,
  title = "Log a session",
  description = "Choose any direction you worked on. You can add the duration and notes next.",
  ariaLabel = "Activities available for logging",
  frequentActivityIds = [],
  sessionCountByActivity = new Map<number, number>(),
}: {
  activities: Activity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (activity: Activity) => void;
  title?: string;
  description?: string;
  ariaLabel?: string;
  frequentActivityIds?: number[];
  sessionCountByActivity?: Map<number, number>;
}) {
  const frequent = frequentActivityIds.flatMap((id) => {
    const activity = activities.find((candidate) => candidate.id === id);
    return activity ? [activity] : [];
  });
  const frequentIds = new Set(frequent.map((activity) => activity.id));
  const other = activities.filter((activity) => !frequentIds.has(activity.id));
  const renderActivity = (activity: Activity) => (
    <button
      key={activity.id}
      type="button"
      onClick={() => {
        onSelect(activity);
        onOpenChange(false);
      }}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] px-4 py-4 text-left transition-colors hover:border-[#ff7868]/45 hover:bg-[#ff7868]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7868]"
      role="listitem"
      data-testid={`button-pick-activity-${activity.id}`}
    >
      <span className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            color: activity.color || "#e95448",
            backgroundColor: `${activity.color || "#e95448"}18`,
          }}
        >
          <ActivityGlyph
            icon={activity.icon}
            activityType={activity.activityType}
            category={activity.category}
            className="h-4 w-4"
          />
        </span>
        <span>
          <span className="block font-semibold">{activity.name}</span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
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
          </span>
        </span>
      </span>
      <span className="text-xs text-white/35">
        {sessionCountByActivity.has(activity.id)
          ? `${sessionCountByActivity.get(activity.id)} sessions`
          : "Not started"}
      </span>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] border-white/10 bg-[#0c1119] p-6 text-white shadow-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-white/45">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-5">
          {frequent.length > 0 && (
            <section aria-labelledby="frequent-directions-heading">
              <p
                id="frequent-directions-heading"
                className="mb-2 text-[9px] font-bold uppercase tracking-[.2em] text-[#ff9a89]"
              >
                Your frequent directions
              </p>
              <div
                className="grid gap-2"
                role="list"
                aria-label="Your frequent directions"
              >
                {frequent.map(renderActivity)}
              </div>
            </section>
          )}
          {other.length > 0 && (
            <section aria-labelledby="other-directions-heading">
              <p
                id="other-directions-heading"
                className="mb-2 text-[9px] font-bold uppercase tracking-[.2em] text-white/30"
              >
                {frequent.length ? "Other directions" : "Directions"}
              </p>
              <div
                className="grid gap-2"
                role="list"
                aria-label={frequent.length ? "Other directions" : ariaLabel}
              >
                {other.map(renderActivity)}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardV2() {
  const preview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("preview");
  const light =
    new URLSearchParams(window.location.search).get("theme") === "light";
  const weekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    [],
  );
  const start = format(weekStart, "yyyy-MM-dd");
  const end = format(addDays(weekStart, 6), "yyyy-MM-dd");
  const dashboardQuery = useGetDashboard();
  const activitiesQuery = useListActivities();
  const streaksQuery = useListStreaks();
  const calendarQuery = useGetCalendar(
    { start, end },
    { query: { queryKey: getGetCalendarQueryKey({ start, end }) } },
  );
  const dashboard = preview ? previewDashboard : dashboardQuery.data;
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
  const calendarData = preview
    ? previewCalendar()
    : Array.isArray(calendarQuery.data)
      ? calendarQuery.data
      : [];
  const calendarMap = new Map(calendarData.map((day) => [day.date, day]));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = format(addDays(weekStart, index), "yyyy-MM-dd");
    return (
      calendarMap.get(date) ?? {
        date,
        totalMinutes: 0,
        focusMinutes: 0,
        sportMinutes: 0,
        goalMinutes: 0,
        status: "under" as const,
        logs: [],
      }
    );
  });
  const momentum = momentumSeries(days);
  const momentumStrength = momentum.at(-1) ?? 0;
  const exceptionalWeek = days.some((day) => day.focusMinutes > 240);
  const atmosphere =
    exceptionalWeek && momentumStrength > 0.62
      ? "exceptional"
      : momentumStrength < 0.22
        ? "quiet"
        : momentumStrength > (momentum.at(-2) ?? 0) + 0.08
          ? "building"
          : "holding";
  const practiceActivities = activities.filter(
    (activity) => activity.activityType !== "sport",
  );
  const automaticFocus =
    practiceActivities.find(
      (activity) =>
        activity.id ===
        dashboard?.todayLogs.find((log) =>
          practiceActivities.some(
            (candidate) => candidate.id === log.activityId,
          ),
        )?.activityId,
    ) ??
    [...practiceActivities].sort(
      (a, b) =>
        (streaks.find((s) => s.activityId === b.id)?.currentStreak ?? 0) -
        (streaks.find((s) => s.activityId === a.id)?.currentStreak ?? 0),
    )[0];
  const focus = automaticFocus;
  const focusLogsQuery = useListActivityLogs(focus?.id ?? 0, {
    query: {
      enabled: !preview && Boolean(focus?.id),
      queryKey: getListActivityLogsQueryKey(focus?.id ?? 0),
    },
  });
  const focusLogs = Array.isArray(focusLogsQuery.data)
    ? focusLogsQuery.data
    : [];
  const newestFocusLogs = [...focusLogs].sort((a, b) =>
    b.logDate.localeCompare(a.logDate),
  );
  const mostRecentFocusLog = newestFocusLogs[0];
  const latestContinuationLog = newestFocusLogs.find((log) =>
    Boolean(log.nextContinuation),
  );
  const continuation =
    latestContinuationLog?.nextContinuation ?? focus?.currentThread ?? null;
  const continuationSource = latestContinuationLog
    ? `From your reflection on ${format(new Date(`${latestContinuationLog.logDate}T00:00:00`), "MMM d")}`
    : focus?.currentThread
      ? "From this direction’s current thread"
      : null;
  const focusStreak = streaks.find((streak) => streak.activityId === focus?.id);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [activityPickerOpen, setActivityPickerOpen] = useState(false);
  const [recentLog, setRecentLog] = useState<{
    date: string;
    duration: number;
    nonce: number;
  } | null>(null);
  const frequentActivityIds = preview
    ? activities.slice(0, 3).map((activity) => activity.id)
    : (dashboard?.frequentActivities
        .slice(0, 4)
        .map((entry) => entry.activityId) ?? []);
  const sessionCountByActivity = new Map(
    dashboard?.frequentActivities.map((entry) => [
      entry.activityId,
      entry.sessionCount,
    ]) ?? [],
  );
  const loading =
    !preview &&
    (dashboardQuery.isLoading ||
      activitiesQuery.isLoading ||
      calendarQuery.isLoading);
  const hasRefreshError =
    !preview &&
    (dashboardQuery.isError ||
      activitiesQuery.isError ||
      calendarQuery.isError);
  const retry = () =>
    Promise.all([
      dashboardQuery.refetch(),
      activitiesQuery.refetch(),
      streaksQuery.refetch(),
      calendarQuery.refetch(),
    ]);

  useEffect(() => {
    if (!recentLog) return;
    const timeout = window.setTimeout(() => setRecentLog(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [recentLog]);

  if (loading)
    return (
      <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
        <Skeleton className="h-72 rounded-[2rem] bg-white/5" />
        <Skeleton className="h-[520px] rounded-[2rem] bg-white/5" />
      </div>
    );
  if (!dashboard)
    return (
      <div className="mx-auto max-w-xl p-12 text-center text-white/50">
        <Radio className="mx-auto mb-4 h-9 w-9 text-[#ff8b7c]" />
        <h1 className="text-2xl text-white">Signal interrupted</h1>
        <p className="mt-3 text-sm">
          Your work is still safe. Check the connection and retry the current
          state.
        </p>
        <Button
          onClick={() => void retry()}
          className="mt-6 rounded-full bg-[#e95448]"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  if (!activities.length)
    return (
      <div className="mx-auto max-w-xl p-12 text-center">
        <Target className="mx-auto mb-4 text-white/20" />
        <h1 className="text-3xl text-white">Choose your first direction</h1>
        <p className="mt-3 text-white/35">
          Mastery begins when the first line is drawn.
        </p>
        <Link href="/activities">
          <Button className="mt-7 bg-[#e95448]">
            <Plus className="mr-2 h-4 w-4" />
            Add activity
          </Button>
        </Link>
      </div>
    );

  return (
    <div
      className={`signal-atmosphere page-arrival relative z-10 min-h-screen ${light ? "is-light bg-[#f2f4f7] text-[#15181e]" : "bg-[#090d14]"}`}
      data-atmosphere={atmosphere}
      style={
        {
          "--atmosphere-opacity":
            0.035 + momentumStrength * (light ? 0.055 : 0.1),
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-6 pb-28 md:px-9 md:py-9">
        {hasRefreshError && (
          <div
            className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-sm ${light ? "border-amber-900/20 bg-amber-100/60 text-amber-950" : "border-amber-500/20 bg-amber-500/10 text-amber-100"}`}
          >
            <span>
              Showing the last available state. New activity could not be
              refreshed.
            </span>
            <button
              onClick={() => void retry()}
              className="shrink-0 text-[10px] font-bold uppercase tracking-widest underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}
        <header
          className={`signal-surface relative overflow-hidden rounded-[2rem] border px-6 py-9 md:px-10 md:py-12 ${light ? "border-black/[.08] bg-white/84" : "border-white/[.08] bg-[#0c1119]/94"}`}
        >
          <div
            className={`momentum-field absolute right-[-8%] top-[-55%] h-96 w-96 rounded-full blur-3xl ${light ? "bg-[#ff7b69]" : "bg-[#ff6f61]"}`}
            style={{
              opacity: 0.035 + momentumStrength * (light ? 0.08 : 0.13),
              transform: `scale(${0.86 + momentumStrength * 0.28})`,
            }}
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_.58fr]">
            <div>
              <div
                className={`mb-6 flex items-center gap-3 pr-28 text-[10px] font-bold uppercase tracking-[.26em] ${light ? "text-[#91463f]" : "text-[#ff9a89]"}`}
              >
                <Radio className="h-3.5 w-3.5" /> {momentumStatus(momentum)}
              </div>
              <p
                className={`mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.2em] ${light ? "text-black/40" : "text-white/35"}`}
              >
                <Target className="h-3 w-3" /> Current line in view
              </p>
              <h1
                className={`max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.045em] md:text-7xl ${light ? "text-[#181719]" : "text-white"}`}
              >
                {focus?.name}.<br />
                <span className={light ? "text-black/30" : "text-white/25"}>
                  Continue the line.
                </span>
              </h1>
              <p
                className={`mt-6 max-w-xl text-sm leading-7 ${light ? "text-black/45" : "text-white/40"}`}
              >
                Today holds {minutesLabel(dashboard.totalMinutesToday)} of
                deliberate effort. You touched{" "}
                {dashboard.activitiesTodayCompleted}{" "}
                {dashboard.activitiesTodayCompleted === 1
                  ? "direction"
                  : "directions"}
                ; nothing else is owed.
              </p>
              {dashboard.sportMinutesToday > 0 && (
                <p
                  className={`mt-2 text-[9px] font-bold uppercase tracking-[.18em] ${light ? "text-[#287362]" : "text-[#83d1bf]"}`}
                >
                  Sport moves beside it ·{" "}
                  {minutesLabel(dashboard.sportMinutesToday)}
                </p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setActivityPickerOpen(true)}
                  className="signal-button rounded-full bg-[#e95448] px-7 py-6 text-[10px] font-bold uppercase tracking-[.16em] text-white shadow-[0_12px_36px_rgba(233,84,72,.18)] hover:bg-[#f26456]"
                  data-testid="button-continue"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Continue
                </Button>
                <p
                  className={`max-w-sm text-xs leading-6 ${light ? "text-black/40" : "text-white/35"}`}
                >
                  Choose from the directions you return to most often, then
                  enter the session with fresh intent.
                </p>
              </div>
            </div>
            <div className="grid w-full gap-6 lg:justify-items-end">
              <div className="flex items-center justify-center gap-7 lg:justify-end">
                <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-[#ff7868]/18 md:h-52 md:w-52">
                  <span className="absolute inset-3 rounded-full border border-white/5" />
                  <div className="text-center">
                    <Flame
                      className={`mx-auto mb-2 h-5 w-5 ${light ? "text-[#9c4d44]" : "text-[#ff8b7c]"}`}
                    />
                    <p
                      className={`text-6xl font-light ${light ? "text-[#181719]" : "text-white"}`}
                    >
                      {dashboard.overallCurrentStreak}
                    </p>
                    <span
                      className={`text-[8px] font-bold uppercase tracking-[.2em] ${light ? "text-black/35" : "text-white/25"}`}
                    >
                      days moving
                    </span>
                  </div>
                </div>
                <div className="hidden space-y-5 sm:block">
                  <div>
                    <p
                      className={`text-2xl font-light ${light ? "text-[#181719]" : "text-white"}`}
                    >
                      {focusStreak?.currentStreak ?? 0}
                    </p>
                    <span
                      className={`text-[8px] uppercase tracking-widest ${light ? "text-black/30" : "text-white/25"}`}
                    >
                      {focus?.name} streak
                    </span>
                  </div>
                  <div>
                    <p
                      className={`text-2xl font-light ${light ? "text-[#181719]" : "text-white"}`}
                    >
                      {dashboard.totalAchievements}
                    </p>
                    <span
                      className={`text-[8px] uppercase tracking-widest ${light ? "text-black/30" : "text-white/25"}`}
                    >
                      rewards earned
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </header>

        {recentLog && (
          <div className="session-feedback" role="status">
            <span className="session-feedback-pulse" />
            Momentum received{" "}
            <strong>{minutesLabel(recentLog.duration)}</strong>
          </div>
        )}

        <Timeline
          days={days}
          activities={activities}
          todayLogs={dashboard.todayLogs}
          light={light}
          preview={preview}
          pulseDate={recentLog?.date}
        />

        {focus && (
          <section
            className={`signal-surface relative overflow-hidden rounded-[2rem] border p-6 md:p-8 ${light ? "border-black/[.08] bg-white/80" : "border-white/[.08] bg-[#0c1119]/92"}`}
            aria-labelledby="continuation-heading"
          >
            <div
              className="absolute -right-14 -top-20 h-48 w-48 rounded-full blur-3xl"
              style={{
                backgroundColor: focus.color || "#e95448",
                opacity: light ? 0.08 : 0.12,
              }}
            />
            <div className="relative grid gap-7 lg:grid-cols-[1.45fr_.55fr] lg:items-end">
              <div>
                <div
                  className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] ${light ? "text-[#91463f]" : "text-[#ff9a89]"}`}
                >
                  <Target className="h-3.5 w-3.5" /> Next meaningful move
                </div>
                <h2
                  id="continuation-heading"
                  className={`mt-3 text-2xl font-semibold ${light ? "text-[#181719]" : "text-white"}`}
                >
                  Keep the line open.
                </h2>
                {continuation ? (
                  <>
                    <p
                      className={`mt-4 max-w-3xl text-base leading-relaxed ${light ? "text-black/70" : "text-white/75"}`}
                    >
                      “{continuation}”
                    </p>
                    {continuationSource && (
                      <p
                        className={`mt-3 text-[10px] font-bold uppercase tracking-[.14em] ${light ? "text-black/40" : "text-white/35"}`}
                      >
                        {continuationSource}
                      </p>
                    )}
                  </>
                ) : (
                  <p
                    className={`mt-4 max-w-3xl text-sm leading-relaxed ${light ? "text-black/55" : "text-white/50"}`}
                  >
                    No next step is saved yet. After your next session, use the
                    optional reflection to name the smallest useful
                    continuation.
                  </p>
                )}
                {mostRecentFocusLog?.whatMoved && (
                  <p
                    className={`mt-5 border-l pl-3 text-sm italic ${light ? "border-black/15 text-black/45" : "border-white/15 text-white/35"}`}
                  >
                    Last evidence: “{mostRecentFocusLog.whatMoved}”
                  </p>
                )}
              </div>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col">
                <details
                  className={`flex-1 rounded-2xl border px-4 py-3 text-xs ${light ? "border-black/10 bg-black/[.025] text-black/55" : "border-white/10 bg-white/[.02] text-white/50"}`}
                >
                  <summary className="cursor-pointer font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">
                    Why this is here
                  </summary>
                  <p className="mt-2 leading-relaxed">
                    A visible next step connects your plan, your session, and
                    your reflection without turning the Dashboard into a
                    scorecard.
                  </p>
                </details>
              </div>
            </div>
          </section>
        )}

        <Link
          href="/history?from=dashboard"
          className={`group flex items-center justify-between rounded-2xl border px-5 py-4 text-[10px] font-bold uppercase tracking-[.16em] ${light ? "border-black/10 bg-black/[.025] text-black/45 hover:bg-black/[.05]" : "border-white/[.08] bg-white/[.025] text-white/40 hover:bg-white/[.05]"}`}
        >
          <span>Open History for composition and long-term patterns</span>
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </Link>
      </div>
      <ActivityPickerDialog
        activities={activities}
        open={activityPickerOpen}
        onOpenChange={setActivityPickerOpen}
        onSelect={setSelectedActivity}
        title="Where do you want to continue?"
        description="Your most frequently visited directions come first. Choose one; nothing is preselected for you."
        ariaLabel="Frequent and other activities available to continue"
        frequentActivityIds={frequentActivityIds}
        sessionCountByActivity={sessionCountByActivity}
      />
      {selectedActivity && (
        <LogActivityDialog
          activity={selectedActivity}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedActivity(null);
          }}
          onLogged={({ date, duration }) =>
            setRecentLog({ date, duration, nonce: Date.now() })
          }
          startingContext={
            selectedActivity.id === focus?.id
              ? (continuation ?? undefined)
              : undefined
          }
          startingContextSource={
            selectedActivity.id === focus?.id && continuation
              ? (continuationSource ?? "Dashboard · saved continuation")
              : undefined
          }
          priorEvidence={
            selectedActivity.id === focus?.id ? focusLogs : undefined
          }
        />
      )}
    </div>
  );
}
