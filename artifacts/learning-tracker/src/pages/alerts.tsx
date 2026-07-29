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
    daysOfWeek: [1, 2, 3, 4, 5],
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
          toast({ title: 'Alert deleted' });
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
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-5xl mx-auto">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-5xl font-bold mb-2 text-white tracking-tight">Alerts</h1>
          <p className="text-white/40 uppercase tracking-widest text-sm">Set reminders for your activities</p>
        </div>
        <Button
          size="lg"
          onClick={openCreateDialog}
          className="gap-2 rounded-2xl font-semibold uppercase tracking-wider text-xs bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20 backdrop-blur-md hover:scale-[1.03] active:scale-[0.97] transition-all"
          disabled={activities.length === 0}
          data-testid="button-create-alert"
        >
          <Plus className="w-4 h-4" />
          New Alert
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 border-dashed rounded-3xl p-16 text-center">
          <Bell className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white">No activities yet</h3>
          <p className="text-white/50">Create an activity first to set up alerts</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 border-dashed rounded-3xl p-16 text-center">
          <Bell className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white">No alerts set</h3>
          <p className="text-white/50 mb-6">Create your first reminder to stay on track</p>
          <Button onClick={openCreateDialog} className="rounded-2xl uppercase tracking-wider text-xs font-semibold bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20 backdrop-blur-md" data-testid="button-create-first-alert">
            <Plus className="w-4 h-4 mr-2" />
            Create Alert
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white/5 backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl ${alert.enabled ? 'border-cyan-400/30' : 'border-white/10 opacity-70'}`}
              data-testid={`alert-${alert.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-6 flex-1">
                  <div className={`p-4 rounded-2xl ${alert.enabled ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-400/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                    {alert.enabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1 text-white">{alert.activityName || 'Activity'}</h3>
                    <p className="text-sm text-white/70 mb-4">"{alert.message}"</p>
                    <div className="flex items-center gap-6">
                      <div className="font-bold text-xl tracking-wider text-cyan-300">{alert.timeOfDay}</div>
                      <div className="flex items-center gap-1">
                        {DAYS.map((day, i) => {
                          const isActive = alert.daysOfWeek.includes(i);
                          return (
                            <span
                              key={day}
                              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
                                isActive 
                                  ? 'bg-white text-[#1a1a2e]' 
                                  : 'bg-white/5 text-white/30'
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
                      className="rounded-2xl bg-white/5 border-white/10 hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-300 backdrop-blur-md text-white/70"
                      onClick={() => openEditDialog(alert)}
                      data-testid={`button-edit-alert-${alert.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-2xl bg-white/5 border-white/10 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 backdrop-blur-md text-white/70"
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
        <DialogContent className="rounded-3xl border-white/10 p-8 bg-[#1a1a2e] backdrop-blur-md shadow-2xl" data-testid="dialog-alert-form">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold mb-2 text-white">
              {editingAlert ? 'Edit Alert' : 'New Alert'}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Set up a reminder for your activity
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="activity" className="text-xs uppercase tracking-wider text-white/40 font-semibold">Activity</Label>
              <select
                id="activity"
                value={formData.activityId}
                onChange={(e) => setFormData({ ...formData, activityId: Number(e.target.value) })}
                className="w-full px-3 py-3 border border-white/10 rounded-2xl bg-white/5 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 text-white backdrop-blur-md"
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
              <Label htmlFor="time" className="text-xs uppercase tracking-wider text-white/40 font-semibold">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.timeOfDay}
                onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                className="rounded-2xl text-xl border-white/10 h-12 bg-white/5 text-white backdrop-blur-md"
                data-testid="input-time"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Days</Label>
              <div className="grid grid-cols-7 gap-2 pt-2">
                {DAYS.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`py-3 px-1 rounded-2xl border-2 transition-all duration-200 text-sm font-bold uppercase tracking-wider ${
                      formData.daysOfWeek.includes(idx)
                        ? 'bg-white text-[#1a1a2e] border-white shadow-md'
                        : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
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
              <Label htmlFor="message" className="text-xs uppercase tracking-wider text-white/40 font-semibold">Message</Label>
              <Input
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Time to practice!"
                className="rounded-2xl border-white/10 bg-white/5 text-white backdrop-blur-md"
                data-testid="input-message"
              />
            </div>

            <div className="flex gap-4 pt-6 mt-8 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 rounded-2xl uppercase tracking-wider text-xs font-semibold bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-md"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAlert.isPending || updateAlert.isPending}
                className="flex-1 rounded-2xl uppercase tracking-wider text-xs font-semibold bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20 backdrop-blur-md"
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
        <AlertDialogContent className="rounded-3xl border-white/10 p-8 bg-[#1a1a2e] backdrop-blur-md shadow-2xl" data-testid="dialog-delete-alert">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-red-400">Delete Alert?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50 text-base">
              This will permanently remove this alert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-2xl uppercase tracking-wider text-xs font-semibold bg-white/5 border-white/10 hover:bg-white/10 text-white" data-testid="button-cancel-delete-alert">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-2xl uppercase tracking-wider text-xs font-semibold backdrop-blur-md"
              data-testid="button-confirm-delete-alert"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
