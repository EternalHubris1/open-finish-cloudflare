import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useListActivities, useCreateActivity, useUpdateActivity, useDeleteActivity, getListActivitiesQueryKey, getListStreaksQueryKey } from '@workspace/api-client-react';
import { Activity, ActivityInput } from '@workspace/api-client-react/src/generated/api.schemas';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const PRESET_COLORS = [
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Green
  '#f59e0b', // Amber
  '#6366f1', // Indigo
];

const CATEGORIES = ['Learning', 'Fitness', 'Creative', 'Practice', 'Reading', 'Meditation', 'Work', 'Other'];

export default function Activities() {
  const { data: activities = [], isLoading } = useListActivities();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);

  const [formData, setFormData] = useState<ActivityInput>({
    name: '',
    category: 'Learning',
    color: PRESET_COLORS[0],
    targetMinutesPerDay: 30,
  });

  const openCreateDialog = () => {
    setEditingActivity(null);
    setFormData({
      name: '',
      category: 'Learning',
      color: PRESET_COLORS[0],
      targetMinutesPerDay: 30,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      category: activity.category,
      color: activity.color,
      targetMinutesPerDay: activity.targetMinutesPerDay,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingActivity) {
      updateActivity.mutate(
        { id: editingActivity.id, data: formData },
        {
          onSuccess: () => {
            toast({ title: 'Activity updated!' });
            queryClient.invalidateQueries({ queryKey: getListActivitiesQueryKey() });
            setDialogOpen(false);
          },
          onError: () => {
            toast({ title: 'Failed to update activity', variant: 'destructive' });
          },
        }
      );
    } else {
      createActivity.mutate(
        { data: formData },
        {
          onSuccess: () => {
            toast({ title: 'Activity created!' });
            queryClient.invalidateQueries({ queryKey: getListActivitiesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListStreaksQueryKey() });
            setDialogOpen(false);
          },
          onError: () => {
            toast({ title: 'Failed to create activity', variant: 'destructive' });
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deletingActivity) return;

    deleteActivity.mutate(
      { id: deletingActivity.id },
      {
        onSuccess: () => {
          toast({ title: 'Activity deleted' });
          queryClient.invalidateQueries({ queryKey: getListActivitiesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStreaksQueryKey() });
          setDeleteDialogOpen(false);
          setDeletingActivity(null);
        },
        onError: () => {
          toast({ title: 'Failed to delete activity', variant: 'destructive' });
        },
      }
    );
  };

  if (isLoading) {
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
    <div className="min-h-screen p-8 space-y-10 animate-slide-up max-w-5xl mx-auto">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-5xl font-bold mb-2 text-white">Activities</h1>
          <p className="text-white/40 uppercase tracking-widest text-sm">Manage your tracked activities</p>
        </div>
        <Button size="lg" onClick={openCreateDialog} className="gap-2 rounded-2xl font-semibold uppercase tracking-wider text-xs bg-blue-500/10 border border-blue-400/30 text-blue-300 hover:bg-blue-500/20 backdrop-blur-md hover:scale-[1.03] active:scale-[0.97] transition-all" data-testid="button-create-activity">
          <Plus className="w-5 h-5" />
          New Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 border-dashed rounded-3xl p-16 text-center">
          <Target className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2 text-white">No activities yet</h3>
          <p className="text-white/50 mb-6">Create your first activity to start tracking</p>
          <Button onClick={openCreateDialog} className="rounded-2xl uppercase tracking-wider text-xs bg-blue-500/10 border border-blue-400/30 text-blue-300 hover:bg-blue-500/20 backdrop-blur-md" data-testid="button-create-first">
            <Plus className="w-4 h-4 mr-2" />
            Create Activity
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-200 hover:border-white/20 hover:shadow-2xl flex items-center group relative overflow-hidden"
              data-testid={`activity-item-${activity.id}`}
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300"
                style={{ backgroundColor: activity.color || '#3b82f6' }}
              />
              
              <div className="flex items-center justify-between w-full pl-4">
                <div className="flex flex-col gap-1 flex-1">
                  <h3 className="text-2xl font-bold text-white">{activity.name}</h3>
                  <p className="text-xs text-white/40 uppercase tracking-widest">{activity.category}</p>
                </div>
                <div className="text-right mr-8">
                  <p className="text-3xl font-bold text-white">{activity.targetMinutesPerDay}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider">min/day</p>
                </div>
                <div className="flex items-center gap-2 border-l border-white/10 pl-6 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl bg-white/5 border-white/10 hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-300 backdrop-blur-md text-white/70"
                    onClick={() => openEditDialog(activity)}
                    data-testid={`button-edit-${activity.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl bg-white/5 border-white/10 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 backdrop-blur-md text-white/70"
                    onClick={() => {
                      setDeletingActivity(activity);
                      setDeleteDialogOpen(true);
                    }}
                    data-testid={`button-delete-${activity.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl border-white/10 p-8 bg-[#1a1a2e] backdrop-blur-md shadow-2xl" data-testid="dialog-activity-form">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold mb-2 text-white">
              {editingActivity ? 'Edit Activity' : 'New Activity'}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {editingActivity ? 'Update your activity details' : 'Create a new activity to track'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-wider text-white/40 font-semibold">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Running, Reading, Coding"
                required
                className="rounded-2xl text-lg bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500 backdrop-blur-md"
                data-testid="input-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs uppercase tracking-wider text-white/40 font-semibold">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-white/10 rounded-2xl bg-white/5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-white backdrop-blur-md"
                  data-testid="select-category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target" className="text-xs uppercase tracking-wider text-white/40 font-semibold">Daily Target (min)</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={formData.targetMinutesPerDay}
                  onChange={(e) => setFormData({ ...formData, targetMinutesPerDay: Number(e.target.value) })}
                  className="rounded-2xl bg-white/5 border-white/10 text-center font-bold text-white backdrop-blur-md"
                  data-testid="input-target"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Color</Label>
              <div className="grid grid-cols-8 gap-2 pt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: formData.color === color ? '#ffffff' : 'transparent',
                      transform: formData.color === color ? 'scale(1.15)' : 'scale(1)'
                    }}
                    onClick={() => setFormData({ ...formData, color })}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
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
                disabled={createActivity.isPending || updateActivity.isPending}
                className="flex-1 rounded-2xl uppercase tracking-wider text-xs font-semibold bg-blue-500/10 border border-blue-400/30 text-blue-300 hover:bg-blue-500/20 backdrop-blur-md"
                data-testid="button-submit"
              >
                {editingActivity ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-white/10 p-8 bg-[#1a1a2e] backdrop-blur-md shadow-2xl" data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-red-400">Delete Activity?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50 text-base">
              This will permanently delete "{deletingActivity?.name}" and all associated logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-2xl uppercase tracking-wider text-xs font-semibold bg-white/5 border-white/10 hover:bg-white/10 text-white" data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-2xl uppercase tracking-wider text-xs font-semibold backdrop-blur-md"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
