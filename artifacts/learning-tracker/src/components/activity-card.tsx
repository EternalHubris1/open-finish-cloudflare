import { Activity } from '@workspace/api-client-react/src/generated/api.schemas';
import { Clock, Target, Flame } from 'lucide-react';
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
      <div className="rounded-sm border border-card-border bg-card p-5 transition-all duration-300 hover:border-foreground/40 hover:shadow-sm relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-6 rounded-sm"
                style={{ backgroundColor: activity.color || 'hsl(var(--primary))' }}
              />
              <h3 className="font-bold font-serif text-lg text-card-foreground group-hover:text-primary transition-colors">
                {activity.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest pl-4">{activity.category}</p>
          </div>
          {streak && streak.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm border border-primary/30 bg-primary/5 text-primary">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold">{streak.currentStreak}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground font-serif">
              <Clock className="w-4 h-4" />
              <span>{todayMinutes} / {activity.targetMinutesPerDay} min</span>
            </div>
            <span className={cn(
              'font-serif font-bold text-lg',
              progress >= 100 ? 'text-primary' : 'text-foreground'
            )}>
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-1 bg-muted rounded-none overflow-hidden">
            <div
              className={cn(
                'h-full rounded-none transition-all duration-500 ease-out',
                progress >= 100 ? 'bg-primary' : 'bg-foreground'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}