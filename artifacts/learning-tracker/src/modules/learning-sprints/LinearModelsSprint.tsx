import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  linearModels,
  sprintKey,
  sprintTitle,
  emptyLesson,
  canComplete,
  lessonStatusNames,
  practiceId,
  assessmentId,
  taskHref,
  type LessonRecord,
  type LessonState,
} from "../../../../../modules/learning-sprints/linear-models";
import "./sprint.css";

const preview =
  import.meta.env.DEV && new URLSearchParams(location.search).has("preview");
const previewKey = "design-preview-linear-models-v1";
const queryKey = ["learning-sprint", sprintKey, preview];
async function request<T>(suffix = "", init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/sprints/curricula/${sprintKey}${suffix}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  if (response.status === 401)
    window.dispatchEvent(new Event("auth:unauthorized"));
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error ?? "Спринт недоступен. Экспортируйте черновик и повторите.",
    );
  }
  return response.json();
}
function previewRecords(): LessonRecord[] {
  try {
    return JSON.parse(sessionStorage.getItem(previewKey) ?? "[]");
  } catch {
    return [];
  }
}
function exportDraft(record: LessonRecord) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ sprintKey, ...record }, null, 2)], {
      type: "application/json",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sprintKey}-lesson-${record.lessonNumber}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
type Day = (typeof linearModels.days)[number];
function Lesson({
  day,
  record,
  ready,
  save,
}: {
  day: Day;
  record?: LessonRecord;
  ready: boolean;
  save: (record: LessonRecord) => Promise<LessonRecord>;
}) {
  const [state, setState] = useState<LessonState>(
    () => record?.state ?? emptyLesson(),
  );
  const [version, setVersion] = useState(record?.version ?? 0);
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify(record?.state ?? emptyLesson()),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [minutes, setMinutes] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const dirty = JSON.stringify(state) !== baseline;
  const change = (patch: Partial<LessonState>) => {
    setState((current) => ({ ...current, ...patch }));
    setMessage("");
  };
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const linkGuard = (event: MouseEvent) => {
      const link =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        dirty &&
        link &&
        link.target !== "_blank" &&
        new URL(link.href).origin === location.origin &&
        !confirm(
          "Есть несохранённые изменения занятия. Сохраните или экспортируйте их. Всё равно перейти?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", linkGuard, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", linkGuard, true);
    };
  }, [dirty]);
  const persist = async () => {
    if (!ready || saving) return;
    if (state.status === "completed" && !canComplete(state)) {
      setError(
        "Завершение требует просмотра, практики и подтверждения критерия.",
      );
      return;
    }
    const next = state;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await save({
        lessonNumber: day.number,
        version,
        state: next,
      });
      setState((current) =>
        JSON.stringify(current) === JSON.stringify(next)
          ? result.state
          : current,
      );
      setVersion(result.version);
      setBaseline(JSON.stringify(result.state));
      setMessage(
        preview
          ? "Сохранено только в этой тестовой вкладке, не в аккаунте."
          : "Занятие сохранено. Прогресс восстановится после перезагрузки.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось сохранить. Черновик оставлен на странице.",
      );
    } finally {
      setSaving(false);
    }
  };
  const addSession = () => {
    const duration = Number(minutes);
    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 1440 ||
      state.sessions.length >= 100
    ) {
      setError("Укажите от 1 до 1440 минут; допустимо до 100 отрезков работы.");
      return;
    }
    change({
      sessions: [
        ...state.sessions,
        {
          id: crypto.randomUUID(),
          recordedAt: new Date().toISOString(),
          minutes: duration,
          note: sessionNote,
        },
      ],
    });
    setMinutes("");
    setSessionNote("");
    setError("");
    setMessage("Отрезок добавлен в черновик. Сохраните занятие.");
  };
  return (
    <article className="math-lesson" aria-label={`Занятие ${day.number}`}>
      <header>
        <p className="math-kicker">
          Занятие {day.number} / 13 · {day.estimated_minutes} минут · можно
          разделить
        </p>
        <h3>{day.title}</h3>
        <p>{day.goal}</p>
      </header>
      <section>
        <h4>Ресурсы · в указанном порядке</h4>
        <ol>
          {day.resources.map((resource) => (
            <li key={resource.url}>
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                {resource.title} ↗
              </a>
            </li>
          ))}
        </ol>
        <p className="math-formula">{day.focus}</p>
        {day.number === 7 && (
          <p className="math-note">
            В исходном JSON упомянуто приложение с разбором слайдов, но его
            текста в JSON нет. Не заменяем его выдуманным материалом.
          </p>
        )}
      </section>
      <details>
        <summary>Поминутный план · {day.estimated_minutes} минут</summary>
        <ol>
          {linearModels.schedule.map((item, index) => {
            const start = linearModels.schedule
              .slice(0, index)
              .reduce((sum, part) => sum + part.minutes, 0);
            return (
              <li key={item.action}>
                <strong>
                  {start}–{start + item.minutes} мин.
                </strong>{" "}
                · {item.action}
              </li>
            );
          })}
        </ol>
      </details>
      <section>
        <h4>Практика</h4>
        <ol>
          {day.practice.map((task, index) => (
            <li key={index}>
              <p className="math-formula">{task}</p>
              <a
                className="math-task-link"
                href={taskHref(practiceId(day.number, index), preview)}
              >
                Открыть задачу {day.number}.{index + 1} в практикуме →
              </a>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h4>Вопросы своими словами</h4>
        <ol>
          {day.questions.map((question) => (
            <li className="math-formula" key={question}>
              {question}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h4>Что сохранить</h4>
        <p>{day.artifact}</p>
        <h4>Критерий завершения</h4>
        <p>{day.completion_criteria}</p>
      </section>
      <details>
        <summary>Если застряли</summary>
        <p>{day.if_stuck}</p>
      </details>
      <details>
        <summary>Ответы · открыть после своей попытки</summary>
        <p className="math-formula">{day.answer}</p>
      </details>
      <section className="math-progress">
        <h4>Ход занятия</h4>
        <p>
          Открытие ссылки, просмотр видео и правильный ответ сами по себе не
          завершают занятие.
        </p>
        <fieldset disabled={!ready || saving}>
          <legend>Независимые отметки</legend>
          {(
            [
              ["viewed", "Материалы просмотрены"],
              ["practiced", "Практика выполнена"],
              ["criterionConfirmed", "Критерий подтверждён самостоятельно"],
            ] as const
          ).map(([field, label]) => (
            <label className="math-check" key={field}>
              <input
                type="checkbox"
                checked={state[field]}
                onChange={(event) => change({ [field]: event.target.checked })}
              />
              {label}
            </label>
          ))}
          <div className="math-fields">
            <label>
              Статус
              <select
                value={state.status}
                onChange={(event) =>
                  change({
                    status: event.target.value as LessonState["status"],
                  })
                }
              >
                {Object.entries(lessonStatusNames).map(([key, name]) => (
                  <option
                    key={key}
                    value={key}
                    disabled={key === "completed" && !canComplete(state)}
                  >
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Плановая дата · необязательно
              <input
                type="date"
                value={state.plannedDate ?? ""}
                onChange={(event) =>
                  change({ plannedDate: event.target.value || null })
                }
              />
            </label>
          </div>
          <p className="math-note">
            Дата редактируется независимо от порядка. Очистите поле, чтобы
            оставить занятие без даты. Все материалы доступны сразу.
          </p>
          <label>
            Заметки
            <textarea
              rows={3}
              maxLength={6000}
              value={state.notes}
              onChange={(event) => change({ notes: event.target.value })}
            />
          </label>
          <label>
            Артефакт / решение занятия
            <textarea
              rows={4}
              className="math-formula"
              maxLength={24000}
              value={state.solution}
              onChange={(event) => change({ solution: event.target.value })}
            />
          </label>
          <label>
            Ссылка на решение
            <input
              type="url"
              value={state.solutionUrl}
              maxLength={2000}
              onChange={(event) => change({ solutionUrl: event.target.value })}
              placeholder="https://…"
            />
          </label>
          <h4>
            Фактическое время ·{" "}
            {state.sessions.reduce((sum, item) => sum + item.minutes, 0)} мин.
          </h4>
          <p>
            Можно повторять занятие и работать несколькими отрезками. Это время
            спринта, не новая запись активности в общем журнале.
          </p>
          <div className="math-fields">
            <label>
              Минуты нового отрезка
              <input
                type="number"
                min={1}
                max={1440}
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
              />
            </label>
            <label>
              Что сделано
              <input
                maxLength={600}
                value={sessionNote}
                onChange={(event) => setSessionNote(event.target.value)}
              />
            </label>
          </div>
          <button type="button" onClick={addSession}>
            Добавить отрезок работы
          </button>
          {state.sessions.map((item) => (
            <div className="math-session" key={item.id}>
              <small>
                Записано: {new Date(item.recordedAt).toLocaleString("ru-RU")}
              </small>
              <div className="math-fields">
                <label>
                  Минуты
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={item.minutes}
                    onChange={(event) =>
                      change({
                        sessions: state.sessions.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, minutes: Number(event.target.value) }
                            : entry,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Заметка к отрезку
                  <input
                    maxLength={600}
                    value={item.note}
                    onChange={(event) =>
                      change({
                        sessions: state.sessions.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, note: event.target.value }
                            : entry,
                        ),
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              change({ status: "review", criterionConfirmed: false })
            }
          >
            Нужно повторить · сохранить историю
          </button>
        </fieldset>
        <div className="math-actions">
          <button
            type="button"
            className="math-primary"
            disabled={!ready || saving}
            onClick={() => void persist()}
          >
            {saving ? "Сохранение…" : "Сохранить занятие"}
          </button>
          <button
            type="button"
            onClick={() => {
              exportDraft({ lessonNumber: day.number, version, state });
              setMessage(
                "Скачивание черновика запрошено. Проверьте загрузки браузера.",
              );
            }}
          >
            Экспортировать черновик
          </button>
        </div>
        {dirty && <p className="math-note">Есть несохранённые изменения.</p>}
        <div aria-live="polite">
          {message && <p className="math-success">{message}</p>}
          {error && (
            <p role="alert" className="math-error">
              {error}
            </p>
          )}
        </div>
      </section>
    </article>
  );
}
export default function LinearModelsSprint() {
  const cache = useQueryClient();
  const records = useQuery<LessonRecord[]>({
    queryKey,
    queryFn: () => (preview ? Promise.resolve(previewRecords()) : request()),
    retry: false,
  });
  const params = new URLSearchParams(location.search);
  const requested = Number(params.get("lesson") ?? 1);
  const [selected, setSelected] = useState(
    Number.isInteger(requested) && requested >= 1 && requested <= 13
      ? requested
      : 1,
  );
  const [assessment, setAssessment] = useState(params.has("assessment"));
  const [open, setOpen] = useState(params.get("sprint") === sprintKey);
  const record = records.data?.find((item) => item.lessonNumber === selected);
  const save = async (draft: LessonRecord) => {
    const result = preview
      ? { ...draft, version: draft.version + 1 }
      : await request<LessonRecord>(`/lessons/${draft.lessonNumber}`, {
          method: "PUT",
          body: JSON.stringify({ version: draft.version, state: draft.state }),
        });
    const next = [
      ...(records.data ?? []).filter(
        (item) => item.lessonNumber !== draft.lessonNumber,
      ),
      result,
    ];
    if (preview) sessionStorage.setItem(previewKey, JSON.stringify(next));
    cache.setQueryData(queryKey, next);
    return result;
  };
  const navigate = (number: number, final = false) => {
    // A full local navigation uses the draft guard and restores persisted records.
    const url = new URL(location.href);
    url.searchParams.set("sprint", sprintKey);
    url.searchParams.set("lesson", String(number));
    if (final) url.searchParams.set("assessment", "true");
    else url.searchParams.delete("assessment");
    url.hash = "math-sprint";
    return url.pathname + url.search + url.hash;
  };
  return (
    <section
      id="math-sprint"
      className="math-sprint signal-surface"
      aria-labelledby="math-sprint-title"
    >
      <header className="math-sprint-head">
        <div>
          <p className="math-kicker">
            {sprintTitle} · 13 занятий · 19 ч 30 мин
          </p>
          <h2 id="math-sprint-title">{linearModels.title}</h2>
          <p>{linearModels.description}</p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="math-sprint-body"
          onClick={() => setOpen(!open)}
        >
          {open ? "Свернуть программу" : "Открыть программу"}
        </button>
      </header>
      {open && (
        <div id="math-sprint-body">
          <p className="math-note">
            {preview
              ? "Тестовый режим: сохранение только в этой вкладке, переживает перезагрузку; аккаунт не изменяется."
              : "Содержание уже доступно. Запись спринта создаётся только при первом сохранении занятия; просмотр не записывает прогресс."}
          </p>
          <div className="math-stages">
            {[
              "Чтение формул",
              "Линейная модель",
              "Логистическая модель и LogLoss",
              "Производные",
              "Матрицы",
              "Матричное дифференцирование",
            ].map((stage) => (
              <span key={stage}>{stage}</span>
            ))}
          </div>
          <nav className="math-days" aria-label="Занятия матспринта">
            {linearModels.days.map((day) => {
              const saved = records.data?.find(
                (item) => item.lessonNumber === day.number,
              );
              return (
                <a
                  key={day.number}
                  href={navigate(day.number)}
                  aria-current={
                    !assessment && selected === day.number ? "step" : undefined
                  }
                >
                  <strong>{String(day.number).padStart(2, "0")}</strong>
                  <span>{day.title}</span>
                  <small>
                    {lessonStatusNames[saved?.state.status ?? "not_started"]}
                    {saved?.state.plannedDate
                      ? ` · ${saved.state.plannedDate}`
                      : ""}
                  </small>
                </a>
              );
            })}
            <a
              href={navigate(13, true)}
              aria-current={assessment ? "step" : undefined}
            >
              <strong>Σ</strong>
              <span>Итоговая проверка</span>
              <small>Четыре независимых задания</small>
            </a>
          </nav>
          {records.isLoading && (
            <p role="status">
              Загрузка сохранённого прогресса… Материалы доступны ниже.
            </p>
          )}
          {records.isError && (
            <div role="alert" className="math-error">
              <p>{records.error.message}</p>
              <button type="button" onClick={() => void records.refetch()}>
                Повторить загрузку
              </button>
              <p>
                Пока прогресс не загружен, сохранение выключено: старые записи
                не будут перезаписаны.
              </p>
            </div>
          )}
          {assessment ? (
            <div className="math-assessment">
              <h3>Итоговая проверка · четыре задания</h3>
              <p>
                Умение умножать матрицы и умение дифференцировать их
                произведение — разные результаты. Просмотр ответа не
                подтверждает освоение.
              </p>
              {linearModels.final_assessment.map((item, index) => (
                <article key={item.title}>
                  <h4>
                    {index + 1}. {item.title}
                  </h4>
                  <p className="math-formula">{item.task}</p>
                  <a
                    className="math-task-link"
                    href={taskHref(assessmentId(index), preview)}
                  >
                    Решить в практикуме →
                  </a>
                  <details>
                    <summary>Ответ · после попытки</summary>
                    <p className="math-formula">{item.answer}</p>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <Lesson
              key={`${selected}:${records.isSuccess}`}
              day={linearModels.days[selected - 1]}
              record={record}
              ready={records.isSuccess}
              save={save}
            />
          )}
        </div>
      )}
    </section>
  );
}
