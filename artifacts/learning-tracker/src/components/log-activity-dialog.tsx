import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLogActivity, getGetDashboardQueryKey, getListActivityLogsQueryKey, getListStreaksQueryKey, getGetWeeklyProgressQueryKey } from '@workspace/api-client-react';
import { Activity } from '@workspace/api-client-react/src/generated/api.schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface LogActivityDialogProps {
  activity: Activity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogActivityDialog({ activity, open, onOpenChange }: LogActivityDialogProps) {
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notes, setNotes] = useState('');
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
      { id: activity.id, data: { durationMinutes: duration, notes: notes || undefined } },
      {
        onSuccess: () => {
          toast({ title: 'Session logged!', description: `${duration} minutes added to ${activity.name}` });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListActivityLogsQueryKey(activity.id) });
          queryClient.invalidateQueries({ queryKey: getListStreaksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetWeeklyProgressQueryKey() });
          setDurationMinutes('');
          setNotes('');
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
      <DialogContent data-testid="dialog-log-activity">
        <DialogHeader>
          <DialogTitle>Log Session: {activity.name}</DialogTitle>
          <DialogDescription>Record your practice time</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="30"
              required
              data-testid="input-duration"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              rows={3}
              data-testid="input-notes"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={logActivity.isPending}
              className="flex-1"
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
