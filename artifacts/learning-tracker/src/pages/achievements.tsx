import { useListAchievements } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Lock } from 'lucide-react';
import { format } from 'date-fns';

export default function Achievements() {
  const { data: achievements = [], isLoading } = useListAchievements();

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

  const unlockedCount = achievements.length;
  const totalCount = 20;

  return (
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-6xl mx-auto relative z-10 pb-20">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">Achievements</h1>
          <p className="text-red-400/80 font-bold uppercase tracking-widest text-[10px]">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-5 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Overall Progress</span>
          <span className="text-3xl font-bold text-orange-400 tracking-tight">{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden relative z-10">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Unlocked Achievements */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-8 text-white tracking-wide">Unlocked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/20 rounded-3xl p-8 hover:shadow-[0_10px_40px_-10px_rgba(234,88,12,0.2)] hover:-translate-y-1 transition-all duration-300 relative group backdrop-blur-xl"
                data-testid={`achievement-${achievement.id}`}
              >
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="text-5xl drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">{achievement.icon || '🏆'}</div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold uppercase tracking-widest rounded-2xl">
                    <Award className="w-3.5 h-3.5" />
                    Earned
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight text-white tracking-wide">{achievement.title}</h3>
                <p className="text-sm text-white/50 mb-6 font-medium">{achievement.description}</p>
                
                <div className="pt-5 border-t border-white/10 mt-auto flex items-center justify-between">
                  {achievement.activityName ? (
                    <span className="text-[10px] text-orange-400/80 font-bold uppercase tracking-widest">{achievement.activityName}</span>
                  ) : <span />}
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(totalCount - unlockedCount)].map((_, i) => (
            <div
              key={i}
              className="bg-[rgba(15,15,20,0.5)] backdrop-blur-xl border border-white/5 border-dashed rounded-3xl p-8 opacity-60 hover:opacity-100 transition-opacity duration-300"
              data-testid={`locked-achievement-${i}`}
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
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/5 border-dashed rounded-3xl p-16 text-center shadow-2xl">
          <Award className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white">No achievements yet</h3>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-8">Start tracking activities to earn your first mark</p>
        </div>
      )}
    </div>
  );
}