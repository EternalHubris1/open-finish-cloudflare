import { useState, type FormEvent } from "react";
import type { CustomProblem } from "../../../../../modules/algorithm-trainer/model";
export default function CustomTaskForm({
  initial,
  onSave,
  editing = false,
}: {
  initial?: CustomProblem;
  onSave: (value: CustomProblem) => Promise<void> | void;
  editing?: boolean;
}) {
  const [value, setValue] = useState<CustomProblem>(
    () =>
      initial ?? {
        title: "",
        topic: "Personal interviews",
        url: "",
        statement: "",
        tests: [],
      },
  );
  const [tests, setTests] = useState(JSON.stringify(value.tests, null, 2));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const parsed = JSON.parse(tests) as CustomProblem["tests"];
      if (
        !Array.isArray(parsed) ||
        parsed.length > 50 ||
        parsed.some(
          (item) =>
            !item ||
            !Array.isArray(item.args) ||
            item.args.length > 20 ||
            !("expected" in item),
        )
      )
        throw new Error(
          'Tests must be a JSON array like [{"args": [[1,2,1]], "expected": 1}], up to 50 cases.',
        );
      const url = value.url.trim();
      if (url) {
        const source = new URL(url);
        if (
          !["https:", "http:"].includes(source.protocol) ||
          source.username ||
          source.password
        )
          throw new Error(
            "Use a plain HTTP(S) source link, without credentials.",
          );
      }
      if (!value.title.trim() || !value.topic.trim())
        throw new Error("Add a task name and topic.");
      setPending(true);
      await onSave({
        ...value,
        title: value.title.trim(),
        topic: value.topic.trim(),
        url,
        tests: parsed,
      });
      if (!editing) {
        setValue({
          title: "",
          topic: "Personal interviews",
          url: "",
          statement: "",
          tests: [],
        });
        setTests("[]");
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Task could not be saved. Keep this form and retry.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <form className="trainer-custom" onSubmit={(event) => void submit(event)}>
      <label>
        Task name
        <input
          required
          maxLength={140}
          value={value.title}
          onChange={(event) =>
            setValue({ ...value, title: event.target.value })
          }
        />
      </label>
      <label>
        Topic
        <input
          required
          maxLength={80}
          value={value.topic}
          onChange={(event) =>
            setValue({ ...value, topic: event.target.value })
          }
        />
      </label>
      <label>
        Source link (optional)
        <input
          type="url"
          maxLength={2000}
          value={value.url}
          onChange={(event) => setValue({ ...value, url: event.target.value })}
        />
      </label>
      <label>
        Your problem statement
        <textarea
          rows={4}
          maxLength={10000}
          value={value.statement}
          onChange={(event) =>
            setValue({ ...value, statement: event.target.value })
          }
        />
      </label>
      <label>
        Tests · JSON
        <textarea
          rows={4}
          spellCheck={false}
          value={tests}
          maxLength={18000}
          onChange={(event) => setTests(event.target.value)}
        />
      </label>
      <p className="trainer-caption">
        Optional: [{'{"args": [[1,2,1]], "expected": 1}'}]. Each case calls
        solve(*args). Use your own or permissioned statements and tests.
      </p>
      <button disabled={pending} type="submit">
        {pending
          ? "Saving task…"
          : editing
            ? "Apply to draft"
            : "Add personal task"}
      </button>
      {error && (
        <p role="alert" className="trainer-error">
          {error}
        </p>
      )}
    </form>
  );
}
