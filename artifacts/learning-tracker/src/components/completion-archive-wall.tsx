import { useState } from "react";
import { BookOpen, Check, GraduationCap, Layers3 } from "lucide-react";
import bambooMaple from "@/assets/patterns/bamboo-maple-cutout-v1.png";
import "./completion-archive-wall.css";

const records = [
  {
    id: "five-rings",
    kind: "Book",
    title: "The Book of Five Rings",
    creator: "Miyamoto Musashi",
    date: "12 Aug 2026",
    mark: "五",
    icon: BookOpen,
    description: "Timing, distance, and seeing the whole field.",
  },
  {
    id: "data-signal",
    kind: "Course",
    title: "Data Visualization: Story & Signal",
    creator: "Independent course",
    date: "28 Jul 2026",
    mark: "視",
    icon: GraduationCap,
    description: "Turning dense measurements into legible comparisons.",
  },
  {
    id: "practice-cycle",
    kind: "Completed work",
    title: "Thirty Days of Deliberate Practice",
    creator: "Personal study cycle",
    date: "30 Jun 2026",
    mark: "道",
    icon: Layers3,
    description: "A finished cycle with conclusions and a next return point.",
  },
];

export function CompletionArchiveWall() {
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
          <p className="completion-wall__kicker">Cabinet wall · sealed works</p>
          <h2 id="completion-wall-title">Completion archive</h2>
          <p>
            Finished books, courses, and substantial works kept as evidence—not
            mixed with automatic Journey Marks.
          </p>
        </div>
        <span className="completion-wall__prototype">
          Visual prototype · illustrative records
        </span>
      </div>

      <div className="completion-wall__layout">
        <div className="completion-wall__records">
          {records.map((record) => {
            const Icon = record.icon;
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
                    {record.kind}
                  </span>
                  <strong>{record.title}</strong>
                  <small>{record.creator}</small>
                </span>
                <span className="completion-plaque__date">
                  <Check aria-hidden="true" className="h-3 w-3" />
                  {record.date}
                </span>
              </button>
            );
          })}
        </div>

        <aside className="completion-wall__inspector" aria-live="polite">
          <span aria-hidden="true">{selected.mark}</span>
          <div>
            <p>
              {selected.kind} · sealed {selected.date}
            </p>
            <h3>{selected.title}</h3>
            <small>{selected.creator}</small>
            <blockquote>{selected.description}</blockquote>
          </div>
        </aside>
      </div>
    </section>
  );
}
