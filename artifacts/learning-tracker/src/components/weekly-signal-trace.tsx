import { useMemo, useState, type CSSProperties } from "react";
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type SignalDay = {
  date: string;
  volume: number;
  sessions: number;
  longest: number;
};

type SignalSlice = "volume" | "sessions" | "longest";

interface Props {
  days: SignalDay[];
  slice: SignalSlice;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const labelValue = (value: number, slice: SignalSlice) => {
  if (slice === "sessions")
    return `${value} ${value === 1 ? "return" : "returns"}`;
  if (value < 60) return `${value}m`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h${minutes ? ` ${minutes}m` : ""}`;
};

export function WeeklySignalTrace({
  days,
  slice,
  selectedDate,
  onSelectDate,
}: Props) {
  const weeks = useMemo(() => {
    const groups = new Map<string, SignalDay[]>();
    days.forEach((day) => {
      const weekStart = format(
        startOfWeek(parseISO(day.date), { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );
      groups.set(weekStart, [...(groups.get(weekStart) ?? []), day]);
    });
    return [...groups.entries()].map(([weekStart, weekDays], index, all) => {
      const value =
        slice === "longest"
          ? Math.max(0, ...weekDays.map((day) => day.longest))
          : weekDays.reduce((sum, day) => sum + day[slice], 0);
      const previousDays = index ? all[index - 1][1] : [];
      const previous =
        slice === "longest"
          ? Math.max(0, ...previousDays.map((day) => day.longest))
          : previousDays.reduce((sum, day) => sum + day[slice], 0);
      return {
        weekStart,
        days: weekDays,
        value,
        delta: index ? value - previous : null,
      };
    });
  }, [days, slice]);

  const selectedWeekIndex = Math.max(
    0,
    weeks.findIndex((week) =>
      week.days.some((day) => day.date === selectedDate),
    ),
  );
  const [manualWeek, setManualWeek] = useState<number | null>(null);
  const activeWeekIndex = manualWeek ?? selectedWeekIndex;
  const activeWeek = weeks[activeWeekIndex] ?? weeks[0];
  const maximum = Math.max(1, ...weeks.map((week) => week.value));
  const chartWidth = Math.max(620, weeks.length * 118);
  const point = (week: (typeof weeks)[number], index: number) => ({
    x:
      weeks.length === 1
        ? chartWidth / 2
        : 42 + (index * (chartWidth - 84)) / (weeks.length - 1),
    y: 32 + (1 - week.value / maximum) * 128,
  });
  const polyline = weeks
    .map((week, index) => {
      const p = point(week, index);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  if (!weeks.length) {
    return <div className="weekly-trace__empty">No weekly signal yet.</div>;
  }

  return (
    <div className="weekly-trace">
      <div className="weekly-trace__readout">
        <div>
          <span className="instrument-label">Weekly signal trace</span>
          <p>
            Weekly {slice === "volume" ? "effort" : slice}. Select a node, then
            open one of its recorded days.
          </p>
        </div>
        <span className="instrument-badge">{weeks.length} weekly nodes</span>
      </div>

      <div
        className="weekly-trace__scroll"
        role="region"
        aria-label="Weekly activity change; scroll horizontally for more weeks"
        tabIndex={0}
      >
        <div className="weekly-trace__plot" style={{ width: chartWidth }}>
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${chartWidth} 205`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="weekly-trace-fill"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#ff8b7c" stopOpacity=".26" />
                <stop offset="100%" stopColor="#ff8b7c" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              className="weekly-trace__grid"
              d={`M0 32H${chartWidth} M0 96H${chartWidth} M0 160H${chartWidth}`}
            />
            {weeks.length > 1 && (
              <polygon
                points={`42,184 ${polyline} ${chartWidth - 42},184`}
                fill="url(#weekly-trace-fill)"
              />
            )}
            <polyline className="weekly-trace__line-glow" points={polyline} />
            <polyline className="weekly-trace__line" points={polyline} />
          </svg>
          {weeks.map((week, index) => {
            const p = point(week, index);
            const active = index === activeWeekIndex;
            const DeltaIcon =
              week.delta === null
                ? Minus
                : week.delta >= 0
                  ? ArrowUpRight
                  : ArrowDownRight;
            return (
              <button
                aria-label={`Week of ${format(parseISO(week.weekStart), "MMMM d")}: ${labelValue(week.value, slice)}${week.delta === null ? "" : `, change ${week.delta >= 0 ? "plus" : "minus"} ${labelValue(Math.abs(week.delta), slice)}`}`}
                aria-pressed={active}
                className="weekly-trace__node"
                key={week.weekStart}
                onClick={() => setManualWeek(index)}
                style={{ left: p.x, top: p.y } as CSSProperties}
                type="button"
              >
                <span className="weekly-trace__point" />
                <strong>{labelValue(week.value, slice)}</strong>
                <small>
                  {week.delta === null ? (
                    "baseline"
                  ) : (
                    <>
                      <DeltaIcon aria-hidden="true" />
                      {week.delta > 0 ? "+" : "−"}
                      {labelValue(Math.abs(week.delta), slice)}
                    </>
                  )}
                </small>
                <em>{format(parseISO(week.weekStart), "d MMM")}</em>
              </button>
            );
          })}
        </div>
      </div>

      {activeWeek && (
        <div className="weekly-trace__days">
          <div>
            <span className="instrument-label">Week detail</span>
            <strong>
              {format(parseISO(activeWeek.weekStart), "d MMM")} —{" "}
              {format(
                parseISO(activeWeek.days.at(-1)?.date ?? activeWeek.weekStart),
                "d MMM",
              )}
            </strong>
          </div>
          <div
            className="weekly-trace__day-list"
            role="group"
            aria-label="Recorded days in selected week"
          >
            {activeWeek.days.map((day) => (
              <button
                aria-pressed={selectedDate === day.date}
                disabled={day[slice] <= 0}
                key={day.date}
                onClick={() => onSelectDate(day.date)}
                type="button"
              >
                <span>{format(parseISO(day.date), "EEE")}</span>
                <strong>{labelValue(day[slice], slice)}</strong>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
