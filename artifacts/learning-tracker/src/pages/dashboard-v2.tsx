import { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  getGetCalendarQueryKey,
  useGetCalendar,
  useGetDashboard,
  useListActivities,
  useListStreaks,
  type Activity,
  type CalendarDay,
} from '@workspace/api-client-react';
import { addDays, format, startOfWeek } from 'date-fns';
import { ArrowUpRight, Clock3, Flame, Leaf, Plus, Radio, RefreshCw, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LogActivityDialog } from '@/components/log-activity-dialog';
import { previewActivities, previewDashboard, previewStreaks } from '@/pages/dashboard-exploration';

const MOMENTUM_PALETTES = {
  dark: [
    'oklch(0.34 0.018 342)',
    'oklch(0.46 0.075 352)',
    'oklch(0.57 0.145 12)',
    'oklch(0.67 0.185 25)',
    'oklch(0.78 0.155 58)',
  ],
  light: [
    'oklch(0.68 0.025 342)',
    'oklch(0.57 0.085 352)',
    'oklch(0.51 0.145 12)',
    'oklch(0.48 0.17 25)',
    'oklch(0.5 0.14 58)',
  ],
} as const;

function minutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ''}` : `${rest}m`;
}

function intensityIndex(minutes: number) {
  if (minutes === 0) return 0;
  if (minutes <= 45) return 1;
  if (minutes <= 120) return 2;
  if (minutes <= 240) return 3;
  return 4;
}

function momentumSeries(days: CalendarDay[]) {
  let accumulated = 0;
  return days.map((day) => {
    const dailyEnergy = Math.min(day.totalMinutes / 240, 1);
    accumulated = day.totalMinutes === 0
      ? accumulated * 0.52
      : Math.min(1, accumulated * 0.68 + dailyEnergy * 0.52);
    return accumulated;
  });
}

function momentumStatus(values: number[]) {
  const current = values.at(-1) ?? 0;
  const previous = values.at(-2) ?? 0;
  if (current < 0.22) return 'Momentum is quiet';
  if (current - previous > 0.08) return 'Momentum is building';
  if (previous - current > 0.12) return 'Momentum is softening';
  return 'Momentum is holding';
}

function previewCalendar(): CalendarDay[] {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const totals = [42, 126, 18, 208, 76, 286, 164];
  return totals.map((totalMinutes, index) => {
    const date = format(addDays(weekStart, index), 'yyyy-MM-dd');
    const first = Math.round(totalMinutes * 0.58);
    return {
      date,
      totalMinutes,
      goalMinutes: 235,
      status: totalMinutes >= 235 ? 'met' : 'under',
      logs: totalMinutes ? [
        { id: index * 2 + 1, activityId: 1, activityName: 'Writing', activityColor: '#df554f', durationMinutes: first, notes: index === 5 ? 'The chapter finally found its center.' : 'Focused continuation', logDate: date },
        { id: index * 2 + 2, activityId: 2, activityName: 'Research', activityColor: '#6f8fbf', durationMinutes: totalMinutes - first, notes: null, logDate: date },
      ] : [],
    };
  });
}

function Timeline({ days, light }: { days: CalendarDay[]; light: boolean }) {
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState(days.at(-1)?.date ?? '');
  const selected = days.find((day) => day.date === selectedDate) ?? days.at(-1);
  const max = Math.max(60, ...days.map((day) => day.totalMinutes));
  const palette = light ? MOMENTUM_PALETTES.light : MOMENTUM_PALETTES.dark;
  const momentum = momentumSeries(days);
  const points = momentum.map((value, index) => `${50 + index * 100},${210 - value * 164}`).join(' ');
  const selectedIndex = Math.max(0, days.findIndex((day) => day.date === selected?.date));
  const selectedPoint = { x: 50 + selectedIndex * 100, y: 210 - (momentum[selectedIndex] ?? 0) * 164 };

  const selectDay = (day: CalendarDay) => {
    const touchLayout = window.innerWidth < 768 || window.matchMedia('(hover: none)').matches;
    if (touchLayout) setSelectedDate(day.date);
    else navigate(`/history?date=${day.date}`);
  };

  return (
    <section className={`overflow-hidden rounded-[2rem] border ${light ? 'border-black/10 bg-white/45' : 'border-white/10 bg-black/25'} backdrop-blur-xl`}>
      <div className="grid lg:grid-cols-[1.5fr_.5fr]">
        <div className="min-w-0 p-6 md:p-9">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className={`text-[9px] font-bold uppercase tracking-[.28em] ${light ? 'text-[#742c35]' : 'text-red-400'}`}>Energy invested</p>
              <h2 className={`mt-2 text-2xl font-semibold md:text-3xl ${light ? 'text-[#181719]' : 'text-white'}`}>The shape of this week</h2>
            </div>
            <Link href="/history" className={`hidden text-[10px] font-bold uppercase tracking-widest sm:block ${light ? 'text-black/45' : 'text-white/30'} hover:text-red-400`}>History <ArrowUpRight className="ml-1 inline h-3 w-3" /></Link>
          </div>
          <div className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="relative h-72 min-w-[560px]">
              <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[232px] w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 232">
                <defs>
                  <linearGradient id={`momentum-line-${light ? 'light' : 'dark'}`} x1="0" x2="1">
                    <stop offset="0" stopColor={palette[1]} />
                    <stop offset="0.55" stopColor={palette[3]} />
                    <stop offset="1" stopColor={palette[4]} />
                  </linearGradient>
                  <filter id={`momentum-glow-${light ? 'light' : 'dark'}`} x="-20%" y="-40%" width="140%" height="180%">
                    <feGaussianBlur stdDeviation={light ? 5 : 8} />
                  </filter>
                </defs>
                <polyline fill="none" filter={`url(#momentum-glow-${light ? 'light' : 'dark'})`} opacity={light ? 0.16 : 0.34} points={points} stroke={palette[4]} strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" vectorEffect="non-scaling-stroke" />
                <polyline className="momentum-line" fill="none" pathLength="1" points={points} stroke={`url(#momentum-line-${light ? 'light' : 'dark'})`} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                {momentum.map((value, index) => <circle key={days[index]?.date} cx={50 + index * 100} cy={210 - value * 164} fill={palette[Math.max(1, intensityIndex(days[index]?.totalMinutes ?? 0))]} r={index === momentum.length - 1 ? 4.5 : 2.6} vectorEffect="non-scaling-stroke" />)}
                <circle className="momentum-node" cx={50 + (momentum.length - 1) * 100} cy={210 - (momentum.at(-1) ?? 0) * 164} fill="none" opacity={light ? 0.45 : 0.8} r="10" stroke={palette[4]} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <circle cx={selectedPoint.x} cy={selectedPoint.y} fill="none" r="7" stroke={light ? 'oklch(0.32 0.03 20)' : 'white'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="relative z-10 grid h-full grid-cols-7 gap-4 md:gap-6">
              {days.map((day) => {
                const exceptional = day.totalMinutes > 240;
                const selectedDay = selected?.date === day.date;
                const color = palette[intensityIndex(day.totalMinutes)];
                return (
                  <button
                    key={day.date}
                    type="button"
                    aria-label={`${format(new Date(`${day.date}T00:00:00`), 'EEEE')}: ${day.totalMinutes} minutes. Open day history.`}
                    onMouseEnter={() => setSelectedDate(day.date)}
                    onFocus={() => setSelectedDate(day.date)}
                    onClick={() => selectDay(day)}
                    className={`group flex h-full min-w-0 flex-col justify-end gap-3 outline-none transition-opacity duration-300 ${selectedDate && !selectedDay ? 'opacity-70 hover:opacity-100 focus:opacity-100' : 'opacity-100'}`}
                  >
                    <span className="relative flex w-full flex-1 items-end">
                      {selectedDay && <span className={`absolute inset-x-0 z-30 text-center text-[10px] font-semibold tabular-nums ${light ? 'text-black/65' : 'text-white/75'}`} style={{ bottom: `calc(${Math.max(day.totalMinutes ? 8 : 2, day.totalMinutes / max * 100)}% + 12px)` }}>{minutesLabel(day.totalMinutes)}</span>}
                      <span
                        className={`relative block w-full rounded-t-[.65rem] border border-white/10 transition-[height,filter,opacity] duration-500 group-hover:brightness-110 group-focus-visible:ring-2 ${exceptional ? 'exceptional-bloom' : ''}`}
                        style={{
                          height: `${Math.max(day.totalMinutes ? 8 : 2, day.totalMinutes / max * 100)}%`,
                          background: `linear-gradient(180deg, color-mix(in oklab, ${color} 94%, white 6%), ${color})`,
                          boxShadow: exceptional ? `0 0 34px color-mix(in oklab, ${color} 38%, transparent), 0 14px 42px color-mix(in oklab, ${color} 24%, transparent)` : 'none',
                        }}
                      >
                        {exceptional && <span className="absolute inset-x-1 bottom-0 h-2/3 bg-gradient-to-t from-white/16 to-transparent" />}
                      </span>
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-[.14em] ${selectedDay ? (light ? 'text-black/75' : 'text-white/80') : (light ? 'text-black/45' : 'text-white/40')}`}>{format(new Date(`${day.date}T00:00:00`), 'EEE')}</span>
                  </button>
                );
              })}
              </div>
            </div>
          </div>
          <div className={`mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[.12em] ${light ? 'text-black/45' : 'text-white/40'}`}>
            <span>Daily energy</span><span>Quiet</span>{palette.map((color) => <span key={color} className="h-2.5 w-6 rounded-full border border-white/10" style={{ background: color }} />)}<span>Exceptional</span><span className={`mx-1 h-px w-10 ${light ? 'bg-[#9d3d36]' : 'bg-[#f6b36a]'} shadow-[0_0_8px_currentColor]`} /><span>Momentum</span>
          </div>
        </div>

        <aside className={`relative border-t p-6 lg:border-l lg:border-t-0 md:p-8 ${light ? 'border-black/10 bg-[#e4ded4]/70' : 'border-white/8 bg-[#0b0a0d]/70'}`} aria-live="polite">
          {selected && <>
            <p className={`text-[9px] font-bold uppercase tracking-[.25em] ${light ? 'text-[#742c35]' : 'text-violet-300'}`}>Focused day</p>
            <p className={`mt-3 text-2xl font-semibold ${light ? 'text-[#181719]' : 'text-white'}`}>{format(new Date(`${selected.date}T00:00:00`), 'EEEE')}</p>
            <p className={`mt-1 text-sm ${light ? 'text-black/40' : 'text-white/35'}`}>{format(new Date(`${selected.date}T00:00:00`), 'MMMM d')}</p>
            <p className={`mt-7 text-5xl font-light ${light ? 'text-[#181719]' : 'text-white'}`}>{minutesLabel(selected.totalMinutes)}</p>
            <div className="mt-7 space-y-4">
              {selected.logs.length ? selected.logs.map((log) => <div key={log.id} className={`border-l pl-3 ${light ? 'border-black/15' : 'border-white/15'}`}><div className="flex justify-between gap-3"><span className={`text-xs font-semibold ${light ? 'text-black/70' : 'text-white/70'}`}>{log.activityName}</span><span className={`text-xs ${light ? 'text-black/40' : 'text-white/35'}`}>{minutesLabel(log.durationMinutes)}</span></div>{log.notes && <p className={`mt-1 line-clamp-2 text-[11px] italic ${light ? 'text-black/35' : 'text-white/25'}`}>“{log.notes}”</p>}</div>) : <p className={`text-sm ${light ? 'text-black/35' : 'text-white/25'}`}>A quiet day. The line remains open.</p>}
            </div>
            {selected.totalMinutes > 240 && <div className={`mt-7 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${light ? 'text-[#704b7e]' : 'text-violet-300'}`}><Leaf className="h-4 w-4" /> A day that mattered</div>}
            <Link href={`/history?date=${selected.date}`} className={`mt-8 flex items-center justify-between border-t pt-5 text-[10px] font-bold uppercase tracking-widest ${light ? 'border-black/10 text-black/50' : 'border-white/10 text-white/40'} hover:text-red-400`}>Open this day <ArrowUpRight className="h-4 w-4" /></Link>
          </>}
        </aside>
      </div>
    </section>
  );
}

export default function DashboardV2() {
  const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview');
  const light = new URLSearchParams(window.location.search).get('theme') === 'light';
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const start = format(weekStart, 'yyyy-MM-dd');
  const end = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  const dashboardQuery = useGetDashboard();
  const activitiesQuery = useListActivities();
  const streaksQuery = useListStreaks();
  const calendarQuery = useGetCalendar({ start, end }, { query: { queryKey: getGetCalendarQueryKey({ start, end }) } });
  const dashboard = preview ? previewDashboard : dashboardQuery.data;
  const activities = preview ? previewActivities : activitiesQuery.data ?? [];
  const streaks = preview ? previewStreaks : streaksQuery.data ?? [];
  const calendarData = preview ? previewCalendar() : calendarQuery.data ?? [];
  const calendarMap = new Map(calendarData.map((day) => [day.date, day]));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = format(addDays(weekStart, index), 'yyyy-MM-dd');
    return calendarMap.get(date) ?? { date, totalMinutes: 0, goalMinutes: 0, status: 'under' as const, logs: [] };
  });
  const momentum = momentumSeries(days);
  const momentumStrength = momentum.at(-1) ?? 0;
  const focus = activities.find((activity) => activity.id === dashboard?.todayLogs[0]?.activityId)
    ?? [...activities].sort((a, b) => (streaks.find((s) => s.activityId === b.id)?.currentStreak ?? 0) - (streaks.find((s) => s.activityId === a.id)?.currentStreak ?? 0))[0];
  const focusStreak = streaks.find((streak) => streak.activityId === focus?.id);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const loading = !preview && (dashboardQuery.isLoading || activitiesQuery.isLoading || calendarQuery.isLoading);
  const hasRefreshError = !preview && (dashboardQuery.isError || activitiesQuery.isError || calendarQuery.isError);
  const retry = () => Promise.all([dashboardQuery.refetch(), activitiesQuery.refetch(), streaksQuery.refetch(), calendarQuery.refetch()]);

  if (loading) return <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10"><Skeleton className="h-72 rounded-[2rem] bg-white/5" /><Skeleton className="h-[520px] rounded-[2rem] bg-white/5" /></div>;
  if (!dashboard) return <div className="mx-auto max-w-xl p-12 text-center text-white/50"><Radio className="mx-auto mb-4 h-9 w-9 text-red-400" /><h1 className="text-2xl text-white">Signal interrupted</h1><p className="mt-3 text-sm">Your work is still safe. Check the connection and retry the current state.</p><Button onClick={() => void retry()} className="mt-6 rounded-full bg-red-700"><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div>;
  if (!activities.length) return <div className="mx-auto max-w-xl p-12 text-center"><Target className="mx-auto mb-4 text-white/20" /><h1 className="text-3xl text-white">Choose your first direction</h1><p className="mt-3 text-white/35">Mastery begins when the first line is drawn.</p><Link href="/activities"><Button className="mt-7 bg-red-700"><Plus className="mr-2 h-4 w-4" />Add activity</Button></Link></div>;

  return (
    <div className={`relative z-10 min-h-screen ${light ? 'bg-[#ebe6dd] text-[#181719]' : ''}`}>
      <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-6 pb-28 md:px-9 md:py-9">
        {hasRefreshError && <div className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-sm ${light ? 'border-amber-900/20 bg-amber-100/60 text-amber-950' : 'border-amber-500/20 bg-amber-500/10 text-amber-100'}`}><span>Showing the last available state. New activity could not be refreshed.</span><button onClick={() => void retry()} className="shrink-0 text-[10px] font-bold uppercase tracking-widest underline underline-offset-4">Retry</button></div>}
        <header className={`relative overflow-hidden rounded-[2rem] border px-6 py-9 md:px-10 md:py-12 ${light ? 'border-black/10 bg-[#f3efe7]/75' : 'border-white/10 bg-black/25'} backdrop-blur-xl`}>
          <div className={`momentum-field absolute right-[-8%] top-[-55%] h-96 w-96 rounded-full blur-3xl ${light ? 'bg-[#b85c4b]' : 'bg-[#b64135]'}`} style={{ opacity: 0.06 + momentumStrength * (light ? 0.1 : 0.18), transform: `scale(${0.86 + momentumStrength * 0.28})` }} />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_.58fr]">
            <div>
              <div className={`mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.26em] ${light ? 'text-[#742c35]' : 'text-[#f08a78]'}`}><Radio className="h-3.5 w-3.5" /> {momentumStatus(momentum)}</div>
              <h1 className={`max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.045em] md:text-7xl ${light ? 'text-[#181719]' : 'text-white'}`}>{focus?.name}.<br /><span className={light ? 'text-black/30' : 'text-white/25'}>Continue the line.</span></h1>
              <p className={`mt-6 max-w-xl text-sm leading-7 ${light ? 'text-black/45' : 'text-white/40'}`}>Today holds {minutesLabel(dashboard.totalMinutesToday)} of deliberate effort. You touched {dashboard.activitiesTodayCompleted} {dashboard.activitiesTodayCompleted === 1 ? 'direction' : 'directions'}; nothing else is owed.</p>
              {focus && <Button onClick={() => setSelectedActivity(focus)} className="mt-8 rounded-full bg-red-700 px-7 py-6 text-[10px] font-bold uppercase tracking-[.16em] text-white shadow-[0_12px_36px_rgba(127,29,29,.25)] hover:bg-red-600"><Plus className="mr-2 h-4 w-4" />Continue {focus.name}</Button>}
            </div>
            <div className="flex items-center justify-center gap-7 lg:justify-end">
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-red-500/20 md:h-52 md:w-52"><span className="absolute inset-3 rounded-full border border-white/5" /><div className="text-center"><Flame className={`mx-auto mb-2 h-5 w-5 ${light ? 'text-[#8a313a]' : 'text-red-400'}`} /><p className={`text-6xl font-light ${light ? 'text-[#181719]' : 'text-white'}`}>{dashboard.overallCurrentStreak}</p><span className={`text-[8px] font-bold uppercase tracking-[.2em] ${light ? 'text-black/35' : 'text-white/25'}`}>days moving</span></div></div>
              <div className="hidden space-y-5 sm:block"><div><p className={`text-2xl font-light ${light ? 'text-[#181719]' : 'text-white'}`}>{focusStreak?.currentStreak ?? 0}</p><span className={`text-[8px] uppercase tracking-widest ${light ? 'text-black/30' : 'text-white/25'}`}>{focus?.name} streak</span></div><div><p className={`text-2xl font-light ${light ? 'text-[#181719]' : 'text-white'}`}>{dashboard.totalAchievements}</p><span className={`text-[8px] uppercase tracking-widest ${light ? 'text-black/30' : 'text-white/25'}`}>rewards earned</span></div></div>
            </div>
          </div>
        </header>

        <Timeline days={days} light={light} />

        <section className="grid gap-5 md:grid-cols-[1.2fr_.8fr]">
          <div className={`rounded-[2rem] p-7 md:p-9 ${light ? 'bg-[#ded7cc]/65' : 'bg-white/[.035]'}`}><div className="flex items-center justify-between"><div><p className={`text-[9px] font-bold uppercase tracking-[.25em] ${light ? 'text-black/35' : 'text-white/25'}`}>Current direction</p><h2 className={`mt-2 text-3xl font-semibold ${light ? 'text-[#181719]' : 'text-white'}`}>{focus?.name}</h2></div><Target className={light ? 'text-black/20' : 'text-white/15'} /></div><p className={`mt-6 max-w-md text-sm leading-6 ${light ? 'text-black/40' : 'text-white/35'}`}>The next session does not need to finish anything. It only needs to preserve continuity.</p></div>
          <Link href="/history" className={`group flex min-h-48 flex-col justify-between rounded-[2rem] border p-7 md:p-9 ${light ? 'border-black/10 bg-[#f3efe7]/60' : 'border-white/10 bg-black/20'} hover:-translate-y-0.5 hover:border-red-500/30`}><div className="flex justify-between"><Clock3 className={light ? 'text-[#742c35]' : 'text-red-400'} /><ArrowUpRight className={`transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 ${light ? 'text-black/25' : 'text-white/20'}`} /></div><div><p className={`text-2xl font-semibold ${light ? 'text-[#181719]' : 'text-white'}`}>Open the archive</p><p className={`mt-2 text-xs ${light ? 'text-black/35' : 'text-white/30'}`}>Composition, notes and long-term patterns live in History.</p></div></Link>
        </section>
      </div>
      {selectedActivity && <LogActivityDialog activity={selectedActivity} open onOpenChange={(open) => !open && setSelectedActivity(null)} />}
    </div>
  );
}
