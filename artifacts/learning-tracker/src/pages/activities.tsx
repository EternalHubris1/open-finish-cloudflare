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
  '#C0392B', // Vermilion Red
  '#2C3E50', // Ink Charcoal
  '#E67E22', // Persimmon
  '#27AE60', // Bamboo Green
  '#2980B9', // Indigo Blue
  '#8E44AD', // Deep Purple
  '#16A085', // Teal
  '#7F8C8D', // Stone Gray
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
    <div className="min-h-screen p-8 space-y-10 animate-slide-up max-w-5xl mx-auto">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-5xl font-bold mb-2 font-serif text-foreground">Activities</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">Define your disciplines</p>
        </div>
        <Button size="lg" onClick={openCreateDialog} className="gap-2 rounded-sm font-semibold uppercase tracking-wider text-xs" data-testid="button-create-activity">
          <Plus className="w-5 h-5" />
          New Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="bg-card border border-card-border border-dashed rounded-sm p-16 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold font-serif mb-2">No activities yet</h3>
          <p className="text-muted-foreground mb-6 font-serif italic">Choose your path and start tracking</p>
          <Button onClick={openCreateDialog} className="rounded-sm uppercase tracking-wider text-xs" data-testid="button-create-first">
            <Plus className="w-4 h-4 mr-2" />
            Create Activity
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-card border border-card-border rounded-sm p-6 transition-all duration-200 hover:border-foreground/30 flex items-center group relative overflow-hidden"
              data-testid={`activity-item-${activity.id}`}
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2"
                style={{ backgroundColor: activity.color || 'hsl(var(--primary))' }}
              />
              
              <div className="flex items-center justify-between w-full pl-4">
                <div className="flex flex-col gap-1 flex-1">
                  <h3 className="text-2xl font-bold font-serif">{activity.name}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">{activity.category}</p>
                </div>
                <div className="text-right mr-8">
                  <p className="text-3xl font-bold font-serif">{activity.targetMinutesPerDay}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">min/day</p>
                </div>
                <div className="flex items-center gap-2 border-l border-border pl-6 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm border-transparent hover:border-border hover:bg-muted"
                    onClick={() => openEditDialog(activity)}
                    data-testid={`button-edit-${activity.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm border-transparent hover:border-destructive hover:text-destructive hover:bg-destructive/10"
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
        <DialogContent className="rounded-sm border-border p-8" data-testid="dialog-activity-form">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-bold mb-2">
              {editingActivity ? 'Edit Discipline' : 'New Discipline'}
            </DialogTitle>
            <DialogDescription className="font-serif italic text-muted-foreground">
              {editingActivity ? 'Adjust your path' : 'Declare a new endeavor'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Kendo Practice"
                required
                className="rounded-sm font-serif text-lg bg-background border-border focus-visible:ring-primary"
                data-testid="input-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-sm bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                <Label htmlFor="target" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Daily Target (min)</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={formData.targetMinutesPerDay}
                  onChange={(e) => setFormData({ ...formData, targetMinutesPerDay: Number(e.target.value) })}
                  className="rounded-sm bg-background border-border text-center font-bold"
                  data-testid="input-target"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Mark (Color)</Label>
              <div className="grid grid-cols-8 gap-2 pt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded-none border-2 transition-all duration-200"
                    style={{
                      backgroundColor: color,
                      borderColor: formData.color === color ? 'hsl(var(--foreground))' : 'transparent',
                      transform: formData.color === color ? 'scale(1.15)' : 'scale(1)'
                    }}
                    onClick={() => setFormData({ ...formData, color })}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
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
                disabled={createActivity.isPending || updateActivity.isPending}
                className="flex-1 rounded-sm uppercase tracking-wider text-xs font-semibold"
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
        <AlertDialogContent className="rounded-sm border-border p-8" data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-bold text-destructive">Abandon Discipline?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-muted-foreground text-base">
              This will permanently wipe "{deletingActivity?.name}" and all records of your practice from history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-sm uppercase tracking-wider text-xs font-semibold" data-testid="button-cancel-delete">Retain</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-sm uppercase tracking-wider text-xs font-semibold"
              data-testid="button-confirm-delete"
            >
              Destroy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}