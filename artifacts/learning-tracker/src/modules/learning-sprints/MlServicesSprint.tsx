import { useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  Activity, ArrowLeft, ArrowRight, BookOpenText, Check, CircleAlert,
  ExternalLink, FlaskConical, Network, RotateCcw,
} from "lucide-react";
import { faults, mlServices, requestStages, sources } from "./ml-services";
import "./ml-services.css";
import { SprintCard, SprintPageHeader } from "./SprintPresentation";
import { NareshkaGuide } from "./NareshkaGuide";

export const mlSprintPath = "/reflections/sprints/ml-services";
const key = "eternaldojo:ml-services:v1";
const { checkpoints } = mlServices;
const required = checkpoints.filter((checkpoint) => !checkpoint.optional);
const checkId = (checkpoint: string, check: string) => `${checkpoint}/${check}`;
const validChecks = new Set(checkpoints.flatMap((checkpoint) =>
  checkpoint.checks.map(([id]) => checkId(checkpoint.id, id)),
));
const validFaults = new Set(faults.map((fault) => fault.id));
const isComplete = (checkpoint: typeof checkpoints[number], progress: ReadonlySet<string>) =>
  checkpoint.checks.every(([id]) => progress.has(checkId(checkpoint.id, id)));

function readProgress(): Set<string> {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(data)) return new Set();
    return new Set(data.filter((item): item is string =>
      typeof item === "string" && (validChecks.has(item) || validFaults.has(item)),
    ));
  } catch {
    return new Set();
  }
}

function Source({ href, children }: { href: string; children: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="ml-source">
    {children}<ExternalLink size={14} aria-hidden="true" />
  </a>;
}

function RequestTrace({ progress, complete }: {
  progress: ReadonlySet<string>;
  complete: (id: string) => void;
}) {
  const [scenario, select] = useState("ok");
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const fault = faults.find((item) => item.id === scenario);
  const end = fault?.failure ?? requestStages.length - 1;
  const failed = fault && step === end;
  const signal = failed ? fault.observed : requestStages[step].detail;
  const correct = !!failed && answer === fault.correct;

  const choose = (id: string) => {
    select(id);
    setStep(0);
    setAnswer(null);
  };

  return (
    <section className="ml-trace" aria-labelledby="ml-trace-title">
      <div className="ml-section-heading">
        <Network size={19} aria-hidden="true" />
        <h3 id="ml-trace-title">Проследи запрос</h3>
      </div>
      <p>Учебная симуляция по принципу Capture/Forward в Cisco Packet Tracer. Выбери сбой, пройди запрос по шагам и определи, что исправить.</p>
      <label className="ml-scenario">
        Сценарий
        <select value={scenario} onChange={(event) => choose(event.target.value)}>
          <option value="ok">Исправный запрос</option>
          {faults.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}{progress.has(item.id) ? " · пройден" : ""}
            </option>
          ))}
        </select>
      </label>
      <ol className="ml-trace-stages" aria-label="Путь запроса">
        {requestStages.map((stage, index) => (
          <li key={stage.title} aria-current={index === step ? "step" : undefined}
            data-status={index === step ? (failed ? "failed" : "active") : index < step ? "visited" : undefined}>
            <span>{String(index + 1).padStart(2, "0")}</span>{stage.title}
          </li>
        ))}
      </ol>
      <p className="ml-trace-signal" aria-live="polite">
        <strong>{failed ? "Стоп" : requestStages[step].title}</strong> {signal}
      </p>
      <div className="ml-actions">
        <button type="button" className="ml-control" disabled={step === 0}
          onClick={() => { setStep(step - 1); setAnswer(null); }}>
          <ArrowLeft size={16} aria-hidden="true" /> Назад
        </button>
        <button type="button" className="ml-control" disabled={step >= end}
          onClick={() => setStep(step + 1)}>
          Следующий шаг <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button type="button" className="ml-control" onClick={() => choose(scenario)}>
          <RotateCcw size={16} aria-hidden="true" /> Сначала
        </button>
      </div>
      {failed && <div className="ml-diagnosis">
        <h4>Что исправит сбой?</h4>
        <div className="ml-actions">
          {fault.choices.map((choice, index) => (
            <button key={choice} type="button" className="ml-control" aria-pressed={answer === index}
              onClick={() => {
                setAnswer(index);
                if (index === fault.correct) complete(fault.id);
              }}>{choice}</button>
          ))}
        </div>
        <p aria-live="polite">
          {answer !== null && (correct
            ? `Верно. ${fault.reason}`
            : "Проверь, до какого этапа дошёл запрос. Попробуй ещё раз.")}
        </p>
      </div>}
      <footer>
        <span>{faults.filter((item) => progress.has(item.id)).length} из {faults.length} сбоев разобрано</span>
        <Source href={sources.simulation}>Cisco · Simulation Mode</Source>
      </footer>
    </section>
  );
}

export function MlServicesSprintCard({ preview }: { preview: boolean }) {
  const progress = readProgress();
  const done = required.filter((checkpoint) =>
    isComplete(checkpoint, progress),
  ).length;
  return (
    <SprintCard
      icon={Network}
      title={mlServices.title}
      description="От модели до работающего API, сетевой диагностики и мониторинга."
      meta="ML-инженерия · 7 чекпоинтов + облако по желанию"
      completed={done}
      total={required.length}
      href={mlSprintPath + (preview ? "?preview" : "")}
    />
  );
}

export default function MlServicesSprint() {
  const search = new URLSearchParams(useSearch());
  const [, navigate] = useLocation();
  const [progress, setProgress] = useState(readProgress);
  const [saveError, setSaveError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const completed = (checkpoint: typeof checkpoints[number]) => isComplete(checkpoint, progress);
  const [initialId] = useState(() => required.find((checkpoint) => !completed(checkpoint))?.id);
  const active = checkpoints.find((checkpoint) => checkpoint.id === search.get("step"))
    ?? checkpoints.find((checkpoint) => checkpoint.id === initialId) ?? checkpoints[0];
  const done = required.filter(completed).length;
  const activeIndex = checkpoints.indexOf(active);
  const tracesDone = faults.every((fault) => progress.has(fault.id));

  const changeProgress = (id: string, checked: boolean) => {
    const updated = new Set(progress);
    if (checked) updated.add(id);
    else updated.delete(id);
    setProgress(updated);
    try {
      localStorage.setItem(key, JSON.stringify([...updated]));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  };

  const chooseCheckpoint = (id: string) => {
    const params = new URLSearchParams(search);
    params.set("step", id);
    navigate(`${mlSprintPath}?${params}`, { replace: true });
    requestAnimationFrame(() => heading.current?.focus());
  };

  return <div className="ml-room">
      <SprintPageHeader
        title={mlServices.title}
        description={mlServices.intro}
        preview={search.has("preview")}
        completed={done}
        total={required.length}
        unit="основных чекпоинтов"
      >
        <p className="ml-note">
          Основной маршрут проходит локально. AWS нужен только для
          дополнительной практики на удалённой машине.
        </p>
      </SprintPageHeader>
      <NareshkaGuide />
    <div className="ml-layout">
      <nav className="ml-steps" aria-label="Чекпоинты спринта">
        <h2>Карта спринта</h2>
        <ol>
          {checkpoints.map((checkpoint, index) => (
            <li key={checkpoint.id}>
              <button type="button" aria-current={checkpoint.id === active.id ? "step" : undefined}
                onClick={() => chooseCheckpoint(checkpoint.id)}>
                <span className="ml-step-number" aria-hidden="true">
                  {completed(checkpoint) ? <Check size={16} /> : String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{checkpoint.title}</strong>
                  <small>{completed(checkpoint) ? "Готово" : checkpoint.optional ? "По желанию" : checkpoint.short}</small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <article className="ml-detail" aria-labelledby="ml-checkpoint-title">
        <p className="ml-topic">{active.topic} · {active.optional ? "По желанию" : `Чекпоинт ${activeIndex + 1}`}</p>
        <h2 id="ml-checkpoint-title" ref={heading} tabIndex={-1}>{active.title}</h2>
        <h3>Зачем</h3>
        <p>{active.why}</p>
        <div className="ml-section-heading">
          <BookOpenText size={18} aria-hidden="true" /><h3>Что пройти</h3>
        </div>
        <ul className="ml-lessons">
          {active.lessons.map(([label, instruction, href]) => (
            <li key={label}><Source href={href}>{label}</Source><p>{instruction}</p></li>
          ))}
        </ul>
        <div className="ml-section-heading">
          <FlaskConical size={18} aria-hidden="true" /><h3>Практика</h3>
        </div>
        <p>{active.lab}</p>
        {active.simulator && <RequestTrace progress={progress} complete={(id) => changeProgress(id, true)} />}
        <fieldset className="ml-checklist">
          <legend><Check size={18} aria-hidden="true" /> Критерии готовности</legend>
          {active.checks.map(([id, label]) => {
            const value = checkId(active.id, id);
            const locked = active.simulator && id === "diagnosis" && !tracesDone;
            return <label key={id}>
              <input type="checkbox" checked={progress.has(value)} disabled={locked}
                onChange={(event) => changeProgress(value, event.target.checked)} />
              <span>{label}{locked && <small>Сначала разбери все три сбоя в симуляции выше.</small>}</span>
            </label>;
          })}
        </fieldset>
        <p className="ml-note" role="status">
          {saveError ? <><CircleAlert size={16} aria-hidden="true" /> Не удалось сохранить в браузере. Отметки доступны до закрытия страницы.</>
            : "Отметки сохраняются в этом браузере."}
        </p>
        {activeIndex < checkpoints.length - 1 && <button type="button"
          className="ml-control ml-primary"
          onClick={() => chooseCheckpoint(checkpoints[activeIndex + 1].id)}>
          Следующий чекпоинт <ArrowRight size={16} aria-hidden="true" />
        </button>}
      </article>
    </div>
    <footer className="ml-resource-footer">
      <Activity size={17} aria-hidden="true" /> Дополнительные материалы
      <Source href={sources.catalog}>Лабы DataEngLab</Source>
      <Source href={sources.evidently}>Курс Evidently</Source>
    </footer>
  </div>;
}
