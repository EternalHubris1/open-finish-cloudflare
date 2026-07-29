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
  '#dc2626', // Red
  '#ea580c', // Orange
  '#d97706', // Amber
  '#65a30d', // Green
  '#0284c7', // Blue
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#57534e', // Stone
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
      color: activity.color || PRESET_COLORS[0],
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
    <div className="min-h-screen p-8 space-y-10 animate-slide-up max-w-5xl mx-auto relative z-10 pb-20">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">Activities</h1>
          <p className="text-red-400/80 font-bold uppercase tracking-widest text-[10px]">Manage your tracked activities</p>
        </div>
        <Button size="lg" onClick={openCreateDialog} className="gap-2 rounded-2xl font-bold uppercase tracking-wider text-[11px] bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 hover:scale-[1.03] active:scale-[0.97] transition-all border-0" data-testid="button-create-activity">
          <Plus className="w-5 h-5" />
          New Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/5 border-dashed rounded-3xl p-16 text-center shadow-2xl">
          <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2 text-white">No activities yet</h3>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-8">Create your first activity to start tracking</p>
          <Button onClick={openCreateDialog} className="rounded-2xl uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 px-8 py-6 h-auto" data-testid="button-create-first">
            <Plus className="w-4 h-4 mr-2" />
            Create Activity
          </Button>
        </div>
      ) : (
        <div className="grid gap-5">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:border-white/20 hover:shadow-2xl flex items-center group relative overflow-hidden"
              data-testid={`activity-item-${activity.id}`}
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                style={{ backgroundColor: activity.color || '#dc2626' }}
              />
              
              <div className="flex items-center justify-between w-full pl-5">
                <div className="flex flex-col gap-1 flex-1">
                  <h3 className="text-2xl font-bold text-white tracking-wide">{activity.name}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">{activity.category}</p>
                </div>
                <div className="text-right mr-8">
                  <p className="text-3xl font-bold text-white tracking-tight">{activity.targetMinutesPerDay}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">min/day</p>
                </div>
                <div className="flex items-center gap-3 border-l border-white/10 pl-8 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-xl text-white/70 hover:text-white"
                    onClick={() => openEditDialog(activity)}
                    data-testid={`button-edit-${activity.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl bg-white/5 border-white/10 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 backdrop-blur-xl text-white/70"
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
        <DialogContent className="rounded-3xl border-white/10 p-8 bg-[#0a0a0a] backdrop-blur-2xl shadow-2xl" data-testid="dialog-activity-form">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold mb-2 text-white tracking-wide">
              {editingActivity ? 'Edit Activity' : 'New Activity'}
            </DialogTitle>
            <DialogDescription className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
              {editingActivity ? 'Update your activity details' : 'Create a new activity to track'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Katana Practice"
                required
                className="rounded-2xl h-12 text-base bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-red-500 backdrop-blur-xl"
                data-testid="input-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-12 px-4 border border-white/10 rounded-2xl bg-[#0a0a0a] text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 text-white"
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
                <Label htmlFor="target" className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Daily Target (min)</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={formData.targetMinutesPerDay}
                  onChange={(e) => setFormData({ ...formData, targetMinutesPerDay: Number(e.target.value) })}
                  className="rounded-2xl h-12 bg-white/5 border-white/10 text-center font-bold text-white backdrop-blur-xl focus-visible:ring-red-500"
                  data-testid="input-target"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Color</Label>
              <div className="grid grid-cols-8 gap-3 pt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-10 h-10 rounded-full border-2 transition-all duration-300 hover:scale-110 shadow-lg"
                    style={{
                      backgroundColor: color,
                      borderColor: formData.color === color ? '#ffffff' : 'transparent',
                      transform: formData.color === color ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: formData.color === color ? `0 0 20px ${color}80` : 'none'
                    }}
                    onClick={() => setFormData({ ...formData, color })}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
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
                disabled={createActivity.isPending || updateActivity.isPending}
                className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
        <AlertDialogContent className="rounded-3xl border-white/10 p-8 bg-[#0a0a0a] backdrop-blur-2xl shadow-2xl" data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-red-500">Delete Activity?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-sm mt-2">
              This will permanently delete "{deletingActivity?.name}" and all associated logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white" data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-red-900/50 border border-red-500/50 text-red-400 hover:bg-red-900/80 backdrop-blur-xl"
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