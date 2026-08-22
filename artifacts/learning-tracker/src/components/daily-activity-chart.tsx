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
  color = "#dc2626",
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
  const maxSecondaryMinutes = Math.max(
    ...days.map((day) => day.secondaryMinutes ?? 0),
    1,
  );
  const hasActivity = days.some(
    (day) => day.minutes > 0 || (day.secondaryMinutes ?? 0) > 0,
  );
  const today = new Date();
  const isShortRange = days.length <= 7;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className={cn(isShortRange ? "max-w-[26rem]" : "min-w-[820px]")}>
          {isShortRange ? (
            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[9px] font-bold uppercase tracking-[.12em] text-white/30">
              {days.map((day) => (
                <span key={day.date}>{format(parseISO(day.date), "EEE")}</span>
              ))}
            </div>
          ) : (
            <div className="mb-3 ml-10 grid grid-flow-col grid-rows-1 gap-2 text-[9px] font-bold uppercase tracking-[.16em] text-white/30">
              {days
                .filter((_, index) => index % 7 === 0)
                .map((day) => (
                  <span key={day.date}>
                    {format(parseISO(day.date), "MMM")}
                  </span>
                ))}
            </div>
          )}
          <div className="flex gap-2.5">
            {!isShortRange && (
              <div className="grid grid-rows-7 gap-2 pr-1 text-[9px] font-bold uppercase text-white/30">
                {["M", "", "W", "", "F", "", "S"].map((label, index) => (
                  <span key={index} className="flex h-8 items-center">
                    {label}
                  </span>
                ))}
              </div>
            )}
            <div
              className={cn(
                "grid flex-1 gap-2",
                isShortRange
                  ? "grid-cols-7 grid-rows-1"
                  : "grid-flow-col grid-rows-7",
              )}
            >
              {days.map((day, index) => {
                const parsedDate = parseISO(day.date);
                const isFuture = isAfter(parsedDate, today);
                const hasEffort = day.minutes > 0;
                const secondaryMinutes = day.secondaryMinutes ?? 0;
                const hasSecondaryEffort = secondaryMinutes > 0;
                const hasSignal = hasEffort || hasSecondaryEffort;
                const intensity = hasEffort
                  ? 0.3 + 0.7 * Math.sqrt(day.minutes / maxMinutes)
                  : 0;
                const secondaryIntensity = hasSecondaryEffort
                  ? 0.3 +
                    0.7 * Math.sqrt(secondaryMinutes / maxSecondaryMinutes)
                  : 0;
                const signalIntensity = Math.max(intensity, secondaryIntensity);
                const thresholdIndex = intensityThresholds.findIndex(
                  (threshold) => day.minutes <= threshold,
                );
                const scaleIndex = !hasEffort
                  ? 0
                  : thresholdIndex === -1
                    ? intensityThresholds.length + 1
                    : thresholdIndex + 1;
                const cellColor = colorScale?.[scaleIndex] ?? color;
                const ornamentOpacity =
                  hasSignal && ornamentSrc
                    ? Math.min(0.62, 0.16 + signalIntensity * 0.46)
                    : 0;
                const ornamentPosition = `${(index * 19) % 100}% ${(index * 31) % 100}%`;

                return (
                  <button
                    type="button"
                    key={day.date}
                    title={`${format(parsedDate, "MMMM d, yyyy")} · ${day.minutes > 0 ? `${day.minutes} min practice` : "no practice"}${hasSecondaryEffort ? ` · ${secondaryMinutes} min sport` : ""}`}
                    aria-label={`${format(parsedDate, "MMMM d, yyyy")}: ${day.minutes} practice minutes${hasSecondaryEffort ? ` and ${secondaryMinutes} sport minutes` : ""}`}
                    className={cn(
                      "group relative flex items-start justify-start overflow-hidden rounded-[9px] border px-1.5 pt-1 transition-[transform,box-shadow,border-color] duration-200 hover:z-10 hover:scale-[1.08] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc268] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f14]",
                      isShortRange ? "aspect-square min-w-0" : "h-8 min-w-8",
                      isSameDay(parsedDate, today) &&
                        "ring-1 ring-[#ffc268]/85 ring-offset-2 ring-offset-[#0f0f14]",
                      selectedDate === day.date &&
                        "scale-[1.08] border-white/80 ring-2 ring-white/75 ring-offset-2 ring-offset-[#0f0f14]",
                    )}
                    onClick={() => onSelectDate?.(day.date)}
                    style={{
                      backgroundColor:
                        hasSignal && ornamentSrc
                          ? "rgba(242,246,250,0.88)"
                          : hasEffort
                            ? colorScale
                              ? cellColor
                              : color
                            : "rgba(255,255,255,0.018)",
                      borderColor:
                        hasSignal && ornamentSrc
                          ? "rgba(255,255,255,0.42)"
                          : hasEffort
                            ? colorScale
                              ? cellColor
                              : color
                            : "rgba(255,255,255,0.04)",
                      opacity: isFuture
                        ? 0.16
                        : hasSignal && ornamentSrc
                          ? 1
                          : hasEffort
                            ? colorScale
                              ? 1
                              : intensity
                            : 0.55,
                      boxShadow:
                        hasSignal && ornamentSrc
                          ? `0 0 ${Math.round(8 + 8 * signalIntensity)}px rgba(220,230,238,.22)`
                          : hasEffort
                            ? `0 0 ${Math.round(10 * intensity)}px ${cellColor}55`
                            : hasSecondaryEffort
                              ? `0 0 8px ${secondaryColor}40`
                              : "none",
                    }}
                  >
                    {hasSignal && ornamentSrc && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat mix-blend-multiply"
                        style={{
                          backgroundImage: `url(${ornamentSrc})`,
                          backgroundPosition: ornamentPosition,
                          filter:
                            "grayscale(1) brightness(0.26) contrast(1.35)",
                          opacity: ornamentOpacity,
                        }}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={`relative z-10 text-[8px] font-bold tabular-nums transition-colors group-hover:text-white ${ornamentSrc && hasSignal ? "text-[#101822]/72" : "text-white/55"}`}
                    >
                      {format(parsedDate, "d")}
                    </span>
                    {hasEffort && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-x-1.5 bottom-1 h-[3px] rounded-full",
                          ornamentSrc ? "bg-[#ff7868]/80" : "bg-white/45",
                        )}
                        style={{
                          opacity: Math.min(0.9, 0.28 + intensity * 0.72),
                        }}
                      />
                    )}
                    {hasSecondaryEffort && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-1.5 bottom-1 h-1 rounded-full"
                        style={{
                          width: `${Math.max(22, (secondaryMinutes / maxSecondaryMinutes) * 100)}%`,
                          backgroundColor: secondaryColor,
                          boxShadow: `0 0 7px ${secondaryColor}bb`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-wider text-white/36">
        <span>
          {hasActivity
            ? "One tile, one day · select to open its return"
            : emptyLabel}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span>Less</span>
          {(colorScale ?? [0, 0.3, 0.5, 0.72, 1]).map((value, index) => (
            <span
              key={index}
              className="h-4 w-4 rounded-[5px] border"
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
        <span className="hidden items-center gap-1.5 sm:flex">
          <span
            className="h-px w-4 rounded-full"
            style={{ backgroundColor: secondaryColor }}
          />
          Sport edge
        </span>
      </div>
    </div>
  );
}
