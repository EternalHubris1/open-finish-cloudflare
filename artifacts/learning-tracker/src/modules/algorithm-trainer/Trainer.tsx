import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Code2,
  Play,
  Square,
  ExternalLink,
  Save,
  Download,
  RotateCcw,
  Search,
  Bookmark,
  Check,
  Clock,
} from "lucide-react";
import { catalog, type Problem } from "./catalog";
import { ruLabel } from "./russian";
import { practiceNotebook } from "./notebook";
import CustomTaskForm from "./CustomTaskForm";
import LearningGuide, { SourceNote, Sources } from "./LearningGuide";
import {
  blockFor,
  blockProblems,
  blockProgress,
  difficultyLevel,
  learningBlocks,
  latestOutcome,
  mixedPractice,
  nextInBlock,
  taskStage,
} from "./learning-path";
import { provenance } from "./sources";
import {
  emptyState,
  isDue,
  localDate,
  reviewDate,
  type Outcome,
  type PracticeRecord,
  type PracticeState,
} from "../../../../../modules/algorithm-trainer/model";
import scene from "@/assets/environments/optimized/activities-practice-hall.webp";
import "./trainer.css";
import {
  mathTasks,
  lessonHref,
} from "../../../../../modules/learning-sprints/linear-models";

const preview =
  import.meta.env.DEV && new URLSearchParams(location.search).has("preview");
const queryKey = ["algorithm-trainer", preview];
const previewStorageKey = "design-preview-practicum-v1";
function previewRecords(): PracticeRecord[] {
  try {
    return JSON.parse(sessionStorage.getItem(previewStorageKey) ?? "[]");
  } catch {
    return [];
  }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/algorithm-trainer${path}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  if (response.status === 401)
    window.dispatchEvent(new Event("auth:unauthorized"));
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error ??
        "Progress is unavailable. Keep your draft, export it and retry.",
    );
  }
  return response.json();
}
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const outcomeNames: Record<Outcome, string> = {
  independent: "Решено самостоятельно",
  assisted: "Решено с помощью",
  retry: "Нужна ещё попытка",
};
type RunResult = {
  phase: string;
  detail?: string;
  output?: string;
  error?: string;
  results?: { passed: boolean; actual: string }[] | null;
};

function Workspace({
  problem,
  record,
  save,
  onDirty,
  hidePattern = false,
}: {
  problem: Problem;
  record?: PracticeRecord;
  save: (value: PracticeRecord) => Promise<PracticeRecord>;
  onDirty: (dirty: boolean) => void;
  hidePattern?: boolean;
}) {
  const [state, setState] = useState<PracticeState>(
    () => record?.state ?? emptyState(problem.starter),
  );
  const [version, setVersion] = useState(record?.version ?? 0);
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify(record?.state ?? emptyState(problem.starter)),
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [hints, setHints] = useState(0);
  const [run, setRun] = useState<RunResult | null>(null);
  const [environment, setEnvironment] = useState(
    problem.packages?.includes("pandas")
      ? "pandas"
      : problem.packages?.includes("numpy")
        ? "numpy"
        : "standard",
  );
  const worker = useRef<Worker | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(Date.now());
  const [outcome, setOutcome] = useState<Outcome>("retry");
  const [attemptNote, setAttemptNote] = useState("");
  const [minutes, setMinutes] = useState("0");
  const activeProblem = state.custom
    ? {
        ...problem,
        ...state.custom,
        tests: state.custom.tests.length ? state.custom.tests : undefined,
      }
    : problem;
  const dirty = JSON.stringify(state) !== baseline;
  const busy = run?.phase === "loading" || run?.phase === "running";
  const seconds = Math.floor(
    (elapsed + (startedAt === null ? 0 : clock - startedAt)) / 1000,
  );
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const routeGuard = (event: MouseEvent) => {
      const link =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (!dirty || !link || link.target === "_blank") return;
      const destination = new URL(link.href, location.href);
      if (
        destination.origin === location.origin &&
        destination.href !== location.href &&
        !confirm(
          "Leave with unsaved practice? Save or export the draft first to keep it.",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", guard);
    document.addEventListener("click", routeGuard, true);
    return () => {
      window.removeEventListener("beforeunload", guard);
      document.removeEventListener("click", routeGuard, true);
    };
  }, [dirty]);
  useEffect(() => {
    if (startedAt === null) return;
    const interval = setInterval(() => setClock(Date.now()), 500);
    return () => clearInterval(interval);
  }, [startedAt]);
  useEffect(
    () => () => {
      worker.current?.terminate();
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );
  const change = (patch: Partial<PracticeState>) => {
    setState((current) => ({ ...current, ...patch }));
    setMessage("");
  };
  const persist = async (next = state) => {
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await save({
        problemId: problem.id,
        version,
        state: next,
      });
      // Edits made during a slow save remain a new unsaved draft, not lost work.
      setState((current) =>
        JSON.stringify(current) === JSON.stringify(next)
          ? result.state
          : current,
      );
      setVersion(result.version);
      setBaseline(JSON.stringify(result.state));
      setMessage(
        preview
          ? "Saved in this preview session only."
          : "Saved to your workspace.",
      );
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Save failed. Export the draft and retry.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };
  const stop = () => {
    worker.current?.terminate();
    worker.current = null;
    if (timeout.current) clearTimeout(timeout.current);
  };
  const execute = () => {
    stop();
    setRun({ phase: "loading" });
    const instance = new Worker(
      new URL("./python.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.current = instance;
    const limit = (ms: number, message: string) => {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        stop();
        setRun({ phase: "error", error: message });
      }, ms);
    };
    limit(
      180000,
      "Не удалось загрузить Python или библиотеки. Проверьте доступ к jsDelivr или скачайте ноутбук для Colab. Черновик не изменён.",
    );
    instance.onmessage = (event: MessageEvent<RunResult>) => {
      setRun(event.data);
      if (event.data.phase === "running")
        limit(
          10000,
          "Execution stopped after 10 seconds. Check loops and complexity, then retry.",
        );
      if (["done", "error"].includes(event.data.phase)) stop();
    };
    instance.onerror = () => {
      stop();
      setRun({
        phase: "error",
        error:
          "Python could not load. Check your connection or continue on the source.",
      });
    };
    instance.postMessage({
      code: state.code,
      tests: activeProblem.tests,
      packages:
        environment === "pandas"
          ? ["numpy", "pandas"]
          : environment === "numpy"
            ? ["numpy"]
            : [],
    });
  };
  const recordAttempt = async () => {
    const duration = Number(minutes);
    if (!Number.isInteger(duration) || duration < 0 || duration > 1440) {
      setError("Use a duration from 0 to 1440 minutes.");
      return;
    }
    if (state.attempts.length >= 100) {
      setError(
        "This task has 100 attempts. Export its history before removing an old entry.",
      );
      return;
    }
    const next = {
      ...state,
      queued: true,
      nextReview: reviewDate(outcome),
      attempts: [
        ...state.attempts,
        {
          id: crypto.randomUUID(),
          recordedAt: new Date().toISOString(),
          minutes: duration,
          outcome,
          note: attemptNote,
        },
      ],
    };
    change(next);
    if (await persist(next)) {
      setAttemptNote("");
      setElapsed(0);
      setStartedAt(null);
    }
  };
  return (
    <section className="trainer-workspace" aria-label="Selected problem">
      <header className="trainer-problem-head">
        <div>
          <p className="trainer-eyebrow">
            {hidePattern
              ? "Выберите подход самостоятельно"
              : ruLabel(activeProblem.topic)}{" "}
            / {ruLabel(problem.difficulty)}
          </p>
          <h2>{activeProblem.title}</h2>
        </div>
        <button
          aria-pressed={state.queued}
          onClick={() => change({ queued: !state.queued })}
        >
          <Bookmark size={16} />
          {state.queued ? "In queue" : "Add to queue"}
        </button>
      </header>
      {activeProblem.manual ? (
        <p className="trainer-caption">
          Практика из матспринта · часть 2. Ручная самопроверка, не
          автоматическая оценка освоения.
        </p>
      ) : (
        <SourceNote problem={activeProblem} />
      )}
      {activeProblem.manual && (
        <a href={lessonHref(activeProblem.lessonNumber ?? 13, preview)}>
          ← Вернуться к занятию спринта
        </a>
      )}
      <div className="trainer-statement">
        {activeProblem.statement ? (
          <p style={{ whiteSpace: "pre-wrap" }}>{activeProblem.statement}</p>
        ) : (
          <>
            <p>
              Это ссылка на внешнюю задачу. Полное условие, ограничения и
              примеры находятся на сайте-источнике; его язык может отличаться от
              русского.
            </p>
            {activeProblem.url && (
              <a
                href={activeProblem.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={16} /> Открыть оригинал
              </a>
            )}
            <small>
              Local scratch runs do not judge this problem or submit to
              LeetCode.
            </small>
          </>
        )}
        {state.custom?.url && state.custom.statement && (
          <a href={state.custom.url} target="_blank" rel="noopener noreferrer">
            Open original source
          </a>
        )}
        {state.custom && (
          <details>
            <summary>Edit personal task</summary>
            <CustomTaskForm
              initial={state.custom}
              editing
              onSave={(custom) => change({ custom })}
            />
          </details>
        )}
        {activeProblem.tests && (
          <details>
            <summary>Примеры и тесты · {activeProblem.tests.length}</summary>
            <div className="trainer-cases">
              {activeProblem.tests.map((item, index) => (
                <pre key={index}>
                  solve({item.args.map((arg) => JSON.stringify(arg)).join(", ")}
                  ) → {JSON.stringify(item.expected)}
                </pre>
              ))}
            </div>
          </details>
        )}
        {problem.hints.length > 0 && (
          <div className="trainer-hints">
            {problem.hints.slice(0, hints).map((hint) => (
              <p key={hint}>{hint}</p>
            ))}
            {hints < problem.hints.length && (
              <button onClick={() => setHints(hints + 1)}>
                Показать подсказку {hints + 1} / {problem.hints.length}
              </button>
            )}
          </div>
        )}
      </div>
      {activeProblem.answer && (
        <details className="trainer-history">
          <summary>
            {activeProblem.answerLabel ?? "Ответ для самопроверки"}
          </summary>
          <p className="math-formula">{activeProblem.answer}</p>
        </details>
      )}
      <div className="trainer-codebar">
        {!activeProblem.manual && (
          <label>
            <span className="sr-only">Библиотеки Python</span>
            <select
              value={environment}
              disabled={busy || activeProblem.colabOnly || activeProblem.manual}
              onChange={(event) => setEnvironment(event.target.value)}
            >
              <option value="standard">Python · стандартная библиотека</option>
              <option value="numpy">Python + NumPy</option>
              <option value="pandas">Python + pandas + NumPy</option>
            </select>
          </label>
        )}
        <span>
          <Code2 size={16} />{" "}
          {activeProblem.manual ? "Ручное решение" : "Python · browser runtime"}
        </span>
        <div>
          <span aria-label="Practice timer">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
          <button
            onClick={() => {
              if (startedAt !== null) {
                const duration = elapsed + Date.now() - startedAt;
                setElapsed(duration);
                setStartedAt(null);
                setMinutes(String(Math.ceil(duration / 60000)));
              } else {
                const now = Date.now();
                setClock(now);
                setStartedAt(now);
              }
            }}
          >
            {startedAt !== null ? "Pause timer" : "Start timer"}
          </button>
        </div>
      </div>
      <label className="trainer-code-label">
        <span>
          {activeProblem.manual
            ? "Решение: вычисления, формулы и пояснения"
            : "Черновик Python"}
        </span>
        <textarea
          className="trainer-editor"
          spellCheck={false}
          value={state.code}
          maxLength={24000}
          onChange={(event) => change({ code: event.target.value })}
        />
      </label>
      <div className="trainer-actions">
        {!activeProblem.manual && (
          <>
            <button
              onClick={() => {
                download(
                  practiceNotebook(activeProblem, state.code),
                  `${problem.id}.ipynb`,
                );
                setMessage(
                  "Скачивание ноутбука запрошено: текущий код, условие и тесты. В Colab выберите Файл → Загрузить блокнот. Если встроенный браузер не скачивает файл, откройте сайт в обычном браузере. Результат отметьте здесь вручную.",
                );
              }}
            >
              <Download size={16} /> Ноутбук для Colab
            </button>
            <a
              href={
                activeProblem.colabOnly
                  ? `https://colab.research.google.com/github/EternalHubris1/open-finish-cloudflare/blob/dgt/algorithm-trainer/modules/algorithm-trainer/notebooks/${problem.id}.ipynb`
                  : "https://colab.research.google.com/"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} />{" "}
              {activeProblem.colabOnly
                ? "Открыть шаблон в Colab"
                : "Открыть Colab"}
            </a>
            <button
              className="trainer-primary"
              onClick={execute}
              disabled={busy || activeProblem.colabOnly}
            >
              <Play size={16} />
              {activeProblem.colabOnly
                ? "Выполняется в Colab"
                : activeProblem.tests
                  ? "Запустить тесты"
                  : "Запустить код"}
            </button>
            {busy && (
              <button
                onClick={() => {
                  stop();
                  setRun({
                    phase: "error",
                    error: "Stopped. Your draft is unchanged.",
                  });
                }}
              >
                <Square size={16} /> Stop
              </button>
            )}
          </>
        )}
        <button disabled={saving} onClick={() => void persist()}>
          <Save size={16} />
          {saving ? "Сохранение…" : "Сохранить решение"}
        </button>
        <button
          onClick={() => {
            download({ problem, ...state }, `${problem.id}-draft.json`);
            setMessage("Draft exported.");
          }}
        >
          <Download size={16} /> Export draft
        </button>
        {!activeProblem.manual && (
          <button
            onClick={() => {
              if (
                confirm(
                  "Replace the current code with the starter? Notes and attempts stay unchanged.",
                )
              )
                change({ code: problem.starter });
            }}
          >
            <RotateCcw size={16} /> Reset code
          </button>
        )}
      </div>
      {!activeProblem.manual && (
        <p className="trainer-caption">
          {activeProblem.colabOnly &&
            "Этот кейс выполняется в Colab: скачайте ноутбук, затем загрузите его через Файл → Загрузить блокнот. "}
          Python загружается с jsDelivr при первом запуске. Код выполняется в
          браузере, не на сервере, и останавливается через 10 секунд. Запускайте
          только доверенный код. Выберите среду выше и подключайте библиотеки
          через import. pandas и NumPy загружаются по выбору; другие пакеты —
          через Colab. Для тестов возвращайте обычные Python-значения, не
          DataFrame/ndarray. Тесты проверяют примеры, но не сложность алгоритма.
          Ноутбук содержит ваш текущий код и примеры, но не историю аккаунта;
          загрузка в Colab ручная.
        </p>
      )}
      {activeProblem.manual && (
        <p className="trainer-caption">
          Можно решать на бумаге и сохранить здесь объяснение или ссылку в
          заметках. Ответ открывается вручную. Решённая задача не завершает
          занятие спринта автоматически.
        </p>
      )}
      {run && (
        <div className="trainer-console" role="status" aria-live="polite">
          <strong>
            {run.phase === "loading"
              ? (run.detail ??
                "Загрузка Python… Первый запуск может занять несколько минут.")
              : run.phase === "running"
                ? "Running Python…"
                : run.error
                  ? "Run stopped"
                  : run.results
                    ? `${run.results.filter((item) => item.passed).length} / ${run.results.length} tests passed`
                    : "Scratch run finished · not a source submission"}
          </strong>
          {run.error && <pre>{run.error}</pre>}
          {run.output && <pre>{run.output}</pre>}
          {run.results?.map((item, i) => (
            <p key={i}>
              {item.passed ? "✓" : "×"} Test {i + 1} · actual: {item.actual}
            </p>
          ))}
        </div>
      )}
      <div className="trainer-reflection">
        <label>
          Подход, ошибки, следующий шаг или ссылка на решение
          <textarea
            rows={3}
            maxLength={6000}
            value={state.notes}
            onChange={(event) => change({ notes: event.target.value })}
          />
        </label>
        <label>
          Дата повторения
          <input
            type="date"
            value={state.nextReview ?? ""}
            onChange={(event) =>
              change({ nextReview: event.target.value || null })
            }
          />
        </label>
      </div>
      <section className="trainer-attempt">
        <h3>Записать попытку</h3>
        <p>
          Просмотр ответа и прохождение тестов не означают самостоятельного
          освоения.
        </p>
        <div className="trainer-attempt-fields">
          <label>
            Результат
            <select
              value={outcome}
              onChange={(event) => setOutcome(event.target.value as Outcome)}
            >
              {Object.entries(outcomeNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Минуты
            <input
              type="number"
              min={0}
              max={1440}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </label>
          <label>
            Заметка к попытке
            <input
              maxLength={600}
              value={attemptNote}
              onChange={(event) => setAttemptNote(event.target.value)}
            />
          </label>
        </div>
        <button
          className="trainer-primary"
          disabled={saving}
          onClick={() => void recordAttempt()}
        >
          <Check size={16} />
          Сохранить попытку и назначить повторение
        </button>
        <small>
          Повторение: через 1 день, если нужна ещё попытка; через 3 дня — с
          помощью; через 7 — самостоятельно. Дату можно изменить.
        </small>
      </section>
      <div aria-live="polite">
        {error && (
          <p className="trainer-error" role="alert">
            {error}
          </p>
        )}
        {message && <p className="trainer-success">{message}</p>}
        {dirty && (
          <p className="trainer-caption">
            Unsaved changes · save before leaving this task.
          </p>
        )}
      </div>
      <details className="trainer-history">
        <summary>Attempt history · {state.attempts.length}</summary>
        {!state.attempts.length && (
          <p>No attempts yet. Record an outcome above after practicing.</p>
        )}
        {state.attempts.map((item) => (
          <div className="trainer-history-row" key={item.id}>
            <time>{new Date(item.recordedAt).toLocaleString()}</time>
            <label>
              <span className="sr-only">Attempt outcome</span>
              <select
                value={item.outcome}
                onChange={(event) =>
                  change({
                    attempts: state.attempts.map((entry) =>
                      entry.id === item.id
                        ? { ...entry, outcome: event.target.value as Outcome }
                        : entry,
                    ),
                  })
                }
              >
                {Object.entries(outcomeNames).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Attempt minutes</span>
              <input
                type="number"
                min={0}
                max={1440}
                value={item.minutes}
                onChange={(event) =>
                  change({
                    attempts: state.attempts.map((entry) =>
                      entry.id === item.id
                        ? { ...entry, minutes: Number(event.target.value) }
                        : entry,
                    ),
                  })
                }
              />
            </label>
            <label>
              <span className="sr-only">Attempt note</span>
              <input
                maxLength={600}
                value={item.note}
                onChange={(event) =>
                  change({
                    attempts: state.attempts.map((entry) =>
                      entry.id === item.id
                        ? { ...entry, note: event.target.value }
                        : entry,
                    ),
                  })
                }
              />
            </label>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Remove this attempt from history? Save the draft to apply the removal.",
                  )
                )
                  change({
                    attempts: state.attempts.filter(
                      (entry) => entry.id !== item.id,
                    ),
                  });
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </details>
    </section>
  );
}

export default function AlgorithmTrainer() {
  const cache = useQueryClient();
  const records = useQuery<PracticeRecord[]>({
    queryKey,
    queryFn: ({ signal }) =>
      preview ? Promise.resolve(previewRecords()) : request("", { signal }),
    retry: false,
  });
  const requestedTask = new URLSearchParams(location.search).get("task");
  const [selected, setSelected] = useState(requestedTask ?? catalog[0].id);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("All topics");
  const [difficulty, setDifficulty] = useState("All levels");
  const [mode, setMode] = useState(
    requestedTask
      ? mathTasks.some((item) => item.id === requestedTask)
        ? "math"
        : "library"
      : "path",
  );
  const [blockId, setBlockId] = useState("hash");
  const [showExtra, setShowExtra] = useState(false);
  const dirty = useRef(false);
  const saved = new Map(
    (records.data ?? []).map((record) => [record.problemId, record]),
  );
  const allProblems: Problem[] = [
    ...catalog,
    ...mathTasks,
    ...(records.data ?? [])
      .filter(
        (record) =>
          record.problemId.startsWith("custom-") && record.state.custom,
      )
      .map((record) => ({
        id: record.problemId,
        ...record.state.custom!,
        difficulty: "Personal",
        starter: "def solve(*args):\n    pass\n",
        hints: [],
        tests: record.state.custom!.tests.length
          ? record.state.custom!.tests
          : undefined,
      })),
  ];
  const topics = [...new Set(allProblems.map((item) => item.topic))];
  const block = learningBlocks.find((item) => item.id === blockId)!;
  const modeProblems =
    mode === "path"
      ? blockProblems(block).filter(
          (item) => showExtra || block.core.includes(item.id),
        )
      : mode === "mixed"
        ? mixedPractice(saved)
        : allProblems;
  const filtered = modeProblems
    .filter((item) => {
      const state = saved.get(item.id)?.state;
      return (
        (topic === "All topics" || topic === item.topic) &&
        (difficulty === "All levels" ||
          difficultyLevel(item.difficulty) === difficulty) &&
        `${item.title} ${item.id} ${item.topic} ${ruLabel(item.topic)} ${item.difficulty} ${ruLabel(item.difficulty)}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (["library", "path", "mixed"].includes(mode) ||
          (mode === "queue" && state?.queued) ||
          (mode === "due" && isDue(state)) ||
          (mode === "drills" && !!item.tests) ||
          (mode === "data" && item.track === "data") ||
          (mode === "math" && item.track === "math"))
      );
    })
    .sort((a, b) =>
      mode === "due"
        ? (saved.get(a.id)?.state.nextReview ?? "").localeCompare(
            saved.get(b.id)?.state.nextReview ?? "",
          )
        : 0,
    );
  const problem =
    allProblems.find((item) => item.id === selected) ?? catalog[0];
  const openProblem = (id: string) => {
    if (id === selected) return true;
    if (
      id !== selected &&
      dirty.current &&
      !confirm(
        "Есть несохранённый черновик. Сохраните или экспортируйте его перед переходом. Перейти без сохранения?",
      )
    )
      return false;
    dirty.current = false;
    setSelected(id);
    const url = new URL(location.href);
    url.searchParams.set("task", id);
    history.replaceState(null, "", url);
    return true;
  };
  const clearFilters = () => {
    setTopic("All topics");
    setDifficulty("All levels");
    setSearch("");
  };
  const chooseBlock = (id: string) => {
    const chosen = learningBlocks.find((item) => item.id === id)!;
    const next = nextInBlock(chosen, saved) ?? chosen.core[0];
    if (!openProblem(next)) return;
    setBlockId(id);
    setShowExtra(false);
    setMode("path");
    clearFilters();
  };
  const openMixed = () => {
    const candidate = mixedPractice(saved)[0];
    if (candidate && !openProblem(candidate.id)) return;
    setMode("mixed");
    clearFilters();
  };
  const save = async (record: PracticeRecord) => {
    const result = preview
      ? { ...record, version: record.version + 1 }
      : await request<PracticeRecord>(`/${record.problemId}`, {
          method: "PUT",
          body: JSON.stringify({
            version: record.version,
            state: record.state,
          }),
        });
    const next = [
      ...(cache.getQueryData<PracticeRecord[]>(queryKey) ?? []).filter(
        (entry) => entry.problemId !== record.problemId,
      ),
      result,
    ];
    if (preview)
      sessionStorage.setItem(previewStorageKey, JSON.stringify(next));
    cache.setQueryData<PracticeRecord[]>(queryKey, next);
    return result;
  };
  return (
    <div className="algorithm-room">
      <header
        className="trainer-hero"
        style={{
          backgroundImage: `linear-gradient(90deg,rgba(7,12,18,.94),rgba(7,12,18,.56)),url(${scene})`,
        }}
      >
        <p className="trainer-eyebrow">
          Алгоритмы · анализ данных · математика
        </p>
        <h1>Практикум</h1>
        <p>
          Паттерн → базовая задача → перенос → самостоятельная проверка →
          повторение.
        </p>
        <div className="trainer-readouts">
          <span>
            <Code2 size={16} />
            {allProblems.length} problems
          </span>
          <span>
            <Check size={16} />
            {
              [...saved.values()].filter(
                (record) => record.state.attempts.length,
              ).length
            }{" "}
            practiced
          </span>
          <span>
            <Clock size={16} />
            {
              [...saved.values()].filter((record) => isDue(record.state)).length
            }{" "}
            due for repetition
          </span>
        </div>
      </header>
      {preview && (
        <p className="trainer-notice">
          Тестовый режим: Python выполняется реально. Прогресс хранится только в
          этой вкладке и восстанавливается после перезагрузки; аккаунт не
          изменяется.
        </p>
      )}
      {requestedTask &&
        !allProblems.some((item) => item.id === requestedTask) && (
          <p className="trainer-error" role="alert">
            Задача по ссылке не найдена. Выберите задачу из каталога;
            сохранённый прогресс не изменён.
          </p>
        )}
      <div className="trainer-layout">
        <aside className="trainer-library" aria-label="Problem library">
          <div className="trainer-filter">
            <label>
              <Search size={16} />
              <span className="sr-only">Search problems</span>
              <input
                placeholder="Поиск задач…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {mode !== "path" && mode !== "mixed" && (
              <label>
                <span className="sr-only">Topic</span>
                <select
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                >
                  <option value="All topics">Все темы</option>
                  {topics.map((value) => (
                    <option key={value} value={value}>
                      {ruLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              <span className="sr-only">Difficulty</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                {["All levels", "Easy", "Medium", "Hard"].map((value) => (
                  <option key={value} value={value}>
                    {ruLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <div className="trainer-modes">
              {[
                ["path", "Учебный маршрут"],
                ["library", "Все"],
                ["due", "Повторение"],
              ].map(([value, name]) => (
                <button
                  key={value}
                  aria-pressed={mode === value}
                  onClick={() => {
                    if (value === "path")
                      chooseBlock(blockFor(problem)?.id ?? blockId);
                    else {
                      setMode(value);
                      clearFilters();
                    }
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <details
              className="trainer-extra-filters"
              open={
                ["queue", "drills", "data", "mixed"].includes(mode)
                  ? true
                  : undefined
              }
            >
              <summary>Другие подборки</summary>
              <div className="trainer-modes">
                {[
                  ["queue", "Моя очередь"],
                  ["drills", "Локальные задачи"],
                  ["data", "Анализ данных"],
                  ["math", "Математика"],
                  ["mixed", "Смешанная практика"],
                ].map(([value, name]) => (
                  <button
                    key={value}
                    aria-pressed={mode === value}
                    onClick={() => {
                      if (value === "mixed") openMixed();
                      else {
                        setMode(value);
                        clearFilters();
                      }
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </details>
            {mode === "path" && (
              <label>
                Тематический блок
                <select
                  value={blockId}
                  onChange={(event) => chooseBlock(event.target.value)}
                >
                  {learningBlocks.map((item, index) => {
                    const progress = blockProgress(item, saved);
                    return (
                      <option key={item.id} value={item.id}>
                        {String(index + 1).padStart(2, "0")} · {item.title} ·{" "}
                        {progress.independent}/{progress.total}
                      </option>
                    );
                  })}
                </select>
              </label>
            )}
            {mode === "path" && (
              <button
                aria-pressed={showExtra}
                onClick={() => setShowExtra(!showExtra)}
              >
                {showExtra
                  ? "Скрыть дополнительные"
                  : `Дополнительные задачи · ${blockProblems(block).length - block.core.length}`}
              </button>
            )}
            <small>
              Найдено задач: {filtered.length} · Разминка — этап маршрута, не
              отдельная сложность.
            </small>
          </div>
          <div className="trainer-problem-list">
            {filtered.map((item) => (
              <button
                className="trainer-list-item"
                key={item.id}
                aria-pressed={selected === item.id}
                onClick={() => openProblem(item.id)}
              >
                <span>{item.title}</span>
                <small>
                  {mode === "path"
                    ? taskStage(block, item)
                    : mode === "mixed"
                      ? "Паттерн не указан"
                      : ruLabel(item.topic)}{" "}
                  · {ruLabel(item.difficulty)}
                  {saved.get(item.id)?.state.queued ? " · Queued" : ""}
                  {isDue(saved.get(item.id)?.state) ? " · Due" : ""}
                </small>
                <small>
                  {latestOutcome(saved.get(item.id)) === "independent"
                    ? "✓ Самостоятельно · "
                    : latestOutcome(saved.get(item.id)) === "assisted"
                      ? "С помощью · "
                      : ""}
                  {provenance(item).label}
                </small>
              </button>
            ))}
            {!filtered.length && (
              <p className="trainer-empty">
                {mode === "mixed"
                  ? "Сначала сохраните хотя бы одну попытку в учебном маршруте. Затем здесь появятся задачи из разных пройденных блоков для повторения и переноса."
                  : "Нет задач с такими фильтрами. Сбросьте поиск или откройте «Все»."}
              </p>
            )}
          </div>
          <details className="trainer-sources">
            <summary>Add an interview task</summary>
            <CustomTaskForm
              onSave={async (custom) => {
                if (
                  dirty.current &&
                  !confirm(
                    "Save or export the current task before switching. Discard its unsaved changes?",
                  )
                )
                  throw new Error(
                    "Current draft kept. Save it, then add the new task.",
                  );
                const problemId = `custom-${crypto.randomUUID()}`;
                await save({
                  problemId,
                  version: 0,
                  state: {
                    ...emptyState("def solve(*args):\n    pass\n"),
                    queued: true,
                    custom,
                  },
                });
                dirty.current = false;
                setSelected(problemId);
                setTopic("All topics");
                setDifficulty("All levels");
                setSearch("");
                setMode("queue");
              }}
            />
          </details>
          <Sources />
          <button
            onClick={() =>
              download(
                {
                  schemaVersion: 1,
                  exportedAt: new Date().toISOString(),
                  records: records.data ?? [],
                },
                "algorithm-progress.json",
              )
            }
            disabled={!records.data}
          >
            <Download size={16} /> Export saved progress
          </button>
        </aside>
        {records.isPending ? (
          <section className="trainer-workspace" role="status">
            Loading your practice history…
          </section>
        ) : records.isError ? (
          <section className="trainer-workspace">
            <h2>Your history could not be loaded</h2>
            <p role="alert">{records.error.message}</p>
            <p>Nothing has been replaced. Retry before starting a new draft.</p>
            <button onClick={() => void records.refetch()}>
              Retry loading
            </button>
          </section>
        ) : (
          <div className="trainer-study-column">
            {mode === "path" && (
              <LearningGuide
                block={block}
                saved={saved}
                selected={selected}
                onChoose={chooseBlock}
                onOpen={(id) => {
                  if (openProblem(id)) clearFilters();
                }}
                onRepeat={openMixed}
              />
            )}
            {mode === "mixed" && (
              <section className="trainer-learning-guide">
                <p className="trainer-eyebrow">Перенос · разные паттерны</p>
                <h2>Смешанная практика</h2>
                <p className="trainer-learning-outcome">
                  По одной задаче из каждого начатого алгоритмического блока.
                  Сначала — просроченное повторение, затем нерешённая вариация.
                  Это учебная выборка, не симуляция конкретной компании.
                </p>
                <p className="trainer-caption">
                  Не смотрите подсказки до попытки. Объясните ограничения,
                  подход, инвариант и сложность; сохраните честную оценку
                  результата.
                </p>
              </section>
            )}
            <Workspace
              key={selected}
              problem={problem}
              record={saved.get(selected)}
              save={save}
              hidePattern={mode === "mixed"}
              onDirty={(value) => {
                dirty.current = value;
              }}
            />
            {mode !== "path" && blockFor(problem) && (
              <button onClick={() => chooseBlock(blockFor(problem)!.id)}>
                Открыть учебный блок этой задачи →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
