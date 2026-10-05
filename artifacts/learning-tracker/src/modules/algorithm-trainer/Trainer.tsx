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
import CustomTaskForm from "./CustomTaskForm";
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

const preview =
  import.meta.env.DEV && new URLSearchParams(location.search).has("preview");
const queryKey = ["algorithm-trainer", preview];
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
  independent: "Solved independently",
  assisted: "Solved with help",
  retry: "Needs another attempt",
};
type RunResult = {
  phase: string;
  output?: string;
  error?: string;
  results?: { passed: boolean; actual: string }[] | null;
};

function Workspace({
  problem,
  record,
  save,
  onDirty,
}: {
  problem: Problem;
  record?: PracticeRecord;
  save: (value: PracticeRecord) => Promise<PracticeRecord>;
  onDirty: (dirty: boolean) => void;
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
        destination.pathname !== location.pathname &&
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
      90000,
      "Python download timed out. Check access to jsDelivr and retry; your draft is unchanged.",
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
    instance.postMessage({ code: state.code, tests: activeProblem.tests });
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
            {activeProblem.topic} / {problem.difficulty}
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
      <div className="trainer-statement">
        {activeProblem.statement ? (
          <p style={{ whiteSpace: "pre-wrap" }}>{activeProblem.statement}</p>
        ) : (
          <>
            <p>
              This is a linked source problem. Read its original statement,
              constraints and examples before working here.
            </p>
            {activeProblem.url && (
              <a
                href={activeProblem.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={16} /> Open original source
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
            <summary>
              Examples & test cases · {activeProblem.tests.length}
            </summary>
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
                Reveal hint {hints + 1} / {problem.hints.length}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="trainer-codebar">
        <span>
          <Code2 size={16} /> Python · browser runtime
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
        <span className="sr-only">Python solution draft</span>
        <textarea
          className="trainer-editor"
          spellCheck={false}
          value={state.code}
          maxLength={24000}
          onChange={(event) => change({ code: event.target.value })}
        />
      </label>
      <div className="trainer-actions">
        <button className="trainer-primary" onClick={execute} disabled={busy}>
          <Play size={16} />
          {activeProblem.tests ? "Run tests" : "Run scratch code"}
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
        <button disabled={saving} onClick={() => void persist()}>
          <Save size={16} />
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          onClick={() => {
            download({ problem, ...state }, `${problem.id}-draft.json`);
            setMessage("Draft exported.");
          }}
        >
          <Download size={16} /> Export draft
        </button>
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
      </div>
      <p className="trainer-caption">
        Python downloads on demand from jsDelivr. Runs stay in your browser,
        stop after 10 seconds and never execute on the site server. Run only
        code you trust. Tests check examples, not complexity or a proof of
        correctness.
      </p>
      {run && (
        <div className="trainer-console" role="status" aria-live="polite">
          <strong>
            {run.phase === "loading"
              ? "Downloading Python… first run may take a moment."
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
          Approach, mistakes & next step
          <textarea
            rows={3}
            maxLength={6000}
            value={state.notes}
            onChange={(event) => change({ notes: event.target.value })}
          />
        </label>
        <label>
          Next repetition
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
        <h3>Record this attempt</h3>
        <p>Passing tests does not automatically mean independent mastery.</p>
        <div className="trainer-attempt-fields">
          <label>
            Outcome
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
            Minutes
            <input
              type="number"
              min={0}
              max={1440}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </label>
          <label>
            Attempt note
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
          Save attempt & schedule repetition
        </button>
        <small>
          Repeat in 1 day after a retry, 3 days with help, 7 days independently.
          You can change the date.
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
      preview ? Promise.resolve([]) : request("", { signal }),
    retry: false,
  });
  const [selected, setSelected] = useState(catalog[0].id);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("All topics");
  const [difficulty, setDifficulty] = useState("All levels");
  const [mode, setMode] = useState("library");
  const dirty = useRef(false);
  const saved = new Map(
    (records.data ?? []).map((record) => [record.problemId, record]),
  );
  const allProblems: Problem[] = [
    ...catalog,
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
  const filtered = allProblems
    .filter((item) => {
      const state = saved.get(item.id)?.state;
      return (
        (topic === "All topics" || topic === item.topic) &&
        (difficulty === "All levels" || item.difficulty === difficulty) &&
        `${item.title} ${item.topic} ${item.difficulty}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (mode === "library" ||
          (mode === "queue" && state?.queued) ||
          (mode === "due" && isDue(state)) ||
          (mode === "drills" && !!item.tests))
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
    cache.setQueryData<PracticeRecord[]>(queryKey, (current = []) => [
      ...current.filter((entry) => entry.problemId !== record.problemId),
      result,
    ]);
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
          Algorithm practice / a separate training module
        </p>
        <h1>Algorithm room</h1>
        <p>One problem. A deliberate attempt. A clearer next step.</p>
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
          Design preview · Python runs are real; progress is temporary and does
          not change your account.
        </p>
      )}
      <div className="trainer-layout">
        <aside className="trainer-library" aria-label="Problem library">
          <div className="trainer-filter">
            <label>
              <Search size={16} />
              <span className="sr-only">Search problems</span>
              <input
                placeholder="Search problems…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Topic</span>
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                <option>All topics</option>
                {topics.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Difficulty</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                {[
                  "All levels",
                  "Foundation",
                  "Easy",
                  "Medium",
                  "Hard",
                  "Personal",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <div className="trainer-modes">
              {[
                ["library", "All"],
                ["queue", "My queue"],
                ["due", "Repeat"],
                ["drills", "Local drills"],
              ].map(([value, name]) => (
                <button
                  key={value}
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  {name}
                </button>
              ))}
            </div>
            <small>{filtered.length} matching problems</small>
          </div>
          <div className="trainer-problem-list">
            {filtered.map((item) => (
              <button
                className="trainer-list-item"
                key={item.id}
                aria-pressed={selected === item.id}
                onClick={() => {
                  if (
                    item.id !== selected &&
                    dirty.current &&
                    !confirm(
                      "Leave this task with unsaved changes? Export or save the draft first to keep it.",
                    )
                  )
                    return;
                  dirty.current = false;
                  setSelected(item.id);
                }}
              >
                <span>{item.title}</span>
                <small>
                  {item.topic} · {item.difficulty}
                  {saved.get(item.id)?.state.queued ? " · Queued" : ""}
                  {isDue(saved.get(item.id)?.state) ? " · Due" : ""}
                </small>
              </button>
            ))}
            {!filtered.length && (
              <p className="trainer-empty">
                No tasks in this view. Open All, choose a task and add it to
                your queue.
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
          <details className="trainer-sources">
            <summary>Sources & provenance</summary>
            <p>
              Original dōjō drills have local tests. External tasks are links
              only, not imported statements or solutions.
            </p>
            <a
              href="https://github.com/seanprashad/leetcode-patterns"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pattern-based reference
            </a>
            <a
              href="https://github.com/neetcode-gh/leetcode"
              target="_blank"
              rel="noopener noreferrer"
            >
              NeetCode solution reference
            </a>
            <p>No claim is made about current company interview frequency.</p>
          </details>
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
          <Workspace
            key={selected}
            problem={problem}
            record={saved.get(selected)}
            save={save}
            onDirty={(value) => {
              dirty.current = value;
            }}
          />
        )}
      </div>
    </div>
  );
}
