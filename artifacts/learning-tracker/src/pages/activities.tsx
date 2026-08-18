import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  getListActivitiesQueryKey,
  getListStreaksQueryKey,
  getGetDashboardQueryKey,
  getGetCalendarQueryKey,
  getGetWeeklyProgressQueryKey,
} from "@workspace/api-client-react";
import { Activity, ActivityInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
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
import { Plus, Edit2, Trash2, Target, Dumbbell, Compass } from "lucide-react";
import {
  ACTIVITY_ICON_OPTIONS,
  ActivityGlyph,
  defaultActivityIcon,
} from "@/lib/activity-icons";
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
  "Other",
];

export default function Activities() {
  const { data: activities = [], isLoading } = useListActivities();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    icon: "target",
    targetMinutesPerDay: 30,
    purpose: null,
    currentThread: null,
    evidenceNote: null,
  });

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
    <div className="relative z-10 mx-auto min-h-screen max-w-6xl space-y-6 px-4 py-6 pb-28 md:p-8 md:pb-20 animate-slide-up">
      <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.22em] text-[#ff8b7c]">
            <Compass className="h-3.5 w-3.5" /> Direction library
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight md:text-4xl">
            Activities
          </h1>
          <p className="mt-2 text-sm text-white/38">
            Practice and sport stay visible without sharing the same clock.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="h-11 gap-2 rounded-full border-0 bg-[#e95448] px-5 text-[10px] font-bold uppercase tracking-[.14em] text-white"
          data-testid="button-create-activity"
        >
          <Plus className="w-5 h-5" />
          New Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/5 border-dashed rounded-3xl p-16 text-center shadow-2xl">
          <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2 text-white">
            No activities yet
          </h3>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-8">
            Create your first activity to start tracking
          </p>
          <Button
            onClick={openCreateDialog}
            className="rounded-2xl uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 px-8 py-6 h-auto"
            data-testid="button-create-first"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Activity
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="group relative min-h-44 overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/88 p-5 backdrop-blur-xl transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:shadow-[0_20px_55px_rgba(0,0,0,.22)]"
              data-testid={`activity-item-${activity.id}`}
            >
              <div
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ backgroundColor: activity.color }}
              />
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border"
                    style={{
                      color: activity.color,
                      borderColor: `${activity.color}35`,
                      backgroundColor: `${activity.color}12`,
                    }}
                  >
                    <ActivityGlyph
                      icon={activity.icon}
                      activityType={activity.activityType}
                      category={activity.category}
                      className="h-4.5 w-4.5"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/activities/${activity.id}`}
                      className="block truncate text-base font-semibold text-white hover:text-[#ff9a89]"
                    >
                      {activity.name}
                    </Link>
                    <p className="mt-1 truncate text-[8px] font-bold uppercase tracking-[.16em] text-white/28">
                      {activity.category}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[.12em] ${
                    activity.activityType === "sport"
                      ? "border-[#72c6b3]/20 bg-[#72c6b3]/[.07] text-[#8bd2c2]"
                      : "border-[#ff8b7c]/18 bg-[#ff7868]/[.06] text-[#ff9a89]"
                  }`}
                >
                  {activity.activityType === "sport" ? (
                    <Dumbbell className="h-3 w-3" />
                  ) : (
                    <Target className="h-3 w-3" />
                  )}
                  {activity.activityType}
                </span>
              </div>
              <div className="mt-5 min-h-10">
                <p className="line-clamp-2 text-xs leading-5 text-white/38">
                  {activity.currentThread ||
                    activity.purpose ||
                    "No current thread saved yet."}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/[.055] pt-3">
                <p className="text-[9px] font-bold uppercase tracking-[.14em] text-white/26">
                  <span className="mr-1.5 text-sm font-semibold tabular-nums text-white/65">
                    {activity.targetMinutesPerDay}
                  </span>
                  min target
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${activity.name}`}
                    className="h-8 w-8 rounded-xl text-white/35 hover:text-white"
                    onClick={() => openEditDialog(activity)}
                    data-testid={`button-edit-${activity.id}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${activity.name}`}
                    className="h-8 w-8 rounded-xl text-white/28 hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => {
                      setDeletingActivity(activity);
                      setDeleteDialogOpen(true);
                    }}
                    data-testid={`button-delete-${activity.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[.07] bg-white/[.025] p-1.5">
                {(
                  [
                    ["practice", Target, "Practice / work"],
                    ["sport", Dumbbell, "Sport / movement"],
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
                              : "target"
                            : formData.icon,
                      })
                    }
                    className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[10px] font-bold uppercase tracking-[.13em] transition ${
                      formData.activityType === value
                        ? value === "sport"
                          ? "bg-[#72c6b3]/12 text-[#91dac9] ring-1 ring-[#72c6b3]/25"
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
                Sport keeps its own clock and never inflates practice momentum.
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

            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Color
              </Label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use color ${color}`}
                    aria-pressed={formData.color === color}
                    className="aspect-square w-full rounded-full border-2 shadow-lg transition hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        formData.color === color ? "#ffffff" : "transparent",
                      transform:
                        formData.color === color ? "scale(1.2)" : "scale(1)",
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
