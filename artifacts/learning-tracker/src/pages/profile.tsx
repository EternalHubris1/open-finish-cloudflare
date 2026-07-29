import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetProfile, useUpdateProfile, useListStreaks, getGetProfileQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Calendar, Flame, Trophy, Clock } from 'lucide-react';
import { format } from 'date-fns';
import musashi from '@assets/musashi_1785336444855.jpg';

export default function Profile() {
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: streaks = [] } = useListStreaks();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  const handleEdit = () => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio || '');
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (!username.trim()) {
      toast({ title: 'Username is required', variant: 'destructive' });
      return;
    }

    updateProfile.mutate(
      { data: { username, bio: bio || undefined } },
      {
        onSuccess: () => {
          toast({ title: 'Profile updated!' });
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          setIsEditing(false);
        },
        onError: () => {
          toast({ title: 'Failed to update profile', variant: 'destructive' });
        },
      }
    );
  };

  if (profileLoading) {
    return (
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        <Skeleton className="h-32 rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 font-serif">Profile not found</div>;
  }

  const longestStreak = Math.max(...streaks.map((s) => s.longestStreak), 0);
  const currentStreak = Math.max(...streaks.map((s) => s.currentStreak), 0);

  const initials = profile.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-5xl mx-auto relative">
      {/* Decorative large background musashi */}
      <div className="fixed -right-20 -bottom-20 w-1/2 h-full pointer-events-none z-[-1] opacity-5 mix-blend-multiply dark:mix-blend-screen">
        <img 
          src={musashi} 
          alt="" 
          className="w-full h-full object-contain object-bottom"
        />
      </div>

      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-5xl font-bold mb-2 font-serif text-foreground tracking-tight">Identity</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">Who walks the path</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-card-border rounded-sm p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-foreground" />
        
        <div className="flex items-start gap-8">
          <Avatar className="w-32 h-32 rounded-none border border-border">
            <AvatarFallback className="text-4xl font-serif font-bold bg-muted text-foreground rounded-none">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pt-2">
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="username" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Name</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    className="rounded-sm font-serif text-xl border-border bg-background mt-2"
                    data-testid="input-username"
                  />
                </div>
                <div>
                  <Label htmlFor="bio" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Philosophy (Bio)</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="State your purpose..."
                    rows={4}
                    className="rounded-sm font-serif italic border-border bg-background mt-2 resize-none"
                    data-testid="input-bio"
                  />
                </div>
                <div className="flex gap-4 pt-4 border-t border-border">
                  <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-sm uppercase tracking-wider text-xs font-semibold" data-testid="button-save">
                    {updateProfile.isPending ? 'Committing...' : 'Commit Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-sm uppercase tracking-wider text-xs font-semibold hover:bg-muted" data-testid="button-cancel">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-4xl font-bold font-serif mb-4 text-foreground tracking-tight">{profile.username}</h2>
                    {profile.bio ? (
                      <p className="text-lg font-serif italic text-muted-foreground border-l-2 border-primary/50 pl-4 py-1">"{profile.bio}"</p>
                    ) : (
                      <p className="text-sm font-serif italic text-muted-foreground opacity-50 border-l-2 border-border pl-4 py-1">No philosophy declared yet.</p>
                    )}
                  </div>
                  <Button variant="outline" onClick={handleEdit} className="rounded-sm uppercase tracking-wider text-xs font-semibold hover:bg-muted border-transparent hover:border-border" data-testid="button-edit-profile">
                    Edit
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-muted-foreground mt-8">
                  <Calendar className="w-4 h-4" />
                  <span>Began journey on {format(new Date(profile.createdAt), 'MMMM d, yyyy')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary/5 border border-primary/20 rounded-sm p-8 flex items-center gap-6 group hover:bg-primary/10 transition-colors">
          <div className="p-4 rounded-none bg-primary text-background">
            <Flame className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Active Streak</p>
            <p className="text-4xl font-serif font-bold text-foreground" data-testid="stat-current-streak">{currentStreak}</p>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-sm p-8 flex items-center gap-6">
          <div className="p-4 rounded-none bg-foreground text-background">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Longest Chain</p>
            <p className="text-4xl font-serif font-bold text-foreground" data-testid="stat-longest-streak">{longestStreak}</p>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-sm p-8 flex items-center gap-6">
          <div className="p-4 rounded-none bg-muted border border-border text-foreground">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Disciplines</p>
            <p className="text-4xl font-serif font-bold text-foreground" data-testid="stat-total-activities">{streaks.length}</p>
          </div>
        </div>
      </div>

      {/* Activity Streaks */}
      {streaks.length > 0 && (
        <div className="pt-4">
          <h2 className="text-2xl font-bold mb-6 font-serif ink-divider inline-block">Chains of Practice</h2>
          <div className="space-y-4">
            {streaks
              .sort((a, b) => b.currentStreak - a.currentStreak)
              .map((streak) => (
                <div
                  key={streak.activityId}
                  className="bg-card border border-card-border rounded-sm p-6 transition-all duration-300 hover:border-foreground/30 flex items-center justify-between"
                  data-testid={`streak-${streak.activityId}`}
                >
                  <div className="flex-1">
                    <h3 className="font-bold font-serif text-xl mb-1">{streak.activityName}</h3>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Last struck: {streak.lastLoggedDate ? format(new Date(streak.lastLoggedDate), 'MMM d, yyyy') : 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center gap-12 border-l border-border pl-8 py-2">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-bold">Current</p>
                      <div className="flex items-center justify-end gap-2 text-primary">
                        <Flame className="w-4 h-4" />
                        <span className="text-3xl font-serif font-bold">{streak.currentStreak}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-bold">Best</p>
                      <div className="flex items-center justify-end gap-2 text-foreground">
                        <Trophy className="w-4 h-4 opacity-50" />
                        <span className="text-3xl font-serif font-bold">{streak.longestStreak}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}