import { useMemo, useState } from 'react';
import { getGetCalendarQueryKey, useGetCalendar } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, BarChart3, RefreshCw, Sparkles } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addDays,
  subWeeks,
} from 'date-fns';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { CalendarDay } from '@workspace/api-client-react';
import { DailyActivityChart } from '@/components/daily-activity-chart';

const ACTIVITY_COLOR = '#dc2626';

export default function History() {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const startStr = format(gridStart, 'yyyy-MM-dd');
  const endStr = format(gridEnd, 'yyyy-MM-dd');

  const monthQuery = useGetCalendar(
    { start: startStr, end: endStr },
    { query: { queryKey: ['calendar', startStr, endStr] as any } }
  );
  const calendarDays = monthQuery.data ?? [];

  const overviewStart = useMemo(
    () => startOfWeek(subWeeks(new Date(), 11), { weekStartsOn: 1 }),
    [],
  );
  const overviewEnd = useMemo(() => addDays(overviewStart, 83), [overviewStart]);
  const overviewStartStr = format(overviewStart, 'yyyy-MM-dd');
  const overviewEndStr = format(overviewEnd, 'yyyy-MM-dd');
  const overviewQuery = useGetCalendar(
    { start: overviewStartStr, end: overviewEndStr },
    { query: { queryKey: getGetCalendarQueryKey({ start: overviewStartStr, end: overviewEndStr }) } },
  );
  const overviewDays = overviewQuery.data ?? [];
  const overviewMap = useMemo(
    () => new Map(overviewDays.map((day) => [day.date, day.totalMinutes])),
    [overviewDays],
  );
  const overviewChartDays = useMemo(
    () => Array.from({ length: 84 }, (_, index) => {
      const date = format(addDays(overviewStart, index), 'yyyy-MM-dd');
      return { date, minutes: overviewMap.get(date) ?? 0 };
    }),
    [overviewMap, overviewStart],
  );
  const overviewActiveDays = overviewChartDays.filter((day) => day.minutes > 0).length;
  const overviewMinutes = overviewChartDays.reduce((sum, day) => sum + day.minutes, 0);

  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    calendarDays.forEach((d) => map.set(d.date, d));
    return map;
  }, [calendarDays]);

  const gridDays = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  const chartData = useMemo(() => {
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return monthDays.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const entry = dayMap.get(dateStr);
      return {
        date: dateStr,
        label: format(d, 'd'),
        totalMinutes: entry?.totalMinutes ?? 0,
      };
    });
  }, [dayMap, monthStart, monthEnd]);

  const selectedDay = selectedDate ? dayMap.get(selectedDate) : undefined;

  if (monthQuery.isLoading || overviewQuery.isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-3xl bg-white/5" />
        <Skeleton className="h-96 rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (monthQuery.isError || overviewQuery.isError) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 text-center">
        <div className="w-full rounded-3xl border border-red-500/20 bg-red-950/20 p-10">
          <CalendarDays className="mx-auto mb-4 h-10 w-10 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">Couldn’t load activity history</h1>
          <p className="mb-6 text-sm text-white/50">Your entries are still saved. Check the connection and try again.</p>
          <Button
            onClick={() => Promise.all([monthQuery.refetch(), overviewQuery.refetch()])}
            className="gap-2 rounded-2xl bg-red-600 text-white hover:bg-red-500"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:p-8 space-y-10 animate-slide-up max-w-6xl mx-auto relative z-10 pb-28 md:pb-20">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">History</h1>
          <p className="text-red-400/80 font-bold uppercase tracking-widest text-[10px]">
            Every day you moved something forward
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[rgba(15,15,20,0.88)] shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-5 border-b border-white/5 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-red-400">
              <Sparkles className="h-4 w-4" /> Your rhythm
            </div>
            <h2 className="text-2xl font-bold text-white">Activity by day</h2>
            <p className="mt-2 text-sm text-white/40">One active day means you moved at least one activity forward.</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-center">
              <p className="text-2xl font-bold text-white">{overviewActiveDays}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">active days</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-center">
              <p className="text-2xl font-bold text-white">{Math.round(overviewMinutes / 60)}h</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">logged</p>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <DailyActivityChart days={overviewChartDays} />
        </div>
      </section>

      {/* Calendar */}
      <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-red-500" />
            <h2 className="text-2xl font-bold text-white tracking-wide">{format(month, 'MMMM yyyy')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-xl text-white/70 hover:text-white h-10 w-10 p-0"
              onClick={() => {
                setMonth((m) => subMonths(m, 1));
                setSelectedDate(null);
              }}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-xl text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-widest px-4"
              onClick={() => {
                setMonth(new Date());
                setSelectedDate(null);
              }}
              data-testid="button-today"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-xl text-white/70 hover:text-white h-10 w-10 p-0"
              onClick={() => {
                setMonth((m) => addMonths(m, 1));
                setSelectedDate(null);
              }}
              data-testid="button-next-month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-3">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold uppercase tracking-widest text-white/30 pb-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {gridDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = dayMap.get(dateStr);
            const inMonth = isSameMonth(day, month);
            const selected = selectedDate === dateStr;
            const color = entry ? ACTIVITY_COLOR : null;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={!entry}
                onClick={() => setSelectedDate(selected ? null : dateStr)}
                className="aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 disabled:cursor-default"
                style={{
                  backgroundColor: color ? `${color}26` : 'rgba(255,255,255,0.02)',
                  borderColor: selected ? '#ffffff' : color ? `${color}66` : 'rgba(255,255,255,0.05)',
                  borderWidth: selected ? '2px' : '1px',
                  opacity: inMonth ? 1 : 0.3,
                  boxShadow: selected && color ? `0 0 20px ${color}66` : 'none',
                }}
                data-testid={`calendar-day-${dateStr}`}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: color ?? 'rgba(255,255,255,0.4)' }}
                >
                  {format(day, 'd')}
                </span>
                {entry && (
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: color ?? undefined }}>
                    {entry.totalMinutes}m
                  </span>
                )}
                {isToday(day) && (
                  <span className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      {selectedDay && (
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-6">
            <div>
              <h3 className="text-xl font-bold text-white tracking-wide">
                {format(new Date(selectedDay.date), 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="text-[10px] uppercase tracking-widest font-bold mt-1 text-red-400">
                {selectedDay.logs.length} {selectedDay.logs.length === 1 ? 'session' : 'sessions'} &middot; {selectedDay.totalMinutes} min
              </p>
            </div>
            <div
              className="px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest bg-red-500/10 text-red-400"
            >
              {selectedDay.totalMinutes}m logged
            </div>
          </div>

          <div className="space-y-4">
            {selectedDay.logs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl p-5 border border-white/10 bg-white/[0.02] flex items-start gap-4"
                data-testid={`history-log-${log.id}`}
              >
                <div className="w-1.5 self-stretch rounded-full" style={{ backgroundColor: log.activityColor }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white tracking-wide">{log.activityName}</span>
                    <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: log.activityColor }}>
                      <Clock className="w-3.5 h-3.5" />
                      {log.durationMinutes} min
                    </div>
                  </div>
                  {log.notes ? (
                    <p className="text-sm text-white/50 italic mt-2 leading-relaxed">"{log.notes}"</p>
                  ) : (
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-white/25 mt-2">No notes</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-5 h-5 text-red-500" />
          <h2 className="text-2xl font-bold text-white tracking-wide">Duration Over Time</h2>
        </div>
        {chartData.every((d) => d.totalMinutes === 0) ? (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40">No activity logged this month</p>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    color: '#fff',
                  }}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.date ? format(new Date(payload[0].payload.date), 'MMMM d, yyyy') : ''
                  }
                  formatter={(value: number) => [`${value} min`, value > 0 ? 'Activity' : 'No activity']}
                />
                <Bar dataKey="totalMinutes" radius={[8, 8, 0, 0]} maxBarSize={28}>
                  {chartData.map((d) => (
                    <Cell
                      key={d.date}
                      fill={d.totalMinutes > 0 ? ACTIVITY_COLOR : 'rgba(255,255,255,0.08)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
