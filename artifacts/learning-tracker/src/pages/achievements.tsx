import { useListAchievements } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Lock } from 'lucide-react';
import { format } from 'date-fns';

export default function Achievements() {
  const { data: achievements = [], isLoading } = useListAchievements();

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.length;
  const totalCount = 20; // Mock total

  return (
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-6xl mx-auto">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-5xl font-bold mb-2 font-serif text-foreground tracking-tight">Achievements</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">
            {unlockedCount} of {totalCount} mastered
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card border border-card-border rounded-sm p-8 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className="text-sm font-bold uppercase tracking-wider">Journey</span>
          <span className="text-2xl font-serif font-bold text-primary">{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-none overflow-hidden relative z-10">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      </div>

      {/* Unlocked Achievements */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 font-serif ink-divider inline-block">Honors Received</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-card border border-card-border border-t-4 border-t-primary rounded-sm p-6 hover:shadow-md hover:border-foreground/30 transition-all duration-300 relative group"
                data-testid={`achievement-${achievement.id}`}
              >
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="text-5xl filter drop-shadow-sm">{achievement.icon || '🏆'}</div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider rounded-sm">
                    <Award className="w-3 h-3" />
                    Earned
                  </div>
                </div>
                <h3 className="text-xl font-bold font-serif mb-2 leading-tight">{achievement.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 font-serif italic">{achievement.description}</p>
                
                <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
                  {achievement.activityName ? (
                    <span className="text-xs text-primary font-bold uppercase tracking-widest">{achievement.activityName}</span>
                  ) : <span />}
                  <span className="text-xs text-muted-foreground font-serif">
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
        <h2 className="text-2xl font-bold mb-6 font-serif ink-divider inline-block">Yet to be Earned</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(totalCount - unlockedCount)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-card-border border-dashed rounded-sm p-6 opacity-50 hover:opacity-80 transition-opacity duration-300"
              data-testid={`locked-achievement-${i}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 flex items-center justify-center border border-border rounded-sm bg-muted/50">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted text-muted-foreground border border-border text-xs font-bold uppercase tracking-wider rounded-sm">
                  Veiled
                </div>
              </div>
              <h3 className="text-xl font-bold font-serif mb-2 text-muted-foreground">Unknown Mark</h3>
              <p className="text-sm text-muted-foreground font-serif italic">Walk further to reveal this honor</p>
            </div>
          ))}
        </div>
      </div>

      {achievements.length === 0 && (
        <div className="bg-card border border-card-border border-dashed rounded-sm p-16 text-center">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold font-serif mb-2">No honors yet</h3>
          <p className="text-muted-foreground font-serif italic">Start your practice to carve your first mark.</p>
        </div>
      )}
    </div>
  );
}