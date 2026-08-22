import { useEffect, useMemo, useState } from "react";
import armoryRoom from "@/assets/environments/optimized/cabinet-armory-room.webp";
import crossedKatanas from "@assets/samurai-site-assets/weapons-armor/crossed-katanas.png";
import { SessionNotes } from "./reflections";
import { format, isBefore, startOfDay } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListAlertsQueryKey,
  getListDojoCabinetQueryKey,
  getListMilestonesQueryKey,
  getPeriodReflectionQueryKey,
  useCreateAlert,
  useCreateDojoCabinetItem,
  useCreateMilestone,
  useDeleteAlert,
  useDeleteDojoCabinetItem,
  useDeleteMilestone,
  useListAlerts,
  useListActivities,
  useListDojoCabinet,
  useListMilestones,
  usePeriodReflection,
  usePutPeriodReflection,
  useUpdateAlert,
  useUpdateMilestone,
  type Alert,
  type AlertInput,
  type DojoCabinetItem,
  type Milestone,
  type MilestoneInput,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Archive,
  Bell,
  BellOff,
  BookOpen,
  CalendarClock,
  Check,
  ChevronRight,
  ExternalLink,
  Link2,
  Plus,
  ScrollText,
  Trash2,
} from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DialogKind = "reminder" | "milestone" | "cabinet" | null;

function formatDeadline(milestone: Milestone) {
  const due = new Date(`${milestone.dueDate}T00:00:00`);
  const overdue =
    milestone.status === "open" && isBefore(due, startOfDay(new Date()));
  return {
    overdue,
    label: format(due, "EEE, MMM d"),
  };
}

function periodLabel(period: Milestone["period"]) {
  if (period === "week") return "Week target";
  if (period === "month") return "Month target";
  return "Personal date";
}

export default function Cabinet() {
  const { data: alerts = [], isLoading: alertsLoading } = useListAlerts();
  const { data: activities = [], isLoading: activitiesLoading } =
    useListActivities();
  const { data: milestones = [], isLoading: milestonesLoading } =
    useListMilestones();
  const { data: cabinetItems = [], isLoading: cabinetLoading } =
    useListDojoCabinet();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const createCabinetItem = useCreateDojoCabinetItem();
  const deleteCabinetItem = useDeleteDojoCabinetItem();
  const putReflection = usePutPeriodReflection();

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState<number | null>(
    null,
  );
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [cabinetReflectionId, setCabinetReflectionId] = useState<number | null>(
    null,
  );
  const [reminderForm, setReminderForm] = useState<AlertInput>({
    activityId: 0,
    timeOfDay: "09:00",
    daysOfWeek: [1, 2, 3, 4, 5],
    enabled: true,
    message: "A quiet return is waiting.",
  });
  const [milestoneForm, setMilestoneForm] = useState<MilestoneInput>({
    title: "",
    detail: "",
    period: "week",
    dueDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [cabinetForm, setCabinetForm] = useState({
    title: "",
    url: "",
    note: "",
    kind: "link" as const,
  });
  const [reflectionDraft, setReflectionDraft] = useState({
    notice: "",
    carry: "",
  });

  const activeMilestone = milestones.find(
    (milestone) => milestone.id === activeMilestoneId,
  );
  const reflectionQuery = usePeriodReflection(activeMilestoneId);
  const selectedReflection = reflectionQuery.data;

  useEffect(() => {
    if (!selectedReflection) {
      setReflectionDraft({ notice: "", carry: "" });
      return;
    }
    setReflectionDraft({
      notice: selectedReflection.notice,
      carry: selectedReflection.carry,
    });
  }, [selectedReflection]);

  const openMilestones = useMemo(
    () => milestones.filter((milestone) => milestone.status === "open"),
    [milestones],
  );
  const completeMilestones = useMemo(
    () => milestones.filter((milestone) => milestone.status === "complete"),
    [milestones],
  );

  const invalidateCabinet = () => {
    void queryClient.invalidateQueries({
      queryKey: getListMilestonesQueryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: getListDojoCabinetQueryKey(),
    });
  };

  const openReminderDialog = (alert?: Alert) => {
    setEditingAlert(alert ?? null);
    setReminderForm(
      alert
        ? {
            activityId: alert.activityId,
            timeOfDay: alert.timeOfDay,
            daysOfWeek: alert.daysOfWeek,
            enabled: alert.enabled,
            message: alert.message,
          }
        : {
            activityId: activities[0]?.id ?? 0,
            timeOfDay: "09:00",
            daysOfWeek: [1, 2, 3, 4, 5],
            enabled: true,
            message: "A quiet return is waiting.",
          },
    );
    setDialog("reminder");
  };

  const openCabinetDialog = (periodReflectionId: number | null = null) => {
    setCabinetReflectionId(periodReflectionId);
    setCabinetForm({ title: "", url: "", note: "", kind: "link" });
    setDialog("cabinet");
  };

  const saveReminder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reminderForm.activityId || reminderForm.daysOfWeek.length === 0) {
      toast({
        title: "Choose a direction and at least one day",
        variant: "destructive",
      });
      return;
    }
    const onSuccess = () => {
      void queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
      setDialog(null);
      toast({
        title: editingAlert ? "Reminder updated" : "Quiet reminder set",
      });
    };
    if (editingAlert) {
      updateAlert.mutate(
        { id: editingAlert.id, data: reminderForm },
        { onSuccess },
      );
    } else {
      createAlert.mutate({ data: reminderForm }, { onSuccess });
    }
  };

  const saveMilestone = (event: React.FormEvent) => {
    event.preventDefault();
    if (!milestoneForm.title.trim()) return;
    createMilestone.mutate(milestoneForm, {
      onSuccess: () => {
        invalidateCabinet();
        setDialog(null);
        toast({ title: "Deadline saved" });
      },
      onError: () =>
        toast({ title: "Couldn’t save deadline", variant: "destructive" }),
    });
  };

  const saveCabinetItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!cabinetForm.title.trim()) return;
    createCabinetItem.mutate(
      {
        ...cabinetForm,
        periodReflectionId: cabinetReflectionId,
        position: cabinetItems.length,
      },
      {
        onSuccess: () => {
          invalidateCabinet();
          setDialog(null);
          setCabinetForm({ title: "", url: "", note: "", kind: "link" });
          toast({ title: "Placed in the dojo cabinet" });
        },
        onError: () =>
          toast({
            title: "Couldn’t save cabinet item",
            variant: "destructive",
          }),
      },
    );
  };

  const saveReflection = (openCabinetAfterSave = false) => {
    if (!activeMilestone) return;
    putReflection.mutate(
      { milestoneId: activeMilestone.id, data: reflectionDraft },
      {
        onSuccess: (reflection) => {
          void queryClient.invalidateQueries({
            queryKey: getPeriodReflectionQueryKey(activeMilestone.id),
          });
          setReflectionOpen(false);
          toast({ title: "Period reflection saved" });
          if (reflection.id) {
            setActiveMilestoneId(activeMilestone.id);
            setCabinetReflectionId(reflection.id);
            if (openCabinetAfterSave) openCabinetDialog(reflection.id);
          }
        },
        onError: () =>
          toast({ title: "Couldn’t save reflection", variant: "destructive" }),
      },
    );
  };

  const toggleReminder = (alert: Alert) => {
    updateAlert.mutate(
      { id: alert.id, data: { enabled: !alert.enabled } },
      {
        onSuccess: () =>
          void queryClient.invalidateQueries({
            queryKey: getListAlertsQueryKey(),
          }),
      },
    );
  };

  const toggleMilestone = (milestone: Milestone) => {
    updateMilestone.mutate(
      {
        id: milestone.id,
        data: { status: milestone.status === "complete" ? "open" : "complete" },
      },
      { onSuccess: invalidateCabinet },
    );
  };

  const loading =
    alertsLoading || activitiesLoading || milestonesLoading || cabinetLoading;
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:p-8">
        <Skeleton className="h-20 w-80 rounded-3xl bg-white/5" />
        <Skeleton className="h-72 rounded-3xl bg-white/5" />
        <Skeleton className="h-64 rounded-3xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="page-arrival relative z-10 mx-auto min-h-screen max-w-6xl space-y-8 px-4 py-6 pb-28 md:p-8 md:pb-20">
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-[#ffc268]/15 bg-[radial-gradient(circle_at_72%_24%,rgba(255,194,104,.16),transparent_26%),linear-gradient(125deg,rgba(16,22,33,.98),rgba(10,15,23,.94)_58%,rgba(76,38,37,.58))] px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_54px_rgba(0,0,0,.24)] md:px-8 md:py-8">
        <img
          src={armoryRoom}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[48%] select-none object-cover object-left opacity-42 md:block"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[62%] bg-[linear-gradient(90deg,rgba(10,15,23,.1),rgba(10,15,23,.54))]" />
        <div className="relative z-10 flex flex-col gap-6 md:pr-52 lg:pr-64">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-[#ffb1a7]">
              <img
                src={crossedKatanas}
                alt=""
                aria-hidden="true"
                className="h-5 w-5 shrink-0 object-contain opacity-82 drop-shadow-[0_0_9px_rgba(255,194,104,.16)]"
              />
              Cabinet · quiet records
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Cabinet
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/52">
              Keep the useful traces of your practice: a period reflection, the
              tools it revealed, and the small session notes that make return
              easier.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              onClick={() => setDialog("milestone")}
              className="signal-button h-11 gap-2 rounded-2xl bg-[#e95448] px-4 text-[10px] font-bold uppercase tracking-[.14em] text-white shadow-[0_10px_24px_rgba(233,84,72,.22)] hover:bg-[#f26456]"
            >
              <Plus className="h-4 w-4" /> Set deadline
            </Button>
            <Button
              variant="outline"
              onClick={() => openReminderDialog()}
              className="signal-button h-11 gap-2 rounded-2xl border-white/[.14] bg-white/[.055] px-4 text-[10px] font-bold uppercase tracking-[.14em] text-white/80 hover:border-[#ffc268]/45 hover:bg-[#ffc268]/10 hover:text-white"
            >
              <Bell className="h-4 w-4" /> Daily reminder
            </Button>
            <Button
              variant="ghost"
              onClick={() => openCabinetDialog()}
              className="signal-button h-11 gap-2 rounded-2xl px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#ffe0a5] hover:bg-[#ffc268]/10 hover:text-[#fff2cb]"
            >
              <Archive className="h-4 w-4" /> Add tool
            </Button>
          </div>
        </div>
            </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.42fr)_minmax(18rem,.78fr)]">

        <div className="signal-surface overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92">
          <div className="flex items-start justify-between gap-4 border-b border-white/[.06] p-6 md:p-7">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#ff9a89]">
                Period reflections
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Deadlines & reflections
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/42">
                A deadline is a calm checkpoint, not another scorecard. Complete
                it, postpone it, or leave a reflection when it has something to
                teach.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[#ffc268]/20 bg-[#ffc268]/[.08] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#ffe0a5]">
              {openMilestones.length} open
            </span>
          </div>
          <div className="divide-y divide-white/[.06]">
            {openMilestones.length ? (
              openMilestones.map((milestone) => {
                const due = formatDeadline(milestone);
                return (
                  <article
                    key={milestone.id}
                    className="group flex gap-4 p-5 transition-colors hover:bg-white/[.025] md:p-6"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMilestone(milestone)}
                      aria-label={`Mark ${milestone.title} complete`}
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[.12] bg-white/[.035] text-white/35 transition-colors hover:border-[#72c6b3]/55 hover:bg-[#72c6b3]/10 hover:text-[#72c6b3]"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-white">
                          {milestone.title}
                        </p>
                        <span className="rounded-full border border-white/[.09] bg-white/[.035] px-2 py-1 text-[8px] font-bold uppercase tracking-[.14em] text-white/42">
                          {periodLabel(milestone.period)}
                        </span>
                      </div>
                      {milestone.detail && (
                        <p className="mt-2 text-sm leading-6 text-white/42">
                          {milestone.detail}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-[9px] font-bold uppercase tracking-[.14em]">
                        <span
                          className={
                            due.overdue ? "text-[#ff8b7c]" : "text-[#ffc268]"
                          }
                        >
                          {due.overdue ? "Past mark" : `Due ${due.label}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMilestoneId(milestone.id);
                            setCabinetReflectionId(null);
                            setReflectionOpen(true);
                          }}
                          className="signal-button flex items-center gap-1 text-white/42 transition-colors hover:text-white"
                        >
                          <ScrollText className="h-3.5 w-3.5" /> Reflect on this
                          period
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Remove this deadline?"))
                          deleteMilestone.mutate(
                            { id: milestone.id },
                            { onSuccess: invalidateCabinet },
                          );
                      }}
                      className="self-start rounded-lg p-2 text-white/20 transition-colors hover:bg-white/5 hover:text-[#ff8b7c]"
                      aria-label={`Remove ${milestone.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </article>
                );
              })
            ) : (
              <div className="relative overflow-hidden p-10 text-center">
                <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-[#ff7868]/50 to-transparent" />
                <CalendarClock className="mx-auto h-9 w-9 text-[#ff9a89]/50" />
                <p className="mt-4 text-base font-semibold text-white/70">
                  No open marks yet.
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-white/36">
                  Start with one outcome that deserves a week or month of
                  attention. It can stay flexible.
                </p>
                <Button
                  onClick={() => setDialog("milestone")}
                  className="signal-button mt-5 h-10 gap-2 rounded-xl bg-[#e95448] px-4 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"
                >
                  <Plus className="h-4 w-4" /> Set first deadline
                </Button>
              </div>
            )}
          </div>
          {completeMilestones.length > 0 && (
            <div className="border-t border-white/[.06] bg-[#72c6b3]/[.035] px-6 py-4 text-[10px] font-bold uppercase tracking-[.14em] text-[#72c6b3]">
              {completeMilestones.length} closed mark
              {completeMilestones.length === 1 ? "" : "s"} kept with your
              records
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <section className="signal-surface rounded-3xl border border-white/[.08] bg-[#0c1119]/92 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#ffc268]">
                  Quiet returns
                </p>
                <h2 className="mt-2 text-lg font-bold text-white">
                  Daily reminders
                </h2>
              </div>
              <Bell className="h-5 w-5 text-[#ffc268]/75" />
            </div>
            <p className="mt-3 text-xs leading-5 text-white/38">
              These appear gently when Open Finish is open. They do not push or
              interrupt outside the app.
            </p>
            <div className="mt-5 space-y-2">
              {alerts.length ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-2xl border p-3 ${alert.enabled ? "border-white/[.1] bg-white/[.035]" : "border-white/[.05] bg-transparent opacity-55"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={alert.enabled}
                        onCheckedChange={() => toggleReminder(alert)}
                      />
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => openReminderDialog(alert)}
                      >
                        <p className="truncate text-xs font-semibold text-white/82">
                          {alert.activityName}
                        </p>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.13em] text-white/35">
                          {alert.timeOfDay} · {alert.daysOfWeek.length} days
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Remove this reminder?"))
                            deleteAlert.mutate(
                              { id: alert.id },
                              {
                                onSuccess: () =>
                                  void queryClient.invalidateQueries({
                                    queryKey: getListAlertsQueryKey(),
                                  }),
                              },
                            );
                        }}
                        className="p-1 text-white/20 hover:text-[#ff8b7c]"
                        aria-label={`Remove reminder for ${alert.activityName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/[.1] bg-white/[.018] px-4 py-5 text-center">
                  <BellOff className="mx-auto h-5 w-5 text-[#ffc268]/45" />
                  <p className="mt-3 text-xs leading-5 text-white/38">
                    No reminder has to exist until it makes return easier.
                  </p>
                  <button
                    type="button"
                    onClick={() => openReminderDialog()}
                    className="signal-button mt-3 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#ffe0a5] hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create daily reminder
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="relative min-h-[18rem] overflow-hidden rounded-3xl border border-[#ffc268]/20 bg-[radial-gradient(circle_at_72%_25%,rgba(255,194,104,.17),transparent_34%),linear-gradient(145deg,rgba(59,40,32,.78),rgba(12,17,25,.98)_58%,rgba(32,55,53,.62))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] md:p-6">
            <img
              src={armoryRoom}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-12 -right-8 h-[19rem] w-auto select-none object-contain opacity-45 mix-blend-screen"
            />
            <div className="pointer-events-none absolute -right-9 -top-9 h-32 w-32 rounded-full bg-[#ffc268]/[.16] blur-3xl" />
            <div className="relative z-10 flex h-full max-w-[13rem] flex-col">
              <div className="flex items-center gap-2 text-[#ffe0a5]">
                <img
                  src={crossedKatanas}
                  alt=""
                  aria-hidden="true"
                  className="h-6 w-6 shrink-0 object-contain opacity-85 drop-shadow-[0_0_10px_rgba(255,194,104,.18)]"
                />
                <p className="text-[9px] font-bold uppercase tracking-[.2em]">
                  Dojo cabinet
                </p>
              </div>
              <h2 className="mt-3 text-xl font-bold leading-tight text-white">
                Keep the tools that matter.
              </h2>
              <p className="mt-3 text-xs leading-5 text-white/52">
                Save an important link, reference, or quiet note without turning
                it into a task.
              </p>
              <Button
                onClick={() => openCabinetDialog()}
                className="signal-button mt-auto h-11 w-full gap-2 rounded-2xl bg-[#ffc268] text-[10px] font-bold uppercase tracking-[.14em] text-[#17120a] shadow-[0_10px_24px_rgba(255,194,104,.16)] hover:bg-[#ffd486]"
              >
                <Plus className="h-4 w-4" /> Add tool
              </Button>
            </div>
          </section>
        </aside>
      </section>

      <section className="signal-surface overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92">
        <div className="flex flex-col gap-4 border-b border-white/[.06] p-6 md:flex-row md:items-end md:justify-between md:p-7">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#ffc268]">
              Tools kept
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Dojo cabinet</h2>
            <p className="mt-2 text-sm text-white/42">
              A separate place for important links, references, and small notes.
              Add them freely; a period reflection can be linked only when it
              adds useful context.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-white/42">
              {cabinetItems.length} kept
            </span>
            <Button
              onClick={() => openCabinetDialog()}
              className="signal-button h-10 gap-2 rounded-xl bg-[#ffc268] px-3 text-[9px] font-bold uppercase tracking-[.14em] text-[#17120a] hover:bg-[#ffd486]"
            >
              <Plus className="h-3.5 w-3.5" /> Add tool
            </Button>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 md:p-7">
          {cabinetItems.length ? (
            cabinetItems.map((item: DojoCabinetItem) => (
              <article
                key={item.id}
                className="group flex min-h-36 flex-col rounded-2xl border border-white/[.08] bg-white/[.025] p-4 transition-colors hover:border-[#ffc268]/30 hover:bg-white/[.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2 text-[#ffc268]">
                    <Link2 className="h-4 w-4 shrink-0" />
                    <p className="truncate text-sm font-semibold text-white">
                      {item.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Remove this cabinet item?"))
                        deleteCabinetItem.mutate(
                          { id: item.id },
                          { onSuccess: invalidateCabinet },
                        );
                    }}
                    className="p-1 text-white/20 opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#ff8b7c]"
                    aria-label={`Remove ${item.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {item.note && (
                  <p className="mt-3 line-clamp-3 text-xs leading-5 text-white/43">
                    {item.note}
                  </p>
                )}
                <div className="mt-auto pt-4">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[.14em] text-[#ffc268] hover:text-[#ffe0a5]"
                    >
                      Open reference <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-[.14em] text-white/28">
                      Quiet note
                    </span>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full relative overflow-hidden rounded-2xl border border-dashed border-[#ffc268]/20 bg-[linear-gradient(100deg,rgba(255,194,104,.05),transparent_48%,rgba(98,188,168,.045))] px-6 py-12 text-center">
              <img
                src={armoryRoom}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 right-7 hidden h-[18rem] w-auto opacity-20 mix-blend-screen md:block"
              />
              <Archive className="relative mx-auto h-9 w-9 text-[#ffc268]/48" />
              <p className="relative mt-4 text-base font-semibold text-white/68">
                The cabinet is empty.
              </p>
              <p className="relative mx-auto mt-1 max-w-md text-xs leading-5 text-white/36">
                Keep the first important link, reference, or quiet note here.
                You can link it to a period reflection later when that context
                matters.
              </p>
              <Button
                onClick={() => openCabinetDialog()}
                className="signal-button relative mt-5 h-10 gap-2 rounded-xl bg-[#ffc268] px-4 text-[10px] font-bold uppercase tracking-[.14em] text-[#17120a] hover:bg-[#ffd486]"
              >
                <Plus className="h-4 w-4" /> Keep first tool
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="signal-surface overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92">
        <div className="border-b border-white/[.06] p-6 md:p-7">
          <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#ff9a89]">
            Session traces
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Notes that make the next return lighter
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">
            These are optional notes from finished sessions. They stay quiet
            until a detail, learning, or next step is worth finding again.
          </p>
        </div>
      </section>

      <SessionNotes embedded />

      <Dialog
        open={dialog === "reminder"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent className="max-w-xl rounded-3xl border-white/10 bg-[#090d14] p-7 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {editingAlert ? "Tune quiet reminder" : "Set daily reminder"}
            </DialogTitle>
            <DialogDescription className="text-white/42">
              This is an in-app return cue. It appears only while Open Finish is
              open.
            </DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-5" onSubmit={saveReminder}>
            <label className="block space-y-2">
              <Label>Direction</Label>
              <select
                value={reminderForm.activityId}
                onChange={(event) =>
                  setReminderForm({
                    ...reminderForm,
                    activityId: Number(event.target.value),
                  })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm text-white"
              >
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={reminderForm.timeOfDay}
                  onChange={(event) =>
                    setReminderForm({
                      ...reminderForm,
                      timeOfDay: event.target.value,
                    })
                  }
                  className="border-white/10 bg-white/[.04] text-white"
                />
              </label>
              <label className="block space-y-2">
                <Label>Message</Label>
                <Input
                  value={reminderForm.message}
                  onChange={(event) =>
                    setReminderForm({
                      ...reminderForm,
                      message: event.target.value,
                    })
                  }
                  className="border-white/10 bg-white/[.04] text-white"
                />
              </label>
            </div>
            <div>
              <Label>Days</Label>
              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {DAYS.map((day, index) => {
                  const active = reminderForm.daysOfWeek.includes(index);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setReminderForm({
                          ...reminderForm,
                          daysOfWeek: active
                            ? reminderForm.daysOfWeek.filter(
                                (value) => value !== index,
                              )
                            : [...reminderForm.daysOfWeek, index].sort(),
                        })
                      }
                      className={`signal-button rounded-xl border py-2 text-[9px] font-bold uppercase tracking-[.12em] ${active ? "border-[#ff7868]/60 bg-[#ff7868]/15 text-[#ffb1a7]" : "border-white/[.08] text-white/35 hover:text-white"}`}
                    >
                      {day.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialog(null)}
                className="text-white/55"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAlert.isPending || updateAlert.isPending}
                className="signal-button bg-[#e95448] text-white hover:bg-[#f26456]"
              >
                {editingAlert ? "Save" : "Set reminder"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "milestone"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent className="max-w-xl rounded-3xl border-white/10 bg-[#090d14] p-7 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Set a deadline
            </DialogTitle>
            <DialogDescription className="text-white/42">
              A clear mark for the week, month, or a personally chosen date.
            </DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-5" onSubmit={saveMilestone}>
            <label className="block space-y-2">
              <Label>What needs a clear finish?</Label>
              <Input
                autoFocus
                value={milestoneForm.title}
                onChange={(event) =>
                  setMilestoneForm({
                    ...milestoneForm,
                    title: event.target.value,
                  })
                }
                className="border-white/10 bg-white/[.04] text-white"
                placeholder="Finish the first draft"
              />
            </label>
            <label className="block space-y-2">
              <Label>Why it matters (optional)</Label>
              <Textarea
                value={milestoneForm.detail ?? ""}
                onChange={(event) =>
                  setMilestoneForm({
                    ...milestoneForm,
                    detail: event.target.value,
                  })
                }
                className="min-h-20 border-white/10 bg-white/[.04] text-white"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <Label>Timeframe</Label>
                <select
                  value={milestoneForm.period}
                  onChange={(event) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      period: event.target.value as MilestoneInput["period"],
                    })
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm text-white"
                >
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="custom">Personal date</option>
                </select>
              </label>
              <label className="block space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={milestoneForm.dueDate}
                  onChange={(event) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      dueDate: event.target.value,
                    })
                  }
                  className="border-white/10 bg-white/[.04] text-white"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialog(null)}
                className="text-white/55"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMilestone.isPending}
                className="signal-button bg-[#e95448] text-white hover:bg-[#f26456]"
              >
                Place deadline
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "cabinet"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent className="max-w-xl rounded-3xl border-white/10 bg-[#090d14] p-7 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Place in the dojo cabinet
            </DialogTitle>
            <DialogDescription className="text-white/42">
              {cabinetReflectionId
                ? "This tool will be linked to the selected period reflection."
                : "Keep an important link, reference, or note independently from your reflections."}
            </DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-5" onSubmit={saveCabinetItem}>
            <label className="block space-y-2">
              <Label>Title</Label>
              <Input
                autoFocus
                value={cabinetForm.title}
                onChange={(event) =>
                  setCabinetForm({ ...cabinetForm, title: event.target.value })
                }
                className="border-white/10 bg-white/[.04] text-white"
                placeholder="Article, tool, or small note"
              />
            </label>
            <label className="block space-y-2">
              <Label>Link (optional)</Label>
              <Input
                value={cabinetForm.url}
                onChange={(event) =>
                  setCabinetForm({ ...cabinetForm, url: event.target.value })
                }
                className="border-white/10 bg-white/[.04] text-white"
                placeholder="https://…"
              />
            </label>
            <label className="block space-y-2">
              <Label>What to remember</Label>
              <Textarea
                value={cabinetForm.note}
                onChange={(event) =>
                  setCabinetForm({ ...cabinetForm, note: event.target.value })
                }
                className="min-h-24 border-white/10 bg-white/[.04] text-white"
                placeholder="A short reason it is worth keeping."
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialog(null)}
                className="text-white/55"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCabinetItem.isPending}
                className="signal-button bg-[#ffc268] text-[#17120a] hover:bg-[#ffd486]"
              >
                Keep tool
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={reflectionOpen} onOpenChange={setReflectionOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-white/10 bg-[#090d14] p-7 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {activeMilestone
                ? `Reflection · ${activeMilestone.title}`
                : "Period reflection"}
            </DialogTitle>
            <DialogDescription className="text-white/42">
              A quiet trace of what the period revealed — not another activity
              note.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-5">
            <label className="block space-y-2">
              <Label>What mattered?</Label>
              <Textarea
                value={reflectionDraft.notice}
                onChange={(event) =>
                  setReflectionDraft({
                    ...reflectionDraft,
                    notice: event.target.value,
                  })
                }
                className="min-h-28 border-white/10 bg-white/[.04] text-white"
                placeholder="The line you noticed across this period."
              />
            </label>
            <label className="block space-y-2">
              <Label>What remains open?</Label>
              <Textarea
                value={reflectionDraft.carry}
                onChange={(event) =>
                  setReflectionDraft({
                    ...reflectionDraft,
                    carry: event.target.value,
                  })
                }
                className="min-h-28 border-white/10 bg-white/[.04] text-white"
                placeholder="A carry-forward, not a task list."
              />
            </label>
            <div className="flex flex-wrap justify-between gap-3 border-t border-white/[.08] pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (selectedReflection?.id) {
                    setReflectionOpen(false);
                    openCabinetDialog(selectedReflection.id);
                    return;
                  }
                  saveReflection(true);
                }}
                disabled={putReflection.isPending}
                className="signal-button gap-2 rounded-xl border-[#ffc268]/25 text-[#ffe0a5] hover:bg-[#ffc268]/10"
              >
                <BookOpen className="h-4 w-4" /> Add tool to cabinet
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setReflectionOpen(false)}
                  className="text-white/55"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => saveReflection()}
                  disabled={putReflection.isPending}
                  className="signal-button bg-[#e95448] text-white hover:bg-[#f26456]"
                >
                  Save reflection
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
