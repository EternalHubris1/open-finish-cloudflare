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
        <Skeleton className="h-40 rounded-3xl bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl bg-white/5" />
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
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-5xl mx-auto relative z-10 pb-20">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">Profile</h1>
          <p className="text-red-400/80 font-bold uppercase tracking-widest text-[10px]">Your journey dashboard</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-800" />
        
        <div className="flex items-start gap-10">
          <Avatar className="w-32 h-32 rounded-3xl border border-red-500/20 shadow-[0_0_30px_rgba(220,38,38,0.15)]">
            <AvatarFallback className="text-4xl font-bold bg-[rgba(10,10,12,0.9)] text-red-500 rounded-3xl" style={{ fontFamily: 'serif' }}>
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pt-2">
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="username" className="text-[10px] uppercase tracking-widest font-bold text-white/40">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    className="rounded-2xl h-12 text-xl border-white/10 bg-white/5 mt-2 text-white backdrop-blur-xl focus-visible:ring-red-500"
                    data-testid="input-username"
                  />
                </div>
                <div>
                  <Label htmlFor="bio" className="text-[10px] uppercase tracking-widest font-bold text-white/40">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="rounded-2xl border-white/10 bg-white/5 mt-2 resize-none text-white backdrop-blur-xl focus-visible:ring-red-500"
                    data-testid="input-bio"
                  />
                </div>
                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-2xl px-8 uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 hover:scale-[1.02] active:scale-[0.98]" data-testid="button-save">
                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-2xl px-8 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-xl" data-testid="button-cancel">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-4xl font-bold mb-4 text-white tracking-wide">{profile.username}</h2>
                    {profile.bio ? (
                      <p className="text-lg text-white/60 border-l-2 border-red-500/50 pl-5 py-1 font-medium italic">"{profile.bio}"</p>
                    ) : (
                      <p className="text-sm text-white/30 border-l-2 border-white/10 pl-5 py-1 font-medium">No bio yet</p>
                    )}
                  </div>
                  <Button variant="outline" onClick={handleEdit} className="rounded-2xl px-6 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-xl text-white/70 hover:text-white" data-testid="button-edit-profile">
                    Edit
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/40 mt-8">
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
        <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-500/20 rounded-3xl p-8 flex items-center gap-6 group hover:shadow-[0_10px_40px_-10px_rgba(220,38,38,0.2)] hover:-translate-y-1 transition-all backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg relative z-10">
            <Flame className="w-8 h-8" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Current Streak</p>
            <p className="text-4xl font-bold text-white tracking-tight" data-testid="stat-current-streak">{currentStreak}</p>
          </div>
        </div>

        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex items-center gap-6 hover:border-white/20 transition-all hover:-translate-y-1">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Longest Streak</p>
            <p className="text-4xl font-bold text-white tracking-tight" data-testid="stat-longest-streak">{longestStreak}</p>
          </div>
        </div>

        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex items-center gap-6 hover:border-white/20 transition-all hover:-translate-y-1">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Activities</p>
            <p className="text-4xl font-bold text-white tracking-tight" data-testid="stat-total-activities">{streaks.length}</p>
          </div>
        </div>
      </div>

      {/* Activity Streaks */}
      {streaks.length > 0 && (
        <div className="pt-4">
          <h2 className="text-2xl font-bold mb-8 text-white tracking-wide">Activity Streaks</h2>
          <div className="space-y-4">
            {streaks
              .sort((a, b) => b.currentStreak - a.currentStreak)
              .map((streak) => (
                <div
                  key={streak.activityId}
                  className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:border-white/20 flex items-center justify-between group hover:shadow-2xl"
                  data-testid={`streak-${streak.activityId}`}
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1 text-white tracking-wide group-hover:text-red-400 transition-colors">{streak.activityName}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Last logged: {streak.lastLoggedDate ? format(new Date(streak.lastLoggedDate), 'MMM d, yyyy') : 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center gap-12 border-l border-white/10 pl-8 py-2">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Current</p>
                      <div className="flex items-center justify-end gap-2 text-red-400">
                        <Flame className="w-4 h-4" />
                        <span className="text-3xl font-bold tracking-tight">{streak.currentStreak}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Best</p>
                      <div className="flex items-center justify-end gap-2 text-white/60">
                        <Trophy className="w-4 h-4 opacity-50" />
                        <span className="text-3xl font-bold tracking-tight">{streak.longestStreak}</span>
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