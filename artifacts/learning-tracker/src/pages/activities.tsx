import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useGetWeeklyProgress,
  getListActivitiesQueryKey,
  getListStreaksQueryKey,
  getGetDashboardQueryKey,
  getGetCalendarQueryKey,
  getGetWeeklyProgressQueryKey,
} from "@workspace/api-client-react";
import { Activity, ActivityInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { SamuraiStatusIcon } from "@/components/samurai-status-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowUpRight,
  Dumbbell,
  Edit2,
  Flame,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import {
  ACTIVITY_ICON_OPTIONS,
  ActivityGlyph,
  defaultActivityIcon,
} from "@/lib/activity-icons";
import practiceHall from "@/assets/environments/optimized/activities-practice-hall.webp";
import verticalOrnament from "@/assets/patterns/japanese-ornament-transparent-v2-cropped.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PRESET_COLORS = [
  "#e95448",
  "#ff7868",
  "#d97941",
  "#d7a449",
  "#8fa34c",
  "#4f9b78",
  "#3f9d96",
  "#4f8fae",
  "#5f7fbd",
  "#796fbd",
  "#9b68ad",
  "#b65f89",
  "#b06f60",
  "#7d817f",
  "#596579",
  "#a79578",
];

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function compactDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

const CATEGORIES = [
  "Learning",
  "Fitness",
  "Creative",
  "Practice",
  "Reading",
  "Meditation",
  "Work",
  "Sport",
  "Strength",
  "Running",
  "Cycling",
  "Swimming",
  "Mobility",
  "Outdoors",
  "IT",
  "Friction",
  "Other",
];

export default function Activities() {
  const { data: activities = [], isLoading } = useListActivities();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: weeklyProgress = [] } = useGetWeeklyProgress();

  const [directionFilter, setDirectionFilter] = useState<
    "all" | Activity["activityType"]
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(
    null,
  );

  const [formData, setFormData] = useState<ActivityInput>({
    name: "",
    category: "Learning",
    activityType: "practice",
    color: PRESET_COLORS[0],
    secondaryColor: null,
    icon: "target",
    targetMinutesPerDay: 30,
    purpose: null,
    currentThread: null,
    evidenceNote: null,
  });

  const weeklyProgressByActivity = useMemo(
    () =>
      new Map(
        weeklyProgress.map((progress) => [progress.activityId, progress]),
      ),
    [weeklyProgress],
  );

  const visibleActivities = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesDirection =
        directionFilter === "all" || activity.activityType === directionFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          activity.name,
          activity.category,
          activity.currentThread,
          activity.purpose,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesDirection && matchesQuery;
    });
  }, [activities, directionFilter, searchQuery]);

  const totalWeekMinutes = weeklyProgress.reduce(
    (sum, progress) =>
      sum +
      progress.days.reduce((daySum, day) => daySum + day.minutesLogged, 0),
    0,
  );
  const practiceWeekMinutes = weeklyProgress
    .filter((progress) => progress.activityType === "practice")
    .reduce(
      (sum, progress) =>
        sum +
        progress.days.reduce((daySum, day) => daySum + day.minutesLogged, 0),
      0,
    );
  const sportWeekMinutes = totalWeekMinutes - practiceWeekMinutes;
  const totalWeekTarget = activities.reduce(
    (sum, activity) => sum + activity.targetMinutesPerDay * 7,
    0,
  );
  const weeklyDirectionReturns = weeklyProgress.map((progress) => ({
    activityId: progress.activityId,
    minutes: progress.days.reduce(
      (sum, day) => sum + day.minutesLogged,
      0,
    ),
  }));
  const activeDirectionsThisWeek = weeklyDirectionReturns.filter(
    (direction) => direction.minutes > 0,
  ).length;
  const peakWeeklyReturn = weeklyDirectionReturns.reduce(
    (peak, direction) => Math.max(peak, direction.minutes),
    0,
  );
  const dailyPracticePace = Math.round(practiceWeekMinutes / 7);

  const refreshActivitySurfaces = () => {
    [
      getListActivitiesQueryKey(),
      getListStreaksQueryKey(),
      getGetDashboardQueryKey(),
      getGetCalendarQueryKey(),
      getGetWeeklyProgressQueryKey(),
    ].forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }));
  };

  const openCreateDialog = () => {
    setEditingActivity(null);
    setFormData({
      name: "",
      category: "Learning",
      activityType: "practice",
      color: PRESET_COLORS[0],
      secondaryColor: null,
      icon: "target",
      targetMinutesPerDay: 30,
      purpose: null,
      currentThread: null,
      evidenceNote: null,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      category: activity.category,
      activityType: activity.activityType,
      color: activity.color || PRESET_COLORS[0],
      secondaryColor: activity.secondaryColor ?? null,
      icon:
        activity.icon ??
        defaultActivityIcon({
          activityType: activity.activityType,
          category: activity.category,
        }),
      targetMinutesPerDay: activity.targetMinutesPerDay,
      purpose: activity.purpose ?? null,
      currentThread: activity.currentThread ?? null,
      evidenceNote: activity.evidenceNote ?? null,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingActivity) {
      updateActivity.mutate(
        { id: editingActivity.id, data: formData },
        {
          onSuccess: () => {
            toast({ title: "Activity updated!" });
            refreshActivitySurfaces();
            setDialogOpen(false);
          },
          onError: () => {
            toast({
              title: "Failed to update activity",
              variant: "destructive",
            });
          },
        },
      );
    } else {
      createActivity.mutate(
        { data: formData },
        {
          onSuccess: () => {
            toast({ title: "Activity created!" });
            refreshActivitySurfaces();
            setDialogOpen(false);
          },
          onError: () => {
            toast({
              title: "Failed to create activity",
              variant: "destructive",
            });
          },
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deletingActivity) return;

    deleteActivity.mutate(
      { id: deletingActivity.id },
      {
        onSuccess: () => {
          toast({ title: "Activity deleted" });
          refreshActivitySurfaces();
          setDeleteDialogOpen(false);
          setDeletingActivity(null);
        },
        onError: () => {
          toast({ title: "Failed to delete activity", variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-3xl bg-white/5" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-6 pb-28 md:p-8 md:pb-20 animate-slide-up">
      <section className="signal-surface relative min-h-[14.5rem] overflow-hidden rounded-[2rem] border border-white/[.11] bg-[#0a1019]/92 p-5 shadow-[0_28px_80px_rgba(0,0,0,.28)] md:p-7">
        <img
          src={practiceHall}
          alt=""
          aria-hidden="true"
          className="room-motif-image pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
          style={{ opacity: 0.74 }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,20,.84)_0%,rgba(8,13,20,.46)_54%,rgba(8,13,20,.06)_100%)]" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#ff7868]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-[38%] h-48 w-72 rounded-full bg-[#72c6b3]/[.06] blur-3xl" />
        <div className="relative z-10 pr-20 sm:pr-28 xl:pr-[clamp(10rem,19vw,18rem)]">
          <div className="max-w-2xl">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-[#ffb1a7]">
                <SamuraiStatusIcon
                  status="active"
                  label="Practice field active"
                  className="h-8 w-8 shrink-0 opacity-90"
                  animate={false}
                />
                <span>Practice field</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-[-.035em] text-white md:text-4xl">
                Activities, seen as a living field.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/52">
                Each direction holds its own pace. The field below turns this
                week&apos;s real return into a quieter view of where your time
                went.
              </p>
              <Button
                onClick={openCreateDialog}
                className="mt-5 h-11 w-full max-w-52 justify-center gap-2 rounded-2xl border border-[#ff9a89]/35 bg-[#d94a41] px-5 text-[10px] font-bold uppercase tracking-[.14em] text-white shadow-[0_10px_26px_rgba(217,74,65,.22)] transition-[transform,background-color,box-shadow] duration-150 hover:bg-[#ed5d53] hover:shadow-[0_14px_32px_rgba(233,84,72,.32)] active:scale-[.97] sm:w-52"
                data-testid="button-create-activity"
              >
                <Plus className="h-4 w-4" />
                New direction
              </Button>
            </div>
          </div>
        </div>
      </section>

      {activities.length === 0 ? (
        <section className="signal-surface relative overflow-hidden rounded-[2rem] border border-dashed border-white/[.14] bg-[#0d141f]/86 px-6 py-16 text-center shadow-[0_24px_70px_rgba(0,0,0,.22)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-[#ff8b7c]/20 bg-[#ff7868]/[.08] text-[#ff9a89] shadow-[0_0_40px_rgba(233,84,72,.1)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-white">
            Begin with one direction.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/44">
            A direction can be a skill, a project, a sport, or simply a place
            you intend to return to.
          </p>
          <Button
            onClick={openCreateDialog}
            className="mt-7 h-11 rounded-2xl border border-[#ff9a89]/30 bg-[#e95448] px-6 text-[10px] font-bold uppercase tracking-[.14em] text-white"
            data-testid="button-create-first"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create direction
          </Button>
        </section>
      ) : (
        <>
          <section className="signal-surface relative isolate overflow-hidden rounded-[2.25rem] border border-white/[.1] bg-[#0a1019]/88 p-2 shadow-[0_24px_70px_rgba(0,0,0,.22)]">
            <img
              src={practiceHall}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-right opacity-[.34]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(10,16,25,.82),rgba(10,16,25,.52),rgba(10,16,25,.72))]" />
            <div className="relative z-10 grid items-start gap-2 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,.8fr)]">
              <div className="relative self-start overflow-hidden rounded-[1.75rem] border border-white/[.09] bg-[#0d1520]/[.57] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-[1px] md:p-6">
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#ffb1a7]">
                    Direction constellation
                  </p>
                  <p className="mt-1 text-sm text-white/46">
                    A node brightens with its real weekly return.
                  </p>
                </div>
                <span className="rounded-full border border-white/[.09] bg-white/[.035] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.13em] text-white/52">
                  {activities.length} active
                </span>
              </div>
              <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {activities.slice(0, 8).map((activity, index) => {
                  const progress = weeklyProgressByActivity.get(activity.id);
                  const minutes =
                    progress?.days.reduce(
                      (sum, day) => sum + day.minutesLogged,
                      0,
                    ) ?? 0;
                  const target = Math.max(activity.targetMinutesPerDay * 7, 1);
                  const fill = Math.min(
                    100,
                    Math.round((minutes / target) * 100),
                  );
                  const color = activity.color || "#ff7868";
                  const secondaryColor = activity.secondaryColor ?? null;
                  const iconBackground = secondaryColor
                    ? `linear-gradient(135deg, ${color} 0 50%, ${secondaryColor} 50% 100%)`
                    : `${color}18`;

                  return (
                    <Link
                      key={activity.id}
                      href={`/activities/${activity.id}`}
                      className="activity-constellation-node group relative overflow-hidden rounded-2xl border border-white/[.07] bg-black/10 p-3.5 transition-[border-color,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-white/[.18] hover:bg-white/[.045]"
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <div
                        className="absolute inset-x-0 bottom-0 h-1 origin-left bg-gradient-to-r from-transparent"
                        style={{
                          width: `${Math.max(fill, 8)}%`,
                          background: secondaryColor
                            ? `linear-gradient(90deg, ${color} 0 50%, ${secondaryColor} 50% 100%)`
                            : color,
                          boxShadow: `0 0 16px ${color}80`,
                        }}
                      />
                      <div className="flex items-start gap-2.5">
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border"
                          style={{
                            color: secondaryColor
                              ? "rgba(255,255,255,.94)"
                              : color,
                            borderColor: secondaryColor
                              ? `${secondaryColor}85`
                              : `${color}50`,
                            background: iconBackground,
                          }}
                        >
                          <ActivityGlyph
                            icon={activity.icon}
                            activityType={activity.activityType}
                            category={activity.category}
                            className="h-4 w-4"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {activity.name}
                          </span>
                          <span className="mt-1 block text-[9px] font-bold uppercase tracking-[.13em] text-white/32">
                            {compactDuration(minutes)} / {compactDuration(target)}
                          </span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-[1.75rem] border border-white/[.09] bg-[#0d1520]/[.72] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-[2px] md:p-6">
              <div className="relative z-10 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.2em] text-[#72c6b3]">
                <Flame className="h-3.5 w-3.5" /> Week at a glance
              </div>
              <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[.07] bg-black/12 p-3.5">
                  <p className="text-[8px] font-bold uppercase tracking-[.16em] text-white/36">
                    Practice
                  </p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                    {compactDuration(practiceWeekMinutes)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#72c6b3]/[.14] bg-[#72c6b3]/[.045] p-3.5">
                  <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#8bd2c2]/70">
                    Sport
                  </p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                    {compactDuration(sportWeekMinutes)}
                  </p>
                </div>
              </div>
              <div className="relative z-10 mt-4 border-t border-white/[.06] pt-4">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[.15em] text-white/38">
                  <span>Field coverage</span>
                  <span className="text-white/72">
                    {totalWeekTarget
                      ? Math.min(
                          100,
                          Math.round(
                            (totalWeekMinutes / totalWeekTarget) * 100,
                          ),
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ff7868] via-[#ffc268] to-[#72c6b3] shadow-[0_0_16px_rgba(255,194,104,.45)] transition-[width] duration-700"
                    style={{
                      width: `${totalWeekTarget ? Math.min(100, Math.round((totalWeekMinutes / totalWeekTarget) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="relative z-10 mt-4 border-t border-white/[.06] pt-4">
                <div className="mb-2 flex items-center justify-between text-[8px] font-bold uppercase tracking-[.16em] text-white/34">
                  <span>Weekly read</span>
                  <span className="text-[#8bd2c2]/70">Aggregate</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/[.06] bg-black/[.12] px-2.5 py-2">
                    <span className="block text-[7px] font-bold uppercase tracking-[.12em] text-white/32">
                      Active
                    </span>
                    <strong className="mt-1 block text-sm font-semibold tabular-nums text-white/90">
                      {activeDirectionsThisWeek}
                    </strong>
                  </div>
                  <div className="rounded-xl border border-white/[.06] bg-black/[.12] px-2.5 py-2">
                    <span className="block text-[7px] font-bold uppercase tracking-[.12em] text-white/32">
                      Pace
                    </span>
                    <strong className="mt-1 block text-sm font-semibold tabular-nums text-white/90">
                      {compactDuration(dailyPracticePace)}
                    </strong>
                  </div>
                  <div className="rounded-xl border border-white/[.06] bg-black/[.12] px-2.5 py-2">
                    <span className="block text-[7px] font-bold uppercase tracking-[.12em] text-white/32">
                      Peak
                    </span>
                    <strong className="mt-1 block text-sm font-semibold tabular-nums text-white/90">
                      {compactDuration(peakWeeklyReturn)}
                    </strong>
                  </div>
                </div>
              </div>
              <Link
                href="/history?from=activities"
                className="activity-analysis-link relative z-10 mt-5 flex h-11 items-center justify-between rounded-2xl px-4 text-[10px] font-bold uppercase tracking-[.14em] text-[#d9f6ef]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#72c6b3] shadow-[0_0_9px_rgba(114,198,179,.88)]" />
                  Open analysis
                </span>
                <ArrowUpRight className="relative z-10 h-4 w-4" />
              </Link>
            </aside>
            </div>
          </section>

          <section className="signal-surface relative isolate overflow-hidden rounded-[2rem] border border-white/[.1] bg-[#0d1520]/88 p-4 shadow-[0_24px_70px_rgba(0,0,0,.2)] md:p-5">
            <img
              src={verticalOrnament}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-2 top-1/2 h-[15rem] max-h-[190%] w-auto -translate-y-1/2 select-none opacity-[.28] brightness-[1.18] saturate-[.78]"
            />
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div
                className="flex flex-wrap gap-2"
                aria-label="Filter directions"
              >
                {(
                  [
                    ["all", "All directions"],
                    ["practice", "Practice"],
                    ["sport", "Sport"],
                    ["friction", "Friction"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={directionFilter === value}
                    onClick={() => setDirectionFilter(value)}
                    className={`rounded-xl border px-3.5 py-2 text-[9px] font-bold uppercase tracking-[.13em] transition-[color,background-color,border-color,transform] duration-200 active:scale-95 ${
                      directionFilter === value
                        ? value === "sport"
                          ? "border-[#72c6b3]/35 bg-[#72c6b3]/[.1] text-[#91dac9]"
                          : value === "friction"
                            ? "border-[#c8c4d8]/30 bg-[#c8c4d8]/[.08] text-[#d6d1e6]"
                            : "border-[#ff8b7c]/35 bg-[#ff7868]/[.1] text-[#ffb1a7]"
                        : "border-white/[.075] bg-white/[.02] text-white/42 hover:border-white/[.16] hover:bg-white/[.055] hover:text-white/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="group flex h-10 min-w-0 items-center gap-2.5 rounded-xl border border-white/[.08] bg-black/12 px-3 text-white/38 transition-colors focus-within:border-[#ffb1a7]/35 focus-within:text-[#ffb1a7] lg:w-72">
                <Search className="h-3.5 w-3.5" />
                <span className="sr-only">Search activities</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Find a direction"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/26"
                />
              </label>
            </div>
          </section>

          {visibleActivities.length === 0 ? (
            <section className="rounded-[2rem] border border-dashed border-white/[.12] bg-[#0d1520]/72 px-6 py-14 text-center">
              <Search className="mx-auto h-7 w-7 text-white/24" />
              <h2 className="mt-3 text-lg font-semibold text-white">
                No direction matches this view.
              </h2>
              <p className="mt-2 text-sm text-white/42">
                Try a different filter or clear the search line.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setDirectionFilter("all");
                  setSearchQuery("");
                }}
                className="mt-5 rounded-xl border-white/10 bg-white/[.04] text-white"
              >
                Clear view
              </Button>
            </section>
          ) : (
            <section className="grid gap-3 xl:grid-cols-2">
              {visibleActivities.map((activity, index) => {
                const progress = weeklyProgressByActivity.get(activity.id);
                const days = progress?.days ?? [];
                const weekMinutes = days.reduce(
                  (sum, day) => sum + day.minutesLogged,
                  0,
                );
                const weeklyTarget = Math.max(
                  activity.targetMinutesPerDay * 7,
                  1,
                );
                const completion = Math.min(
                  100,
                  Math.round((weekMinutes / weeklyTarget) * 100),
                );
                const accent = activity.color || "#ff7868";
                const secondaryColor = activity.secondaryColor ?? null;
                const iconBackground = secondaryColor
                  ? `linear-gradient(135deg, ${accent} 0 50%, ${secondaryColor} 50% 100%)`
                  : `${accent}18`;
                const thread =
                  activity.currentThread ||
                  activity.purpose ||
                  "No thread set — this direction is ready for its next deliberate return.";

                return (
                  <article
                    key={activity.id}
                    className="group relative overflow-hidden rounded-[1.7rem] border border-white/[.09] bg-[linear-gradient(120deg,rgba(15,23,34,.94),rgba(10,16,25,.9))] p-4 shadow-[0_16px_48px_rgba(0,0,0,.18)] transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/[.19] hover:shadow-[0_24px_58px_rgba(0,0,0,.28)] md:p-5"
                    data-testid={`activity-item-${activity.id}`}
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 w-1"
                      style={{
                        background: secondaryColor
                          ? `linear-gradient(180deg, ${accent} 0 50%, ${secondaryColor} 50% 100%)`
                          : accent,
                        boxShadow: `0 0 20px ${accent}`,
                      }}
                    />
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3.5">
                        <span
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border"
                          style={{
                            color: secondaryColor
                              ? "rgba(255,255,255,.94)"
                              : accent,
                            borderColor: secondaryColor
                              ? `${secondaryColor}85`
                              : `${accent}55`,
                            background: iconBackground,
                          }}
                        >
                          <ActivityGlyph
                            icon={activity.icon}
                            activityType={activity.activityType}
                            category={activity.category}
                            className="h-5 w-5"
                          />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/activities/${activity.id}`}
                              className="text-lg font-semibold tracking-[-.02em] text-white transition-colors hover:text-[#ffb1a7]"
                            >
                              {activity.name}
                            </Link>
                            <span
                              className={`rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[.12em] ${activity.activityType === "sport" ? "border-[#72c6b3]/24 bg-[#72c6b3]/[.08] text-[#8bd2c2]" : activity.activityType === "friction" ? "border-[#c8c4d8]/24 bg-[#c8c4d8]/[.07] text-[#d6d1e6]" : "border-[#ff8b7c]/22 bg-[#ff7868]/[.07] text-[#ffb1a7]"}`}
                            >
                              {activity.activityType === "sport" ? (
                                <Dumbbell className="mr-1 inline h-3 w-3" />
                              ) : activity.activityType === "friction" ? (
                                <Flame className="mr-1 inline h-3 w-3" />
                              ) : (
                                <Target className="mr-1 inline h-3 w-3" />
                              )}
                              {activity.activityType}
                            </span>
                          </div>
                          <p className="mt-1 text-[9px] font-bold uppercase tracking-[.15em] text-white/33">
                            {activity.category}
                          </p>
                          <p className="mt-3 max-w-xl text-sm leading-5 text-white/52">
                            {thread}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                        <span className="rounded-xl border border-white/[.08] bg-black/12 px-2.5 py-2 text-right">
                          <span className="block text-base font-semibold tabular-nums text-white">
                            {activity.targetMinutesPerDay}
                          </span>
                          <span className="block text-[8px] font-bold uppercase tracking-[.14em] text-white/34">
                            min / day
                          </span>
                        </span>
                        <div className="flex items-center gap-1 rounded-xl border border-white/[.07] bg-black/12 p-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label={`Open ${activity.name}`}
                            className="h-8 w-8 rounded-lg text-white/45 hover:bg-white/[.07] hover:text-white"
                          >
                            <Link href={`/activities/${activity.id}`}>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${activity.name}`}
                            className="h-8 w-8 rounded-lg text-white/45 hover:bg-white/[.07] hover:text-white"
                            onClick={() => openEditDialog(activity)}
                            data-testid={`button-edit-${activity.id}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${activity.name}`}
                            className="h-8 w-8 rounded-lg text-white/35 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() => {
                              setDeletingActivity(activity);
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-${activity.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/[.065] bg-black/[.11] p-3.5">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-[.15em] text-white/34">
                            Seven-day return
                          </p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-white">
                            {weekMinutes}
                            <span className="ml-1 text-xs font-medium text-white/36">
                              min
                            </span>
                          </p>
                        </div>
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: accent }}
                        >
                          {completion}%
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-7 gap-1.5">
                        {Array.from({ length: 7 }, (_, dayIndex) => {
                          const day = days[dayIndex];
                          const ratio = Math.min(
                            1,
                            (day?.minutesLogged ?? 0) /
                              Math.max(activity.targetMinutesPerDay, 1),
                          );
                          const height = Math.max(14, Math.round(ratio * 100));
                          return (
                            <div
                              key={day?.date ?? `${activity.id}-${dayIndex}`}
                              className="flex min-w-0 flex-col items-center gap-1.5"
                            >
                              <div className="flex h-10 w-full items-end rounded-md bg-white/[.045] px-0.5">
                                <div
                                  className="activity-week-bar w-full rounded-[3px] transition-[height] duration-700"
                                  style={{
                                    height: `${height}%`,
                                    backgroundColor: day?.minutesLogged
                                      ? accent
                                      : "rgba(255,255,255,.1)",
                                    boxShadow: day?.minutesLogged
                                      ? `0 0 10px ${accent}70`
                                      : "none",
                                  }}
                                />
                              </div>
                              <span className="text-[8px] font-bold text-white/26">
                                {day
                                  ? new Intl.DateTimeFormat("en-US", {
                                      weekday: "narrow",
                                    }).format(new Date(`${day.date}T12:00:00`))
                                  : WEEKDAY_LABELS[dayIndex]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-h-[90dvh] max-w-2xl overflow-y-auto rounded-3xl border-white/10 bg-[#0a0a0a] p-6 shadow-2xl backdrop-blur-2xl"
          data-testid="dialog-activity-form"
        >
          <DialogHeader>
            <DialogTitle className="mb-1 text-2xl font-bold tracking-wide text-white">
              {editingActivity ? "Edit Activity" : "New Activity"}
            </DialogTitle>
            <DialogDescription className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
              {editingActivity
                ? "Update your activity details"
                : "Create a new activity to track"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-[10px] uppercase tracking-widest text-white/40 font-bold"
              >
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Katana Practice"
                required
                className="h-11 rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-white/20 focus-visible:ring-red-500"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Counts as
              </Label>
              <div className="grid grid-cols-1 gap-2 rounded-2xl border border-white/[.07] bg-white/[.025] p-1.5 md:grid-cols-3">
                {(
                  [
                    ["practice", Target, "Practice / work"],
                    ["sport", Dumbbell, "Sport / movement"],
                    ["friction", Flame, "Friction / drift"],
                  ] as const
                ).map(([value, Icon, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={formData.activityType === value}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        activityType: value,
                        icon:
                          formData.icon === "target" ||
                          formData.icon === "dumbbell"
                            ? value === "sport"
                              ? "dumbbell"
                              : value === "friction"
                                ? "bug"
                                : "target"
                            : formData.icon,
                      })
                    }
                    className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[10px] font-bold uppercase tracking-[.13em] transition ${
                      formData.activityType === value
                        ? value === "sport"
                          ? "bg-[#72c6b3]/12 text-[#91dac9] ring-1 ring-[#72c6b3]/25"
                          : value === "friction"
                            ? "bg-[#a8a4ba]/10 text-[#c8c4d8] ring-1 ring-[#c8c4d8]/20"
                            : "bg-[#ff7868]/10 text-[#ff9b8c] ring-1 ring-[#ff7868]/20"
                        : "text-white/35 hover:bg-white/[.04] hover:text-white/60"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] leading-4 text-white/28">
                Sport strengthens the positive day total. Friction stays visible
                as time that reduced the clean balance without changing
                productive goals.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-[10px] uppercase tracking-widest text-white/40 font-bold"
                >
                  Category
                </Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  data-testid="select-category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="target"
                  className="text-[10px] uppercase tracking-widest text-white/40 font-bold"
                >
                  Daily Target (min)
                </Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={formData.targetMinutesPerDay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetMinutesPerDay: Number(e.target.value),
                    })
                  }
                  className="h-11 rounded-xl border-white/10 bg-white/5 text-center font-bold text-white focus-visible:ring-red-500"
                  data-testid="input-target"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Icon
              </Label>
              <div className="grid grid-cols-10 gap-1.5 rounded-2xl border border-white/[.07] bg-white/[.02] p-2">
                {ACTIVITY_ICON_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      title={option.label}
                      aria-label={option.label}
                      aria-pressed={formData.icon === option.value}
                      onClick={() =>
                        setFormData({ ...formData, icon: option.value })
                      }
                      className={`flex aspect-square items-center justify-center rounded-lg transition ${
                        formData.icon === option.value
                          ? "bg-white/12 text-white ring-1 ring-white/30"
                          : "text-white/35 hover:bg-white/[.06] hover:text-white/70"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <details className="group rounded-2xl border border-white/[.07] bg-white/[.02]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                Direction context{" "}
                <span className="normal-case tracking-normal text-white/20">
                  optional · open
                </span>
              </summary>
              <div className="grid gap-3 border-t border-white/[.06] p-3">
                <Textarea
                  value={formData.purpose ?? ""}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      purpose: event.target.value.trimStart() || null,
                    })
                  }
                  maxLength={280}
                  rows={2}
                  placeholder="Why does this direction matter?"
                  className="resize-none rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/25"
                />
                <Textarea
                  value={formData.currentThread ?? ""}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      currentThread: event.target.value.trimStart() || null,
                    })
                  }
                  maxLength={160}
                  rows={2}
                  placeholder="What thread is currently open?"
                  className="resize-none rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/25"
                />
                <Textarea
                  value={formData.evidenceNote ?? ""}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      evidenceNote: event.target.value.trimStart() || null,
                    })
                  }
                  maxLength={280}
                  rows={2}
                  placeholder="What would visible movement look like?"
                  className="resize-none rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/25"
                />
              </div>
            </details>

            <div className="space-y-4 rounded-2xl border border-white/[.07] bg-white/[.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Icon tone
                  </Label>
                  <p className="mt-1 text-[10px] leading-4 text-white/28">
                    Add a second color to split an activity&apos;s icon 50 / 50.
                  </p>
                </div>
                <div
                  className="h-9 w-14 rounded-xl border border-white/15 shadow-[0_0_20px_rgba(255,255,255,.06)]"
                  style={{
                    background: formData.secondaryColor
                      ? `linear-gradient(135deg, ${formData.color} 0 50%, ${formData.secondaryColor} 50% 100%)`
                      : formData.color,
                  }}
                  aria-label="Activity color preview"
                />
              </div>

              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[.14em] text-white/34">
                  Primary
                </p>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Use primary color ${color}`}
                      aria-pressed={formData.color === color}
                      className="aspect-square w-full rounded-full border-2 shadow-lg transition hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          formData.color === color ? "#ffffff" : "transparent",
                        transform:
                          formData.color === color ? "scale(1.16)" : "scale(1)",
                        boxShadow:
                          formData.color === color
                            ? `0 0 12px ${color}70`
                            : "none",
                      }}
                      onClick={() => setFormData({ ...formData, color })}
                      data-testid={`color-${color}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[9px] font-bold uppercase tracking-[.14em] text-white/34">
                    Second color · optional
                  </p>
                  {formData.secondaryColor && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, secondaryColor: null })
                      }
                      className="text-[9px] font-bold uppercase tracking-[.13em] text-white/34 transition-colors hover:text-[#ffb1a7]"
                    >
                      Single tone
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Use secondary color ${color}`}
                      aria-pressed={formData.secondaryColor === color}
                      className="aspect-square w-full rounded-full border-2 shadow-lg transition hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          formData.secondaryColor === color
                            ? "#ffffff"
                            : "transparent",
                        transform:
                          formData.secondaryColor === color
                            ? "scale(1.16)"
                            : "scale(1)",
                        boxShadow:
                          formData.secondaryColor === color
                            ? `0 0 12px ${color}70`
                            : "none",
                      }}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          secondaryColor:
                            formData.color === color ? null : color,
                        })
                      }
                      data-testid={`secondary-color-${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3 border-t border-white/5 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-xl"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createActivity.isPending || updateActivity.isPending}
                className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
                data-testid="button-submit"
              >
                {editingActivity ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          className="rounded-3xl border-white/10 p-8 bg-[#0a0a0a] backdrop-blur-2xl shadow-2xl"
          data-testid="dialog-delete-confirm"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-red-500">
              Delete Activity?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-sm mt-2">
              This will permanently delete "{deletingActivity?.name}" and all
              associated logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel
              className="rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white"
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-red-900/50 border border-red-500/50 text-red-400 hover:bg-red-900/80 backdrop-blur-xl"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
