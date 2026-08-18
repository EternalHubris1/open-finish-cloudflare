import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { addDays, format, startOfWeek, subDays } from "date-fns";
import {
  AlertTriangle,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  BookOpenText,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  CornerDownRight,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  getGetCalendarQueryKey,
  getGetEvidenceShelfQueryKey,
  getListActivitiesQueryKey,
  getListReflectionsQueryKey,
  getListWeeklyReflectionsQueryKey,
  useGetCalendar,
  useGetEvidenceShelf,
  useListActivities,
  useListReflections,
  useListWeeklyReflections,
  usePutEvidenceShelf,
  usePutWeeklyReflection,
  type KeptEvidence,
  type ReflectionEntry,
  type WeeklyReflection,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { previewActivities } from "@/pages/dashboard-exploration";
import {
  EVIDENCE_SHELF_STORAGE_KEY,
  moveEvidenceShelfEntry,
  readEvidenceShelf,
} from "@/lib/evidence-shelf";
import {
  readStoredWeeklyReflections,
  WEEKLY_REVIEW_STORAGE_PREFIX,
} from "@/lib/weekly-reflections";
import {
  WeeklyReviewDialog,
  type WeeklyReviewEvidence,
} from "@/components/weekly-review-dialog";

type EvidenceLens =
  "all" | "reentry" | "continuations" | "recall" | "shifts" | "learning";
type EvidenceTimeContext = "all" | "14days" | "30days";
type EvidenceQuestion = "reentry" | "shifts" | "figuring-out";

const LENS_COPY: Record<EvidenceLens, { label: string; description: string }> =
  {
    all: {
      label: "All evidence",
      description: "Every saved recall, observation, and next step.",
    },
    reentry: {
      label: "Re-entry cues",
      description:
        "Notes that helped you begin again: recall attempts or a saved next step.",
    },
    continuations: {
      label: "Next steps",
      description: "Only reflections that left a small re-entry cue.",
    },
    recall: {
      label: "Recall",
      description: "Only sessions that began by trying to remember.",
    },
    shifts: {
      label: "Shifts",
      description: "Only observations about what changed in the work.",
    },
    learning: {
      label: "Learning",
      description: "Only observations about what became clearer.",
    },
  };

const QUESTION_ROUTES: Record<
  EvidenceQuestion,
  { prompt: string; description: string; lens: EvidenceLens }
> = {
  reentry: {
    prompt: "What helped me re-enter?",
    description:
      "Look for recall attempts and notes left to make the next start lighter.",
    lens: "reentry",
  },
  shifts: {
    prompt: "Where did I notice a shift?",
    description:
      "Look for observations about what changed, strengthened, or became clearer in the work.",
    lens: "shifts",
  },
  "figuring-out": {
    prompt: "What am I still figuring out?",
    description:
      "Look for learning notes, questions, and useful corrections still worth carrying.",
    lens: "learning",
  },
};

const TIME_CONTEXT_COPY: Record<
  EvidenceTimeContext,
  { label: string; description: string }
> = {
  all: {
    label: "All time",
    description: "Everything you have chosen to keep in this library.",
  },
  "14days": {
    label: "Last 14 days",
    description: "Recent evidence that may make the next return lighter.",
  },
  "30days": {
    label: "Last 30 days",
    description:
      "A wider recent view of the threads you have been keeping open.",
  },
};

type WeeklyEvidenceTrace = { weekStart: string; savedAt: string };

function readWeeklyEvidenceTraces(reviews: WeeklyReflection[]) {
  const traces = new Map<number, WeeklyEvidenceTrace>();
  reviews.forEach((review) => {
    review.keptEvidenceIds.forEach((id) => {
      const current = traces.get(id);
      if (!current || review.savedAt > current.savedAt)
        traces.set(id, {
          weekStart: review.weekStart,
          savedAt: review.savedAt,
        });
    });
  });
  return traces;
}

const previewReflections = [
  {
    id: -1,
    activityId: 1,
    activityName: "Writing",
    activityColor: "#df554f",
    durationMinutes: 55,
    logDate: "2026-08-17",
    recallNote:
      "The transition needs to carry the image forward, not explain it.",
    whatMoved: "The chapter found a stronger handoff between the two scenes.",
    whatLearned:
      "The strongest version removes the explanation and keeps the physical detail.",
    nextContinuation:
      "Draft the revised transition in one pass before editing the dialogue.",
    createdAt: "2026-08-17T10:00:00.000Z",
  },
  {
    id: -2,
    activityId: 2,
    activityName: "Research",
    activityColor: "#6f8fbf",
    durationMinutes: 40,
    logDate: "2026-08-15",
    recallNote: null,
    whatMoved:
      "The source map now separates primary evidence from useful commentary.",
    whatLearned:
      "The claim needs one directly observable example before it needs another citation.",
    nextContinuation:
      "Compare the two primary sources and record the disagreement.",
    createdAt: "2026-08-15T14:00:00.000Z",
  },
  {
    id: -3,
    activityId: 1,
    activityName: "Writing",
    activityColor: "#df554f",
    durationMinutes: 35,
    logDate: "2026-08-12",
    recallNote: null,
    whatMoved:
      "The image at the end of the first scene finally belongs to the beginning of the next.",
    whatLearned: null,
    nextContinuation:
      "Return to the handoff image before deciding whether the explanation is needed.",
    createdAt: "2026-08-12T16:30:00.000Z",
  },
];

function matchesLens(
  entry: Pick<
    ReflectionEntry,
    "recallNote" | "whatMoved" | "whatLearned" | "nextContinuation"
  >,
  lens: EvidenceLens,
) {
  if (lens === "all") return true;
  if (lens === "reentry")
    return Boolean(entry.recallNote || entry.nextContinuation);
  if (lens === "continuations") return Boolean(entry.nextContinuation);
  if (lens === "recall") return Boolean(entry.recallNote);
  if (lens === "shifts") return Boolean(entry.whatMoved);
  return Boolean(entry.whatLearned);
}

function contains(
  entry: Pick<
    ReflectionEntry,
    | "activityName"
    | "recallNote"
    | "whatMoved"
    | "whatLearned"
    | "nextContinuation"
  >,
  query: string,
) {
  const haystack = [
    entry.activityName,
    entry.recallNote,
    entry.whatMoved,
    entry.whatLearned,
    entry.nextContinuation,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function Reflections() {
  const queryClient = useQueryClient();
  const preview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("preview");
  const reflectionsQuery = useListReflections({
    query: { enabled: !preview, queryKey: getListReflectionsQueryKey() },
  });
  const activitiesQuery = useListActivities({
    query: { enabled: !preview, queryKey: getListActivitiesQueryKey() },
  });
  const weekStartDate = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    [],
  );
  const weekStart = format(weekStartDate, "yyyy-MM-dd");
  const weekEnd = format(addDays(weekStartDate, 6), "yyyy-MM-dd");
  const calendarQuery = useGetCalendar(
    { start: weekStart, end: weekEnd },
    {
      query: {
        enabled: !preview,
        queryKey: getGetCalendarQueryKey({ start: weekStart, end: weekEnd }),
      },
    },
  );
  const evidenceShelfQuery = useGetEvidenceShelf({
    query: { enabled: !preview, queryKey: getGetEvidenceShelfQueryKey() },
  });
  const weeklyReflectionsQuery = useListWeeklyReflections({
    query: { enabled: !preview, queryKey: getListWeeklyReflectionsQueryKey() },
  });
  const migrateWeeklyReflection = usePutWeeklyReflection();
  const putEvidenceShelf = usePutEvidenceShelf();
  const migrationStarted = useRef(false);
  const shelfSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const reflections = preview
    ? previewReflections
    : Array.isArray(reflectionsQuery.data)
      ? reflectionsQuery.data
      : [];
  const activities = preview
    ? previewActivities
    : Array.isArray(activitiesQuery.data)
      ? activitiesQuery.data
      : [];
  const [query, setQuery] = useState("");
  const [question, setQuestion] = useState<EvidenceQuestion | null>(() => {
    const requestedQuestion = new URLSearchParams(window.location.search).get(
      "question",
    );
    return requestedQuestion === "reentry" ||
      requestedQuestion === "shifts" ||
      requestedQuestion === "figuring-out"
      ? requestedQuestion
      : null;
  });
  const [lens, setLens] = useState<EvidenceLens>(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedLens = params.get("lens");
    if (
      requestedLens === "reentry" ||
      requestedLens === "continuations" ||
      requestedLens === "recall" ||
      requestedLens === "shifts" ||
      requestedLens === "learning"
    )
      return requestedLens;
    const requestedQuestion = params.get("question");
    return requestedQuestion === "reentry" ||
      requestedQuestion === "shifts" ||
      requestedQuestion === "figuring-out"
      ? QUESTION_ROUTES[requestedQuestion].lens
      : "all";
  });
  const [activityId, setActivityId] = useState<number | null>(() => {
    const requestedId = Number(
      new URLSearchParams(window.location.search).get("activity"),
    );
    return Number.isInteger(requestedId) && requestedId > 0
      ? requestedId
      : null;
  });
  const [evidenceDate, setEvidenceDate] = useState<string | null>(() => {
    const requestedDate = new URLSearchParams(window.location.search).get(
      "date",
    );
    return requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : null;
  });
  const [timeContext, setTimeContext] = useState<EvidenceTimeContext>(() => {
    const requestedContext = new URLSearchParams(window.location.search).get(
      "time",
    );
    return requestedContext === "14days" || requestedContext === "30days"
      ? requestedContext
      : "all";
  });
  const [previewKeptEvidence, setPreviewKeptEvidence] = useState<
    KeptEvidence[]
  >([]);
  const [shelfCopied, setShelfCopied] = useState(false);
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);
  const keptEvidence = preview
    ? previewKeptEvidence
    : Array.isArray(evidenceShelfQuery.data)
      ? evidenceShelfQuery.data
      : [];
  const weeklyReflections = Array.isArray(weeklyReflectionsQuery.data)
    ? weeklyReflectionsQuery.data
    : [];
  const currentWeeklyReflection = weeklyReflections.find(
    (reflection) => reflection.weekStart === weekStart,
  );
  const weeklyEvidenceTraces = useMemo(
    () => readWeeklyEvidenceTraces(weeklyReflections),
    [weeklyReflections],
  );
  const weeklyDays = Array.isArray(calendarQuery.data)
    ? calendarQuery.data
    : [];
  const weeklyMinutes = preview
    ? 135
    : weeklyDays.reduce((sum, day) => sum + day.focusMinutes, 0);
  const weeklyActiveDays = preview
    ? 3
    : weeklyDays.filter((day) => day.focusMinutes > 0).length;
  const weeklyReviewEvidence: WeeklyReviewEvidence[] = reflections
    .filter(
      (reflection) =>
        reflection.logDate >= weekStart && reflection.logDate <= weekEnd,
    )
    .flatMap((reflection) => {
      const identity = String(reflection.id);
      return [
        ...(reflection.whatMoved
          ? [
              {
                id: `${identity}:whatMoved`,
                activityName: reflection.activityName,
                logDate: reflection.logDate,
                label: "Shift" as const,
                text: reflection.whatMoved,
              },
            ]
          : []),
        ...(reflection.whatLearned
          ? [
              {
                id: `${identity}:whatLearned`,
                activityName: reflection.activityName,
                logDate: reflection.logDate,
                label: "Learning" as const,
                text: reflection.whatLearned,
              },
            ]
          : []),
        ...(reflection.nextContinuation
          ? [
              {
                id: `${identity}:nextContinuation`,
                activityName: reflection.activityName,
                logDate: reflection.logDate,
                label: "Next step" as const,
                text: reflection.nextContinuation,
              },
            ]
          : []),
        ...(reflection.recallNote
          ? [
              {
                id: `${identity}:recallNote`,
                activityName: reflection.activityName,
                logDate: reflection.logDate,
                label: "Recall" as const,
                text: reflection.recallNote,
              },
            ]
          : []),
      ] satisfies WeeklyReviewEvidence[];
    })
    .slice(0, 8);

  useEffect(() => {
    if (
      preview ||
      migrationStarted.current ||
      !evidenceShelfQuery.isSuccess ||
      !weeklyReflectionsQuery.isSuccess
    )
      return;
    migrationStarted.current = true;
    const localShelf = readEvidenceShelf();
    const localWeeks = readStoredWeeklyReflections();
    if (!localShelf.length && !localWeeks.length) return;

    void (async () => {
      try {
        const serverShelf = Array.isArray(evidenceShelfQuery.data)
          ? evidenceShelfQuery.data
          : [];
        const validReflectionIds = new Set(
          reflections.map((entry) => entry.id),
        );
        const mergedShelf = [
          ...serverShelf,
          ...localShelf.filter(
            (local) =>
              validReflectionIds.has(local.id) &&
              !serverShelf.some((server) => server.id === local.id),
          ),
        ].slice(0, 6);
        const mergedShelfIds = new Set(mergedShelf.map((entry) => entry.id));
        if (mergedShelf.length !== serverShelf.length) {
          const savedShelf = await putEvidenceShelf.mutateAsync({
            activityLogIds: mergedShelf.map((entry) => entry.id),
          });
          queryClient.setQueryData(getGetEvidenceShelfQueryKey(), savedShelf);
        }
        const serverWeeks = Array.isArray(weeklyReflectionsQuery.data)
          ? weeklyReflectionsQuery.data
          : [];
        for (const local of localWeeks.filter(
          (candidate) =>
            !serverWeeks.some(
              (server) => server.weekStart === candidate.weekStart,
            ),
        )) {
          await migrateWeeklyReflection.mutateAsync({
            weekStart: local.weekStart,
            notice: local.notice,
            carry: local.carry,
            evidenceIds: local.evidenceIds,
            keptEvidenceIds: local.keptEvidenceIds.filter((id) =>
              mergedShelfIds.has(id),
            ),
          });
        }
        await queryClient.invalidateQueries({
          queryKey: getListWeeklyReflectionsQueryKey(),
        });
        window.localStorage.removeItem(EVIDENCE_SHELF_STORAGE_KEY);
        const weeklyKeys = Array.from(
          { length: window.localStorage.length },
          (_, index) => window.localStorage.key(index),
        ).filter((key): key is string =>
          Boolean(key?.startsWith(WEEKLY_REVIEW_STORAGE_PREFIX)),
        );
        weeklyKeys.forEach((key) => window.localStorage.removeItem(key));
      } catch {
        migrationStarted.current = false;
      }
    })();
  }, [
    evidenceShelfQuery.data,
    evidenceShelfQuery.isSuccess,
    migrateWeeklyReflection,
    preview,
    queryClient,
    reflections,
    weeklyReflectionsQuery.data,
    weeklyReflectionsQuery.isSuccess,
  ]);
  const timeStart = useMemo(
    () =>
      timeContext === "all"
        ? null
        : format(
            subDays(new Date(), timeContext === "14days" ? 13 : 29),
            "yyyy-MM-dd",
          ),
    [timeContext],
  );

  const saveEvidenceShelf = (next: KeptEvidence[]) => {
    if (preview) {
      setPreviewKeptEvidence(next);
      return;
    }
    queryClient.setQueryData(getGetEvidenceShelfQueryKey(), next);
    shelfSaveQueue.current = shelfSaveQueue.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await putEvidenceShelf.mutateAsync({
            activityLogIds: next.map((entry) => entry.id),
          });
        } catch {
          await queryClient.invalidateQueries({
            queryKey: getGetEvidenceShelfQueryKey(),
          });
        }
      });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (lens === "all") params.delete("lens");
    else params.set("lens", lens);
    if (question === null) params.delete("question");
    else params.set("question", question);
    if (activityId === null) params.delete("activity");
    else params.set("activity", String(activityId));
    if (evidenceDate === null) params.delete("date");
    else params.set("date", evidenceDate);
    if (timeContext === "all") params.delete("time");
    else params.set("time", timeContext);
    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) window.history.replaceState(null, "", nextUrl);
  }, [activityId, evidenceDate, lens, question, timeContext]);

  const filtered = useMemo(
    () =>
      reflections
        .filter(
          (entry) =>
            (!timeStart || entry.logDate >= timeStart) &&
            (!activityId || entry.activityId === activityId) &&
            (!evidenceDate || entry.logDate === evidenceDate) &&
            matchesLens(entry, lens) &&
            (!query.trim() || contains(entry, query)),
        )
        .sort(
          (left, right) =>
            right.logDate.localeCompare(left.logDate) ||
            right.createdAt.localeCompare(left.createdAt),
        ),
    [activityId, evidenceDate, lens, query, reflections, timeStart],
  );
  const lensCounts = useMemo(
    () => ({
      all: reflections.length,
      reentry: reflections.filter((entry) =>
        Boolean(entry.recallNote || entry.nextContinuation),
      ).length,
      continuations: reflections.filter((entry) =>
        Boolean(entry.nextContinuation),
      ).length,
      recall: reflections.filter((entry) => Boolean(entry.recallNote)).length,
      shifts: reflections.filter((entry) => Boolean(entry.whatMoved)).length,
      learning: reflections.filter((entry) => Boolean(entry.whatLearned))
        .length,
    }),
    [reflections],
  );
  const selectedActivity = activities.find(
    (activity) => activity.id === activityId,
  );
  const keptEvidenceIds = useMemo(
    () => new Set(keptEvidence.map((entry) => entry.id)),
    [keptEvidence],
  );
  const toggleKeptEvidence = (entry: ReflectionEntry) => {
    const text =
      entry.nextContinuation ??
      entry.whatLearned ??
      entry.whatMoved ??
      entry.recallNote;
    if (!text) return;
    saveEvidenceShelf(
      keptEvidence.some((kept) => kept.id === entry.id)
        ? keptEvidence.filter((kept) => kept.id !== entry.id)
        : [
            {
              id: entry.id,
              activityId: entry.activityId,
              activityName: entry.activityName,
              activityColor: entry.activityColor,
              logDate: entry.logDate,
              text,
              savedAt: new Date().toISOString(),
            },
            ...keptEvidence,
          ].slice(0, 6),
    );
  };
  const moveKeptEvidence = (id: number, direction: "up" | "down") => {
    saveEvidenceShelf(moveEvidenceShelfEntry(keptEvidence, id, direction));
  };
  const shelfText = useMemo(
    () =>
      [
        "Open Finish — evidence shelf",
        "",
        ...keptEvidence.flatMap((entry) => [
          `${entry.activityName} · ${entry.logDate}`,
          entry.text,
          "",
        ]),
        "This is a private selection of context you chose to keep close. It is not a plan, priority list, or score.",
      ].join("\n"),
    [keptEvidence],
  );
  const copyShelfText = async () => {
    setShelfCopied(false);
    try {
      await navigator.clipboard.writeText(shelfText);
    } catch {
      const target = document.createElement("textarea");
      target.value = shelfText;
      target.style.position = "fixed";
      target.style.opacity = "0";
      document.body.appendChild(target);
      target.select();
      document.execCommand("copy");
      document.body.removeChild(target);
    }
    setShelfCopied(true);
  };
  const recallTrails = useMemo(() => {
    const latestContinuations = new Map<
      number,
      { text: string; logDate: string }
    >();
    const trails = new Map<number, { text: string; logDate: string }>();
    [...reflections]
      .sort(
        (left, right) =>
          left.logDate.localeCompare(right.logDate) ||
          left.createdAt.localeCompare(right.createdAt),
      )
      .forEach((entry) => {
        const priorContinuation = latestContinuations.get(entry.activityId);
        if (entry.recallNote && priorContinuation)
          trails.set(entry.id, priorContinuation);
        if (entry.nextContinuation)
          latestContinuations.set(entry.activityId, {
            text: entry.nextContinuation,
            logDate: entry.logDate,
          });
      });
    return trails;
  }, [reflections]);
  const patterns = useMemo(() => {
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(now.getDate() - 13);
    const recent = reflections.filter(
      (entry) => new Date(`${entry.logDate}T00:00:00`) >= windowStart,
    );
    const continuationCount = recent.filter((entry) =>
      Boolean(entry.nextContinuation),
    ).length;
    const recallCount = recent.filter((entry) =>
      Boolean(entry.recallNote),
    ).length;
    const directionCounts = new Map<number, { name: string; count: number }>();
    recent.forEach((entry) =>
      directionCounts.set(entry.activityId, {
        name: entry.activityName,
        count: (directionCounts.get(entry.activityId)?.count ?? 0) + 1,
      }),
    );
    const leadingDirection =
      [...directionCounts.values()].sort(
        (left, right) => right.count - left.count,
      )[0] ?? null;
    const latestLearning =
      recent.find((entry) => Boolean(entry.whatLearned))?.whatLearned ?? null;
    return {
      recent,
      continuationCount,
      recallCount,
      leadingDirection,
      latestLearning,
    };
  }, [reflections]);

  if (
    !preview &&
    (reflectionsQuery.isLoading ||
      activitiesQuery.isLoading ||
      evidenceShelfQuery.isLoading ||
      weeklyReflectionsQuery.isLoading)
  ) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
        <Skeleton className="h-40 rounded-[2rem] bg-white/5" />
        <Skeleton className="h-72 rounded-[2rem] bg-white/5" />
      </div>
    );
  }

  if (
    !preview &&
    (reflectionsQuery.isError ||
      activitiesQuery.isError ||
      evidenceShelfQuery.isError ||
      weeklyReflectionsQuery.isError)
  ) {
    const retrying =
      reflectionsQuery.isFetching ||
      activitiesQuery.isFetching ||
      evidenceShelfQuery.isFetching ||
      weeklyReflectionsQuery.isFetching;
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center p-5 md:p-10">
        <section
          className="signal-surface w-full rounded-[2rem] border border-[#ff8b7c]/20 bg-[#0c1119]/92 p-8 text-center"
          role="alert"
        >
          <AlertTriangle className="mx-auto h-9 w-9 text-[#ff9a89]" />
          <h1 className="mt-5 text-2xl font-semibold text-white">
            Your reflection library could not be loaded
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/50">
            Your saved sessions and continuity memory have not been changed.
            Check the connection and try loading the library again.
          </p>
          <Button
            type="button"
            onClick={() => {
              void reflectionsQuery.refetch();
              void activitiesQuery.refetch();
              void evidenceShelfQuery.refetch();
              void weeklyReflectionsQuery.refetch();
            }}
            disabled={retrying}
            className="mt-6 rounded-full bg-[#e95448] px-6 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`}
            />
            Try again
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl space-y-8 p-5 pb-28 md:p-10">
      <header className="signal-surface relative overflow-hidden rounded-[2rem] border border-white/[.08] bg-[#0c1119]/92 p-7 md:p-10">
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#ff7868] blur-3xl opacity-10" />
        <div className="relative">
          <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-[#ff9a89]">
            <BookOpenText className="h-3.5 w-3.5" /> Reflection library
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-white md:text-5xl">
            Keep what the work taught you.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
            Search evidence, observations, recall checkpoints, and the next
            moves you left for yourself. This library is a way back into the
            work, not a performance record.
          </p>
        </div>
      </header>

      <section
        className="signal-surface rounded-[2rem] border border-white/[.08] bg-[#0c1119]/92 p-6 md:p-8"
        aria-labelledby="weekly-reflection-heading"
      >
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-[#ff9a89]">
              <CalendarRange className="h-3.5 w-3.5" /> Weekly reflection
            </p>
            <h2
              id="weekly-reflection-heading"
              className="mt-3 text-2xl font-semibold text-white"
            >
              One quiet conversation with the week.
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Review the plain record, choose any evidence worth carrying, and
              leave one gentle continuation. This lives with your reflections
              rather than competing for attention on the Dashboard.
            </p>
            <p className="mt-2 text-xs leading-6 text-white/35">
              Week of {format(weekStartDate, "MMMM d")} · {weeklyMinutes}{" "}
              minutes across {weeklyActiveDays} active{" "}
              {weeklyActiveDays === 1 ? "day" : "days"}.
            </p>
          </div>
          {calendarQuery.isError && !preview ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void calendarQuery.refetch()}
              disabled={calendarQuery.isFetching}
              className="shrink-0 rounded-full border-white/15 text-white/70 hover:bg-white/[.06]"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${calendarQuery.isFetching ? "animate-spin" : ""}`}
              />
              Reload week
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setWeeklyReviewOpen(true)}
              disabled={calendarQuery.isLoading}
              className="shrink-0 rounded-full bg-[#e95448] px-5 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"
            >
              Reflect on this week
            </Button>
          )}
        </div>
      </section>

      {patterns.recent.length > 0 && (
        <section
          className="signal-surface rounded-[2rem] border border-white/[.08] bg-[#0c1119]/92 p-6 md:p-8"
          aria-labelledby="reflection-patterns-heading"
        >
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.24em] text-[#ff9a89]">
                Evidence patterns
              </p>
              <h2
                id="reflection-patterns-heading"
                className="mt-3 text-2xl font-semibold text-white"
              >
                What you have been leaving for yourself.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
                A factual 14-day view of the notes that make it easier to resume
                meaningful work. These are signals of available context, not
                scores.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[.025] px-4 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/40">
              Last 14 days
            </span>
          </div>
          <dl className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
              <dt className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
                Evidence entries
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-white">
                {patterns.recent.length}
              </dd>
              <p className="mt-1 text-xs text-white/40">
                Sessions with a recall or reflection.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
              <dt className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
                Next steps saved
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-white">
                {patterns.continuationCount}/{patterns.recent.length}
              </dd>
              <p className="mt-1 text-xs text-white/40">
                Entries that left a continuation.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
              <dt className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
                Recall attempts
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-white">
                {patterns.recallCount}/{patterns.recent.length}
              </dd>
              <p className="mt-1 text-xs text-white/40">
                Sessions begun with an attempt to remember.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
              <dt className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
                Most documented line
              </dt>
              <dd
                className="mt-2 truncate text-lg font-semibold text-white"
                title={patterns.leadingDirection?.name}
              >
                {patterns.leadingDirection?.name ?? "—"}
              </dd>
              <p className="mt-1 text-xs text-white/40">
                Direction with the most evidence entries.
              </p>
            </div>
          </dl>
          {patterns.latestLearning && (
            <p className="mt-5 border-l-2 border-[#ff7868]/50 pl-4 text-sm leading-relaxed text-white/60">
              <span className="font-semibold text-[#ff9a89]">
                Latest learning:
              </span>{" "}
              {patterns.latestLearning}
            </p>
          )}
        </section>
      )}

      <section
        className="signal-surface rounded-[2rem] border border-white/[.08] bg-[#0c1119]/92 p-6 md:p-8"
        aria-labelledby="evidence-shelf-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-[#ff9a89]">
              <Bookmark className="h-3.5 w-3.5" /> Evidence shelf
            </p>
            <h2
              id="evidence-shelf-heading"
              className="mt-3 text-2xl font-semibold text-white"
            >
              Keep a few notes close.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
              Save up to six pieces of evidence that you want to find again. The
              shelf is stored with your Open Finish data, not only in this
              browser.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[.025] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/40">
              {keptEvidence.length}/6 kept
            </span>
            {keptEvidence.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyShelfText}
                  data-copied={shelfCopied}
                  className="copy-action continuity-action rounded-xl border-white/10 bg-white/[.02] px-3 text-xs text-white/55 hover:bg-white/[.06] hover:text-white"
                >
                  {shelfCopied ? (
                    <Check className="mr-2 h-3.5 w-3.5" />
                  ) : (
                    <ClipboardCopy className="mr-2 h-3.5 w-3.5" />
                  )}
                  {shelfCopied ? "Copied" : "Copy as text"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => saveEvidenceShelf([])}
                  className="continuity-action rounded-xl px-3 text-xs text-white/45 hover:bg-white/[.05] hover:text-white"
                >
                  Clear shelf
                </Button>
              </>
            )}
          </div>
        </div>
        {shelfCopied && (
          <p
            role="status"
            className="mt-4 flex items-center gap-2 text-xs text-[#ffb1a7]"
          >
            <ClipboardCopy className="h-4 w-4" /> Evidence shelf copied
            privately to your clipboard.
          </p>
        )}
        {keptEvidence.length ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {keptEvidence.map((entry, index) => {
              const weeklyTrace = weeklyEvidenceTraces.get(entry.id);
              return (
                <article
                  key={entry.id}
                  className="continuity-card continuity-shelf-entry rounded-2xl border border-white/10 bg-white/[.02] p-4"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/activities/${entry.activityId}`}
                      className="flex min-w-0 items-center gap-2 text-xs font-semibold text-white hover:text-[#ff9a89]"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.activityColor }}
                      />{" "}
                      <span className="truncate">{entry.activityName}</span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveKeptEvidence(entry.id, "up")}
                        disabled={index === 0}
                        aria-label={`Move kept evidence from ${entry.activityName} higher on your shelf`}
                        className="continuity-action h-10 w-10 rounded-lg text-white/35 hover:bg-white/[.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-25 sm:h-7 sm:w-7"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveKeptEvidence(entry.id, "down")}
                        disabled={index === keptEvidence.length - 1}
                        aria-label={`Move kept evidence from ${entry.activityName} lower on your shelf`}
                        className="continuity-action h-10 w-10 rounded-lg text-white/35 hover:bg-white/[.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-25 sm:h-7 sm:w-7"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          saveEvidenceShelf(
                            keptEvidence.filter((kept) => kept.id !== entry.id),
                          )
                        }
                        aria-label={`Remove kept evidence from ${entry.activityName}`}
                        className="continuity-action h-10 w-10 rounded-lg text-white/35 hover:bg-white/[.06] hover:text-white sm:h-7 sm:w-7"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    {entry.text}
                  </p>
                  <p className="mt-4 text-[9px] font-bold uppercase tracking-[.13em] text-white/30">
                    Shelf position {index + 1} of {keptEvidence.length} · saved
                    evidence ·{" "}
                    {format(new Date(`${entry.logDate}T00:00:00`), "MMM d")}
                  </p>
                  {weeklyTrace && (
                    <p className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-xs leading-relaxed text-[#ffb1a7]">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" /> You included
                      this note in a weekly reflection for the week of{" "}
                      {format(
                        new Date(`${weeklyTrace.weekStart}T00:00:00`),
                        "MMM d",
                      )}
                      .
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[.015] p-5 text-sm leading-relaxed text-white/45">
            Nothing is kept close yet. On any reflection below, choose{" "}
            <span className="font-semibold text-white/70">Keep close</span> when
            a note would make a future return easier.
          </p>
        )}
      </section>

      <section
        className="signal-surface rounded-[2rem] border border-white/[.08] bg-[#0c1119]/92 p-5 md:p-6"
        aria-labelledby="reflection-search-heading"
      >
        <h2 id="reflection-search-heading" className="sr-only">
          Filter reflections
        </h2>
        <div className="grid gap-3 md:grid-cols-[1fr_.35fr]">
          <label className="relative">
            <span className="sr-only">Search reflections</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search what changed, what you learned, or a next step"
              className="h-12 rounded-2xl border-white/10 bg-white/[.035] pl-11 text-white placeholder:text-white/25"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by direction</span>
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <select
              value={activityId ?? ""}
              onChange={(event) =>
                setActivityId(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-white/[.035] px-11 text-sm text-white outline-none focus:ring-2 focus:ring-[#ff7868] [color-scheme:dark]"
            >
              <option value="">All directions</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="mt-5">
          <legend className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
            Start with a question
          </legend>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {(Object.keys(QUESTION_ROUTES) as EvidenceQuestion[]).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setLens(QUESTION_ROUTES[value].lens);
                    setQuestion(value);
                    setQuery("");
                  }}
                  aria-pressed={question === value}
                  className={`rounded-2xl border p-4 text-left transition-colors ${question === value ? "border-[#ff8b7c]/40 bg-[#ff7868]/[.10]" : "border-white/10 bg-white/[.02] hover:bg-white/[.055]"}`}
                >
                  <span
                    className={`text-sm font-semibold ${question === value ? "text-[#ffb1a7]" : "text-white/75"}`}
                  >
                    {QUESTION_ROUTES[value].prompt}
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-white/40">
                    {QUESTION_ROUTES[value].description}
                  </span>
                </button>
              ),
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/40">
            Question routes narrow the library to evidence that can support the
            question; they do not generate an answer for you.
          </p>
        </fieldset>
        <fieldset className="mt-5">
          <legend className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
            Evidence lens
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(LENS_COPY) as EvidenceLens[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setLens(value);
                  setQuestion(null);
                }}
                aria-pressed={lens === value}
                className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] transition-colors ${lens === value ? "border-[#ff8b7c]/35 bg-[#ff7868]/[.11] text-[#ffb1a7]" : "border-white/10 bg-white/[.02] text-white/40 hover:bg-white/[.055] hover:text-white"}`}
              >
                {LENS_COPY[value].label}{" "}
                <span className="ml-1 text-white/35">{lensCounts[value]}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/40">
            {LENS_COPY[lens].description}
          </p>
        </fieldset>
        <fieldset className="mt-5">
          <legend className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
            Time context
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(TIME_CONTEXT_COPY) as EvidenceTimeContext[]).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTimeContext(value)}
                  aria-pressed={timeContext === value}
                  className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] transition-colors ${timeContext === value ? "border-[#ff8b7c]/35 bg-[#ff7868]/[.11] text-[#ffb1a7]" : "border-white/10 bg-white/[.02] text-white/40 hover:bg-white/[.055] hover:text-white"}`}
                >
                  {TIME_CONTEXT_COPY[value].label}
                </button>
              ),
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/40">
            {TIME_CONTEXT_COPY[timeContext].description}
          </p>
        </fieldset>
        <div
          className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/40"
          aria-live="polite"
        >
          <span>
            {question ? `${QUESTION_ROUTES[question].prompt} · ` : ""}
            {activityId && selectedActivity
              ? `Showing ${selectedActivity.name} only · `
              : ""}
            {evidenceDate
              ? `From ${format(new Date(`${evidenceDate}T00:00:00`), "MMMM d")} · `
              : ""}
            {filtered.length}{" "}
            {filtered.length === 1 ? "reflection" : "reflections"} shown ·{" "}
            {LENS_COPY[lens].label.toLowerCase()} ·{" "}
            {TIME_CONTEXT_COPY[timeContext].label.toLowerCase()}.
          </span>
          {evidenceDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEvidenceDate(null)}
              className="h-auto rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-white/50 hover:bg-white/[.06] hover:text-white"
            >
              Clear day
            </Button>
          )}
        </div>
      </section>

      {filtered.length ? (
        <div className="space-y-4">
          {filtered.map((entry) => (
            <article
              key={entry.id}
              className="signal-surface rounded-[2rem] border border-white/[.08] bg-[#0c1119]/92 p-6 md:p-8"
            >
              <div className="flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: entry.activityColor }}
                  />
                  <div>
                    <Link
                      href={`/activities/${entry.activityId}`}
                      className="font-semibold text-white hover:text-[#ff9a89]"
                    >
                      {entry.activityName}
                    </Link>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[.15em] text-white/35">
                      {format(
                        new Date(`${entry.logDate}T00:00:00`),
                        "MMMM d, yyyy",
                      )}{" "}
                      · {entry.durationMinutes} min
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toggleKeptEvidence(entry)}
                    aria-pressed={keptEvidenceIds.has(entry.id)}
                    className={`rounded-xl px-3 text-[10px] font-bold uppercase tracking-[.12em] ${keptEvidenceIds.has(entry.id) ? "border-[#ff8b7c]/35 bg-[#ff7868]/[.10] text-[#ffb1a7] hover:bg-[#ff7868]/[.16] hover:text-white" : "border-white/10 bg-white/[.02] text-white/45 hover:bg-white/[.06] hover:text-white"}`}
                  >
                    {keptEvidenceIds.has(entry.id) ? (
                      <BookmarkCheck className="mr-2 h-3.5 w-3.5" />
                    ) : (
                      <Bookmark className="mr-2 h-3.5 w-3.5" />
                    )}
                    {keptEvidenceIds.has(entry.id)
                      ? "Kept close"
                      : "Keep close"}
                  </Button>
                  <Link
                    href={`/history?date=${entry.logDate}&from=reflection${preview ? "&preview" : ""}`}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/40 hover:text-white"
                  >
                    Open this day <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/activities/${entry.activityId}`}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/40 hover:text-white"
                  >
                    Open direction <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <dl className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {entry.recallNote && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/35">
                      Recall checkpoint
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-white/70">
                      {entry.recallNote}
                    </dd>
                    {recallTrails.get(entry.id) && (
                      <aside className="mt-4 rounded-2xl border border-[#ff8b7c]/15 bg-[#ff7868]/[.055] p-4">
                        <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.14em] text-[#ff9a89]">
                          <CornerDownRight className="h-3.5 w-3.5" /> Recall
                          trail
                        </p>
                        <p className="mt-3 text-xs leading-relaxed text-white/50">
                          This recall followed the note:
                        </p>
                        <blockquote className="mt-2 border-l border-[#ff8b7c]/45 pl-3 text-sm leading-relaxed text-white/75">
                          “{recallTrails.get(entry.id)?.text}”
                        </blockquote>
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[.13em] text-white/30">
                          Available from{" "}
                          {format(
                            new Date(
                              `${recallTrails.get(entry.id)?.logDate}T00:00:00`,
                            ),
                            "MMMM d",
                          )}
                        </p>
                      </aside>
                    )}
                  </div>
                )}
                {entry.whatMoved && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/35">
                      What moved
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-white/70">
                      {entry.whatMoved}
                    </dd>
                  </div>
                )}
                {entry.whatLearned && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/35">
                      What I learned
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-white/70">
                      {entry.whatLearned}
                    </dd>
                  </div>
                )}
                {entry.nextContinuation && (
                  <div className="rounded-2xl border border-[#ff8b7c]/15 bg-[#ff7868]/[.06] p-4">
                    <dt className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#ff9a89]">
                      <Sparkles className="h-3.5 w-3.5" /> Next continuation
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-white/75">
                      {entry.nextContinuation}
                    </dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <section className="signal-surface rounded-[2rem] border border-dashed border-white/15 bg-[#0c1119]/80 p-14 text-center">
          <BookOpenText className="mx-auto h-10 w-10 text-white/20" />
          <h2 className="mt-5 text-2xl font-semibold text-white">
            No matching reflections yet
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
            Try another search, direction, evidence lens, or time context. You
            can also log a session and add a few optional words about what
            moved, what you learned, or what comes next.
          </p>
        </section>
      )}
      <WeeklyReviewDialog
        open={weeklyReviewOpen}
        onOpenChange={setWeeklyReviewOpen}
        light={false}
        weekStart={weekStart}
        minutes={weeklyMinutes}
        activeDays={weeklyActiveDays}
        evidence={weeklyReviewEvidence}
        keptEvidence={keptEvidence}
        existingReview={currentWeeklyReflection}
        preview={preview}
      />
    </div>
  );
}
