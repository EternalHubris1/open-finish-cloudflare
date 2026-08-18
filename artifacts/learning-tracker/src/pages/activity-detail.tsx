import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetActivity,
  useListActivityLogs,
  useDeleteLog,
  getGetCalendarQueryKey,
  getGetWeeklyProgressQueryKey,
  getListActivityLogsQueryKey,
  getGetDashboardQueryKey,
  getListStreaksQueryKey,
} from "@workspace/api-client-react";
import { LogActivityDialog } from "@/components/log-activity-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Calendar, Clock } from "lucide-react";
import { addDays, format, startOfWeek, subWeeks } from "date-fns";
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
import { DailyActivityChart } from "@/components/daily-activity-chart";

export default function ActivityDetail() {
  const params = useParams();
  const activityId = params.id ? Number(params.id) : 0;
  const { data: activity, isLoading: activityLoading } = useGetActivity(
    activityId,
    {
      query: {
        enabled: !!activityId,
        queryKey: ["activity", activityId] as any,
      },
    },
  );
  const { data: logs = [], isLoading: logsLoading } = useListActivityLogs(
    activityId,
    {
      query: { queryKey: ["activity-logs", activityId] as any },
    },
  );
  const deleteLog = useDeleteLog();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  if (activityLoading || logsLoading) {
    return (
      <div className="p-8 space-y-8 max-w-5xl mx-auto relative z-10">
        <Skeleton className="h-12 w-32 rounded-2xl bg-white/5" />
        <Skeleton className="h-40 rounded-3xl bg-white/5" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center mt-20 relative z-10">
        <p className="text-2xl text-white/50">Activity not found</p>
        <Link
          href="/activities"
          className="text-red-400 mt-4 inline-block underline font-bold tracking-wide"
        >
          Back to activities
        </Link>
      </div>
    );
  }

  const handleDeleteLog = () => {
    if (!deletingLogId) return;

    deleteLog.mutate(
      { id: deletingLogId },
      {
        onSuccess: () => {
          toast({ title: "Log deleted" });
          queryClient.invalidateQueries({
            queryKey: getListActivityLogsQueryKey(activityId),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardQueryKey(),
          });
          queryClient.invalidateQueries({ queryKey: getListStreaksQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getGetWeeklyProgressQueryKey(),
          });
          queryClient.invalidateQueries({ queryKey: getGetCalendarQueryKey() });
          setDeleteDialogOpen(false);
          setDeletingLogId(null);
        },
        onError: () => {
          toast({ title: "Failed to delete log", variant: "destructive" });
        },
      },
    );
  };

  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const chartStart = startOfWeek(subWeeks(new Date(), 11), { weekStartsOn: 1 });
  const minutesByDate = new Map<string, number>();
  logs.forEach((log) => {
    minutesByDate.set(
      log.logDate,
      (minutesByDate.get(log.logDate) ?? 0) + log.durationMinutes,
    );
  });
  const chartDays = Array.from({ length: 84 }, (_, index) => {
    const date = format(addDays(chartStart, index), "yyyy-MM-dd");
    return { date, minutes: minutesByDate.get(date) ?? 0 };
  });

  return (
    <div className="min-h-screen p-8 space-y-10 animate-slide-up max-w-5xl mx-auto relative z-10 pb-20">
      <div>
        <Link href="/activities">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-2xl uppercase tracking-wider text-[10px] font-bold text-white/40 hover:text-white hover:bg-white/5"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Activity Header */}
      <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
        <div
          className="absolute left-0 top-0 bottom-0 w-2 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          style={{ backgroundColor: activity.color || "#dc2626" }}
        />
        <div className="flex items-start justify-between relative z-10 pl-6">
          <div className="flex items-center gap-10">
            <div
              className="w-24 h-24 flex items-center justify-center border-2 rounded-[2rem] backdrop-blur-md shadow-xl"
              style={{
                borderColor: activity.color || "#dc2626",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              }}
            >
              <Clock
                className="w-10 h-10"
                style={{ color: activity.color || "#dc2626" }}
              />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white tracking-wide">
                {activity.name}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">
                {activity.category}
              </p>
              <div className="flex items-center gap-10 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-white">
                    {activity.targetMinutesPerDay} min
                  </span>
                  <span className="text-white/40 font-semibold uppercase tracking-wider text-[10px]">
                    daily target
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-white">{logs.length}</span>
                  <span className="text-white/40 font-semibold uppercase tracking-wider text-[10px]">
                    sessions
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => setLogDialogOpen(true)}
            className="gap-2 rounded-2xl font-bold uppercase tracking-wider text-[11px] bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 hover:scale-[1.03] active:scale-[0.97] transition-all border-0 px-8"
            data-testid="button-log-session"
          >
            <Plus className="w-4 h-4" />
            Log Session
          </Button>
        </div>

        <div
          className="absolute right-0 top-0 bottom-0 w-80 opacity-[0.03] pointer-events-none transition-transform duration-700 group-hover:scale-110 blur-3xl"
          style={{ backgroundColor: activity.color || "#dc2626" }}
        />
      </div>

      {(activity.purpose ||
        activity.currentThread ||
        activity.evidenceNote) && (
        <section
          className="grid gap-4 rounded-3xl border border-white/10 bg-[rgba(15,15,20,0.82)] p-6 backdrop-blur-xl md:grid-cols-3 md:p-8"
          aria-label="Direction context"
        >
          {activity.purpose && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
                Why this line exists
              </p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                {activity.purpose}
              </p>
            </div>
          )}
          {activity.currentThread && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
                Current thread
              </p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                {activity.currentThread}
              </p>
            </div>
          )}
          {activity.evidenceNote && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
                Visible movement
              </p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                {activity.evidenceNote}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="rounded-3xl p-8 border-b-4 backdrop-blur-xl bg-[rgba(20,20,25,0.7)] shadow-lg"
          style={{ borderColor: activity.color || "#dc2626" }}
        >
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3 font-bold">
            Total Time
          </p>
          <p className="text-4xl font-bold text-white tracking-tight">
            {totalHours > 0
              ? `${totalHours}h ${remainingMinutes}m`
              : `${totalMinutes}m`}
          </p>
        </div>
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3 font-bold">
            Total Sessions
          </p>
          <p className="text-4xl font-bold text-white tracking-tight">
            {logs.length}
          </p>
        </div>
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3 font-bold">
            Avg Session
          </p>
          <p className="text-4xl font-bold text-white tracking-tight">
            {logs.length > 0 ? Math.round(totalMinutes / logs.length) : 0}m
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-white/10 bg-[rgba(15,15,20,0.85)] p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-white">Daily rhythm</h2>
          <p className="mt-2 text-sm text-white/40">
            The last 12 weeks of {activity.name.toLowerCase()}.
          </p>
        </div>
        <DailyActivityChart days={chartDays} color={activity.color} />
      </section>

      {/* Log History */}
      <div className="pt-6">
        <h2 className="text-2xl font-bold mb-8 text-white tracking-wide">
          Session History
        </h2>
        {logs.length === 0 ? (
          <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/5 border-dashed rounded-3xl p-16 text-center shadow-2xl">
            <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-white tracking-wide">
              No sessions yet
            </h3>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-8">
              Log your first session to build momentum
            </p>
            <Button
              onClick={() => setLogDialogOpen(true)}
              className="rounded-2xl px-8 uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
              data-testid="button-log-first"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log First Session
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {logs
              .sort(
                (a, b) =>
                  new Date(b.logDate).getTime() - new Date(a.logDate).getTime(),
              )
              .map((log) => (
                <div
                  key={log.id}
                  className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all duration-300 hover:border-white/20 hover:shadow-2xl flex items-start justify-between group"
                  data-testid={`log-${log.id}`}
                >
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-8 mb-5 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2 text-[11px] text-white/80 font-bold uppercase tracking-widest">
                        <Calendar className="w-4 h-4 text-white/30" />
                        <span>
                          {format(new Date(log.logDate), "MMMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xl">
                        <Clock
                          className="w-4 h-4"
                          style={{ color: activity.color || "#dc2626" }}
                        />
                        <span className="font-bold text-white tracking-tight">
                          {log.durationMinutes} min
                        </span>
                      </div>
                    </div>
                    {log.notes ? (
                      <p
                        className="text-base text-white/60 leading-relaxed pl-4 border-l-2 font-medium italic"
                        style={{ borderColor: activity.color || "#dc2626" }}
                      >
                        "{log.notes}"
                      </p>
                    ) : (
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-white/30 pl-4 border-l-2 border-white/10">
                        No notes
                      </p>
                    )}
                    {(log.recallNote ||
                      log.whatMoved ||
                      log.whatLearned ||
                      log.nextContinuation) && (
                      <dl className="mt-5 grid gap-4 rounded-2xl border border-white/[.07] bg-white/[.02] p-4 sm:grid-cols-2">
                        {log.recallNote && (
                          <div>
                            <dt className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                              Recall
                            </dt>
                            <dd className="mt-1 text-sm text-white/60">
                              {log.recallNote}
                            </dd>
                          </div>
                        )}
                        {log.whatMoved && (
                          <div>
                            <dt className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                              What moved
                            </dt>
                            <dd className="mt-1 text-sm text-white/60">
                              {log.whatMoved}
                            </dd>
                          </div>
                        )}
                        {log.whatLearned && (
                          <div>
                            <dt className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                              What I learned
                            </dt>
                            <dd className="mt-1 text-sm text-white/60">
                              {log.whatLearned}
                            </dd>
                          </div>
                        )}
                        {log.nextContinuation && (
                          <div>
                            <dt className="text-[9px] font-bold uppercase tracking-widest text-[#ff9a89]">
                              Next continuation
                            </dt>
                            <dd className="mt-1 text-sm text-white/70">
                              {log.nextContinuation}
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/30 hover:text-red-400 rounded-2xl h-10 w-10 p-0"
                    onClick={() => {
                      setDeletingLogId(log.id);
                      setDeleteDialogOpen(true);
                    }}
                    data-testid={`button-delete-log-${log.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </div>

      <LogActivityDialog
        activity={activity}
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        startingContext={
          logs.find((log) => log.nextContinuation)?.nextContinuation ??
          activity.currentThread
        }
        startingContextSource="Direction detail · saved continuation"
        priorEvidence={logs}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          className="rounded-3xl border-white/10 p-8 bg-[#0a0a0a] backdrop-blur-2xl shadow-2xl"
          data-testid="dialog-delete-log"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-red-500">
              Delete Session?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-sm mt-2">
              This will permanently delete this session log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel
              className="rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white"
              data-testid="button-cancel-delete-log"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLog}
              className="rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-red-900/50 border border-red-500/50 text-red-400 hover:bg-red-900/80 backdrop-blur-xl"
              data-testid="button-confirm-delete-log"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
