import { useState } from 'react';
import { useGetDashboard, useListActivities, useListStreaks, useGetWeeklyProgress } from '@workspace/api-client-react';
import { StatCard } from '@/components/stat-card';
import { ActivityCard } from '@/components/activity-card';
import { LogActivityDialog } from '@/components/log-activity-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Clock, Target, Award, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { Activity } from '@workspace/api-client-react/src/generated/api.schemas';
import { format, startOfWeek, addDays } from 'date-fns';

export default function Dashboard() {
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboard();
  const { data: activities = [], isLoading: activitiesLoading } = useListActivities();
  const { data: streaks = [] } = useListStreaks();
  const { data: weeklyProgress = [] } = useGetWeeklyProgress();
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  if (dashboardLoading || activitiesLoading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  const handleLogClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setLogDialogOpen(true);
  };

  // Calculate today's minutes per activity
  const todayMinutesByActivity = new Map<number, number>();
  dashboard?.todayLogs.forEach((log) => {
    const current = todayMinutesByActivity.get(log.activityId) || 0;
    todayMinutesByActivity.set(log.activityId, current + log.durationMinutes);
  });

  // Get week dates for heatmap
  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-6xl mx-auto">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-2 font-serif tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">Discipline is the bridge to mastery</p>
        </div>
        <Link href="/activities">
          <Button size="lg" className="gap-2 rounded-sm font-semibold uppercase tracking-wider text-xs" data-testid="button-manage-activities">
            <Plus className="w-4 h-4" />
            Add Activity
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Current Streak"
          value={dashboard?.overallCurrentStreak || 0}
          icon={Flame}
          variant="primary"
          trend="days unbroken"
        />
        <StatCard
          label="Today's Focus"
          value={dashboard?.totalMinutesToday || 0}
          icon={Clock}
          variant="accent"
          trend="minutes logged"
        />
        <StatCard
          label="Path Walked"
          value={`${dashboard?.activitiesTodayCompleted || 0}/${dashboard?.activitiesTodayTotal || 0}`}
          icon={Target}
          variant="default"
          trend="activities done"
        />
        <StatCard
          label="Milestones"
          value={dashboard?.totalAchievements || 0}
          icon={Award}
          variant="default"
          trend="achievements"
        />
      </div>

      {/* Weekly Progress Heatmap */}
      {weeklyProgress.length > 0 && (
        <div className="bg-card border border-card-border rounded-sm p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-serif ink-divider inline-block">Weekly Progress</h2>
          </div>
          <div className="space-y-6">
            {weeklyProgress.slice(0, 5).map((activity) => (
              <div key={activity.activityId}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-1.5 h-4 rounded-none"
                    style={{ backgroundColor: activity.color || 'hsl(var(--foreground))' }}
                  />
                  <span className="text-sm font-bold uppercase tracking-wider">{activity.activityName}</span>
                </div>
                <div className="flex gap-2">
                  {activity.days.map((day, idx) => {
                    const dayDate = weekDays[idx];
                    const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    return (
                      <div
                        key={day.date}
                        className="flex-1 h-12 rounded-sm border flex items-center justify-center text-xs font-serif font-bold transition-all duration-200"
                        style={{
                          backgroundColor: day.completed
                            ? activity.color
                            : 'transparent',
                          color: day.completed ? '#fff' : 'hsl(var(--muted-foreground))',
                          borderColor: isToday ? 'hsl(var(--primary))' : 'hsl(var(--card-border))',
                          borderWidth: isToday ? '2px' : '1px',
                          opacity: day.completed ? 1 : 0.6,
                        }}
                        data-testid={`heatmap-${activity.activityId}-${idx}`}
                      >
                        {day.minutesLogged > 0 ? `${day.minutesLogged}m` : format(dayDate, 'EE')[0]}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activities Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6 font-serif ink-divider inline-block">Your Disciplines</h2>
        {activities.length === 0 ? (
          <div className="bg-card border border-card-border border-dashed rounded-sm p-16 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold font-serif mb-2 text-foreground">The path is empty</h3>
            <p className="text-muted-foreground mb-6 font-serif italic">Take the first step and choose your discipline.</p>
            <Link href="/activities">
              <Button className="rounded-sm uppercase tracking-wider text-xs font-semibold" data-testid="button-create-first-activity">
                <Plus className="w-4 h-4 mr-2" />
                Begin
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => {
              const streak = streaks.find((s) => s.activityId === activity.id);
              const todayMinutes = todayMinutesByActivity.get(activity.id) || 0;

              return (
                <div key={activity.id} className="space-y-3 group">
                  <ActivityCard
                    activity={activity}
                    streak={streak}
                    todayMinutes={todayMinutes}
                  />
                  <Button
                    variant="outline"
                    className="w-full rounded-sm border-dashed hover:border-solid hover:border-primary hover:text-primary transition-all font-semibold uppercase tracking-wider text-xs"
                    onClick={() => handleLogClick(activity)}
                    data-testid={`button-log-${activity.id}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Record Session
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Achievements */}
      {dashboard?.recentAchievements && dashboard.recentAchievements.length > 0 && (
        <div className="bg-card border border-card-border rounded-sm p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-serif ink-divider inline-block">Honors</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboard.recentAchievements.slice(0, 3).map((achievement) => (
              <div
                key={achievement.id}
                className="bg-background rounded-sm p-5 border border-border border-l-4 border-l-primary flex gap-4 items-center"
                data-testid={`achievement-${achievement.id}`}
              >
                <div className="text-3xl">{achievement.icon || '🏆'}</div>
                <div>
                  <h3 className="font-bold font-serif mb-1 leading-tight">{achievement.title}</h3>
                  <p className="text-xs text-muted-foreground leading-snug">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedActivity && (
        <LogActivityDialog
          activity={selectedActivity}
          open={logDialogOpen}
          onOpenChange={setLogDialogOpen}
        />
      )}
    </div>
  );
}