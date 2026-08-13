import { useState } from 'react';
import { useGetDashboard, useListActivities, useListStreaks, useGetWeeklyProgress } from '@workspace/api-client-react';
import { StatCard } from '@/components/stat-card';
import { ActivityCard } from '@/components/activity-card';
import { LogActivityDialog } from '@/components/log-activity-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Clock, Target, Award, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { Activity } from '@workspace/api-client-react';
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
        <Skeleton className="h-12 w-64 rounded-3xl bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  const handleLogClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setLogDialogOpen(true);
  };

  const todayMinutesByActivity = new Map<number, number>();
  dashboard?.todayLogs.forEach((log) => {
    const current = todayMinutesByActivity.get(log.activityId) || 0;
    todayMinutesByActivity.set(log.activityId, current + log.durationMinutes);
  });

  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-6xl mx-auto relative z-10 pb-20">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">WASTE NO TIME & BECAME GREAT</h1>
          <p className="text-red-400/80 font-bold uppercase tracking-widest text-[10px]">Track your progress</p>
        </div>
        <Link href="/activities">
          <Button size="lg" className="gap-2 rounded-2xl font-bold uppercase tracking-wider text-[11px] bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 hover:scale-[1.03] active:scale-[0.97] transition-all border-0" data-testid="button-manage-activities">
            <Plus className="w-4 h-4" />
            Add Activity
          </Button>
        </Link>
      </div>
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
          label="Active Today"
          value={dashboard?.activitiesTodayCompleted || 0}
          icon={Target}
          variant="default"
          trend="directions touched"
        />
        <StatCard
          label="Achievements"
          value={dashboard?.totalAchievements || 0}
          icon={Award}
          variant="default"
          trend="milestones"
        />
      </div>
      {weeklyProgress.length > 0 && (
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <TrendingUp className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Weekly Progress</h2>
          </div>
          <div className="space-y-6 relative z-10">
            {weeklyProgress.slice(0, 5).map((activity) => (
              <div key={activity.activityId}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-1.5 h-4 rounded-full"
                    style={{ backgroundColor: activity.color || '#dc2626' }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{activity.activityName}</span>
                </div>
                <div className="flex gap-2">
                  {activity.days.map((day, idx) => {
                    const dayDate = weekDays[idx];
                    const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    return (
                      <div
                        key={day.date}
                        className="flex-1 h-12 rounded-2xl border flex items-center justify-center text-[11px] font-bold transition-all duration-200"
                        style={{
                          backgroundColor: day.completed
                            ? activity.color || '#dc2626'
                            : 'rgba(255, 255, 255, 0.03)',
                          color: day.completed ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                          borderColor: isToday ? '#dc2626' : 'rgba(255, 255, 255, 0.05)',
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
      <div>
        <h2 className="text-2xl font-bold mb-8 text-white tracking-wide">Your Activities</h2>
        {activities.length === 0 ? (
          <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/5 border-dashed rounded-3xl p-16 text-center shadow-2xl">
            <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2 text-white">No activities yet</h3>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-8">Start tracking your first activity</p>
            <Link href="/activities">
              <Button className="rounded-2xl uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 px-8 py-6 h-auto" data-testid="button-create-first-activity">
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
                    className="w-full rounded-3xl border border-white/10 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold uppercase tracking-wider text-[11px] text-white/60 bg-[rgba(15,15,20,0.85)] backdrop-blur-xl hover:scale-[1.02] active:scale-[0.98] py-6 h-auto shadow-lg"
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
      {dashboard?.recentAchievements && dashboard.recentAchievements.length > 0 && (
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Award className="w-5 h-5 text-orange-400" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Recent Achievements</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboard.recentAchievements.slice(0, 3).map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-3xl p-6 border border-orange-500/20 flex gap-5 items-center backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-transform"
                data-testid={`achievement-${achievement.id}`}
              >
                <div className="text-4xl drop-shadow-[0_0_15px_rgba(251,146,60,0.3)]">{achievement.icon || '🏆'}</div>
                <div>
                  <h3 className="font-bold mb-1 leading-tight text-white tracking-wide">{achievement.title}</h3>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-white/50 leading-snug">{achievement.description}</p>
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
