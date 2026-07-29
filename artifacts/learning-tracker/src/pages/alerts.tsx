import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useListAlerts, useListActivities, useCreateAlert, useUpdateAlert, useDeleteAlert, getListAlertsQueryKey } from '@workspace/api-client-react';
import { Alert, AlertInput } from '@workspace/api-client-react/src/generated/api.schemas';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Bell, BellOff } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Alerts() {
  const { data: alerts = [], isLoading: alertsLoading } = useListAlerts();
  const { data: activities = [], isLoading: activitiesLoading } = useListActivities();
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null);

  const [formData, setFormData] = useState<AlertInput>({
    activityId: 0,
    timeOfDay: '09:00',
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    enabled: true,
    message: 'Time to practice!',
  });

  const openCreateDialog = () => {
    setEditingAlert(null);
    setFormData({
      activityId: activities[0]?.id || 0,
      timeOfDay: '09:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      enabled: true,
      message: 'Time to practice!',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (alert: Alert) => {
    setEditingAlert(alert);
    setFormData({
      activityId: alert.activityId,
      timeOfDay: alert.timeOfDay,
      daysOfWeek: alert.daysOfWeek,
      enabled: alert.enabled,
      message: alert.message,
    });
    setDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    const days = formData.daysOfWeek.includes(day)
      ? formData.daysOfWeek.filter((d) => d !== day)
      : [...formData.daysOfWeek, day].sort();
    setFormData({ ...formData, daysOfWeek: days });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.daysOfWeek.length === 0) {
      toast({ title: 'Select at least one day', variant: 'destructive' });
      return;
    }

    if (editingAlert) {
      updateAlert.mutate(
        { id: editingAlert.id, data: formData },
        {
          onSuccess: () => {
            toast({ title: 'Alert updated!' });
            queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
            setDialogOpen(false);
          },
          onError: () => {
            toast({ title: 'Failed to update alert', variant: 'destructive' });
          },
        }
      );
    } else {
      createAlert.mutate(
        { data: formData },
        {
          onSuccess: () => {
            toast({ title: 'Alert created!' });
            queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
            setDialogOpen(false);
          },
          onError: () => {
            toast({ title: 'Failed to create alert', variant: 'destructive' });
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deletingAlert) return;

    deleteAlert.mutate(
      { id: deletingAlert.id },
      {
        onSuccess: () => {
          toast({ title: 'Alert silenced' });
          queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
          setDeleteDialogOpen(false);
          setDeletingAlert(null);
        },
        onError: () => {
          toast({ title: 'Failed to delete alert', variant: 'destructive' });
        },
      }
    );
  };

  const toggleAlertEnabled = (alert: Alert) => {
    updateAlert.mutate(
      { id: alert.id, data: { enabled: !alert.enabled } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        },
      }
    );
  };

  if (alertsLoading || activitiesLoading) {
    return (
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-sm" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-5xl mx-auto">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-5xl font-bold mb-2 font-serif text-foreground tracking-tight">Alerts</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">Calls to discipline</p>
        </div>
        <Button
          size="lg"
          onClick={openCreateDialog}
          className="gap-2 rounded-sm font-semibold uppercase tracking-wider text-xs"
          disabled={activities.length === 0}
          data-testid="button-create-alert"
        >
          <Plus className="w-4 h-4" />
          Set Bell
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="bg-card border border-card-border border-dashed rounded-sm p-16 text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold font-serif mb-2">No path defined</h3>
          <p className="text-muted-foreground font-serif italic">Choose an activity first before setting the bell.</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-card border border-card-border border-dashed rounded-sm p-16 text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold font-serif mb-2">The bell is silent</h3>
          <p className="text-muted-foreground mb-6 font-serif italic">Set a reminder to keep your practice steady.</p>
          <Button onClick={openCreateDialog} className="rounded-sm uppercase tracking-wider text-xs font-semibold" data-testid="button-create-first-alert">
            <Plus className="w-4 h-4 mr-2" />
            Set First Bell
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-card border rounded-sm p-6 transition-all duration-300 hover:shadow-md ${alert.enabled ? 'border-primary/50' : 'border-card-border opacity-70'}`}
              data-testid={`alert-${alert.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-6 flex-1">
                  <div className={`p-4 rounded-sm border ${alert.enabled ? 'bg-primary/5 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                    {alert.enabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold font-serif mb-1">{alert.activityName || 'Activity'}</h3>
                    <p className="text-sm text-foreground font-serif italic mb-4">"{alert.message}"</p>
                    <div className="flex items-center gap-6">
                      <div className="font-serif font-bold text-xl tracking-wider border-b-2 border-primary/30 pb-1">{alert.timeOfDay}</div>
                      <div className="flex items-center gap-1">
                        {DAYS.map((day, i) => {
                          const isActive = alert.daysOfWeek.includes(i);
                          return (
                            <span
                              key={day}
                              className={`w-8 h-8 flex items-center justify-center rounded-sm text-xs font-bold border ${
                                isActive 
                                  ? 'bg-foreground text-background border-foreground' 
                                  : 'bg-transparent text-muted-foreground border-border'
                              }`}
                            >
                              {day[0]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between h-full gap-6">
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={() => toggleAlertEnabled(alert)}
                    data-testid={`switch-alert-${alert.id}`}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-sm border-transparent hover:border-border hover:bg-muted"
                      onClick={() => openEditDialog(alert)}
                      data-testid={`button-edit-alert-${alert.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-sm border-transparent hover:border-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setDeletingAlert(alert);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`button-delete-alert-${alert.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-sm border-border p-8" data-testid="dialog-alert-form">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-bold mb-2">
              {editingAlert ? 'Adjust Bell' : 'Set New Bell'}
            </DialogTitle>
            <DialogDescription className="font-serif italic text-muted-foreground">
              Define the time of your practice.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="activity" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Discipline</Label>
              <select
                id="activity"
                value={formData.activityId}
                onChange={(e) => setFormData({ ...formData, activityId: Number(e.target.value) })}
                className="w-full px-3 py-3 border border-input rounded-sm bg-background font-serif text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-testid="select-activity"
              >
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.timeOfDay}
                onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                className="rounded-sm font-serif text-xl border-border h-12"
                data-testid="input-time"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Days of Practice</Label>
              <div className="grid grid-cols-7 gap-2 pt-2">
                {DAYS.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`py-3 px-1 rounded-sm border-2 transition-all duration-200 text-sm font-bold uppercase tracking-wider ${
                      formData.daysOfWeek.includes(idx)
                        ? 'bg-foreground text-background border-foreground shadow-sm'
                        : 'bg-background text-muted-foreground border-border hover:border-foreground/50'
                    }`}
                    onClick={() => toggleDay(idx)}
                    data-testid={`day-${idx}`}
                  >
                    {day.substring(0,2)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Message</Label>
              <Input
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Time to practice!"
                className="rounded-sm font-serif italic border-border"
                data-testid="input-message"
              />
            </div>

            <div className="flex gap-4 pt-6 mt-8 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 rounded-sm uppercase tracking-wider text-xs font-semibold border-border hover:bg-muted"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAlert.isPending || updateAlert.isPending}
                className="flex-1 rounded-sm uppercase tracking-wider text-xs font-semibold"
                data-testid="button-submit-alert"
              >
                {editingAlert ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-sm border-border p-8" data-testid="dialog-delete-alert">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-bold text-destructive">Silence Bell?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-muted-foreground text-base">
              This will permanently remove this reminder from your path.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-sm uppercase tracking-wider text-xs font-semibold" data-testid="button-cancel-delete-alert">Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-sm uppercase tracking-wider text-xs font-semibold"
              data-testid="button-confirm-delete-alert"
            >
              Silence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}