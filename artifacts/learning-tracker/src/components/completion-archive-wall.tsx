import { useState } from "react";
import { BookOpen, Check, GraduationCap, Layers3 } from "lucide-react";
import bambooMaple from "@/assets/patterns/bamboo-maple-cutout-v1.png";
import {
  completionDuration,
  completionKindLabel,
  previewCompletionRecords,
} from "@/lib/completion-records";
import "./completion-archive-wall.css";

const kindIcon = { book: BookOpen, course: GraduationCap, block: Layers3 };
const recordDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));

export function CompletionArchiveWall() {
  const records = previewCompletionRecords;
  const [selectedId, setSelectedId] = useState(records[0].id);
  const selected =
    records.find((record) => record.id === selectedId) ?? records[0];
  return (
    <section
      className="completion-wall"
      aria-labelledby="completion-wall-title"
    >
      <img
        alt=""
        aria-hidden="true"
        className="completion-wall__ornament"
        loading="lazy"
        src={bambooMaple}
      />
      <div className="completion-wall__header">
        <div>
          <p className="completion-wall__kicker">Hall display · sealed works</p>
          <h2 id="completion-wall-title">Completed works</h2>
          <p>
            Every finished book, course, or substantial block keeps what it was,
            when it was sealed, and the time it required.
          </p>
        </div>
        <span className="completion-wall__prototype">
          Visual prototype · illustrative records
        </span>
      </div>
      <div className="completion-wall__layout">
        <div className="completion-wall__records">
          {records.map((record) => {
            const Icon = kindIcon[record.kind];
            return (
              <button
                aria-pressed={selected.id === record.id}
                className="completion-plaque"
                key={record.id}
                onClick={() => setSelectedId(record.id)}
                type="button"
              >
                <span className="completion-plaque__seal" aria-hidden="true">
                  {record.mark}
                </span>
                <span className="completion-plaque__body">
                  <span className="completion-plaque__kind">
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                    {completionKindLabel[record.kind]}
                  </span>
                  <strong>{record.title}</strong>
                  <small>{record.creator}</small>
                </span>
                <span className="completion-plaque__date">
                  <Check aria-hidden="true" className="h-3 w-3" />
                  {recordDate(record.completedOn)} ·{" "}
                  {completionDuration(record.durationMinutes)}
                </span>
              </button>
            );
          })}
        </div>
        <aside className="completion-wall__inspector" aria-live="polite">
          <span aria-hidden="true">{selected.mark}</span>
          <div>
            <p>
              {completionKindLabel[selected.kind]} · sealed{" "}
              {recordDate(selected.completedOn)}
            </p>
            <h3>{selected.title}</h3>
            <small>{selected.creator}</small>
            <blockquote>{selected.description}</blockquote>
            <strong className="completion-wall__duration">
              Time invested · {completionDuration(selected.durationMinutes)}
            </strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
