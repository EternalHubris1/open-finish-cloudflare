import { format, isAfter, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export interface DailyActivityPoint {
  date: string;
  minutes: number;
}

interface DailyActivityChartProps {
  days: DailyActivityPoint[];
  color?: string;
  colorScale?: string[];
  intensityThresholds?: number[];
  emptyLabel?: string;
  className?: string;
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
}

export function DailyActivityChart({
  days,
  color = "#dc2626",
  colorScale,
  intensityThresholds = [30, 90, 180],
  emptyLabel = "No activity recorded in this period",
  className,
  selectedDate,
  onSelectDate,
}: DailyActivityChartProps) {
  const maxMinutes = Math.max(...days.map((day) => day.minutes), 1);
  const hasActivity = days.some((day) => day.minutes > 0);
  const today = new Date();

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[720px]">
          <div className="mb-2 ml-9 grid grid-flow-col grid-rows-1 gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white/25">
            {days
              .filter((_, index) => index % 7 === 0)
              .map((day) => (
                <span key={day.date}>{format(parseISO(day.date), "MMM")}</span>
              ))}
          </div>
          <div className="flex gap-2">
            <div className="grid grid-rows-7 gap-1.5 pr-1 text-[9px] font-bold uppercase text-white/25">
              {["M", "", "W", "", "F", "", "S"].map((label, index) => (
                <span key={index} className="flex h-5 items-center">
                  {label}
                </span>
              ))}
            </div>
            <div className="grid flex-1 grid-flow-col grid-rows-7 gap-1.5">
              {days.map((day) => {
                const parsedDate = parseISO(day.date);
                const isFuture = isAfter(parsedDate, today);
                const hasEffort = day.minutes > 0;
                const intensity = hasEffort
                  ? 0.3 + 0.7 * Math.sqrt(day.minutes / maxMinutes)
                  : 0;
                const thresholdIndex = intensityThresholds.findIndex(
                  (threshold) => day.minutes <= threshold,
                );
                const scaleIndex = !hasEffort
                  ? 0
                  : thresholdIndex === -1
                    ? intensityThresholds.length + 1
                    : thresholdIndex + 1;
                const cellColor = colorScale?.[scaleIndex] ?? color;

                return (
                  <button
                    type="button"
                    key={day.date}
                    title={`${format(parsedDate, "MMMM d, yyyy")} · ${day.minutes > 0 ? `${day.minutes} min` : "no activity"}`}
                    aria-label={`${format(parsedDate, "MMMM d, yyyy")}: ${day.minutes} minutes`}
                    className={cn(
                      "h-5 min-w-5 rounded-[6px] border transition-all duration-200 hover:z-10 hover:scale-125",
                      isSameDay(parsedDate, today) &&
                        "ring-1 ring-white/80 ring-offset-2 ring-offset-[#0f0f14]",
                      selectedDate === day.date &&
                        "outline outline-2 outline-offset-2 outline-white",
                    )}
                    onClick={() => onSelectDate?.(day.date)}
                    style={{
                      backgroundColor: hasEffort
                        ? colorScale
                          ? cellColor
                          : color
                        : "rgba(255,255,255,0.018)",
                      borderColor: hasEffort
                        ? colorScale
                          ? cellColor
                          : color
                        : "rgba(255,255,255,0.04)",
                      opacity: isFuture
                        ? 0.16
                        : hasEffort
                          ? colorScale
                            ? 1
                            : intensity
                          : 0.55,
                      boxShadow: hasEffort
                        ? `0 0 ${Math.round(10 * intensity)}px ${cellColor}55`
                        : "none",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-wider text-white/30">
        <span>{hasActivity ? "Every square is one day" : emptyLabel}</span>
        <div className="flex shrink-0 items-center gap-2">
          <span>Less</span>
          {(colorScale ?? [0, 0.3, 0.5, 0.72, 1]).map((value, index) => (
            <span
              key={index}
              className="h-3 w-3 rounded-[4px] border"
              style={{
                backgroundColor:
                  index === 0
                    ? "rgba(255,255,255,0.018)"
                    : typeof value === "string"
                      ? value
                      : color,
                borderColor:
                  index === 0
                    ? "rgba(255,255,255,0.04)"
                    : typeof value === "string"
                      ? value
                      : color,
                opacity:
                  index === 0
                    ? 0.55
                    : typeof value === "number"
                      ? value || 1
                      : 1,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
