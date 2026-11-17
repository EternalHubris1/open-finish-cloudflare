import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import "./sprint-presentation.css";

export function SprintCard({
  icon: Icon,
  title,
  description,
  meta,
  completed,
  total,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  meta: string;
  completed: number | null;
  total: number;
  href: string;
}) {
  return (
    <article className="learning-sprint-card">
      <div className="learning-sprint-icon">
        <Icon size={24} aria-hidden="true" />
      </div>
      <div className="learning-sprint-copy">
        <p className="learning-sprint-meta">{meta}</p>
        <h3>{title}</h3>
        <p>{description}</p>
        <span>
          {completed === null
            ? "Прогресс пока недоступен"
            : `${completed} из ${total} завершено`}
        </span>
        {completed !== null && (
          <progress
            aria-label={`Прогресс: ${title}`}
            value={completed}
            max={total}
          />
        )}
      </div>
      <Link className="learning-sprint-open" href={href}>
        {completed ? "Продолжить спринт" : "Открыть спринт"}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

export function SprintPageHeader({
  title,
  description,
  preview,
  completed,
  total,
  unit,
  children,
}: {
  title: string;
  description: string;
  preview: boolean;
  completed: number | null;
  total: number;
  unit: string;
  children?: ReactNode;
}) {
  return (
    <>
      <Link
        className="learning-sprint-back"
        href={`/reflections${preview ? "?preview" : ""}#learning-sprints`}
      >
        <ArrowLeft size={16} aria-hidden="true" />К спринтам
      </Link>
      <header className="learning-sprint-heading">
        <p className="learning-sprint-meta">Учебный спринт</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        <div className="learning-sprint-meter">
          <span>
            {completed === null
              ? "Прогресс пока недоступен"
              : `${completed} из ${total} ${unit}`}
          </span>
          {completed !== null && (
            <progress
              aria-label={`Прогресс: ${title}`}
              max={total}
              value={completed}
            />
          )}
        </div>
      </header>
    </>
  );
}
