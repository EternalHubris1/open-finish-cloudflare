import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLogActivity, getGetCalendarQueryKey, getGetDashboardQueryKey, getListActivityLogsQueryKey, getListStreaksQueryKey, getGetWeeklyProgressQueryKey } from '@workspace/api-client-react';
import { Activity } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LogActivityDialogProps {
  activity: Activity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogActivityDialog({ activity, open, onOpenChange }: LogActivityDialogProps) {
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logActivity = useLogActivity();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = Number(durationMinutes);
    if (duration < 1) {
      toast({ title: 'Invalid duration', description: 'Duration must be at least 1 minute', variant: 'destructive' });
      return;
    }

    logActivity.mutate(
      { id: activity.id, data: { durationMinutes: duration, notes: notes || undefined, logDate } },
      {
        onSuccess: () => {
          toast({ title: 'Session logged!', description: `${duration} minutes added to ${activity.name}` });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListActivityLogsQueryKey(activity.id) });
          queryClient.invalidateQueries({ queryKey: getListStreaksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetWeeklyProgressQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCalendarQueryKey() });
          setDurationMinutes('');
          setNotes('');
          setLogDate(format(new Date(), 'yyyy-MM-dd'));
          onOpenChange(false);
        },
        onError: () => {
          toast({ title: 'Failed to log session', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-white/10 p-8 bg-[#0a0a0a] backdrop-blur-2xl shadow-2xl" data-testid="dialog-log-activity">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold mb-2 text-white tracking-wide">Log Session</DialogTitle>
          <DialogDescription className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
            Record your practice for {activity.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="30"
                required
                className="rounded-2xl h-12 text-base bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-red-500 backdrop-blur-xl"
                data-testid="input-duration"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-date" className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Date</Label>
              <Input
                id="log-date"
                type="date"
                max={format(new Date(), 'yyyy-MM-dd')}
                value={logDate}
                onChange={(event) => setLogDate(event.target.value)}
                required
                className="rounded-2xl h-12 bg-white/5 border-white/10 text-white focus-visible:ring-red-500 [color-scheme:dark]"
                data-testid="input-log-date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you focus on?"
              rows={3}
              className="rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-red-500 backdrop-blur-xl resize-none"
              data-testid="input-notes"
            />
          </div>

          <div className="flex gap-4 pt-6 mt-8 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-xl"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={logActivity.isPending}
              className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
              data-testid="button-submit-log"
            >
              {logActivity.isPending ? 'Logging...' : 'Log Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
