import { useEffect, useMemo, useState } from "react";
import {
  getListAchievementsQueryKey,
  useListAchievements,
  type Achievement,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Check, Lock, RefreshCw, Sparkles } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SamuraiStatusIcon } from "@/components/samurai-status-icon";
import zenGarden from "@/assets/environments/optimized/history-zen-garden.webp";

function achievementDate(value: string, pattern: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : format(date, pattern);
}

type JourneyMark = {
  key: string;
  title: string;
  condition: string;
  icon: string;
  matches: (type: string) => boolean;
};

const JOURNEY_MARKS: JourneyMark[] = [
  {
    key: "first-log",
    title: "The First Mark",
    condition: "Log your first session.",
    icon: "◇",
    matches: (type) => type === "first_log",
  },
  {
    key: "sessions-10",
    title: "Ten Returns",
    condition: "Keep ten sessions in the record.",
    icon: "✦",
    matches: (type) => type === "sessions_10",
  },
  {
    key: "sessions-25",
    title: "A Habit Takes Shape",
    condition: "Reach twenty-five sessions.",
    icon: "◈",
    matches: (type) => type === "sessions_25",
  },
  {
    key: "sessions-50",
    title: "Fifty Returns",
    condition: "Reach fifty sessions.",
    icon: "◉",
    matches: (type) => type === "sessions_50",
  },
  {
    key: "sessions-100",
    title: "One Hundred Returns",
    condition: "Reach one hundred sessions.",
    icon: "✺",
    matches: (type) => type === "sessions_100",
  },
  {
    key: "practice-600",
    title: "Ten Hours Invested",
    condition: "Accumulate 600 practice minutes.",
    icon: "⌁",
    matches: (type) => type === "practice_minutes_600",
  },
  {
    key: "sport-180",
    title: "The Body Returned",
    condition: "Accumulate 180 sport minutes.",
    icon: "◒",
    matches: (type) => type === "sport_minutes_180",
  },
  {
    key: "directions-3",
    title: "Three Directions Awake",
    condition: "Log time in three directions.",
    icon: "△",
    matches: (type) => type === "directions_3",
  },
  {
    key: "directions-5",
    title: "A Wider Field",
    condition: "Log time in five directions.",
    icon: "✧",
    matches: (type) => type === "directions_5",
  },
  {
    key: "active-days-7",
    title: "A Week in View",
    condition: "Keep seven active calendar days.",
    icon: "▦",
    matches: (type) => type === "active_days_7",
  },
  {
    key: "streak-3",
    title: "Three-Day Return",
    condition: "Return to one direction for three consecutive days.",
    icon: "◌",
    matches: (type) => type.startsWith("streak_3_"),
  },
  {
    key: "streak-7",
    title: "Seven-Day Thread",
    condition: "Keep one direction alive for a full week.",
    icon: "◍",
    matches: (type) => type.startsWith("streak_7_"),
  },
  {
    key: "streak-30",
    title: "A Month of Return",
    condition: "Keep one direction alive for thirty consecutive days.",
    icon: "♛",
    matches: (type) => type.startsWith("streak_30_"),
  },
];

export default function Achievements() {
  const preview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("preview");
  const achievementsQuery = useListAchievements({
    query: { enabled: !preview, queryKey: getListAchievementsQueryKey() },
  });
  const previewAchievements = useMemo<Achievement[]>(
    () => [
      {
        id: 9001,
        type: "system_milestone",
        title: "A Line Became a Practice",
        description:
          "You returned often enough for effort to become part of the landscape.",
        icon: "✦",
        activityId: null,
        activityName: null,
        unlockedAt: "2026-08-13T18:40:00.000Z",
      },
      {
        id: 9000,
        type: "first_log",
        title: "The First Mark",
        description:
          "The journey became visible with its first recorded session.",
        icon: "◇",
        activityId: null,
        activityName: null,
        unlockedAt: "2026-08-01T09:15:00.000Z",
      },
    ],
    [],
  );
  const achievements = preview
    ? previewAchievements
    : Array.isArray(achievementsQuery.data)
      ? achievementsQuery.data
      : [];
  const isLoading = !preview && achievementsQuery.isLoading;
  const isError = !preview && achievementsQuery.isError;
  const hasCachedData = preview || achievementsQuery.data !== undefined;
  const [ritualOpen, setRitualOpen] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [reconcileMessage, setReconcileMessage] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const latestAchievement = useMemo(
    () =>
      [...achievements].sort((a, b) => {
        const bTime = new Date(b.unlockedAt).getTime();
        const aTime = new Date(a.unlockedAt).getTime();
        return (
          (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
        );
      })[0],
    [achievements],
  );

  useEffect(() => {
    if (!latestAchievement) return;
    const lastSeen = window.localStorage.getItem(
      "open-finish:last-seen-achievement",
    );
    setRitualOpen(lastSeen !== String(latestAchievement.id));
  }, [latestAchievement]);

  const closeRitual = () => {
    if (latestAchievement)
      window.localStorage.setItem(
        "open-finish:last-seen-achievement",
        String(latestAchievement.id),
      );
    setRitualOpen(false);
  };

  const reconcileJourney = async () => {
    if (reconciling) return;
    setReconciling(true);
    setReconcileError(null);
    setReconcileMessage(null);
    try {
      const response = await fetch("/api/achievements/reconcile", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Journey marks could not be refreshed");
      const payload = (await response.json()) as { unlocked?: unknown[] };
      const unlockedCount = Array.isArray(payload.unlocked)
        ? payload.unlocked.length
        : 0;
      setReconcileMessage(
        unlockedCount
          ? `${unlockedCount} new ${unlockedCount === 1 ? "mark is" : "marks are"} now visible.`
          : "Your journey marks are already current.",
      );
      await achievementsQuery.refetch();
    } catch (error) {
      setReconcileError(
        error instanceof Error
          ? error.message
          : "Journey marks could not be refreshed",
      );
    } finally {
      setReconciling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-3xl bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-3xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && !hasCachedData) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 text-center">
        <div className="signal-surface w-full rounded-[2rem] border border-[#ff7868]/20 bg-[#0c1119]/94 p-10">
          <Award className="mx-auto mb-4 h-10 w-10 text-[#ff8b7c]" />
          <h1 className="mb-2 text-2xl font-semibold text-white">
            Couldn’t load your journey marks
          </h1>
          <p className="mb-6 text-sm text-white/45">
            Your achievements are still safe. Check the connection and try
            again.
          </p>
          <button
            type="button"
            onClick={() => void achievementsQuery.refetch()}
            className="signal-button inline-flex items-center gap-2 rounded-2xl bg-[#e95448] px-5 py-3 text-sm font-semibold text-white hover:bg-[#f26456]"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const unlockedMarks = JOURNEY_MARKS.filter((mark) =>
    achievements.some((achievement) => mark.matches(achievement.type)),
  );
  const lockedMarks = JOURNEY_MARKS.filter(
    (mark) =>
      !achievements.some((achievement) => mark.matches(achievement.type)),
  );
  const legacyCount = achievements.filter(
    (achievement) =>
      !JOURNEY_MARKS.some((mark) => mark.matches(achievement.type)),
  ).length;
  const unlockedCount = unlockedMarks.length;
  const totalCount = JOURNEY_MARKS.length;
  const progressPercent = Math.min(
    100,
    Math.round((unlockedCount / totalCount) * 100),
  );
  const nextMark = lockedMarks[0] ?? null;

  return (
    <div className="page-arrival relative z-10 mx-auto min-h-screen max-w-6xl space-y-12 px-4 py-6 pb-28 md:p-8 md:pb-20">
      {latestAchievement && (
        <Dialog
          open={ritualOpen}
          onOpenChange={(open) => {
            if (!open) closeRitual();
          }}
        >
          <DialogContent className="achievement-ritual signal-surface overflow-hidden rounded-[2rem] border border-[#ffc268]/24 bg-[#0c1119] p-8 text-center text-white shadow-[0_30px_100px_rgba(0,0,0,.5)] md:p-11">
            <div className="absolute inset-x-16 top-[-5rem] h-44 rounded-full bg-[#ff7968]/14 blur-3xl" />
            <Sparkles className="relative mx-auto mb-6 h-5 w-5 text-[#ffc268]" />
            <p className="relative text-[9px] font-bold uppercase tracking-[.28em] text-[#ffc268]/75">
              A mark in the whole journey
            </p>
            <div className="relative my-7 text-6xl">
              {latestAchievement.icon || "🏆"}
            </div>
            <DialogTitle className="relative text-3xl font-semibold text-white">
              {latestAchievement.title}
            </DialogTitle>
            <DialogDescription className="relative mx-auto mt-3 max-w-sm text-sm leading-6 text-white/45">
              {latestAchievement.description}
            </DialogDescription>
            <p className="relative mt-7 text-[9px] font-bold uppercase tracking-[.18em] text-white/28">
              Earned{" "}
              {achievementDate(latestAchievement.unlockedAt, "MMMM d, yyyy")}
            </p>
            <button
              type="button"
              onClick={closeRitual}
              className="signal-button relative mt-8 rounded-full bg-[#e95448] px-6 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-white hover:bg-[#f26456]"
            >
              Keep the mark
            </button>
          </DialogContent>
        </Dialog>
      )}
      <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-[#ff9a89]">
            <Sparkles className="h-3.5 w-3.5" /> Living marks
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Achievements
          </h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#ff8b7c]/80">
            {unlockedCount} of {totalCount} journey marks visible
            {legacyCount
              ? ` · ${legacyCount} earlier mark${legacyCount === 1 ? "" : "s"} kept`
              : ""}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void reconcileJourney()}
          disabled={reconciling || preview}
          className="signal-button h-11 rounded-full bg-[#e95448] px-5 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${reconciling ? "animate-spin" : ""}`}
          />
          {reconciling ? "Reviewing" : "Review journey"}
        </Button>
      </div>

      {isError && hasCachedData && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#ffc268]/20 bg-[#ffc268]/[.07] px-5 py-4 text-sm text-[#ffe0a5]">
          <span>
            Showing saved marks. The latest achievements could not be loaded.
          </span>
          <button
            type="button"
            onClick={() => void achievementsQuery.refetch()}
            className="signal-button inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold hover:bg-white/5"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      {reconcileError && (
        <div
          className="rounded-2xl border border-[#ff8b7c]/20 bg-[#ff7868]/[.07] px-5 py-4 text-sm text-[#ffb1a7]"
          role="alert"
        >
          {reconcileError}
        </div>
      )}

      {reconcileMessage && (
        <div
          className="quiet-reveal flex items-center gap-3 rounded-2xl border border-[#ffc268]/18 bg-[#ffc268]/[.06] px-5 py-4 text-sm text-[#ffe0a5]"
          role="status"
        >
          <SamuraiStatusIcon
            status="active"
            label="Journey review complete"
            className="h-9 w-9 shrink-0 opacity-85"
          />
          {reconcileMessage}
        </div>
      )}

      {/* Progress Bar */}
      <div className="signal-surface relative overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92 p-8">
        <img
          src={zenGarden}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center opacity-[.13]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(12,17,25,.9),rgba(12,17,25,.58),rgba(12,17,25,.86))]" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">
              Journey marks
            </span>
            <p className="mt-2 text-sm text-white/48">
              {nextMark
                ? `Next: ${nextMark.title} · ${nextMark.condition}`
                : "Every current journey mark is visible."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SamuraiStatusIcon
              status={unlockedCount === totalCount ? "active" : "focus"}
              label={
                unlockedCount === totalCount
                  ? "Every current journey mark is visible"
                  : "Focus on the next journey mark"
              }
              className="h-12 w-12 opacity-80"
            />
            <span className="text-3xl font-semibold tracking-tight text-[#ffc268]">
              {progressPercent}%
            </span>
          </div>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden relative z-10">
          <div
            className="achievement-progress h-full rounded-full bg-gradient-to-r from-[#d95149] to-[#efb45f] shadow-[0_0_14px_rgba(255,194,104,.2)] transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-[#ffc268]/[.06] to-transparent" />
      </div>

      {/* Unlocked Achievements */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-8 text-white tracking-wide">
            Unlocked
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-focus-scope
          >
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="achievement-card signal-surface group relative flex min-h-64 flex-col rounded-3xl border border-[#ff9b84]/16 bg-[#0c1119]/92 p-8 hover:-translate-y-1 hover:border-[#ffc268]/24"
                data-testid={`achievement-${achievement.id}`}
                data-focus-item
              >
                <div className="pointer-events-none absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-[#ffc268]/[.06] opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="text-5xl drop-shadow-[0_0_14px_rgba(255,194,104,.25)]">
                    {achievement.icon || "🏆"}
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-[#ffc268]/20 bg-[#ffc268]/[.07] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#ffc268]">
                    <Check className="w-3.5 h-3.5" />
                    Earned
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight text-white tracking-wide">
                  {achievement.title}
                </h3>
                <p className="text-sm text-white/50 mb-6 font-medium">
                  {achievement.description}
                </p>

                <div className="pt-5 border-t border-white/10 mt-auto flex items-center justify-between">
                  {achievement.activityName ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff9a89]">
                      {achievement.activityName}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    {achievementDate(achievement.unlockedAt, "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      <div>
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-wide text-white">
              Still taking shape
            </h2>
            <p className="mt-2 text-sm text-white/40">
              Every mark names the next return instead of hiding it.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[.16em] text-white/25">
            {lockedMarks.length} ahead
          </span>
        </div>
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          data-focus-scope
        >
          {lockedMarks.map((mark) => (
            <article
              key={mark.key}
              className="signal-surface group relative overflow-hidden rounded-3xl border border-dashed border-white/[.09] bg-[#0a0e15]/76 p-7 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#ffc268]/20 hover:bg-[#0c1119]/92"
              data-testid={`locked-achievement-${mark.key}`}
              data-focus-item
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[.07] bg-white/[.025] text-2xl text-white/35">
                  <span aria-hidden="true">{mark.icon}</span>
                  <span className="sr-only">Locked</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/[.06] bg-white/[.025] px-3 py-2 text-[9px] font-bold uppercase tracking-[.14em] text-white/35">
                  <Lock className="h-3.5 w-3.5" /> Locked
                </div>
              </div>
              <h3 className="mt-7 text-xl font-semibold leading-tight text-white/72">
                {mark.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/38">
                {mark.condition}
              </p>
            </article>
          ))}
        </div>
      </div>

      {achievements.length === 0 && (
        <div className="signal-surface rounded-3xl border border-dashed border-[#ffc268]/14 bg-[#0c1119]/88 p-10 text-center md:p-14">
          <SamuraiStatusIcon
            status="standing"
            label="Your first mark may be waiting"
            className="mx-auto mb-4 h-16 w-16 opacity-75"
          />
          <h3 className="text-xl font-semibold text-white">
            Your first mark may already be waiting
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
            Review the sessions already in your history. Open Finish only adds a
            mark when a real condition has been met.
          </p>
          <Button
            type="button"
            onClick={() => void reconcileJourney()}
            disabled={reconciling || preview}
            className="signal-button mt-7 rounded-full bg-[#e95448] px-6 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${reconciling ? "animate-spin" : ""}`}
            />
            Review journey
          </Button>
        </div>
      )}
    </div>
  );
}
