import { useEffect, useMemo, useState } from "react";
import readingRoom from "@/assets/environments/optimized/cabinet-reading-room.webp";
import armoryRoom from "@/assets/environments/optimized/cabinet-armory-room.webp";
import verticalOrnament from "@/assets/patterns/japanese-ornament-transparent-v2-cropped.webp";
import seatedSamuraiSignal from "@/assets/icons/seated-samurai-signal.png";
import { SessionNotes } from "./reflections";
import { SessionRecordsPanel } from "@/components/session-records-panel";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  startOfDay,
} from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListAlertsQueryKey,
  getListActivitiesQueryKey,
  getListDojoCabinetQueryKey,
  getListMilestonesQueryKey,
  getListSprintsQueryKey,
  getPeriodReflectionQueryKey,
  useCreateAlert,
  useCreateDojoCabinetItem,
  useCreateMilestone,
  useCreateSprint,
  useDeleteAlert,
  useDeleteDojoCabinetItem,
  useDeleteMilestone,
  useListAlerts,
  useListActivities,
  useListDojoCabinet,
  useListMilestones,
  useListSprints,
  usePeriodReflection,
  usePutPeriodReflection,
  useUpdateAlert,
  useUpdateDojoCabinetItem,
  useUpdateMilestone,
  useUpdateSprint,
  useUpdateSprintStep,
  useDeleteSprint,
  type Alert,
  type AlertInput,
  type DojoCabinetKind,
  type DojoCabinetItem,
  type Milestone,
  type MilestoneInput,
  type Sprint,
  type SprintInput,
  type SprintStepKind,
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
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  BellOff,
  BookOpen,
  CalendarClock,
  Check,
  ChevronRight,
  ExternalLink,
  GripVertical,
  Github,
  Link2,
  ListChecks,
  Pencil,
  Pause,
  Plus,
  RotateCcw,
  Route,
  ScrollText,
  Trash2,
} from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COURSE_REPOSITORIES = [
  {
    id: "classic-ml-dl",
    title: "Classic ML + DL",
    slug: "EternalHubris1/classic-ml-dl-course",
    url: "https://github.com/EternalHubris1/classic-ml-dl-course",
    note: "Private offline archive of the Classic ML + DL course.",
  },
  {
    id: "agents",
    title: "AI Agents",
    slug: "EternalHubris1/agents-course",
    url: "https://github.com/EternalHubris1/agents-course",
    note: "Private offline archive of the Agents course.",
  },
] as const;

function repositoryKey(value: string | null | undefined) {
  return (
    value
      ?.trim()
      .replace(/\.git$/i, "")
      .replace(/\/$/, "")
      .toLowerCase() ?? ""
  );
}

type DialogKind = "reminder" | "milestone" | "sprint" | "cabinet" | null;

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

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function shiftDate(value: string, amount: number): string {
  return format(addDays(new Date(`${value}T00:00:00`), amount), "yyyy-MM-dd");
}

function sprintDayCount(startDate: string, dueDate: string): number {
  if (!startDate || !dueDate) return 0;
  const value =
    differenceInCalendarDays(
      new Date(`${dueDate}T00:00:00`),
      new Date(`${startDate}T00:00:00`),
    ) + 1;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

const previewSprints: Sprint[] = [
  {
    id: 901,
    activityId: null,
    activityName: "Writing",
    title: "Finish the methods chapter",
    outcome: "A complete draft ready for one editorial pass.",
    startDate: "2026-09-07",
    dueDate: "2026-09-13",
    status: "active",
    createdAt: "2026-09-07T08:00:00.000Z",
    completedAt: null,
    steps: [
      {
        id: 1901,
        sprintId: 901,
        title: "Rebuild the argument map",
        kind: "task",
        plannedDate: "2026-09-07",
        position: 0,
        status: "complete",
        completedAt: "2026-09-07T18:00:00.000Z",
      },
      {
        id: 1902,
        sprintId: 901,
        title: "Recovery and reading",
        kind: "buffer",
        plannedDate: "2026-09-09",
        position: 1,
        status: "pending",
        completedAt: null,
      },
      {
        id: 1903,
        sprintId: 901,
        title: "Write the comparative section",
        kind: "task",
        plannedDate: "2026-09-10",
        position: 2,
        status: "pending",
        completedAt: null,
      },
    ],
  },
];

const previewCabinetItems: DojoCabinetItem[] = [
  {
    id: 2901,
    periodReflectionId: null,
    title: "Classic ML + DL",
    url: COURSE_REPOSITORIES[0].url,
    note: COURSE_REPOSITORIES[0].note,
    kind: "repository",
    position: 0,
    createdAt: "2026-09-22T20:00:00.000Z",
  },
  {
    id: 2902,
    periodReflectionId: null,
    title: "AI Agents",
    url: COURSE_REPOSITORIES[1].url,
    note: COURSE_REPOSITORIES[1].note,
    kind: "repository",
    position: 1,
    createdAt: "2026-09-22T20:05:00.000Z",
  },
  {
    id: 2903,
    periodReflectionId: null,
    title: "Advanced Angdan · tower course",
    url: "https://example.com/course",
    note: "Primary course workspace.",
    kind: "link",
    position: 2,
    createdAt: "2026-09-23T08:00:00.000Z",
  },
  {
    id: 2904,
    periodReflectionId: null,
    title: "Mathematics for DS",
    url: "https://example.com/math",
    note: "Reference playlist.",
    kind: "link",
    position: 3,
    createdAt: "2026-09-23T08:05:00.000Z",
  },
  {
    id: 2905,
    periodReflectionId: null,
    title: "Semester notes",
    url: null,
    note: "Return to the first semester summary before planning the next block.",
    kind: "note",
    position: 4,
    createdAt: "2026-09-23T08:10:00.000Z",
  },
];

export default function Cabinet() {
  const preview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("preview");
  const alertsQuery = useListAlerts({
    query: { enabled: !preview, queryKey: getListAlertsQueryKey() },
  });
  const activitiesQuery = useListActivities({
    query: { enabled: !preview, queryKey: getListActivitiesQueryKey() },
  });
  const milestonesQuery = useListMilestones({
    query: { enabled: !preview, queryKey: getListMilestonesQueryKey() },
  });
  const sprintsQuery = useListSprints({
    query: { enabled: !preview, queryKey: getListSprintsQueryKey() },
  });
  const cabinetQuery = useListDojoCabinet({
    query: { enabled: !preview, queryKey: getListDojoCabinetQueryKey() },
  });
  const alerts = Array.isArray(alertsQuery.data) ? alertsQuery.data : [];
  const activities = Array.isArray(activitiesQuery.data)
    ? activitiesQuery.data
    : [];
  const milestones = Array.isArray(milestonesQuery.data)
    ? milestonesQuery.data
    : [];
  const sprints = preview
    ? previewSprints
    : Array.isArray(sprintsQuery.data)
      ? sprintsQuery.data
      : [];
  const cabinetItems = preview
    ? previewCabinetItems
    : Array.isArray(cabinetQuery.data)
      ? cabinetQuery.data
      : [];
  const alertsLoading = !preview && alertsQuery.isLoading;
  const activitiesLoading = !preview && activitiesQuery.isLoading;
  const milestonesLoading = !preview && milestonesQuery.isLoading;
  const sprintsLoading = !preview && sprintsQuery.isLoading;
  const cabinetLoading = !preview && cabinetQuery.isLoading;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();
  const createMilestone = useCreateMilestone();
  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const updateSprintStep = useUpdateSprintStep();
  const deleteSprint = useDeleteSprint();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const createCabinetItem = useCreateDojoCabinetItem();
  const updateCabinetItem = useUpdateDojoCabinetItem();
  const deleteCabinetItem = useDeleteDojoCabinetItem();
  const putReflection = usePutPeriodReflection();

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null,
  );
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editingCabinetItem, setEditingCabinetItem] =
    useState<DojoCabinetItem | null>(null);
  const [draggedSprintStep, setDraggedSprintStep] = useState<number | null>(
    null,
  );
  const [sprintError, setSprintError] = useState("");
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
  const [sprintForm, setSprintForm] = useState<SprintInput>(() => {
    const today = new Date();
    return {
      activityId: null,
      title: "",
      outcome: "",
      startDate: format(today, "yyyy-MM-dd"),
      dueDate: format(addDays(today, 2), "yyyy-MM-dd"),
      steps: [0, 1, 2].map((offset) => ({
        title: "",
        kind: "task" as const,
        plannedDate: format(addDays(today, offset), "yyyy-MM-dd"),
      })),
    };
  });
  const [cabinetForm, setCabinetForm] = useState<{
    title: string;
    url: string;
    note: string;
    kind: DojoCabinetKind;
  }>({
    title: "",
    url: "",
    note: "",
    kind: "link",
  });
  const [cabinetError, setCabinetError] = useState("");
  const [repositoryError, setRepositoryError] = useState("");
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
    () => milestones.filter((milestone) => milestone.status !== "open"),
    [milestones],
  );
  const activeSprints = useMemo(
    () => sprints.filter((sprint) => sprint.status === "active"),
    [sprints],
  );
  const completeSprints = useMemo(
    () => sprints.filter((sprint) => sprint.status !== "active"),
    [sprints],
  );
  const cabinetLinks = useMemo(
    () => cabinetItems.filter((item) => Boolean(item.url)),
    [cabinetItems],
  );
  const cabinetNotes = useMemo(
    () => cabinetItems.filter((item) => !item.url),
    [cabinetItems],
  );
  const repositoriesByUrl = useMemo(
    () =>
      new Map(
        cabinetItems.flatMap((item) => {
          const key = repositoryKey(item.url);
          return key ? [[key, item] as const] : [];
        }),
      ),
    [cabinetItems],
  );
  const otherCabinetLinks = useMemo(
    () =>
      cabinetLinks.filter(
        (item) =>
          !COURSE_REPOSITORIES.some(
            (repository) =>
              repositoryKey(repository.url) === repositoryKey(item.url),
          ),
      ),
    [cabinetLinks],
  );

  const invalidateCabinet = () => {
    void queryClient.invalidateQueries({
      queryKey: getListMilestonesQueryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: getListDojoCabinetQueryKey(),
    });
  };

  const invalidateSprints = () =>
    void queryClient.invalidateQueries({ queryKey: getListSprintsQueryKey() });

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

  const openCabinetDialog = (
    periodReflectionId: number | null = null,
    item: DojoCabinetItem | null = null,
    kind: DojoCabinetKind = "link",
  ) => {
    setCabinetReflectionId(item?.periodReflectionId ?? periodReflectionId);
    setEditingCabinetItem(item);
    setCabinetError("");
    setCabinetForm(
      item
        ? {
            title: item.title,
            url: item.url ?? "",
            note: item.note,
            kind: item.kind,
          }
        : { title: "", url: "", note: "", kind },
    );
    setDialog("cabinet");
  };

  const openMilestoneDialog = (milestone?: Milestone) => {
    setEditingMilestone(milestone ?? null);
    setMilestoneForm(
      milestone
        ? {
            title: milestone.title,
            detail: milestone.detail ?? "",
            period: milestone.period,
            dueDate: milestone.dueDate,
          }
        : {
            title: "",
            detail: "",
            period: "week",
            dueDate: format(new Date(), "yyyy-MM-dd"),
          },
    );
    setDialog("milestone");
  };

  const openSprintDialog = (sprint?: Sprint) => {
    setEditingSprint(sprint ?? null);
    setSprintError("");
    setDraggedSprintStep(null);
    if (sprint) {
      setSprintForm({
        activityId: sprint.activityId,
        title: sprint.title,
        outcome: sprint.outcome,
        startDate: sprint.startDate,
        dueDate: sprint.dueDate,
        steps: sprint.steps.map((step) => ({
          id: step.id,
          title: step.title,
          kind: step.kind,
          plannedDate: step.plannedDate,
          status: step.status,
        })),
      });
    } else {
      const today = new Date();
      setSprintForm({
        activityId: null,
        title: "",
        outcome: "",
        startDate: format(today, "yyyy-MM-dd"),
        dueDate: format(addDays(today, 2), "yyyy-MM-dd"),
        steps: [0, 1, 2].map((offset) => ({
          title: "",
          kind: "task" as const,
          plannedDate: format(addDays(today, offset), "yyyy-MM-dd"),
        })),
      });
    }
    setDialog("sprint");
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
    const options = {
      onSuccess: () => {
        invalidateCabinet();
        setDialog(null);
        setEditingMilestone(null);
        toast({
          title: editingMilestone ? "Deadline updated" : "Deadline saved",
        });
      },
      onError: () =>
        toast({ title: "Couldn’t save deadline", variant: "destructive" }),
    };
    if (editingMilestone) {
      updateMilestone.mutate(
        { id: editingMilestone.id, data: milestoneForm },
        options,
      );
    } else {
      createMilestone.mutate(milestoneForm, options);
    }
  };

  const saveSprint = (event: React.FormEvent) => {
    event.preventDefault();
    setSprintError("");
    const steps = sprintForm.steps.map((step) => ({
      ...step,
      title: step.title.trim(),
      kind: step.kind ?? "task",
    }));
    if (!sprintForm.title.trim()) {
      setSprintError("Name the sprint before saving it.");
      return;
    }
    if (!steps.some((step) => step.kind === "task")) {
      setSprintError("Keep at least one task in the sprint route.");
      return;
    }
    const unnamedTask = steps.findIndex(
      (step) => step.kind === "task" && !step.title,
    );
    if (unnamedTask >= 0) {
      setSprintError(
        `Task ${unnamedTask + 1} needs a name, or change it to an open day.`,
      );
      return;
    }
    if (sprintForm.startDate > sprintForm.dueDate) {
      setSprintError("The sprint cannot end before it starts.");
      return;
    }
    if (
      steps.some(
        (step) =>
          step.plannedDate < sprintForm.startDate ||
          step.plannedDate > sprintForm.dueDate,
      )
    ) {
      setSprintError("Every route item must stay inside the sprint dates.");
      return;
    }
    const options = {
      onSuccess: () => {
        invalidateSprints();
        setDialog(null);
        setEditingSprint(null);
        setSprintError("");
        toast({
          title: editingSprint ? "Sprint updated" : "Sprint path opened",
        });
      },
      onError: () => {
        setSprintError(
          "The sprint was not saved. Review the route and try again.",
        );
        toast({
          title: editingSprint
            ? "Couldn’t update sprint"
            : "Couldn’t open sprint",
          variant: "destructive" as const,
        });
      },
    };
    if (editingSprint) {
      updateSprint.mutate(
        { id: editingSprint.id, data: { ...sprintForm, steps } },
        options,
      );
    } else {
      createSprint.mutate({ ...sprintForm, steps }, options);
    }
  };

  const moveSprintStep = (from: number, to: number) => {
    setSprintForm((current) => ({
      ...current,
      steps: moveItem(current.steps, from, to),
    }));
    setSprintError("");
  };

  const addSprintStep = (kind: SprintStepKind) => {
    setSprintForm((current) => {
      const lastDate = current.steps.at(-1)?.plannedDate ?? current.startDate;
      const plannedDate = kind === "buffer" ? shiftDate(lastDate, 1) : lastDate;
      return {
        ...current,
        dueDate: plannedDate > current.dueDate ? plannedDate : current.dueDate,
        steps: [...current.steps, { title: "", kind, plannedDate }],
      };
    });
    setSprintError("");
  };

  const shiftSprint = (amount: number) => {
    setSprintForm((current) => ({
      ...current,
      startDate: shiftDate(current.startDate, amount),
      dueDate: shiftDate(current.dueDate, amount),
      steps: current.steps.map((step) => ({
        ...step,
        plannedDate: shiftDate(step.plannedDate, amount),
      })),
    }));
    setSprintError("");
  };

  const updateSprintStepDate = (index: number, plannedDate: string) => {
    if (!plannedDate) return;
    setSprintForm((current) => ({
      ...current,
      startDate:
        plannedDate < current.startDate ? plannedDate : current.startDate,
      dueDate: plannedDate > current.dueDate ? plannedDate : current.dueDate,
      steps: current.steps.map((step, itemIndex) =>
        itemIndex === index ? { ...step, plannedDate } : step,
      ),
    }));
    setSprintError("");
  };

  const setSprintStatus = (sprint: Sprint, status: Sprint["status"]) => {
    updateSprint.mutate(
      { id: sprint.id, data: { status } },
      {
        onSuccess: () => {
          invalidateSprints();
          toast({
            title:
              status === "active"
                ? "Sprint returned to active practice"
                : status === "archived"
                  ? "Sprint moved to past paths"
                  : "Sprint completed",
          });
        },
        onError: () =>
          toast({ title: "Couldn’t update sprint", variant: "destructive" }),
      },
    );
  };

  const saveCabinetItem = (event: React.FormEvent) => {
    event.preventDefault();
    setCabinetError("");
    if (!cabinetForm.title.trim()) {
      setCabinetError("Give this item a short name.");
      return;
    }
    if (cabinetForm.kind === "repository" && !cabinetForm.url.trim()) {
      setCabinetError("A repository needs its GitHub address.");
      return;
    }
    const options = {
      onSuccess: () => {
        invalidateCabinet();
        setDialog(null);
        setEditingCabinetItem(null);
        setCabinetForm({ title: "", url: "", note: "", kind: "link" as const });
        toast({
          title: editingCabinetItem
            ? "Cabinet item updated"
            : cabinetForm.kind === "repository"
              ? "Repository kept close"
              : "Placed in the dojo cabinet",
        });
      },
      onError: () =>
        setCabinetError(
          "This item could not be saved. Check the address and try again.",
        ),
    };
    if (editingCabinetItem) {
      updateCabinetItem.mutate(
        {
          id: editingCabinetItem.id,
          data: {
            ...cabinetForm,
            periodReflectionId: cabinetReflectionId,
          },
        },
        options,
      );
      return;
    }
    createCabinetItem.mutate(
      {
        ...cabinetForm,
        periodReflectionId: cabinetReflectionId,
        position: cabinetItems.length,
      },
      options,
    );
  };

  const toggleCourseRepository = (
    repository: (typeof COURSE_REPOSITORIES)[number],
  ) => {
    const selected = repositoriesByUrl.get(repositoryKey(repository.url));
    setRepositoryError("");
    if (selected) {
      deleteCabinetItem.mutate(
        { id: selected.id },
        {
          onSuccess: () => {
            invalidateCabinet();
            toast({
              title: `${repository.title} removed from the quick shelf`,
            });
          },
          onError: () =>
            setRepositoryError(
              "The repository could not be removed. Try again.",
            ),
        },
      );
      return;
    }
    createCabinetItem.mutate(
      {
        title: repository.title,
        url: repository.url,
        note: repository.note,
        kind: "repository",
        position: cabinetItems.length,
      },
      {
        onSuccess: () => {
          invalidateCabinet();
          toast({ title: `${repository.title} added to the quick shelf` });
        },
        onError: () =>
          setRepositoryError(
            "The repository could not be added. Check the connection and try again.",
          ),
      },
    );
  };

  const removeCabinetItem = () => {
    if (!editingCabinetItem) return;
    if (
      !window.confirm(`Remove “${editingCabinetItem.title}” from the cabinet?`)
    )
      return;
    setCabinetError("");
    deleteCabinetItem.mutate(
      { id: editingCabinetItem.id },
      {
        onSuccess: () => {
          invalidateCabinet();
          setDialog(null);
          setEditingCabinetItem(null);
          toast({ title: "Cabinet item removed" });
        },
        onError: () =>
          setCabinetError("This item could not be removed. Try again."),
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
      {
        onSuccess: () => {
          invalidateCabinet();
          toast({
            title:
              milestone.status === "complete"
                ? "Deadline reopened"
                : "Deadline completed",
          });
        },
        onError: () =>
          toast({ title: "Couldn’t update deadline", variant: "destructive" }),
      },
    );
  };

  const setMilestoneStatus = (
    milestone: Milestone,
    status: Milestone["status"],
  ) => {
    updateMilestone.mutate(
      { id: milestone.id, data: { status } },
      {
        onSuccess: () => {
          invalidateCabinet();
          toast({
            title:
              status === "open"
                ? "Deadline returned to active practice"
                : "Deadline moved to past paths",
          });
        },
        onError: () =>
          toast({ title: "Couldn’t update deadline", variant: "destructive" }),
      },
    );
  };

  const loading =
    alertsLoading ||
    activitiesLoading ||
    milestonesLoading ||
    sprintsLoading ||
    cabinetLoading;
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
    <div className="page-arrival cabinet-room-line relative z-10 mx-auto min-h-screen max-w-6xl space-y-8 overflow-hidden px-4 py-6 pb-28 md:p-8 md:pb-20">
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-[#ffc268]/15 bg-[radial-gradient(circle_at_72%_24%,rgba(255,194,104,.16),transparent_26%),linear-gradient(125deg,rgba(16,22,33,.98),rgba(10,15,23,.94)_58%,rgba(76,38,37,.58))] px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_54px_rgba(0,0,0,.24)] md:px-8 md:py-8">
        <img
          src={readingRoom}
          alt=""
          aria-hidden="true"
          className="room-motif-image pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[48%] select-none object-cover object-center md:block"
          style={{
            opacity: 0.72,
            filter: "brightness(1.18) contrast(0.98) saturate(0.94)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,20,.72)_0%,rgba(8,13,20,.28)_54%,rgba(8,13,20,.04)_100%)]" />
        <div className="relative z-10 flex flex-col gap-6 md:pr-52 lg:pr-64">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-[#ffb1a7]">
              <img
                src={seatedSamuraiSignal}
                alt=""
                aria-hidden="true"
                className="h-7 w-7 shrink-0 object-contain opacity-72 grayscale brightness-[1.62] contrast-[.8] drop-shadow-[0_0_6px_rgba(255,177,167,.08)]"
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
              onClick={() => openSprintDialog()}
              className="signal-button h-11 gap-2 rounded-2xl border border-[#72c6b3]/35 bg-[#14302f] px-4 text-[10px] font-bold uppercase tracking-[.14em] text-[#b8f1e5] shadow-[0_10px_24px_rgba(36,150,132,.16)] transition-[transform,background-color,box-shadow,border-color] duration-150 hover:bg-[#1a403d] active:scale-[.97]"
            >
              <Route className="h-4 w-4" /> Open sprint
            </Button>
            <Button
              onClick={() => openMilestoneDialog()}
              className="signal-button h-11 gap-2 rounded-2xl border border-[#ff9a89]/30 bg-[#e95448] px-4 text-[10px] font-bold uppercase tracking-[.14em] text-white shadow-[0_10px_24px_rgba(233,84,72,.22)] transition-[transform,background-color,box-shadow,border-color] duration-150 hover:bg-[#f26456] hover:shadow-[0_14px_30px_rgba(233,84,72,.3)] active:scale-[.97]"
            >
              <Plus className="h-4 w-4" /> Set deadline
            </Button>
            <Button
              variant="outline"
              onClick={() => openReminderDialog()}
              className="signal-button h-11 gap-2 rounded-2xl border border-white/[.14] bg-white/[.055] px-4 text-[10px] font-bold uppercase tracking-[.14em] text-white/80 transition-[transform,background-color,box-shadow,border-color] duration-150 hover:border-[#ffc268]/45 hover:bg-[#ffc268]/10 hover:text-white hover:shadow-[0_12px_26px_rgba(0,0,0,.18)] active:scale-[.97]"
            >
              <Bell className="h-4 w-4" /> Daily reminder
            </Button>
            <Button
              variant="ghost"
              onClick={() => openCabinetDialog()}
              className="signal-button h-11 gap-2 rounded-2xl border border-[#ffc268]/22 bg-[#ffc268]/[.06] px-4 text-[10px] font-bold uppercase tracking-[.14em] text-[#ffe0a5] transition-[transform,background-color,box-shadow,border-color] duration-150 hover:border-[#ffc268]/48 hover:bg-[#ffc268]/12 hover:text-[#fff2cb] hover:shadow-[0_12px_26px_rgba(255,194,104,.12)] active:scale-[.97]"
            >
              <Archive className="h-4 w-4" /> Add tool
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.42fr)_minmax(18rem,.78fr)]">
        <div className="signal-surface overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92">
          <div className="relative isolate overflow-hidden flex items-start justify-between gap-4 border-b border-white/[.06] p-6 md:p-7">
            <div className="relative z-10">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#ff9a89]">
                Period reflections
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Sprints & deadlines
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/42">
                Shape a multi-day route when an outcome needs structure. Keep
                space for recovery, parallel work, and changing priorities.
              </p>
            </div>
            <span className="relative z-10 shrink-0 rounded-full border border-[#ffc268]/20 bg-[#ffc268]/[.08] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#ffe0a5]">
              {activeSprints.length + openMilestones.length} open
            </span>
          </div>
          <div className="border-b border-white/[.06] bg-[linear-gradient(135deg,rgba(32,112,103,.1),transparent_58%)] p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#72c6b3]">
                  Flexible routes
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  Active sprints
                </h3>
              </div>
              <Button
                variant="outline"
                onClick={() => openSprintDialog()}
                className="signal-button h-9 gap-2 rounded-xl border-[#72c6b3]/25 bg-[#72c6b3]/[.06] px-3 text-[9px] font-bold uppercase tracking-[.13em] text-[#9ee3d5] hover:bg-[#72c6b3]/12"
              >
                <Plus className="h-3.5 w-3.5" /> Sprint
              </Button>
            </div>
            {activeSprints.length ? (
              <div className="space-y-3">
                {activeSprints.map((sprint) => {
                  const taskSteps = sprint.steps.filter(
                    (step) => step.kind === "task",
                  ).length;
                  const completeCount = sprint.steps.filter(
                    (step) =>
                      step.kind === "task" && step.status === "complete",
                  ).length;
                  return (
                    <article
                      key={sprint.id}
                      className="overflow-hidden rounded-2xl border border-[#72c6b3]/16 bg-[#071315]/72"
                    >
                      <div className="flex items-start justify-between gap-4 px-4 pb-3 pt-4 md:px-5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-white">
                              {sprint.title}
                            </h4>
                            {sprint.activityName && (
                              <span className="text-[8px] font-bold uppercase tracking-[.14em] text-[#72c6b3]">
                                {sprint.activityName}
                              </span>
                            )}
                          </div>
                          {sprint.outcome && (
                            <p className="mt-1 text-xs leading-5 text-white/38">
                              {sprint.outcome}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openSprintDialog(sprint)}
                            className="signal-button rounded-lg p-2 text-white/35 hover:bg-white/5 hover:text-white"
                            aria-label={`Edit ${sprint.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSprintStatus(sprint, "archived")}
                            className="signal-button rounded-lg p-2 text-white/28 hover:bg-[#ffc268]/10 hover:text-[#ffc268]"
                            aria-label={`Move ${sprint.title} to past paths`}
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Remove this sprint?"))
                                deleteSprint.mutate(
                                  { id: sprint.id },
                                  { onSuccess: invalidateSprints },
                                );
                            }}
                            className="rounded-lg p-2 text-white/20 hover:bg-white/5 hover:text-[#ff8b7c]"
                            aria-label={`Remove ${sprint.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div
                        className="grid gap-px border-y border-white/[.06] bg-white/[.05]"
                        style={{
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(min(100%, 7.5rem), 1fr))",
                        }}
                      >
                        {sprint.steps.map((step, index) => {
                          const buffer = step.kind === "buffer";
                          const complete = step.status === "complete";
                          const pending = updateSprintStep.isPending;
                          if (buffer) {
                            return (
                              <div
                                key={step.id}
                                className="min-h-16 bg-[linear-gradient(135deg,rgba(114,198,179,.04),rgba(255,194,104,.035))] px-2 py-2 text-left"
                                aria-label={`${step.title || "Open day"}, ${format(new Date(`${step.plannedDate}T00:00:00`), "EEEE, MMMM d")}`}
                              >
                                <span className="block font-mono text-[8px] uppercase tracking-[.12em] text-[#ffc268]/60">
                                  Open ·{" "}
                                  {format(
                                    new Date(`${step.plannedDate}T00:00:00`),
                                    "EEE d",
                                  )}
                                </span>
                                <span className="mt-1 line-clamp-2 block text-[10px] leading-4 text-white/38">
                                  {step.title || "Unassigned space"}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <button
                              key={step.id}
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                updateSprintStep.mutate(
                                  {
                                    sprintId: sprint.id,
                                    stepId: step.id,
                                    status: complete ? "pending" : "complete",
                                  },
                                  {
                                    onSuccess: invalidateSprints,
                                    onError: () =>
                                      toast({
                                        title: "Couldn’t update this task",
                                        description:
                                          "The sprint was not changed. Try again.",
                                        variant: "destructive",
                                      }),
                                  },
                                )
                              }
                              className={`min-h-16 px-2 py-2 text-left transition-colors ${complete ? "bg-[#72c6b3]/12" : "bg-[#080e12] hover:bg-[#ffc268]/[.08]"}`}
                              aria-label={`${complete ? "Reopen" : "Complete"} ${step.title}`}
                            >
                              <span
                                className={`block font-mono text-[8px] uppercase tracking-[.12em] ${complete ? "text-[#72c6b3]" : "text-[#ffc268]"}`}
                              >
                                {format(
                                  new Date(`${step.plannedDate}T00:00:00`),
                                  "EEE d",
                                )}
                              </span>
                              <span
                                className={`mt-1 line-clamp-2 block text-[10px] leading-4 ${complete ? "text-white/45 line-through" : "text-white/72"}`}
                              >
                                {step.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 font-mono text-[8px] uppercase tracking-[.12em] text-white/30 md:px-5">
                        <span>
                          {completeCount}/{taskSteps} tasks sealed
                        </span>
                        <span
                          className="h-1 flex-1 overflow-hidden rounded-full bg-white/[.06]"
                          aria-hidden="true"
                        >
                          <span
                            className="block h-full rounded-full bg-[#72c6b3]"
                            style={{
                              width: `${taskSteps ? (completeCount / taskSteps) * 100 : 0}%`,
                            }}
                          />
                        </span>
                        <span>
                          Due{" "}
                          {format(
                            new Date(`${sprint.dueDate}T00:00:00`),
                            "MMM d",
                          )}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openSprintDialog()}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#72c6b3]/20 px-4 py-5 text-left transition-colors hover:border-[#72c6b3]/42 hover:bg-[#72c6b3]/[.04]"
              >
                <ListChecks className="h-5 w-5 text-[#72c6b3]/65" />
                <span>
                  <span className="block text-sm font-semibold text-white/68">
                    No active sprint
                  </span>
                  <span className="mt-1 block text-xs text-white/32">
                    Sequence the next result into daily closures.
                  </span>
                </span>
              </button>
            )}
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
                        <button
                          type="button"
                          onClick={() => openMilestoneDialog(milestone)}
                          className="signal-button flex items-center gap-1 text-white/42 transition-colors hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit deadline
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMilestoneStatus(milestone, "archived")
                          }
                          className="signal-button flex items-center gap-1 text-white/32 transition-colors hover:text-[#ffc268]"
                        >
                          <Archive className="h-3.5 w-3.5" /> Move to past paths
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
                  onClick={() => openMilestoneDialog()}
                  className="signal-button mt-5 h-10 gap-2 rounded-xl bg-[#e95448] px-4 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"
                >
                  <Plus className="h-4 w-4" /> Set first deadline
                </Button>
              </div>
            )}
          </div>
          {completeMilestones.length + completeSprints.length > 0 && (
            <details className="group border-t border-white/[.06] bg-[#72c6b3]/[.025]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/[.025]">
                <span>
                  <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-[#72c6b3]">
                    Past paths
                  </span>
                  <span className="mt-1 block text-xs text-white/38">
                    Return to completed or archived sprints and deadlines.
                  </span>
                </span>
                <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.12em] text-white/35">
                  {completeSprints.length + completeMilestones.length} records
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                </span>
              </summary>
              <div className="divide-y divide-white/[.06] border-t border-white/[.06]">
                {completeSprints.map((sprint) => (
                  <article
                    key={sprint.id}
                    className="flex items-center gap-3 px-5 py-4 md:px-6"
                  >
                    <Route className="h-4 w-4 shrink-0 text-[#72c6b3]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white/72">
                        {sprint.title}
                      </p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-[.12em] text-white/30">
                        Sprint · {sprint.status} ·{" "}
                        {
                          sprint.steps.filter((step) => step.kind === "task")
                            .length
                        }{" "}
                        tasks · due{" "}
                        {format(
                          new Date(`${sprint.dueDate}T00:00:00`),
                          "MMM d",
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSprintDialog(sprint)}
                      className="signal-button flex items-center gap-1 rounded-lg px-2 py-1.5 text-[8px] text-white/42 hover:bg-white/[.05] hover:text-white"
                      aria-label={`Edit ${sprint.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setSprintStatus(sprint, "active")}
                      className="signal-button flex items-center gap-1 rounded-lg px-2 py-1.5 text-[8px] text-[#72c6b3]/72 hover:bg-[#72c6b3]/10 hover:text-[#9ee3d5]"
                      aria-label={`Return ${sprint.title} to active practice`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Return
                    </button>
                  </article>
                ))}
                {completeMilestones.map((milestone) => {
                  const due = formatDeadline(milestone);
                  return (
                    <article
                      key={milestone.id}
                      className="flex items-center gap-3 px-5 py-4 md:px-6"
                    >
                      <CalendarClock className="h-4 w-4 shrink-0 text-[#ffc268]/75" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white/72">
                          {milestone.title}
                        </p>
                        <p className="mt-1 font-mono text-[8px] uppercase tracking-[.12em] text-white/30">
                          Deadline · {milestone.status} · due {due.label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openMilestoneDialog(milestone)}
                        className="signal-button flex items-center gap-1 rounded-lg px-2 py-1.5 text-[8px] text-white/42 hover:bg-white/[.05] hover:text-white"
                        aria-label={`Edit ${milestone.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setMilestoneStatus(milestone, "open")}
                        className="signal-button flex items-center gap-1 rounded-lg px-2 py-1.5 text-[8px] text-[#72c6b3]/72 hover:bg-[#72c6b3]/10 hover:text-[#9ee3d5]"
                        aria-label={`Return ${milestone.title} to active practice`}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Return
                      </button>
                    </article>
                  );
                })}
              </div>
            </details>
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

          <section className="relative isolate overflow-hidden rounded-3xl border border-[#ffc268]/20 bg-[#0c1119] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] md:p-6">
            <img
              src={armoryRoom}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[64%_center] opacity-[.78] [filter:brightness(.98)_contrast(1.03)_saturate(.9)]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,20,.76)_0%,rgba(8,13,20,.56)_42%,rgba(8,13,20,.26)_68%,rgba(8,13,20,.12)_100%),linear-gradient(0deg,rgba(8,13,20,.28),transparent_58%)]" />
            <div className="pointer-events-none absolute -right-9 -top-9 h-32 w-32 rounded-full bg-[#ffc268]/[.16] blur-3xl" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center gap-2 text-[#ffe0a5]">
                <ScrollText
                  className="h-5 w-5 shrink-0 opacity-85 drop-shadow-[0_0_10px_rgba(255,194,104,.18)]"
                  aria-hidden="true"
                />
                <p className="text-[9px] font-bold uppercase tracking-[.2em]">
                  Quiet shelf
                </p>
              </div>
              <h2 className="mt-3 text-xl font-bold leading-tight text-white">
                Keep the tools that matter.
              </h2>
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#ffb1a7]">
                    Course repositories
                  </p>
                  <span className="font-mono text-[8px] uppercase tracking-[.12em] text-white/32">
                    {
                      COURSE_REPOSITORIES.filter((repository) =>
                        repositoriesByUrl.has(repositoryKey(repository.url)),
                      ).length
                    }
                    /{COURSE_REPOSITORIES.length} kept
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {COURSE_REPOSITORIES.map((repository) => {
                    const selected = repositoriesByUrl.get(
                      repositoryKey(repository.url),
                    );
                    return (
                      <div
                        key={repository.id}
                        className="group flex items-center gap-2 rounded-xl border border-[#ff8b7c]/14 bg-[#080b10]/46 p-2"
                      >
                        <a
                          href={repository.url}
                          target="_blank"
                          rel="noreferrer"
                          className="signal-button flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:text-white"
                        >
                          <Github
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-[#ffb1a7]"
                          />
                          <span className="min-w-0">
                            <span
                              className="block truncate text-[10px] font-semibold text-white/88"
                              title={selected?.title ?? repository.title}
                            >
                              {selected?.title ?? repository.title}
                            </span>
                            <span className="block truncate font-mono text-[7px] text-white/30">
                              {repository.slug}
                            </span>
                          </span>
                          <ExternalLink
                            aria-hidden="true"
                            className="ml-auto h-3 w-3 shrink-0 text-white/30"
                          />
                        </a>
                        {selected && (
                          <button
                            type="button"
                            onClick={() =>
                              openCabinetDialog(
                                selected.periodReflectionId,
                                selected,
                              )
                            }
                            className="signal-button rounded-lg p-2 text-white/30 hover:bg-white/[.06] hover:text-white"
                            aria-label={`Edit ${selected.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleCourseRepository(repository)}
                          disabled={
                            createCabinetItem.isPending ||
                            deleteCabinetItem.isPending
                          }
                          aria-pressed={Boolean(selected)}
                          aria-label={`${selected ? "Remove" : "Keep"} ${repository.title} ${selected ? "from" : "on"} the quick shelf`}
                          className={`signal-button min-w-[4.3rem] rounded-lg border px-2 py-2 text-[7px] font-bold uppercase tracking-[.12em] disabled:opacity-45 ${selected ? "border-[#72c6b3]/24 bg-[#72c6b3]/[.08] text-[#9ee3d5]" : "border-white/[.09] bg-white/[.035] text-white/42 hover:border-[#ffc268]/30 hover:text-[#ffe0a5]"}`}
                        >
                          {selected ? "Kept" : "Keep"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {repositoryError && (
                  <p
                    className="mt-2 rounded-lg border border-[#ff8b7c]/20 bg-[#ff7868]/[.08] px-3 py-2 text-[10px] leading-4 text-[#ffb1a7]"
                    role="alert"
                  >
                    {repositoryError}
                  </p>
                )}
              </div>

              <div className="mt-5 border-t border-white/[.08] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#ffe0a5]/70">
                    Saved links
                  </p>
                  <span className="font-mono text-[8px] text-white/28">
                    {cabinetLinks.length} total
                  </span>
                </div>
                {otherCabinetLinks.length ? (
                  <div className="mt-2 space-y-2">
                    {otherCabinetLinks.map((item) => {
                      const content = (
                        <>
                          <Link2
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 text-[#ffe0a5]/75"
                          />
                          <span
                            className="min-w-0 flex-1 truncate"
                            title={item.title}
                          >
                            {item.title}
                          </span>
                          {item.url && (
                            <ExternalLink
                              aria-hidden="true"
                              className="h-3 w-3 shrink-0 opacity-55"
                            />
                          )}
                        </>
                      );
                      return item.url ? (
                        <div
                          key={item.id}
                          className="group flex items-stretch overflow-hidden rounded-xl border border-white/[.1] bg-black/[.2] transition-colors hover:border-[#ffc268]/38 hover:bg-white/[.07]"
                        >
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="signal-button flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-[10px] font-semibold text-white/82 hover:text-white"
                          >
                            {content}
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              openCabinetDialog(item.periodReflectionId, item)
                            }
                            className="signal-button grid w-9 shrink-0 place-items-center border-l border-white/[.07] text-white/26 hover:bg-white/[.06] hover:text-white"
                            aria-label={`Edit ${item.title}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-black/[.16] px-3 py-2 text-[10px] font-semibold text-white/70"
                        >
                          {content}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-white/52">
                    Keep another frequently used link here without turning it
                    into a task.
                  </p>
                )}
              </div>
              {cabinetNotes.length > 0 && (
                <details className="mt-4 rounded-xl border border-white/[.08] bg-black/[.14]">
                  <summary className="signal-button flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[8px] font-bold uppercase tracking-[.14em] text-white/40">
                    Quiet notes
                    <span className="font-mono text-white/28">
                      {cabinetNotes.length}
                    </span>
                  </summary>
                  <div className="space-y-2 border-t border-white/[.07] p-2">
                    {cabinetNotes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          openCabinetDialog(item.periodReflectionId, item)
                        }
                        className="signal-button block w-full rounded-lg px-2 py-2 text-left hover:bg-white/[.05]"
                      >
                        <span className="block truncate text-[10px] font-semibold text-white/72">
                          {item.title}
                        </span>
                        {item.note && (
                          <span className="mt-1 line-clamp-2 block text-[9px] leading-4 text-white/34">
                            {item.note}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </details>
              )}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button
                  onClick={() => openCabinetDialog()}
                  className="signal-button h-10 gap-2 rounded-xl bg-[#ffc268] text-[9px] font-bold uppercase tracking-[.12em] text-[#17120a] shadow-[0_10px_24px_rgba(255,194,104,.16)] hover:bg-[#ffd486]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add tool
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openCabinetDialog(null, null, "repository")}
                  className="signal-button h-10 gap-2 rounded-xl border-[#ff8b7c]/20 bg-[#ff7868]/[.06] text-[9px] font-bold uppercase tracking-[.12em] text-[#ffb1a7] hover:bg-[#ff7868]/10 hover:text-white"
                >
                  <Github className="h-3.5 w-3.5" /> Add repo
                </Button>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <section className="signal-surface relative isolate overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92">
        <img
          src={verticalOrnament}
          alt=""
          aria-hidden="true"
          className="panel-ornament panel-ornament--cabinet panel-ornament--cabinet-next"
        />
        <div className="relative z-10 border-b border-white/[.06] p-6 md:p-7">
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

      {!preview && <SessionNotes embedded />}

      {!preview && <SessionRecordsPanel />}

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
        open={dialog === "sprint"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setEditingSprint(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-3xl border-[#72c6b3]/18 bg-[#080f14] p-7 shadow-2xl">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.2em] text-[#72c6b3]">
              <Route className="h-4 w-4" /> Flexible sprint route
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              {editingSprint ? "Edit sprint" : "Open a sprint"}
            </DialogTitle>
            <DialogDescription className="text-white/42">
              Shape a flexible route. Tasks may share dates, skip days, and be
              completed in any order; open days preserve intentional space.
            </DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-5" onSubmit={saveSprint}>
            <div className="grid gap-4 sm:grid-cols-[1fr_.8fr]">
              <label className="block space-y-2">
                <Label>Sprint name</Label>
                <Input
                  autoFocus
                  value={sprintForm.title}
                  onChange={(event) =>
                    setSprintForm({ ...sprintForm, title: event.target.value })
                  }
                  className="border-white/10 bg-white/[.04] text-white"
                  placeholder="Ship the reading module"
                />
              </label>
              <label className="block space-y-2">
                <Label>Direction (optional)</Label>
                <select
                  value={sprintForm.activityId ?? ""}
                  onChange={(event) =>
                    setSprintForm({
                      ...sprintForm,
                      activityId: event.target.value
                        ? Number(event.target.value)
                        : null,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm text-white"
                >
                  <option value="">No direction</option>
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-2">
              <Label>Result at the end</Label>
              <Textarea
                value={sprintForm.outcome ?? ""}
                onChange={(event) =>
                  setSprintForm({ ...sprintForm, outcome: event.target.value })
                }
                className="min-h-20 border-white/10 bg-white/[.04] text-white"
                placeholder="A concrete finish that will exist when the path closes."
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <Label>Starts</Label>
                <Input
                  type="date"
                  required
                  value={sprintForm.startDate}
                  onChange={(event) =>
                    setSprintForm({
                      ...sprintForm,
                      startDate: event.target.value,
                    })
                  }
                  className="border-white/10 bg-white/[.04] text-white"
                />
              </label>
              <label className="block space-y-2">
                <Label>Due</Label>
                <Input
                  type="date"
                  required
                  value={sprintForm.dueDate}
                  onChange={(event) =>
                    setSprintForm({
                      ...sprintForm,
                      dueDate: event.target.value,
                    })
                  }
                  className="border-white/10 bg-white/[.04] text-white"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[.13em] text-white/36">
                {sprintDayCount(sprintForm.startDate, sprintForm.dueDate)} days
                ·{" "}
                {
                  sprintForm.steps.filter(
                    (step) => (step.kind ?? "task") === "task",
                  ).length
                }{" "}
                tasks ·{" "}
                {
                  sprintForm.steps.filter((step) => step.kind === "buffer")
                    .length
                }{" "}
                open
              </p>
              <div
                className="flex items-center gap-1.5"
                aria-label="Shift entire sprint schedule"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => shiftSprint(-1)}
                  aria-label="Shift entire sprint one day earlier"
                  className="h-8 gap-1 rounded-lg px-2 text-[8px] font-bold uppercase tracking-[.12em] text-white/42 hover:bg-white/[.05] hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Shift 1 day
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => shiftSprint(1)}
                  aria-label="Shift entire sprint one day later"
                  className="h-8 gap-1 rounded-lg px-2 text-[8px] font-bold uppercase tracking-[.12em] text-white/42 hover:bg-white/[.05] hover:text-white"
                >
                  Shift 1 day <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[.08] bg-black/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Sprint route</Label>
                  <p className="mt-1 text-[10px] leading-4 text-white/30">
                    Drag or use arrows to set priority. Dates can overlap or
                    leave gaps.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addSprintStep("buffer")}
                    className="h-9 gap-2 rounded-xl border-[#ffc268]/20 text-[9px] font-bold uppercase tracking-[.12em] text-[#ffe0a5]/75 hover:bg-[#ffc268]/10"
                  >
                    <Pause className="h-3.5 w-3.5" /> Open day
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addSprintStep("task")}
                    className="h-9 gap-2 rounded-xl border-[#72c6b3]/22 text-[9px] font-bold uppercase tracking-[.12em] text-[#9ee3d5] hover:bg-[#72c6b3]/10"
                  >
                    <Plus className="h-3.5 w-3.5" /> Task
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {sprintForm.steps.map((step, index) => {
                  const kind = step.kind ?? "task";
                  const buffer = kind === "buffer";
                  return (
                    <div
                      key={step.id ?? `${kind}-${index}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (draggedSprintStep !== null) {
                          moveSprintStep(draggedSprintStep, index);
                        }
                        setDraggedSprintStep(null);
                      }}
                      className={`grid gap-2 rounded-xl border p-2 transition-[border-color,background-color] sm:grid-cols-[2rem_3.5rem_minmax(10rem,1fr)_8.75rem_6.5rem_2rem] sm:items-center ${draggedSprintStep === index ? "border-[#72c6b3]/45 bg-[#72c6b3]/[.08]" : buffer ? "border-[#ffc268]/12 bg-[#ffc268]/[.025]" : "border-white/[.055] bg-white/[.018]"}`}
                    >
                      <button
                        type="button"
                        draggable
                        onDragStart={() => setDraggedSprintStep(index)}
                        onDragEnd={() => setDraggedSprintStep(null)}
                        className="flex h-9 cursor-grab items-center justify-center rounded-lg text-white/22 hover:bg-white/[.05] hover:text-white/60 active:cursor-grabbing"
                        aria-label={`Drag route item ${index + 1}`}
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveSprintStep(index, index - 1)}
                          className="rounded-md p-1.5 text-white/28 hover:bg-white/[.06] hover:text-white disabled:opacity-15"
                          aria-label={`Move route item ${index + 1} earlier`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === sprintForm.steps.length - 1}
                          onClick={() => moveSprintStep(index, index + 1)}
                          className="rounded-md p-1.5 text-white/28 hover:bg-white/[.06] hover:text-white disabled:opacity-15"
                          aria-label={`Move route item ${index + 1} later`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Input
                        value={step.title}
                        onChange={(event) => {
                          setSprintForm({
                            ...sprintForm,
                            steps: sprintForm.steps.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, title: event.target.value }
                                : item,
                            ),
                          });
                          setSprintError("");
                        }}
                        className="border-white/10 bg-white/[.035] text-white"
                        placeholder={
                          buffer
                            ? "Optional note for this open day"
                            : "Task to close"
                        }
                        aria-label={`${buffer ? "Open day" : "Task"} ${index + 1} title`}
                      />
                      <Input
                        type="date"
                        value={step.plannedDate}
                        onChange={(event) =>
                          updateSprintStepDate(index, event.target.value)
                        }
                        className="border-white/10 bg-white/[.035] text-white"
                        aria-label={`Route item ${index + 1} date`}
                      />
                      <select
                        value={kind}
                        onChange={(event) => {
                          const nextKind = event.target.value as SprintStepKind;
                          setSprintForm({
                            ...sprintForm,
                            steps: sprintForm.steps.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    kind: nextKind,
                                    status:
                                      nextKind === "buffer"
                                        ? "pending"
                                        : item.status,
                                  }
                                : item,
                            ),
                          });
                          setSprintError("");
                        }}
                        className={`h-10 rounded-xl border bg-black/20 px-2 text-[9px] font-bold uppercase tracking-[.1em] ${buffer ? "border-[#ffc268]/18 text-[#ffe0a5]/70" : "border-[#72c6b3]/18 text-[#9ee3d5]/75"}`}
                        aria-label={`Route item ${index + 1} type`}
                      >
                        <option value="task">Task</option>
                        <option value="buffer">Open day</option>
                      </select>
                      <button
                        type="button"
                        disabled={sprintForm.steps.length === 1}
                        onClick={() => {
                          setSprintForm({
                            ...sprintForm,
                            steps: sprintForm.steps.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          });
                          setSprintError("");
                        }}
                        className="rounded-lg p-2 text-white/20 hover:bg-white/5 hover:text-[#ff8b7c] disabled:opacity-20"
                        aria-label={`Remove route item ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            {sprintError && (
              <div
                role="alert"
                className="rounded-xl border border-[#ff7868]/25 bg-[#ff7868]/[.08] px-4 py-3 text-xs leading-5 text-[#ffb1a7]"
              >
                {sprintError}
              </div>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-white/[.08] pt-5">
              <p className="text-[10px] leading-4 text-white/28">
                Saving keeps existing task history, even after reordering.
              </p>
              <div className="flex justify-end gap-2">
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
                  disabled={createSprint.isPending || updateSprint.isPending}
                  className="signal-button gap-2 bg-[#287d71] text-white hover:bg-[#319686]"
                >
                  <Route className="h-4 w-4" />{" "}
                  {editingSprint ? "Save changes" : "Open sprint"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "milestone"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setEditingMilestone(null);
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-3xl border-white/10 bg-[#090d14] p-7 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {editingMilestone ? "Edit deadline" : "Set a deadline"}
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
                disabled={
                  createMilestone.isPending || updateMilestone.isPending
                }
                className="signal-button bg-[#e95448] text-white hover:bg-[#f26456]"
              >
                {editingMilestone ? "Save changes" : "Place deadline"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "cabinet"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setEditingCabinetItem(null);
            setCabinetError("");
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-3xl border-white/10 bg-[#090d14] p-7 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {editingCabinetItem
                ? "Edit kept item"
                : cabinetForm.kind === "repository"
                  ? "Keep a repository close"
                  : "Place in the dojo cabinet"}
            </DialogTitle>
            <DialogDescription className="text-white/42">
              {editingCabinetItem
                ? "Adjust the name, address, type, or note without recreating it."
                : cabinetReflectionId
                  ? "This tool will be linked to the selected period reflection."
                  : cabinetForm.kind === "repository"
                    ? "Add a GitHub repository to the compact course shelf. Private repositories open through your existing GitHub session."
                    : "Keep an important link, reference, or note independently from your reflections."}
            </DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-5" onSubmit={saveCabinetItem}>
            <label className="block space-y-2">
              <Label htmlFor="cabinet-item-kind">Type</Label>
              <select
                id="cabinet-item-kind"
                value={cabinetForm.kind}
                onChange={(event) => {
                  setCabinetForm({
                    ...cabinetForm,
                    kind: event.target.value as DojoCabinetKind,
                  });
                  setCabinetError("");
                }}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#101722] px-3 text-sm text-white"
              >
                <option value="link">Link</option>
                <option value="repository">GitHub repository</option>
                <option value="note">Quiet note</option>
              </select>
            </label>
            <label className="block space-y-2">
              <Label htmlFor="cabinet-item-title">Title</Label>
              <Input
                id="cabinet-item-title"
                autoFocus
                value={cabinetForm.title}
                onChange={(event) => {
                  setCabinetForm({ ...cabinetForm, title: event.target.value });
                  setCabinetError("");
                }}
                aria-describedby={
                  cabinetError ? "cabinet-form-error" : undefined
                }
                aria-invalid={
                  Boolean(cabinetError) && !cabinetForm.title.trim()
                }
                className="border-white/10 bg-white/[.04] text-white"
                placeholder={
                  cabinetForm.kind === "repository"
                    ? "Course or project name"
                    : "Article, tool, or small note"
                }
              />
            </label>
            <label className="block space-y-2">
              <Label htmlFor="cabinet-item-url">
                {cabinetForm.kind === "repository"
                  ? "GitHub repository address"
                  : "Link (optional)"}
              </Label>
              <Input
                id="cabinet-item-url"
                type="url"
                value={cabinetForm.url}
                onChange={(event) => {
                  setCabinetForm({ ...cabinetForm, url: event.target.value });
                  setCabinetError("");
                }}
                required={cabinetForm.kind === "repository"}
                aria-describedby={
                  cabinetError ? "cabinet-form-error" : undefined
                }
                aria-invalid={
                  Boolean(cabinetError) &&
                  cabinetForm.kind === "repository" &&
                  !cabinetForm.url.trim()
                }
                className="border-white/10 bg-white/[.04] text-white"
                placeholder={
                  cabinetForm.kind === "repository"
                    ? "https://github.com/owner/repository"
                    : "https://…"
                }
              />
            </label>
            <label className="block space-y-2">
              <Label htmlFor="cabinet-item-note">What to remember</Label>
              <Textarea
                id="cabinet-item-note"
                value={cabinetForm.note}
                onChange={(event) =>
                  setCabinetForm({ ...cabinetForm, note: event.target.value })
                }
                className="min-h-24 border-white/10 bg-white/[.04] text-white"
                placeholder="A short reason it is worth keeping."
              />
            </label>
            {cabinetError && (
              <p
                id="cabinet-form-error"
                className="rounded-xl border border-[#ff8b7c]/20 bg-[#ff7868]/[.08] px-3 py-2 text-xs leading-5 text-[#ffb1a7]"
                role="alert"
              >
                {cabinetError}
              </p>
            )}
            <div className="flex items-center justify-between gap-3 pt-2">
              {editingCabinetItem ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={removeCabinetItem}
                  disabled={deleteCabinetItem.isPending}
                  className="text-[#ff9a89]/72 hover:bg-[#ff7868]/10 hover:text-[#ffb1a7]"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteCabinetItem.isPending ? "Removing…" : "Remove"}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
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
                  disabled={
                    createCabinetItem.isPending || updateCabinetItem.isPending
                  }
                  className="signal-button bg-[#ffc268] text-[#17120a] hover:bg-[#ffd486]"
                >
                  {createCabinetItem.isPending || updateCabinetItem.isPending
                    ? "Saving…"
                    : editingCabinetItem
                      ? "Save changes"
                      : cabinetForm.kind === "repository"
                        ? "Keep repository"
                        : "Keep tool"}
                </Button>
              </div>
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
