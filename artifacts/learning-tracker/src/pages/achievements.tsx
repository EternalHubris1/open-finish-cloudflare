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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SamuraiStatusIcon } from "@/components/samurai-status-icon";
import armoryRoom from "@/assets/environments/optimized/cabinet-armory-room.webp";
import completedScrollEmblem from "@/assets/icons/completed-scroll-emblem-v1.webp";
import { CompletionArchiveWall } from "@/components/completion-archive-wall";
import Streaks from "./streaks";

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
  const [activeTab, setActiveTab] = useState<"journey" | "completed">(
    "completed",
  );
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
  const nextMark = lockedMarks[0] ?? null;

  return (
    <div className="page-arrival relative z-10 mx-auto min-h-screen max-w-6xl px-4 py-6 pb-28 md:p-8 md:pb-20">
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
      <section className="progress-room">
      <header className="progress-room__hero relative isolate overflow-hidden px-6 py-7 md:px-8 md:py-8">
        <img src={armoryRoom} alt="" aria-hidden="true" className="room-motif-image pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,20,.92),rgba(8,13,20,.62)_58%,rgba(8,13,20,.18))]" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-1 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#ffc268]/28 bg-black/25 shadow-[0_0_28px_rgba(255,194,104,.1)]">
              <img src={completedScrollEmblem} alt="" aria-hidden="true" className="h-12 w-12 object-contain drop-shadow-[0_0_12px_rgba(255,194,104,.2)]" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.24em] text-[#ff9a89]">Long-view room</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] text-white md:text-4xl">Progress</h1>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#ff8b7c]/80">Finished work first · milestones and return lines kept in context</p>
            </div>
          </div>
          <Button type="button" onClick={() => setActiveTab("journey")} className="signal-button h-11 rounded-full border border-[#ffc268]/24 bg-black/25 px-5 text-[10px] font-bold uppercase tracking-[.14em] text-[#ffe0a5] backdrop-blur-md hover:bg-white/[.08]">
            <Award className="mr-2 h-4 w-4" /> Journey marks
          </Button>
        </div>
      </header>

      <CompletionArchiveWall />

      <Dialog open={activeTab === "journey"} onOpenChange={(open) => !open && setActiveTab("completed")}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[2rem] border-[#ffc268]/16 bg-[#090d14] p-0 text-white shadow-[0_30px_100px_rgba(0,0,0,.55)]">
          <DialogHeader className="relative isolate overflow-hidden border-b border-white/[.07] p-6 text-left md:p-7">
            <img src={armoryRoom} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-55" />
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,13,20,.96),rgba(8,13,20,.68),rgba(8,13,20,.36))]" />
            <div className="flex items-center gap-4 pr-8">
              <img src={completedScrollEmblem} alt="" aria-hidden="true" className="h-12 w-12 shrink-0 object-contain" />
              <div>
                <DialogTitle className="text-2xl font-semibold">Journey marks</DialogTitle>
                <DialogDescription className="mt-1 text-white/46">Rare milestones kept quietly beside the completed-work archive.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-6 p-5 md:p-7">
          {isError && hasCachedData && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#ffc268]/20 bg-[#ffc268]/[.07] px-5 py-4 text-sm text-[#ffe0a5]">
              <span>
                Showing saved marks. The latest achievements could not be
                loaded.
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

          <div className="relative overflow-hidden rounded-2xl border border-[#ffc268]/14 bg-[#ffc268]/[.035] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[.18em] text-[#ffe0a5]/62">
                  Next threshold
                </span>
                <p className="mt-1.5 text-sm text-white/58">
                  {nextMark
                    ? `Next: ${nextMark.title} · ${nextMark.condition}`
                    : "Every current journey mark is visible."}
                </p>
              </div>
              <div className="shrink-0 rounded-xl border border-white/[.08] bg-black/20 px-3 py-2 text-right">
                <span className="block font-mono text-lg font-semibold text-[#ffe0a5]">{unlockedCount}/{totalCount}</span>
                <span className="block text-[7px] font-bold uppercase tracking-[.15em] text-white/30">marks held</span>
              </div>
            </div>
          </div>

          {/* Unlocked Achievements */}
          {achievements.length > 0 && (
            <div>
              <h2 className="mb-3 text-[9px] font-bold uppercase tracking-[.2em] text-[#ffc268]/72">
                Held marks
              </h2>
              <div
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                data-focus-scope
              >
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="achievement-card group relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 rounded-xl border border-[#ff9b84]/14 bg-[#0c1119]/82 p-3 hover:border-[#ffc268]/22"
                    data-testid={`achievement-${achievement.id}`}
                    data-focus-item
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-lg border border-[#ffc268]/14 bg-[#ffc268]/[.04] text-2xl drop-shadow-[0_0_10px_rgba(255,194,104,.18)]">
                        {achievement.icon || "🏆"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-white">{achievement.title}</h3>
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#ffc268]" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/42">{achievement.description}</p>
                      <span className="mt-2 block text-[8px] font-bold uppercase tracking-[.13em] text-white/30">
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
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[9px] font-bold uppercase tracking-[.2em] text-white/42">
                  Still taking shape
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[.16em] text-white/25">
                {lockedMarks.length} ahead
              </span>
            </div>
            <div
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              data-focus-scope
            >
              {lockedMarks.map((mark) => (
                <article
                  key={mark.key}
                  className="group flex items-center gap-3 rounded-xl border border-dashed border-white/[.08] bg-[#0a0e15]/72 p-3 transition-colors hover:border-[#ffc268]/18"
                  data-testid={`locked-achievement-${mark.key}`}
                  data-focus-item
                >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/[.07] bg-white/[.025] text-lg text-white/30">
                      <span aria-hidden="true">{mark.icon}</span>
                      <span className="sr-only">Locked</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-white/64">{mark.title}</h3>
                      <p className="mt-1 truncate text-xs text-white/32">{mark.condition}</p>
                    </div>
                    <Lock className="h-3.5 w-3.5 shrink-0 text-white/24" />
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
                Review the sessions already in your history. Open Finish only
                adds a mark when a real condition has been met.
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
        </DialogContent>
      </Dialog>

      <section className="progress-room__streaks border-t border-white/[.07]">
        <Streaks embedded />
      </section>
      </section>
    </div>
  );
}
