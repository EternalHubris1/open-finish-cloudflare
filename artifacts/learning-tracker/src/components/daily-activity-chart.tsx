import { format, isAfter, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export interface DailyActivityPoint {
  date: string;
  minutes: number;
  secondaryMinutes?: number;
}

interface DailyActivityChartProps {
  days: DailyActivityPoint[];
  color?: string;
  colorScale?: string[];
  secondaryColor?: string;
  ornamentSrc?: string;
  intensityThresholds?: number[];
  emptyLabel?: string;
  className?: string;
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
}

export function DailyActivityChart({
  days,
  color = "#b97667",
  colorScale,
  secondaryColor = "#62bca8",
  ornamentSrc,
  intensityThresholds = [30, 90, 180],
  emptyLabel = "No activity recorded in this period",
  className,
  selectedDate,
  onSelectDate,
}: DailyActivityChartProps) {
  const maxMinutes = Math.max(...days.map((day) => day.minutes), 1);
  const maxSecondary = Math.max(
    ...days.map((day) => day.secondaryMinutes ?? 0),
    1,
  );
  const hasActivity = days.some(
    (day) => day.minutes > 0 || (day.secondaryMinutes ?? 0) > 0,
  );
  const today = new Date();
  const shortRange = days.length <= 7;
  // Blank slots preserve actual weekday rows when a month starts midweek.
  const offset =
    !shortRange && days.length ? (parseISO(days[0].date).getDay() + 6) % 7 : 0;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="overflow-x-auto px-1 py-2 scrollbar-thin">
        <div className="flex w-max gap-2">
          {!shortRange && (
            <div
              className="grid grid-rows-7 gap-2 pr-1 text-[10px] text-white/55"
              aria-hidden="true"
            >
              {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex items-center",
                    ornamentSrc ? "h-9 sm:h-10" : "h-8",
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          <div
            className={cn(
              "grid gap-2",
              "grid-flow-col",
              ornamentSrc
                ? "auto-cols-[2.25rem] sm:auto-cols-[2.5rem]"
                : "auto-cols-[2rem]",
              shortRange ? "grid-rows-1" : "grid-rows-7",
            )}
          >
            {Array.from({ length: offset }, (_, i) => (
              <span key={`offset-${i}`} aria-hidden="true" />
            ))}
            {days.map((day, index) => {
              const date = parseISO(day.date);
              const future = isAfter(date, today);
              const sport = day.secondaryMinutes ?? 0;
              const intensity =
                day.minutes > 0 ? Math.sqrt(day.minutes / maxMinutes) : 0;
              const hasSignal = day.minutes > 0 || sport > 0;
              const threshold = intensityThresholds.findIndex(
                (limit) => day.minutes <= limit,
              );
              const scaleIndex =
                day.minutes <= 0
                  ? 0
                  : threshold < 0
                    ? intensityThresholds.length + 1
                    : threshold + 1;
              const cellColor = colorScale?.[scaleIndex] ?? color;
              const label = `${format(date, "MMMM d, yyyy")}: ${day.minutes} practice minutes and ${sport} sport minutes`;
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={future || !onSelectDate}
                  aria-label={label}
                  title={label}
                  aria-pressed={
                    onSelectDate ? selectedDate === day.date : undefined
                  }
                  aria-current={isSameDay(date, today) ? "date" : undefined}
                  onClick={() => onSelectDate?.(day.date)}
                  className={cn(
                    "relative overflow-hidden rounded-[7px] border text-[10px] font-semibold tabular-nums text-white/85 transition-[box-shadow,border-color] hover:shadow-[0_0_14px_rgba(230,207,181,.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c9b9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1119] motion-reduce:transition-none",
                    ornamentSrc ? "h-9 w-9 sm:h-10 sm:w-10" : "h-8 w-8",
                    ornamentSrc &&
                      hasSignal &&
                      "shadow-[inset_0_1px_0_rgba(255,255,255,.65),0_2px_7px_rgba(0,0,0,.18)]",
                    selectedDate === day.date
                      ? "ring-2 ring-[#e7c9b9] ring-offset-2 ring-offset-[#0c1119]"
                      : isSameDay(date, today)
                        ? "ring-1 ring-white/40"
                        : "",
                    future && "opacity-25",
                  )}
                  style={{
                    backgroundColor: ornamentSrc
                      ? `rgba(244,237,229,${hasSignal ? 0.65 + intensity * 0.28 : 0.035})`
                      : day.minutes > 0
                        ? cellColor
                        : "rgba(255,255,255,.04)",
                    borderColor:
                      selectedDate === day.date
                        ? "#e7c9b9"
                        : ornamentSrc && hasSignal
                          ? "rgba(246,226,203,.55)"
                          : "rgba(244,237,229,.16)",
                  }}
                >
                  {ornamentSrc && hasSignal && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-no-repeat mix-blend-multiply"
                      style={{
                        backgroundImage: `url(${ornamentSrc})`,
                        backgroundSize: "210% auto",
                        backgroundPosition: [
                          "45% 17%",
                          "70% 27%",
                          "35% 60%",
                          "50% 82%",
                        ][index % 4],
                        opacity: 0.78 + intensity * 0.2,
                      }}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={
                      ornamentSrc && hasSignal
                        ? "absolute left-1 top-1 z-10 rounded-[3px] bg-[#faf4e9]/90 px-1 text-[9px] leading-[13px] text-[#392824]"
                        : "relative z-10"
                    }
                  >
                    {format(date, "d")}
                  </span>
                  {day.minutes > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-[5px] left-1 h-[2px] rounded-full"
                      style={{
                        width: `${Math.max(12, intensity * 72)}%`,
                        backgroundColor: ornamentSrc
                          ? "#7e332f"
                          : "rgba(255,255,255,.7)",
                      }}
                    />
                  )}
                  {sport > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-[2px] left-1 h-[2px] rounded-full"
                      style={{
                        width: `${Math.max(12, (sport / maxSecondary) * 72)}%`,
                        backgroundColor:
                          ornamentSrc && hasSignal ? "#286858" : secondaryColor,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {!hasActivity && (
        <p className="mt-3 text-xs text-white/55">{emptyLabel}</p>
      )}
    </div>
  );
}
