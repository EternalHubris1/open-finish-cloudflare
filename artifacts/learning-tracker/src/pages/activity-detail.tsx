import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useGetActivity, useListActivityLogs, useDeleteLog, getListActivityLogsQueryKey, getGetDashboardQueryKey, getListStreaksQueryKey } from '@workspace/api-client-react';
import { LogActivityDialog } from '@/components/log-activity-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Calendar, Clock, Flame } from 'lucide-react';
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
        <Skeleton className="h-12 w-32 rounded-sm" />
        <Skeleton className="h-32 rounded-sm" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center font-serif mt-20">
        <p className="text-2xl text-muted-foreground">The path does not exist.</p>
        <Link href="/activities" className="text-primary mt-4 inline-block underline">Return to your journey</Link>
      </div>
    );
  }

  const handleDeleteLog = () => {
    if (!deletingLogId) return;

    deleteLog.mutate(
      { id: deletingLogId },
      {
        onSuccess: () => {
          toast({ title: 'Record removed' });
          queryClient.invalidateQueries({ queryKey: getListActivityLogsQueryKey(activityId) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStreaksQueryKey() });
          setDeleteDialogOpen(false);
          setDeletingLogId(null);
        },
        onError: () => {
          toast({ title: 'Failed to erase record', variant: 'destructive' });
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
          <Button variant="ghost" size="sm" className="gap-2 rounded-sm uppercase tracking-wider text-xs font-semibold text-muted-foreground hover:text-foreground" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Return
          </Button>
        </Link>
      </div>

      {/* Activity Header */}
      <div className="bg-card border border-card-border rounded-sm p-10 shadow-sm relative overflow-hidden group">
        <div 
          className="absolute left-0 top-0 bottom-0 w-2"
          style={{ backgroundColor: activity.color || 'hsl(var(--primary))' }}
        />
        <div className="flex items-start justify-between relative z-10 pl-4">
          <div className="flex items-center gap-8">
            <div
              className="w-24 h-24 flex items-center justify-center border-2"
              style={{ 
                borderColor: activity.color || 'hsl(var(--primary))',
                backgroundColor: 'transparent'
              }}
            >
              <Flame className="w-12 h-12" style={{ color: activity.color || 'hsl(var(--primary))' }} />
            </div>
            <div>
              <h1 className="text-5xl font-bold font-serif mb-2 text-foreground tracking-tight">{activity.name}</h1>
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">{activity.category}</p>
              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2 font-serif">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-bold">{activity.targetMinutesPerDay} min</span> 
                  <span className="text-muted-foreground italic">daily target</span>
                </div>
                <div className="flex items-center gap-2 font-serif">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-bold">{logs.length}</span>
                  <span className="text-muted-foreground italic">sessions</span>
                </div>
              </div>
            </div>
          </div>
          <Button size="lg" onClick={() => setLogDialogOpen(true)} className="gap-2 rounded-sm font-semibold uppercase tracking-wider text-xs" data-testid="button-log-session">
            <Plus className="w-4 h-4" />
            Record
          </Button>
        </div>
        
        {/* Subtle decorative background mark */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-64 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundColor: activity.color || 'hsl(var(--primary))', filter: 'blur(60px)' }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-foreground text-background rounded-sm p-8 border-b-4" style={{ borderColor: activity.color || 'hsl(var(--primary))' }}>
          <p className="text-xs uppercase tracking-widest opacity-70 mb-3 font-semibold">Total Time</p>
          <p className="text-4xl font-serif font-bold">
            {totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalMinutes}m`}
          </p>
        </div>
        <div className="bg-card border border-card-border rounded-sm p-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Logs</p>
          <p className="text-4xl font-serif font-bold text-foreground">{logs.length}</p>
        </div>
        <div className="bg-card border border-card-border rounded-sm p-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Avg Session</p>
          <p className="text-4xl font-serif font-bold text-foreground">
            {logs.length > 0 ? Math.round(totalMinutes / logs.length) : 0}m
          </p>
        </div>
      </div>

      {/* Log History */}
      <div className="pt-6">
        <h2 className="text-2xl font-bold mb-8 font-serif ink-divider inline-block">History</h2>
        {logs.length === 0 ? (
          <div className="bg-card border border-card-border border-dashed rounded-sm p-16 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold font-serif mb-2">No records yet</h3>
            <p className="text-muted-foreground mb-6 font-serif italic">Ink has not yet touched the paper. Record your first session.</p>
            <Button onClick={() => setLogDialogOpen(true)} className="rounded-sm uppercase tracking-wider text-xs font-semibold" data-testid="button-log-first">
              <Plus className="w-4 h-4 mr-2" />
              First Record
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {logs
              .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime())
              .map((log) => (
                <div
                  key={log.id}
                  className="bg-card border border-card-border border-l-4 rounded-sm p-6 transition-all duration-200 hover:border-foreground/30 hover:shadow-sm flex items-start justify-between group"
                  style={{ borderLeftColor: activity.color || 'hsl(var(--primary))' }}
                  data-testid={`log-${log.id}`}
                >
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-6 mb-3 border-b border-border pb-3">
                      <div className="flex items-center gap-2 text-sm text-foreground font-bold uppercase tracking-wider">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(log.logDate), 'MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-lg font-serif">
                        <Clock className="w-4 h-4" style={{ color: activity.color || 'hsl(var(--primary))' }} />
                        <span className="font-bold">{log.durationMinutes} min</span>
                      </div>
                    </div>
                    {log.notes ? (
                      <p className="text-base text-foreground font-serif italic leading-relaxed pl-2 border-l-2 border-muted">
                        "{log.notes}"
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic font-serif opacity-50">No reflections recorded.</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive rounded-sm"
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
        <AlertDialogContent className="rounded-sm border-border p-8" data-testid="dialog-delete-log">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-bold text-destructive">Erase Record?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-muted-foreground text-base">
              This will permanently remove this session from the archives. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-sm uppercase tracking-wider text-xs font-semibold" data-testid="button-cancel-delete-log">Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLog}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-sm uppercase tracking-wider text-xs font-semibold"
              data-testid="button-confirm-delete-log"
            >
              Erase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}