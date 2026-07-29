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
import { Calendar, Flame, Trophy, Clock } from 'lucide-react';
import { format } from 'date-fns';

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
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-white">Profile not found</div>;
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
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-5xl font-bold mb-2 text-white tracking-tight">Profile</h1>
          <p className="text-white/40 uppercase tracking-widest text-sm">Your journey dashboard</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
        
        <div className="flex items-start gap-8">
          <Avatar className="w-32 h-32 rounded-3xl border-2 border-white/20">
            <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pt-2">
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="username" className="text-xs uppercase tracking-wider font-semibold text-white/40">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    className="rounded-2xl text-xl border-white/10 bg-white/5 mt-2 text-white backdrop-blur-md"
                    data-testid="input-username"
                  />
                </div>
                <div>
                  <Label htmlFor="bio" className="text-xs uppercase tracking-wider font-semibold text-white/40">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="rounded-2xl border-white/10 bg-white/5 mt-2 resize-none text-white backdrop-blur-md"
                    data-testid="input-bio"
                  />
                </div>
                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-2xl uppercase tracking-wider text-xs font-semibold bg-blue-500/10 border border-blue-400/30 text-blue-300 hover:bg-blue-500/20 backdrop-blur-md" data-testid="button-save">
                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-2xl uppercase tracking-wider text-xs font-semibold bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-md" data-testid="button-cancel">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-4xl font-bold mb-4 text-white tracking-tight">{profile.username}</h2>
                    {profile.bio ? (
                      <p className="text-lg text-white/70 border-l-2 border-cyan-400/50 pl-4 py-1">"{profile.bio}"</p>
                    ) : (
                      <p className="text-sm text-white/30 border-l-2 border-white/10 pl-4 py-1">No bio yet</p>
                    )}
                  </div>
                  <Button variant="outline" onClick={handleEdit} className="rounded-2xl uppercase tracking-wider text-xs font-semibold bg-white/5 border-white/10 hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-300 backdrop-blur-md text-white/70" data-testid="button-edit-profile">
                    Edit
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-white/40 mt-8">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {format(new Date(profile.createdAt), 'MMMM d, yyyy')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-400/30 rounded-3xl p-8 flex items-center gap-6 group hover:shadow-2xl transition-all backdrop-blur-md">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <Flame className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-300 mb-1">Current Streak</p>
            <p className="text-4xl font-bold text-white" data-testid="stat-current-streak">{currentStreak}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex items-center gap-6 hover:shadow-2xl transition-all">
          <div className="p-4 rounded-2xl bg-white/10 text-white">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">Longest Streak</p>
            <p className="text-4xl font-bold text-white" data-testid="stat-longest-streak">{longestStreak}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex items-center gap-6 hover:shadow-2xl transition-all">
          <div className="p-4 rounded-2xl bg-white/10 text-white">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">Activities</p>
            <p className="text-4xl font-bold text-white" data-testid="stat-total-activities">{streaks.length}</p>
          </div>
        </div>
      </div>

      {/* Activity Streaks */}
      {streaks.length > 0 && (
        <div className="pt-4">
          <h2 className="text-2xl font-bold mb-6 text-white">Activity Streaks</h2>
          <div className="space-y-4">
            {streaks
              .sort((a, b) => b.currentStreak - a.currentStreak)
              .map((streak) => (
                <div
                  key={streak.activityId}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-white/20 hover:shadow-2xl flex items-center justify-between"
                  data-testid={`streak-${streak.activityId}`}
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1 text-white">{streak.activityName}</h3>
                    <p className="text-xs uppercase tracking-widest text-white/40">
                      Last logged: {streak.lastLoggedDate ? format(new Date(streak.lastLoggedDate), 'MMM d, yyyy') : 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center gap-12 border-l border-white/10 pl-8 py-2">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-white/40 mb-1 font-bold">Current</p>
                      <div className="flex items-center justify-end gap-2 text-orange-300">
                        <Flame className="w-4 h-4" />
                        <span className="text-3xl font-bold">{streak.currentStreak}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-white/40 mb-1 font-bold">Best</p>
                      <div className="flex items-center justify-end gap-2 text-white">
                        <Trophy className="w-4 h-4 opacity-50" />
                        <span className="text-3xl font-bold">{streak.longestStreak}</span>
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
