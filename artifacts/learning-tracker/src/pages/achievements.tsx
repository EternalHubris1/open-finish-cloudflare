import { useEffect, useMemo, useState } from 'react';
import { getListAchievementsQueryKey, useListAchievements, type Achievement } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Lock, RefreshCw, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

function achievementDate(value: string, pattern: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : format(date, pattern);
}

export default function Achievements() {
  const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview');
  const achievementsQuery = useListAchievements({ query: { enabled: !preview, queryKey: getListAchievementsQueryKey() } });
  const previewAchievements = useMemo<Achievement[]>(() => [
    { id: 9001, type: 'system_milestone', title: 'A Line Became a Practice', description: 'You returned often enough for effort to become part of the landscape.', icon: '✦', activityId: null, activityName: null, unlockedAt: '2026-08-13T18:40:00.000Z' },
    { id: 9000, type: 'first_log', title: 'The First Mark', description: 'The journey became visible with its first recorded session.', icon: '◇', activityId: null, activityName: null, unlockedAt: '2026-08-01T09:15:00.000Z' },
  ], []);
  const achievements = preview ? previewAchievements : Array.isArray(achievementsQuery.data) ? achievementsQuery.data : [];
  const isLoading = !preview && achievementsQuery.isLoading;
  const isError = !preview && achievementsQuery.isError;
  const hasCachedData = preview || achievementsQuery.data !== undefined;
  const [ritualOpen, setRitualOpen] = useState(false);
  const latestAchievement = useMemo(() => [...achievements].sort((a, b) => {
    const bTime = new Date(b.unlockedAt).getTime();
    const aTime = new Date(a.unlockedAt).getTime();
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  })[0], [achievements]);

  useEffect(() => {
    if (!latestAchievement) return;
    const lastSeen = window.localStorage.getItem('open-finish:last-seen-achievement');
    setRitualOpen(lastSeen !== String(latestAchievement.id));
  }, [latestAchievement]);

  const closeRitual = () => {
    if (latestAchievement) window.localStorage.setItem('open-finish:last-seen-achievement', String(latestAchievement.id));
    setRitualOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-3xl bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-3xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && !hasCachedData) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 text-center">
        <div className="signal-surface w-full rounded-[2rem] border border-[#ff7868]/20 bg-[#0c1119]/94 p-10">
          <Award className="mx-auto mb-4 h-10 w-10 text-[#ff8b7c]" />
          <h1 className="mb-2 text-2xl font-semibold text-white">Couldn’t load your journey marks</h1>
          <p className="mb-6 text-sm text-white/45">Your achievements are still safe. Check the connection and try again.</p>
          <button type="button" onClick={() => void achievementsQuery.refetch()} className="signal-button inline-flex items-center gap-2 rounded-2xl bg-[#e95448] px-5 py-3 text-sm font-semibold text-white hover:bg-[#f26456]"><RefreshCw className="h-4 w-4" /> Retry</button>
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.length;
  const totalCount = 20;
  const lockedCount = Math.max(0, totalCount - unlockedCount);
  const progressPercent = Math.min(100, Math.round((unlockedCount / totalCount) * 100));

  return (
    <div className="page-arrival relative z-10 mx-auto min-h-screen max-w-6xl space-y-12 px-4 py-6 pb-28 md:p-8 md:pb-20">
      {latestAchievement && <Dialog open={ritualOpen} onOpenChange={(open) => { if (!open) closeRitual(); }}>
        <DialogContent className="achievement-ritual signal-surface overflow-hidden rounded-[2rem] border border-[#ffc268]/24 bg-[#0c1119] p-8 text-center text-white shadow-[0_30px_100px_rgba(0,0,0,.5)] md:p-11">
          <div className="absolute inset-x-16 top-[-5rem] h-44 rounded-full bg-[#ff7968]/14 blur-3xl" />
          <Sparkles className="relative mx-auto mb-6 h-5 w-5 text-[#ffc268]" />
          <p className="relative text-[9px] font-bold uppercase tracking-[.28em] text-[#ffc268]/75">A mark in the whole journey</p>
          <div className="relative my-7 text-6xl">{latestAchievement.icon || '🏆'}</div>
          <DialogTitle className="relative text-3xl font-semibold text-white">{latestAchievement.title}</DialogTitle>
          <DialogDescription className="relative mx-auto mt-3 max-w-sm text-sm leading-6 text-white/45">{latestAchievement.description}</DialogDescription>
          <p className="relative mt-7 text-[9px] font-bold uppercase tracking-[.18em] text-white/28">Earned {achievementDate(latestAchievement.unlockedAt, 'MMMM d, yyyy')}</p>
          <button type="button" onClick={closeRitual} className="signal-button relative mt-8 rounded-full bg-[#e95448] px-6 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-white hover:bg-[#f26456]">Keep the mark</button>
        </DialogContent>
      </Dialog>}
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">Achievements</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff8b7c]/80">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
      </div>

      {isError && hasCachedData && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#ffc268]/20 bg-[#ffc268]/[.07] px-5 py-4 text-sm text-[#ffe0a5]">
          <span>Showing saved marks. The latest achievements could not be loaded.</span>
          <button type="button" onClick={() => void achievementsQuery.refetch()} className="signal-button inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold hover:bg-white/5"><RefreshCw className="h-4 w-4" /> Retry</button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="signal-surface relative overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92 p-8">
        <div className="flex items-center justify-between mb-5 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">System-wide marks</span>
          <span className="text-3xl font-semibold tracking-tight text-[#ffc268]">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden relative z-10">
          <div
            className="achievement-progress h-full rounded-full bg-gradient-to-r from-[#d95149] to-[#efb45f] shadow-[0_0_14px_rgba(255,194,104,.2)] transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-[#ffc268]/[.06] to-transparent" />
      </div>

      {/* Unlocked Achievements */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-8 text-white tracking-wide">Unlocked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-focus-scope>
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="signal-surface group relative flex min-h-64 flex-col rounded-3xl border border-[#ff9b84]/16 bg-[#0c1119]/92 p-8 hover:-translate-y-1 hover:border-[#ffc268]/24"
                data-testid={`achievement-${achievement.id}`}
                data-focus-item
              >
                <div className="pointer-events-none absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-[#ffc268]/[.06] opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="text-5xl drop-shadow-[0_0_14px_rgba(255,194,104,.25)]">{achievement.icon || '🏆'}</div>
                  <div className="flex items-center gap-2 rounded-2xl border border-[#ffc268]/20 bg-[#ffc268]/[.07] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#ffc268]">
                    <Award className="w-3.5 h-3.5" />
                    Earned
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight text-white tracking-wide">{achievement.title}</h3>
                <p className="text-sm text-white/50 mb-6 font-medium">{achievement.description}</p>
                
                <div className="pt-5 border-t border-white/10 mt-auto flex items-center justify-between">
                  {achievement.activityName ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff9a89]">{achievement.activityName}</span>
                  ) : <span />}
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    {achievementDate(achievement.unlockedAt, 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      <div>
        <h2 className="text-2xl font-bold mb-8 text-white tracking-wide">Locked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-focus-scope>
          {[...Array(lockedCount)].map((_, i) => (
            <div
              key={i}
              className="signal-surface rounded-3xl border border-dashed border-white/[.07] bg-[#0a0e15]/76 p-8 opacity-55 hover:opacity-85"
              data-testid={`locked-achievement-${i}`}
              data-focus-item
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 flex items-center justify-center border border-white/5 rounded-2xl bg-white/5">
                  <Lock className="w-6 h-6 text-white/20" />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/30 border border-white/5 text-[10px] font-bold uppercase tracking-widest rounded-2xl">
                  Locked
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white/30 tracking-wide">Hidden Path</h3>
              <p className="text-sm text-white/20 font-medium">Keep progressing to reveal</p>
            </div>
          ))}
        </div>
      </div>

      {achievements.length === 0 && (
        <div className="signal-surface rounded-3xl border border-dashed border-white/[.07] bg-[#0c1119]/88 p-16 text-center">
          <Award className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white">No achievements yet</h3>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-8">Start tracking activities to earn your first mark</p>
        </div>
      )}
    </div>
  );
}
