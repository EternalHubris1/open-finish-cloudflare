import { Activity } from '@workspace/api-client-react/src/generated/api.schemas';
import { Clock, Flame } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  activity: Activity;
  streak?: { currentStreak: number; longestStreak: number };
  todayMinutes?: number;
}

export function ActivityCard({ activity, streak, todayMinutes = 0 }: ActivityCardProps) {
  const progress = activity.targetMinutesPerDay > 0
    ? Math.min(100, (todayMinutes / activity.targetMinutesPerDay) * 100)
    : 0;

  return (
    <Link
      href={`/activities/${activity.id}`}
      className="block group"
      data-testid={`activity-card-${activity.id}`}
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-6 rounded-full"
                style={{ backgroundColor: activity.color || '#3b82f6' }}
              />
              <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                {activity.name}
              </h3>
            </div>
            <p className="text-xs text-white/40 uppercase tracking-widest pl-4">{activity.category}</p>
          </div>
          {streak && streak.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-sm font-bold">{streak.currentStreak}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-white/50">
              <Clock className="w-4 h-4" />
              <span>{todayMinutes} / {activity.targetMinutesPerDay} min</span>
            </div>
            <span className={cn(
              'font-bold text-lg',
              progress >= 100 ? 'text-green-400' : 'text-white'
            )}>
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                progress >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </Link>
  );
}
