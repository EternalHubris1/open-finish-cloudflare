import { useListAchievements } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Lock } from 'lucide-react';
import { format } from 'date-fns';

export default function Achievements() {
  const { data: achievements = [], isLoading } = useListAchievements();

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.length;
  const totalCount = 20;

  return (
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-6xl mx-auto">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-5xl font-bold mb-2 text-white tracking-tight">Achievements</h1>
          <p className="text-white/40 uppercase tracking-widest text-sm">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className="text-sm font-bold uppercase tracking-wider text-white/70">Overall Progress</span>
          <span className="text-2xl font-bold text-amber-300">{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden relative z-10">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Unlocked Achievements */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">Unlocked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-3xl p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative group backdrop-blur-md"
                data-testid={`achievement-${achievement.id}`}
              >
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="text-5xl">{achievement.icon || '🏆'}</div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider rounded-full">
                    <Award className="w-3 h-3" />
                    Earned
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight text-white">{achievement.title}</h3>
                <p className="text-sm text-white/50 mb-4">{achievement.description}</p>
                
                <div className="pt-4 border-t border-white/10 mt-auto flex items-center justify-between">
                  {achievement.activityName ? (
                    <span className="text-xs text-amber-300 font-bold uppercase tracking-widest">{achievement.activityName}</span>
                  ) : <span />}
                  <span className="text-xs text-white/40">
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
        <h2 className="text-2xl font-bold mb-6 text-white">Locked</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(totalCount - unlockedCount)].map((_, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-md border border-white/10 border-dashed rounded-3xl p-6 opacity-50 hover:opacity-70 transition-opacity duration-300"
              data-testid={`locked-achievement-${i}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-2xl bg-white/5">
                  <Lock className="w-5 h-5 text-white/30" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-white/40 border border-white/10 text-xs font-bold uppercase tracking-wider rounded-full">
                  Locked
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white/40">Hidden Achievement</h3>
              <p className="text-sm text-white/30">Keep progressing to unlock</p>
            </div>
          ))}
        </div>
      </div>

      {achievements.length === 0 && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 border-dashed rounded-3xl p-16 text-center">
          <Award className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white">No achievements yet</h3>
          <p className="text-white/50">Start tracking activities to earn achievements</p>
        </div>
      )}
    </div>
  );
}
