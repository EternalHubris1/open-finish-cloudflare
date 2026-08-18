import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useGetDashboard,
  useGetWeeklyProgress,
  useListActivities,
  useListStreaks,
  type Activity,
  type DashboardSummary,
  type Streak,
  type WeeklyProgress,
} from "@workspace/api-client-react";
import {
  Award,
  BarChart3,
  BookOpen,
  ChevronRight,
  Clock3,
  Flame,
  Plus,
  Radio,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogActivityDialog } from "@/components/log-activity-dialog";

export type DashboardConcept = "a" | "b" | "c" | "d" | "e";

const CONCEPTS: Array<[DashboardConcept, string]> = [
  ["a", "Editorial"],
  ["b", "Command Center"],
  ["c", "Analytics First"],
  ["d", "Minimal Focus"],
  ["e", "Mission Control"],
];

export const previewActivities: Activity[] = [
  {
    id: 1,
    name: "Writing",
    category: "Craft",
    color: "#df554f",
    targetMinutesPerDay: 90,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Research",
    category: "Study",
    color: "#6f8fbf",
    targetMinutesPerDay: 60,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Japanese",
    category: "Language",
    color: "#b27bba",
    targetMinutesPerDay: 45,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Strength",
    category: "Body",
    color: "#9a8157",
    targetMinutesPerDay: 40,
    createdAt: new Date().toISOString(),
  },
];

export const previewProgress: WeeklyProgress[] = previewActivities.map(
  (activity, activityIndex) => ({
    activityId: activity.id,
    activityName: activity.name,
    color: activity.color,
    targetMinutesPerDay: activity.targetMinutesPerDay,
    days: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      date: `2026-08-${String(7 + day).padStart(2, "0")}`,
      minutesLogged:
        [35, 80, 20, 110, 55, 95, 65][day] * (1 - activityIndex * 0.16),
      completed: day % (activityIndex + 2) === 0,
    })),
  }),
);

export const previewStreaks: Streak[] = previewActivities.map(
  (activity, index) => ({
    activityId: activity.id,
    activityName: activity.name,
    currentStreak: [12, 5, 3, 2][index],
    longestStreak: [21, 9, 7, 5][index],
    lastLoggedDate: "2026-08-13",
  }),
);

export const previewDashboard: DashboardSummary = {
  totalActivities: 4,
  totalMinutesToday: 214,
  activitiesTodayCompleted: 3,
  activitiesTodayTotal: 4,
  overallCurrentStreak: 12,
  totalAchievements: 9,
  recentAchievements: [
    {
      id: 1,
      type: "hours_50",
      title: "Serious Practice",
      description: "50 focused hours accumulated.",
      icon: "gem",
      activityId: null,
      activityName: null,
      unlockedAt: new Date().toISOString(),
    },
  ],
  todayLogs: [
    {
      id: 1,
      activityId: 1,
      durationMinutes: 92,
      notes: "Chapter structure",
      logDate: "2026-08-13",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      activityId: 2,
      durationMinutes: 74,
      notes: "Primary sources",
      logDate: "2026-08-13",
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      activityId: 3,
      durationMinutes: 48,
      notes: "Listening practice",
      logDate: "2026-08-13",
      createdAt: new Date().toISOString(),
    },
  ],
  frequentActivities: previewActivities.map((activity, index) => ({
    activityId: activity.id,
    sessionCount: 12 - index * 2,
    totalMinutes: 820 - index * 110,
    lastLoggedDate: "2026-08-13",
  })),
};

function minutesLabel(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return hours ? `${hours}h ${minutes ? `${minutes}m` : ""}` : `${minutes}m`;
}

function ConceptNav({ active }: { active: DashboardConcept }) {
  return (
    <nav className="mb-6 flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-1.5">
      {CONCEPTS.map(([id, name]) => (
        <Link
          key={id}
          href={`/explore/dashboard-${id}?preview=1`}
          className={`shrink-0 rounded-xl px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] ${active === id ? "bg-red-700 text-white" : "text-white/35 hover:text-white"}`}
        >
          {id.toUpperCase()} · {name}
        </Link>
      ))}
    </nav>
  );
}

function WeekTimeline({
  progress,
  compact = false,
}: {
  progress: WeeklyProgress[];
  compact?: boolean;
}) {
  const [hidden, setHidden] = useState<number[]>([]);
  const days = useMemo(
    () =>
      (progress[0]?.days ?? []).map((day, index) => ({
        date: day.date,
        segments: progress.map((activity) => ({
          id: activity.activityId,
          name: activity.activityName,
          color: activity.color,
          minutes: activity.days[index]?.minutesLogged ?? 0,
        })),
      })),
    [progress],
  );
  const max = Math.max(
    1,
    ...days.map((day) =>
      day.segments.reduce((sum, segment) => sum + segment.minutes, 0),
    ),
  );
  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div
          className={`flex items-end gap-3 ${compact ? "h-36" : "h-64"} min-w-[520px]`}
        >
          {days.map((day) => {
            const total = day.segments.reduce(
              (sum, segment) => sum + segment.minutes,
              0,
            );
            return (
              <Link
                key={day.date}
                href="/history"
                title={`${day.date}: ${minutesLabel(total)}`}
                className="group flex h-full flex-1 flex-col justify-end gap-1"
              >
                <div
                  className="flex w-full flex-col-reverse overflow-hidden rounded-t-md bg-white/[0.025] transition group-hover:brightness-125"
                  style={{ height: `${Math.max(3, (total / max) * 88)}%` }}
                >
                  {day.segments
                    .filter((segment) => !hidden.includes(segment.id))
                    .map((segment) => (
                      <span
                        key={segment.id}
                        style={{
                          height: `${total ? (segment.minutes / total) * 100 : 0}%`,
                          background: segment.color,
                        }}
                      />
                    ))}
                </div>
                <span className="text-center text-[9px] font-bold uppercase text-white/25">
                  {new Date(`${day.date}T00:00:00`)
                    .toLocaleDateString("en", { weekday: "short" })
                    .slice(0, 1)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {progress.map((activity) => (
          <button
            key={activity.activityId}
            onClick={() =>
              setHidden((current) =>
                current.includes(activity.activityId)
                  ? current.filter((id) => id !== activity.activityId)
                  : [...current, activity.activityId],
              )
            }
            className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider ${hidden.includes(activity.activityId) ? "text-white/20" : "text-white/55"}`}
          >
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: activity.color }}
            />
            {activity.activityName}
          </button>
        ))}
      </div>
    </div>
  );
}

type ConceptProps = {
  dashboard: DashboardSummary;
  activities: Activity[];
  streaks: Streak[];
  progress: WeeklyProgress[];
  onLog: (activity: Activity) => void;
};

function ContinueButton({
  activity,
  onLog,
}: {
  activity?: Activity;
  onLog: (activity: Activity) => void;
}) {
  if (!activity) return null;
  return (
    <Button
      onClick={() => onLog(activity)}
      className="rounded-full bg-red-700 px-6 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-red-600"
    >
      <Plus className="mr-2 h-4 w-4" />
      Continue {activity.name}
    </Button>
  );
}

function Editorial(p: ConceptProps) {
  const focus = p.activities[0];
  return (
    <div className="space-y-10">
      <header className="grid gap-8 border-y border-white/10 py-10 lg:grid-cols-[1.35fr_.65fr]">
        <div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[.35em] text-red-400">
            Field notes · August 13
          </p>
          <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-[.95] tracking-tight text-white md:text-7xl">
            The work is becoming a life.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/45">
            Today carries {minutesLabel(p.dashboard.totalMinutesToday)} of
            deliberate practice across {p.dashboard.activitiesTodayCompleted}{" "}
            directions.
          </p>
        </div>
        <div className="flex flex-col justify-between border-l border-red-500/30 pl-6">
          <div>
            <span className="text-7xl font-light text-white">
              {p.dashboard.overallCurrentStreak}
            </span>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
              days of momentum
            </p>
          </div>
          <ContinueButton activity={focus} onLog={p.onLog} />
        </div>
      </header>
      <section className="grid gap-8 lg:grid-cols-[1.5fr_.5fr]">
        <div>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-red-400">
                The week in motion
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                Seven-day composition
              </h2>
            </div>
            <Link href="/history" className="text-xs text-white/35">
              Full history →
            </Link>
          </div>
          <WeekTimeline progress={p.progress} />
        </div>
        <div className="space-y-6 border-l border-white/10 pl-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/35">
            Current directions
          </h3>
          {p.activities.map((activity) => {
            const streak = p.streaks.find((s) => s.activityId === activity.id);
            return (
              <button
                key={activity.id}
                onClick={() => p.onLog(activity)}
                className="group block w-full border-b border-white/10 pb-5 text-left"
              >
                <span className="text-xl text-white group-hover:text-red-300">
                  {activity.name}
                </span>
                <span className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-white/30">
                  <span>{activity.category}</span>
                  <span>{streak?.currentStreak ?? 0} day line</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function CommandCenter(p: ConceptProps) {
  const focus = p.activities[0];
  return (
    <div className="space-y-4 font-mono">
      <header className="flex flex-col gap-5 border border-white/10 bg-black/45 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[.35em] text-red-400">
            Open Finish / Live Operations
          </p>
          <h1 className="mt-2 text-3xl font-bold uppercase text-white">
            Personal Command
          </h1>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase text-emerald-400">
          <Radio className="h-4 w-4 animate-pulse" /> system active
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr_1fr]">
        <aside className="border border-white/10 bg-black/40 p-5">
          <p className="mb-6 text-[9px] uppercase tracking-widest text-white/30">
            Telemetry
          </p>
          {[
            ["Today", minutesLabel(p.dashboard.totalMinutesToday)],
            ["Streak", `${p.dashboard.overallCurrentStreak}D`],
            [
              "Active",
              `${p.dashboard.activitiesTodayCompleted}/${p.dashboard.totalActivities}`,
            ],
            ["Marks", String(p.dashboard.totalAchievements)],
          ].map(([label, value]) => (
            <div key={label} className="border-t border-white/10 py-4">
              <span className="text-[9px] uppercase text-white/25">
                {label}
              </span>
              <p className="mt-1 text-2xl text-white">{value}</p>
            </div>
          ))}
        </aside>
        <main className="border border-red-500/20 bg-[#0d0d10]/90 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-red-400">
                Core visualization
              </p>
              <h2 className="mt-1 text-xl uppercase text-white">
                Activity Signal
              </h2>
            </div>
            <BarChart3 className="text-red-500" />
          </div>
          <WeekTimeline progress={p.progress} />
        </main>
        <aside className="border border-white/10 bg-black/40 p-5">
          <p className="mb-5 text-[9px] uppercase tracking-widest text-white/30">
            Mission queue
          </p>
          {p.activities.map((activity, index) => (
            <button
              key={activity.id}
              onClick={() => p.onLog(activity)}
              className="mb-3 flex w-full items-center gap-3 border border-white/8 p-3 text-left hover:border-red-500/40"
            >
              <span className="text-[9px] text-white/20">0{index + 1}</span>
              <span className="flex-1 text-xs uppercase text-white/65">
                {activity.name}
              </span>
              <ChevronRight className="h-3 w-3 text-white/20" />
            </button>
          ))}
          <div className="mt-6">
            <ContinueButton activity={focus} onLog={p.onLog} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Analytics(p: ConceptProps) {
  const totals = p.progress
    .map((activity) => ({
      activity,
      total: activity.days.reduce((sum, day) => sum + day.minutesLogged, 0),
    }))
    .sort((a, b) => b.total - a.total);
  const grandTotal = totals.reduce((sum, item) => sum + item.total, 0);
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.3em] text-red-400">
            Analytics first
          </p>
          <h1 className="mt-2 text-5xl font-bold text-white">
            Momentum, quantified.
          </h1>
        </div>
        <div className="flex gap-8">
          <div>
            <p className="text-3xl font-bold text-white">
              {minutesLabel(grandTotal)}
            </p>
            <span className="text-[9px] uppercase text-white/30">
              this week
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">
              {p.dashboard.overallCurrentStreak}
            </p>
            <span className="text-[9px] uppercase text-white/30">
              day streak
            </span>
          </div>
        </div>
      </header>
      <section className="border-y border-white/10 py-8">
        <WeekTimeline progress={p.progress} />
      </section>
      <section className="grid gap-8 lg:grid-cols-[1.4fr_.6fr]">
        <div>
          <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-white/40">
            Time distribution
          </h2>
          <div className="space-y-5">
            {totals.map(({ activity, total }) => (
              <button
                key={activity.activityId}
                onClick={() =>
                  p.onLog(
                    p.activities.find(
                      (item) => item.id === activity.activityId,
                    )!,
                  )
                }
                className="block w-full text-left"
              >
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-white/70">{activity.activityName}</span>
                  <span className="text-white/35">
                    {minutesLabel(total)} ·{" "}
                    {Math.round((total / grandTotal) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-white/5">
                  <div
                    className="h-full"
                    style={{
                      width: `${(total / grandTotal) * 100}%`,
                      background: activity.color,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="border-l border-white/10 pl-7">
          <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-white/40">
            Recent signal
          </h2>
          {p.dashboard.todayLogs.map((log) => (
            <div key={log.id} className="mb-5">
              <p className="text-2xl text-white">
                {minutesLabel(log.durationMinutes)}
              </p>
              <p className="text-xs text-white/35">
                {p.activities.find((a) => a.id === log.activityId)?.name} ·{" "}
                {log.notes || "Focused session"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Minimal(p: ConceptProps) {
  const focus = p.activities[0];
  const focusStreak = p.streaks.find((s) => s.activityId === focus?.id);
  return (
    <div className="mx-auto max-w-4xl py-6 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[.4em] text-red-400">
        One direction at a time
      </p>
      <h1 className="mt-10 text-6xl font-light tracking-tight text-white md:text-8xl">
        {focus?.name ?? "Begin"}
      </h1>
      <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/35">
        Continue the thread that matters now. Everything else can wait without
        becoming failure.
      </p>
      <div className="my-12 flex items-center justify-center gap-12">
        <div>
          <p className="text-5xl font-light text-white">
            {minutesLabel(p.dashboard.totalMinutesToday)}
          </p>
          <span className="text-[9px] uppercase tracking-widest text-white/25">
            today
          </span>
        </div>
        <div className="h-12 w-px bg-white/10" />
        <div>
          <p className="text-5xl font-light text-white">
            {focusStreak?.currentStreak ?? 0}
          </p>
          <span className="text-[9px] uppercase tracking-widest text-white/25">
            focus streak
          </span>
        </div>
      </div>
      <ContinueButton activity={focus} onLog={p.onLog} />
      <div className="mx-auto mt-16 max-w-2xl border-t border-white/10 pt-8">
        <WeekTimeline progress={p.progress} compact />
      </div>
      <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
        {p.activities.slice(1).map((activity) => (
          <button
            key={activity.id}
            onClick={() => p.onLog(activity)}
            className="text-xs text-white/30 hover:text-white"
          >
            {activity.name} <span className="ml-2 text-white/15">↗</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Mission(p: ConceptProps) {
  const totalTarget = p.activities.reduce(
    (sum, activity) => sum + activity.targetMinutesPerDay,
    0,
  );
  const ratio = Math.min(
    100,
    (p.dashboard.totalMinutesToday / Math.max(1, totalTarget)) * 100,
  );
  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_75%_20%,rgba(153,27,27,.25),transparent_35%),rgba(5,5,7,.75)] p-7 md:p-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_.8fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.35em] text-red-400">
              Mission control · Day {p.dashboard.overallCurrentStreak}
            </p>
            <h1 className="mt-4 max-w-xl text-5xl font-bold leading-none text-white md:text-7xl">
              Advance the whole frontier.
            </h1>
            <p className="mt-5 max-w-lg text-sm text-white/40">
              Independent pursuits. Shared momentum. No requirement for a
              perfect day.
            </p>
          </div>
          <div
            className="relative mx-auto flex h-64 w-64 items-center justify-center rounded-full border border-white/10"
            style={{
              background: `conic-gradient(#b91c1c ${ratio}%, rgba(255,255,255,.04) 0)`,
            }}
          >
            <div className="flex h-[88%] w-[88%] flex-col items-center justify-center rounded-full bg-[#0a0a0d]">
              <span className="text-5xl font-bold text-white">
                {Math.round(ratio)}%
              </span>
              <span className="mt-2 text-[9px] uppercase tracking-widest text-white/30">
                daily energy
              </span>
            </div>
          </div>
        </div>
      </header>
      <section className="grid gap-6 lg:grid-cols-[1.5fr_.5fr]">
        <div className="rounded-[2rem] border border-white/10 bg-black/35 p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Seven-day flightpath
            </h2>
            <Link
              href="/history"
              className="text-[10px] uppercase text-red-400"
            >
              Open archive
            </Link>
          </div>
          <WeekTimeline progress={p.progress} />
        </div>
        <div className="space-y-3">
          {p.activities.map((activity) => {
            const streak = p.streaks.find(
              (item) => item.activityId === activity.id,
            );
            return (
              <button
                key={activity.id}
                onClick={() => p.onLog(activity)}
                className="flex w-full items-center gap-4 rounded-[1.5rem] border border-white/10 bg-black/35 p-5 text-left hover:border-red-500/40"
              >
                <span
                  className="h-10 w-1 rounded-full"
                  style={{ background: activity.color }}
                />
                <span className="flex-1">
                  <strong className="block text-sm text-white">
                    {activity.name}
                  </strong>
                  <small className="text-[9px] uppercase text-white/25">
                    trajectory {streak?.currentStreak ?? 0} days
                  </small>
                </span>
                <Target className="h-4 w-4 text-white/20" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function DashboardExploration({
  concept,
}: {
  concept: DashboardConcept;
}) {
  const preview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("preview");
  const dashboardQuery = useGetDashboard();
  const activitiesQuery = useListActivities();
  const streaksQuery = useListStreaks();
  const progressQuery = useGetWeeklyProgress();
  const dashboard = preview ? previewDashboard : dashboardQuery.data;
  const activities = preview ? previewActivities : (activitiesQuery.data ?? []);
  const streaks = preview ? previewStreaks : (streaksQuery.data ?? []);
  const progress = preview ? previewProgress : (progressQuery.data ?? []);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  if (!preview && (dashboardQuery.isLoading || activitiesQuery.isLoading))
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-8">
        <Skeleton className="h-20 rounded-3xl bg-white/5" />
        <Skeleton className="h-[520px] rounded-3xl bg-white/5" />
      </div>
    );
  if (!dashboard)
    return (
      <div className="p-12 text-center text-white/50">
        Command data unavailable. Your records remain safe; reconnect and retry.
      </div>
    );
  if (!activities.length)
    return (
      <div className="mx-auto max-w-xl p-12 text-center">
        <Target className="mx-auto mb-4 text-white/20" />
        <h1 className="text-3xl text-white">Choose your first direction</h1>
        <Link href="/activities">
          <Button className="mt-6 bg-red-700">Add activity</Button>
        </Link>
      </div>
    );
  const props = {
    dashboard,
    activities,
    streaks,
    progress,
    onLog: setSelectedActivity,
  };
  return (
    <div className="relative z-10 mx-auto min-h-screen max-w-[1320px] px-4 py-5 pb-28 md:px-8 md:py-7">
      <ConceptNav active={concept} />
      {concept === "a" ? (
        <Editorial {...props} />
      ) : concept === "b" ? (
        <CommandCenter {...props} />
      ) : concept === "c" ? (
        <Analytics {...props} />
      ) : concept === "d" ? (
        <Minimal {...props} />
      ) : (
        <Mission {...props} />
      )}
      {selectedActivity && (
        <LogActivityDialog
          activity={selectedActivity}
          open
          onOpenChange={(open) => !open && setSelectedActivity(null)}
        />
      )}
    </div>
  );
}
