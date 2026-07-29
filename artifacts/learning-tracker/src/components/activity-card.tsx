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
      <div className="rounded-3xl border border-white/10 bg-[rgba(15,15,20,0.85)] backdrop-blur-xl p-6 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-1.5 h-6 rounded-full"
                style={{ backgroundColor: activity.color || '#dc2626' }}
              />
              <h3 className="font-bold text-xl text-white group-hover:text-red-400 transition-colors tracking-wide">
                {activity.name}
              </h3>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest pl-4 font-semibold mt-1">{activity.category}</p>
          </div>
          {streak && streak.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.15)]">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-sm font-bold">{streak.currentStreak}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 mt-8">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-white/40 font-semibold uppercase tracking-wider text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>{todayMinutes} / {activity.targetMinutesPerDay} min</span>
            </div>
            <span className={cn(
              'font-bold text-lg',
              progress >= 100 ? 'text-red-400' : 'text-white'
            )}>
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(220,38,38,0.5)]',
                progress >= 100 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-red-700 to-red-500'
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