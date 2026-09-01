import { useMemo, useRef, useState, type CSSProperties } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ArrowRight, Check, Crosshair } from "lucide-react";
import type { CalendarDay } from "@workspace/api-client-react";
import { buildHistoryComposition } from "@/lib/history-composition";

interface Props {
  calendar: CalendarDay[];
  dates: string[];
  metric: "practice" | "sport" | "combined";
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const minutesLabel = (value: number) =>
  value < 60
    ? `${value}m`
    : `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60}m` : ""}`;

export function HistoryCompositionChart({
  calendar,
  dates,
  metric,
  selectedDate,
  onSelectDate,
}: Props) {
  const { channels, days } = useMemo(
    () => buildHistoryComposition(calendar, dates),
    [calendar, dates],
  );
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const dayButtons = useRef(new Map<string, HTMLButtonElement>());
  const mainType = metric === "sport" ? "sport" : "practice";
  const visibleChannels = channels.filter(
    (c) => metric === "combined" || c.type === mainType,
  );
  const highlight = visibleChannels.find((c) => c.id === highlightId);
  const maximum = Math.max(
    60,
    Math.ceil(Math.max(0, ...days.map((d) => d[mainType])) / 60) * 60,
  );
  const sportMaximum = Math.max(1, ...days.map((d) => d.sport));
  const selectedIndex = days.findIndex((d) => d.date === selectedDate);
  const selectedDay = days[selectedIndex];
  const selectedSegments =
    selectedDay?.segments.filter(
      (s) => s.minutes > 0 && (metric === "combined" || s.type === mainType),
    ) ?? [];
  const selectAdjacent = (delta: number, focus = false) => {
    const target =
      days[Math.max(0, Math.min(days.length - 1, selectedIndex + delta))];
    if (!target) return;
    onSelectDate(target.date);
    if (focus) dayButtons.current.get(target.date)?.focus();
  };

  return (
    <div className="composition-chart">
      <div className="composition-chart__readout">
        <div>
          <span className="instrument-label">
            {mainType} / daily composition
          </span>
          <p className="mt-2 text-sm text-white/65">
            One column, one day. Each segment is a direction.
          </p>
        </div>
        <span className="instrument-badge">
          {days.length} days · {visibleChannels.length} directions
        </span>
      </div>

      <div
        className="composition-chart__legend"
        role="group"
        aria-label="Highlight an activity"
      >
        <button
          type="button"
          aria-pressed={!highlight}
          onClick={() => setHighlightId(null)}
        >
          All directions
        </button>
        {visibleChannels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            aria-pressed={highlight?.id === channel.id}
            onClick={() =>
              setHighlightId(highlight?.id === channel.id ? null : channel.id)
            }
          >
            <span
              className="composition-chart__swatch"
              style={{ background: channel.color }}
              aria-hidden="true"
            />
            <span>
              {channel.name}
              <span className="composition-chart__domain">
                {" "}
                · {channel.type}
              </span>
            </span>
            {highlight?.id === channel.id && (
              <Check size={12} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs text-white/55" aria-live="polite">
        {highlight
          ? `${highlight.name} highlighted. Other directions remain visible; the scale is unchanged.`
          : "Select a column to pin its day. Arrow keys move between days."}
      </p>

      {!visibleChannels.length ? (
        <div className="composition-chart__empty">
          No {metric === "combined" ? "practice or sport" : mainType} recorded
          in this period. Your next session will appear here.
        </div>
      ) : (
        <div className="composition-chart__plot-wrap">
          <div className="composition-chart__axis" aria-hidden="true">
            {[maximum, maximum * 0.75, maximum * 0.5, maximum * 0.25, 0].map(
              (value) => (
                <span key={value}>{minutesLabel(value)}</span>
              ),
            )}
          </div>
          <div
            className="composition-chart__scroll"
            role="region"
            aria-label="Daily composition columns; scroll horizontally for more days"
            tabIndex={0}
          >
            <div
              className="composition-chart__columns"
              style={{ "--day-count": days.length } as CSSProperties}
            >
              {days.map((day) => {
                const segments = day.segments.filter(
                  (s) => s.type === mainType && s.minutes > 0,
                );
                const isSelected = selectedDate === day.date;
                return (
                  <button
                    key={day.date}
                    type="button"
                    className="composition-chart__day"
                    aria-pressed={isSelected}
                    ref={(node) => {
                      if (node) dayButtons.current.set(day.date, node);
                      else dayButtons.current.delete(day.date);
                    }}
                    aria-label={`Inspect ${format(parseISO(day.date), "MMMM d, yyyy")}: ${day.practice} practice minutes, ${day.sport} sport minutes`}
                    onClick={() => onSelectDate(day.date)}
                    onKeyDown={(event) => {
                      if (
                        event.key !== "ArrowLeft" &&
                        event.key !== "ArrowRight"
                      )
                        return;
                      event.preventDefault();
                      const index = days.findIndex((d) => d.date === day.date);
                      const target =
                        days[
                          Math.max(
                            0,
                            Math.min(
                              days.length - 1,
                              index + (event.key === "ArrowRight" ? 1 : -1),
                            ),
                          )
                        ];
                      onSelectDate(target.date);
                      dayButtons.current.get(target.date)?.focus();
                    }}
                  >
                    <span
                      className="composition-chart__bar-zone"
                      aria-hidden="true"
                    >
                      <span
                        className="composition-chart__stack"
                        style={{
                          height: `${(day[mainType] / maximum) * 100}%`,
                        }}
                      >
                        {segments.map((segment) => (
                          <span
                            key={segment.id}
                            className="composition-chart__segment"
                            style={{
                              height: `${(segment.minutes / day[mainType]) * 100}%`,
                              backgroundColor: segment.color,
                              opacity:
                                !highlight || highlight.id === segment.id
                                  ? 1
                                  : 0.2,
                            }}
                          />
                        ))}
                      </span>
                      {!day[mainType] && (
                        <span className="composition-chart__zero" />
                      )}
                    </span>
                    <span
                      className="composition-chart__date"
                      aria-hidden="true"
                    >
                      {format(parseISO(day.date), "d")}
                      <small>{format(parseISO(day.date), "MMM")}</small>
                    </span>
                    {metric === "combined" && (
                      <span
                        className="composition-chart__sport"
                        aria-hidden="true"
                      >
                        <span
                          style={{
                            width: `${(day.sport / sportMaximum) * 100}%`,
                            opacity:
                              !highlight || highlight.type === "sport"
                                ? 1
                                : 0.25,
                          }}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {metric === "combined" && visibleChannels.length > 0 && (
        <p className="composition-chart__sport-label">
          <span /> Sport beneath each day · separate scale, max{" "}
          {minutesLabel(sportMaximum)}
        </p>
      )}

      <div className="composition-chart__inspector">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-white/90">
            <Crosshair
              size={16}
              className="text-[#9edcd4]"
              aria-hidden="true"
            />
            <span aria-live="polite" aria-atomic="true">
              {selectedDay
                ? format(parseISO(selectedDay.date), "EEEE, d MMM")
                : "Select a day"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              className="instrument-arrow"
              type="button"
              aria-label="Previous chart day"
              disabled={selectedIndex <= 0}
              onClick={() => selectAdjacent(-1)}
            >
              <ArrowLeft size={15} />
            </button>
            <button
              className="instrument-arrow"
              type="button"
              aria-label="Next chart day"
              disabled={selectedIndex < 0 || selectedIndex >= days.length - 1}
              onClick={() => selectAdjacent(1)}
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
        <div
          className="mt-3 flex flex-wrap gap-x-6 gap-y-2"
          aria-live="polite"
          aria-atomic="true"
        >
          {selectedSegments.length ? (
            selectedSegments.map((segment) => (
              <p
                key={segment.id}
                className="flex items-center gap-2 text-sm text-white/70"
              >
                <span
                  className="composition-chart__swatch"
                  aria-hidden="true"
                  style={{ background: segment.color }}
                />
                {segment.name}
                <strong className="font-mono font-medium text-white">
                  {minutesLabel(segment.minutes)}
                </strong>
              </p>
            ))
          ) : (
            <p className="text-sm text-white/60">
              No {metric === "combined" ? "practice or sport" : mainType}{" "}
              sessions on this day.
            </p>
          )}
        </div>
        <p className="mt-3 text-xs text-white/50">
          Linked to Daily effort and the session record below.
        </p>
      </div>
    </div>
  );
}
