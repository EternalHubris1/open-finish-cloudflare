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
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
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
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Dashboard</h1>
          <p className="text-white/40 uppercase tracking-widest text-sm">Track your progress</p>
        </div>
        <Link href="/activities">
          <Button size="lg" className="gap-2 rounded-2xl font-semibold uppercase tracking-wider text-xs bg-blue-500/10 border border-blue-400/30 text-blue-300 hover:bg-blue-500/20 hover:scale-[1.03] active:scale-[0.97] transition-all backdrop-blur-md" data-testid="button-manage-activities">
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
          label="Completed"
          value={`${dashboard?.activitiesTodayCompleted || 0}/${dashboard?.activitiesTodayTotal || 0}`}
          icon={Target}
          variant="default"
          trend="activities done"
        />
        <StatCard
          label="Achievements"
          value={dashboard?.totalAchievements || 0}
          icon={Award}
          variant="default"
          trend="milestones"
        />
      </div>

      {/* Weekly Progress Heatmap */}
      {weeklyProgress.length > 0 && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">Weekly Progress</h2>
          </div>
          <div className="space-y-6">
            {weeklyProgress.slice(0, 5).map((activity) => (
              <div key={activity.activityId}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-1.5 h-4 rounded-full"
                    style={{ backgroundColor: activity.color || '#3b82f6' }}
                  />
                  <span className="text-sm font-bold uppercase tracking-wider text-white/70">{activity.activityName}</span>
                </div>
                <div className="flex gap-2">
                  {activity.days.map((day, idx) => {
                    const dayDate = weekDays[idx];
                    const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    return (
                      <div
                        key={day.date}
                        className="flex-1 h-12 rounded-2xl border flex items-center justify-center text-xs font-bold transition-all duration-200"
                        style={{
                          backgroundColor: day.completed
                            ? activity.color
                            : 'rgba(255, 255, 255, 0.05)',
                          color: day.completed ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                          borderColor: isToday ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                          borderWidth: isToday ? '2px' : '1px',
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
        <h2 className="text-2xl font-bold mb-6 text-white">Your Activities</h2>
        {activities.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 border-dashed rounded-3xl p-16 text-center">
            <Target className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2 text-white">No activities yet</h3>
            <p className="text-white/50 mb-6">Start tracking your first activity</p>
            <Link href="/activities">
              <Button className="rounded-2xl uppercase tracking-wider text-xs font-semibold bg-blue-500/10 border border-blue-400/30 text-blue-300 hover:bg-blue-500/20 backdrop-blur-md" data-testid="button-create-first-activity">
                <Plus className="w-4 h-4 mr-2" />
                Get Started
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
                    className="w-full rounded-2xl border-dashed border-white/20 hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all font-semibold uppercase tracking-wider text-xs text-white/70 bg-white/5 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleLogClick(activity)}
                    data-testid={`button-log-${activity.id}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Log Session
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Achievements */}
      {dashboard?.recentAchievements && dashboard.recentAchievements.length > 0 && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-amber-300" />
            <h2 className="text-2xl font-bold text-white">Recent Achievements</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboard.recentAchievements.slice(0, 3).map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-400/30 flex gap-4 items-center backdrop-blur-md"
                data-testid={`achievement-${achievement.id}`}
              >
                <div className="text-3xl">{achievement.icon || '🏆'}</div>
                <div>
                  <h3 className="font-bold mb-1 leading-tight text-white">{achievement.title}</h3>
                  <p className="text-xs text-white/50 leading-snug">{achievement.description}</p>
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
