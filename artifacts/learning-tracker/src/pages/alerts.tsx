import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useListAlerts, useListActivities, useCreateAlert, useUpdateAlert, useDeleteAlert, getListAlertsQueryKey } from '@workspace/api-client-react';
import { Alert, AlertInput } from '@workspace/api-client-react';
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
        <Skeleton className="h-12 w-64 rounded-3xl bg-white/5" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-5xl mx-auto relative z-10 pb-20">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">Alerts</h1>
          <p className="text-red-400/80 font-bold uppercase tracking-widest text-[10px]">Set reminders for your activities</p>
        </div>
        <Button
          size="lg"
          onClick={openCreateDialog}
          className="gap-2 rounded-2xl font-bold uppercase tracking-wider text-[11px] bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 hover:scale-[1.03] active:scale-[0.97] transition-all border-0"
          disabled={activities.length === 0}
          data-testid="button-create-alert"
        >
          <Plus className="w-4 h-4" />
          New Alert
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/5 border-dashed rounded-3xl p-16 text-center shadow-2xl">
          <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white">No activities yet</h3>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-8">Create an activity first to set up alerts</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/5 border-dashed rounded-3xl p-16 text-center shadow-2xl">
          <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white">No alerts set</h3>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-8">Create your first reminder to stay on track</p>
          <Button onClick={openCreateDialog} className="rounded-2xl uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 px-8 py-6 h-auto" data-testid="button-create-first-alert">
            <Plus className="w-4 h-4 mr-2" />
            Create Alert
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl ${alert.enabled ? 'border-red-500/30' : 'border-white/5 opacity-60'}`}
              data-testid={`alert-${alert.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-6 flex-1">
                  <div className={`p-4 rounded-3xl ${alert.enabled ? 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.15)]' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                    {alert.enabled ? <Bell className="w-7 h-7" /> : <BellOff className="w-7 h-7" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 text-white tracking-wide">{alert.activityName || 'Activity'}</h3>
                    <p className="text-sm text-white/50 mb-6 font-medium">"{alert.message}"</p>
                    <div className="flex items-center gap-8">
                      <div className={`font-bold text-2xl tracking-wider ${alert.enabled ? 'text-red-400' : 'text-white/30'}`}>{alert.timeOfDay}</div>
                      <div className="flex items-center gap-1.5">
                        {DAYS.map((day, i) => {
                          const isActive = alert.daysOfWeek.includes(i);
                          return (
                            <span
                              key={day}
                              className={`w-9 h-9 flex items-center justify-center rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                isActive 
                                  ? (alert.enabled ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'bg-white/20 text-white')
                                  : 'bg-white/5 text-white/20'
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
                <div className="flex flex-col items-end justify-between h-full gap-8">
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={() => toggleAlertEnabled(alert)}
                    data-testid={`switch-alert-${alert.id}`}
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-xl text-white/70 hover:text-white"
                      onClick={() => openEditDialog(alert)}
                      data-testid={`button-edit-alert-${alert.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-2xl bg-white/5 border-white/10 hover:border-red-500/50 hover:text-red-400 hover:bg-red-900/30 backdrop-blur-xl text-white/70"
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
        <DialogContent className="rounded-3xl border-white/10 p-8 bg-[#0a0a0a] backdrop-blur-2xl shadow-2xl" data-testid="dialog-alert-form">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold mb-2 text-white tracking-wide">
              {editingAlert ? 'Edit Alert' : 'New Alert'}
            </DialogTitle>
            <DialogDescription className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
              Set up a reminder for your activity
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label htmlFor="activity" className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Activity</Label>
              <select
                id="activity"
                value={formData.activityId}
                onChange={(e) => setFormData({ ...formData, activityId: Number(e.target.value) })}
                className="w-full h-12 px-4 border border-white/10 rounded-2xl bg-[#0a0a0a] text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 text-white"
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
              <Label htmlFor="time" className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.timeOfDay}
                onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                className="rounded-2xl text-xl font-bold border-white/10 h-12 bg-white/5 text-white backdrop-blur-xl focus-visible:ring-red-500"
                data-testid="input-time"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Days</Label>
              <div className="grid grid-cols-7 gap-2 pt-2">
                {DAYS.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`py-3 px-1 rounded-2xl border-2 transition-all duration-200 text-[10px] font-bold uppercase tracking-wider ${
                      formData.daysOfWeek.includes(idx)
                        ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                        : 'bg-white/5 text-white/30 border-white/5 hover:border-white/20 hover:text-white'
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
              <Label htmlFor="message" className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Message</Label>
              <Input
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Time to practice!"
                className="rounded-2xl h-12 border-white/10 bg-white/5 text-white backdrop-blur-xl focus-visible:ring-red-500"
                data-testid="input-message"
              />
            </div>

            <div className="flex gap-4 pt-8 mt-8 border-t border-white/5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-xl"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAlert.isPending || updateAlert.isPending}
                className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
        <AlertDialogContent className="rounded-3xl border-white/10 p-8 bg-[#0a0a0a] backdrop-blur-2xl shadow-2xl" data-testid="dialog-delete-alert">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-red-500">Delete Alert?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-sm mt-2">
              This will permanently remove this alert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white" data-testid="button-cancel-delete-alert">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-red-900/50 border border-red-500/50 text-red-400 hover:bg-red-900/80 backdrop-blur-xl"
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
