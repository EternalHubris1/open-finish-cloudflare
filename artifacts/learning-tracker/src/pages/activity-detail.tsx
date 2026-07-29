import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useGetActivity, useListActivityLogs, useDeleteLog, getListActivityLogsQueryKey, getGetDashboardQueryKey, getListStreaksQueryKey } from '@workspace/api-client-react';
import { LogActivityDialog } from '@/components/log-activity-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ActivityDetail() {
  const params = useParams();
  const activityId = params.id ? Number(params.id) : 0;
  const { data: activity, isLoading: activityLoading } = useGetActivity(activityId, {
    query: { enabled: !!activityId, queryKey: ['activity', activityId] as any },
  });
  const { data: logs = [], isLoading: logsLoading } = useListActivityLogs(activityId, {
    query: { queryKey: ['activity-logs', activityId] as any },
  });
  const deleteLog = useDeleteLog();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  if (activityLoading || logsLoading) {
    return (
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center mt-20">
        <p className="text-2xl text-white/50">Activity not found</p>
        <Link href="/activities" className="text-cyan-300 mt-4 inline-block underline">Back to activities</Link>
      </div>
    );
  }

  const handleDeleteLog = () => {
    if (!deletingLogId) return;

    deleteLog.mutate(
      { id: deletingLogId },
      {
        onSuccess: () => {
          toast({ title: 'Log deleted' });
          queryClient.invalidateQueries({ queryKey: getListActivityLogsQueryKey(activityId) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStreaksQueryKey() });
          setDeleteDialogOpen(false);
          setDeletingLogId(null);
        },
        onError: () => {
          toast({ title: 'Failed to delete log', variant: 'destructive' });
        },
      }
    );
  };

  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <div className="min-h-screen p-8 space-y-10 animate-slide-up max-w-5xl mx-auto">
      <div>
        <Link href="/activities">
          <Button variant="ghost" size="sm" className="gap-2 rounded-2xl uppercase tracking-wider text-xs font-semibold text-white/50 hover:text-white hover:bg-white/5" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Activity Header */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
        <div 
          className="absolute left-0 top-0 bottom-0 w-2"
          style={{ backgroundColor: activity.color || '#3b82f6' }}
        />
        <div className="flex items-start justify-between relative z-10 pl-4">
          <div className="flex items-center gap-8">
            <div
              className="w-24 h-24 flex items-center justify-center border-2 rounded-3xl backdrop-blur-md"
              style={{ 
                borderColor: activity.color || '#3b82f6',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <Clock className="w-12 h-12" style={{ color: activity.color || '#3b82f6' }} />
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2 text-white tracking-tight">{activity.name}</h1>
              <p className="text-sm uppercase tracking-widest text-white/40 mb-6">{activity.category}</p>
              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="w-4 h-4 text-cyan-300" />
                  <span className="font-bold">{activity.targetMinutesPerDay} min</span> 
                  <span className="text-white/50">daily target</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Calendar className="w-4 h-4 text-cyan-300" />
                  <span className="font-bold">{logs.length}</span>
                  <span className="text-white/50">sessions</span>
                </div>
              </div>
            </div>
          </div>
          <Button size="lg" onClick={() => setLogDialogOpen(true)} className="gap-2 rounded-2xl font-semibold uppercase tracking-wider text-xs bg-blue-500/10 border border-blue-400/30 text-blue-300 hover:bg-blue-500/20 backdrop-blur-md hover:scale-[1.03] active:scale-[0.97] transition-all" data-testid="button-log-session">
            <Plus className="w-4 h-4" />
            Log Session
          </Button>
        </div>
        
        <div 
          className="absolute right-0 top-0 bottom-0 w-64 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110 blur-3xl"
          style={{ backgroundColor: activity.color || '#3b82f6' }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl p-8 border-b-4 backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5" style={{ borderColor: activity.color || '#3b82f6' }}>
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3 font-semibold">Total Time</p>
          <p className="text-4xl font-bold text-white">
            {totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalMinutes}m`}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3 font-semibold">Total Sessions</p>
          <p className="text-4xl font-bold text-white">{logs.length}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3 font-semibold">Avg Session</p>
          <p className="text-4xl font-bold text-white">
            {logs.length > 0 ? Math.round(totalMinutes / logs.length) : 0}m
          </p>
        </div>
      </div>

      {/* Log History */}
      <div className="pt-6">
        <h2 className="text-2xl font-bold mb-8 text-white">Session History</h2>
        {logs.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 border-dashed rounded-3xl p-16 text-center">
            <Clock className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-white">No sessions yet</h3>
            <p className="text-white/50 mb-6">Log your first session to get started</p>
            <Button onClick={() => setLogDialogOpen(true)} className="rounded-2xl uppercase tracking-wider text-xs font-semibold bg-blue-500/10 border border-blue-400/30 text-blue-300 hover:bg-blue-500/20 backdrop-blur-md" data-testid="button-log-first">
              <Plus className="w-4 h-4 mr-2" />
              Log First Session
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {logs
              .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime())
              .map((log) => (
                <div
                  key={log.id}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-200 hover:border-white/20 hover:shadow-2xl flex items-start justify-between group"
                  data-testid={`log-${log.id}`}
                >
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-6 mb-3 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2 text-sm text-white font-bold uppercase tracking-wider">
                        <Calendar className="w-4 h-4 text-white/40" />
                        <span>{format(new Date(log.logDate), 'MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-lg">
                        <Clock className="w-4 h-4" style={{ color: activity.color || '#3b82f6' }} />
                        <span className="font-bold text-white">{log.durationMinutes} min</span>
                      </div>
                    </div>
                    {log.notes ? (
                      <p className="text-base text-white/70 leading-relaxed pl-2 border-l-2" style={{ borderColor: activity.color || '#3b82f6' }}>
                        "{log.notes}"
                      </p>
                    ) : (
                      <p className="text-sm text-white/30">No notes</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400 rounded-2xl"
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
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-white/10 p-8 bg-[#1a1a2e] backdrop-blur-md shadow-2xl" data-testid="dialog-delete-log">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-red-400">Delete Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50 text-base">
              This will permanently delete this session log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-2xl uppercase tracking-wider text-xs font-semibold bg-white/5 border-white/10 hover:bg-white/10 text-white" data-testid="button-cancel-delete-log">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLog}
              className="bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-2xl uppercase tracking-wider text-xs font-semibold backdrop-blur-md"
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
