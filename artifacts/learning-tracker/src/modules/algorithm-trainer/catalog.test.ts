import test from "node:test";
import assert from "node:assert/strict";
import { catalog, drills } from "./catalog.ts";
import { russianTitles, ruLabel } from "./russian.ts";
import { dataDrills } from "./data-drills.ts";
import { practiceNotebook } from "./notebook.ts";
import { adaptations } from "./adaptations.ts";
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
} from "./learning-path.ts";
import { learningSources, officialPrepSlugs, provenance } from "./sources.ts";
import {
  emptyState,
  type PracticeRecord,
} from "../../../../../modules/algorithm-trainer/model.ts";
test("catalog has stable unique IDs, 159 LeetCode references, 5 candidate reports and original exercises", () => {
  assert.equal(catalog.length, 182);
  assert.equal(catalog.filter((item) => item.id.startsWith("lc-")).length, 159);
  assert.equal(
    catalog.filter((item) => item.id.startsWith("dojo-interview-")).length,
    5,
  );
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  assert.equal(drills.length, 10);
  for (const item of drills) {
    assert.ok(item.tests && item.tests.length >= 3);
    assert.ok(item.statement);
    assert.match(item.statement!, /[а-яё]/i);
    assert.ok(item.hints.every((hint) => /[а-яё]/i.test(hint)));
    assert.match(item.starter, /^def solve\(/);
  }
  for (const item of catalog.filter((item) => item.id.startsWith("lc-"))) {
    assert.equal(new URL(item.url!).hostname, "leetcode.com");
    if (adaptations[item.id.slice(3)]) {
      assert.ok(item.tests && item.tests.length >= 4);
      assert.match(item.statement!, /[а-яё]/i);
      assert.match(item.starter, /^def solve\(/);
    } else assert.equal(item.statement, undefined);
    assert.equal(item.title, russianTitles[item.id.slice(3)]);
    assert.match(item.title, /[а-яё]/i);
  }
});
test("every catalog entry belongs to a coherent block, with unique core tasks and acyclic prerequisites", () => {
  assert.equal(learningBlocks.length, 18);
  const preceding = new Set<string>();
  const coreIds = new Set<string>();
  for (const block of learningBlocks) {
    assert.ok(
      block.prerequisites.every((id) => preceding.has(id)),
      block.id,
    );
    preceding.add(block.id);
    for (const id of block.core) {
      const problem = catalog.find((item) => item.id === id);
      assert.ok(problem, id);
      assert.equal(blockFor(problem!)?.id, block.id, id);
      assert.ok(!coreIds.has(id), id);
      coreIds.add(id);
    }
    const problems = blockProblems(block);
    assert.equal(
      new Set(problems.map((item) => item.id)).size,
      problems.length,
    );
    assert.deepEqual(
      problems.slice(0, block.core.length).map((item) => item.id),
      block.core,
    );
    for (const problem of problems.slice(block.core.length))
      assert.equal(taskStage(block, problem), "Дополнительно");
    assert.equal(
      taskStage(
        block,
        catalog.find((problem) => problem.id === block.core.at(-1))!,
      ),
      "Самопроверка",
    );
    assert.ok(
      block.sources.every((id) =>
        learningSources.some((source) => source.id === id),
      ),
    );
  }
  for (const problem of catalog) assert.ok(blockFor(problem), problem.id);
  assert.equal(
    blockFor(catalog.find((item) => item.id === "lc-generate-parentheses")!)
      ?.id,
    "backtracking",
  );
});
function record(
  id: string,
  outcome: "independent" | "assisted" | "retry",
  nextReview: string | null = null,
): PracticeRecord {
  return {
    problemId: id,
    version: 1,
    state: {
      ...emptyState(),
      nextReview,
      attempts: [
        {
          id: "one",
          recordedAt: "2026-10-05T10:00:00Z",
          minutes: 10,
          outcome,
          note: "",
        },
      ],
    },
  };
}
test("progress uses latest saved assessment, recommendations prioritize reviews, and drafts never count", () => {
  const block = learningBlocks[0];
  const saved = new Map<string, PracticeRecord>();
  saved.set(block.core[0], {
    problemId: block.core[0],
    version: 1,
    state: emptyState("finished-looking code"),
  });
  assert.equal(blockProgress(block, saved).independent, 0);
  assert.equal(nextInBlock(block, saved, "2026-10-06"), block.core[0]);
  saved.set(block.core[0], record(block.core[0], "independent", "2026-10-20"));
  assert.equal(blockProgress(block, saved).independent, 1);
  assert.equal(nextInBlock(block, saved, "2026-10-06"), block.core[1]);
  saved.set(block.core[3], record(block.core[3], "assisted", "2026-10-04"));
  assert.equal(nextInBlock(block, saved, "2026-10-06"), block.core[3]);
  const changed = record(block.core[0], "independent");
  changed.state.attempts.unshift({
    id: "two",
    recordedAt: "2026-10-06T10:00:00Z",
    minutes: 5,
    outcome: "retry",
    note: "",
  });
  assert.equal(latestOutcome(changed), "retry");
  saved.set(block.core[0], changed);
  assert.equal(blockProgress(block, saved).independent, 0);
  for (const id of block.core)
    saved.set(id, record(id, "independent", "2026-10-20"));
  assert.equal(nextInBlock(block, saved, "2026-10-06"), undefined);
});
test("mixed practice is deterministic, drawn only from attempted algorithm blocks and not duplicated", () => {
  assert.deepEqual(mixedPractice(new Map(), "2026-10-06"), []);
  const saved = new Map<string, PracticeRecord>();
  saved.set("lc-two-sum", record("lc-two-sum", "independent", "2026-10-01"));
  saved.set("lc-valid-palindrome", record("lc-valid-palindrome", "assisted"));
  saved.set("dojo-data-filter", record("dojo-data-filter", "independent"));
  const tasks = mixedPractice(saved, "2026-10-06");
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].id, "lc-two-sum");
  assert.equal(new Set(tasks.map((item) => item.id)).size, tasks.length);
  assert.ok(tasks.every((item) => item.track !== "data"));
});
test("official examples, employer recommendations, community reports and original exercises stay distinct", () => {
  for (const slug of officialPrepSlugs) {
    const task = catalog.find((item) => item.id === `lc-${slug}`)!;
    assert.ok(task);
    assert.equal(
      provenance(task).label,
      "Официальная рекомендация для подготовки",
    );
  }
  assert.equal(
    provenance(catalog.find((item) => item.id === "lc-valid-anagram")!).label,
    "Официальный пример интервью",
  );
  assert.equal(
    provenance(catalog.find((item) => item.id === "lc-two-sum")!).label,
    "Список рекрутеров · по словам автора",
  );
  assert.equal(provenance(drills[0]).label, "Авторское упражнение");
  for (const task of catalog.filter((item) =>
    item.id.startsWith("dojo-interview-"),
  )) {
    assert.equal(provenance(task).label, "Отчёт кандидата · не подтверждён");
    assert.equal(task.tests, undefined);
    assert.equal(new URL(task.url!).hostname, "github.com");
  }
  assert.equal(difficultyLevel("Foundation"), "Easy");
  assert.equal(ruLabel("Foundation"), ruLabel("Easy"));
});
test("Russian labels preserve filter values and personal text", () => {
  for (const item of catalog) {
    assert.ok(
      /[а-яё]/i.test(ruLabel(item.topic)) ||
        ["pandas", "NumPy", "ML / scikit-learn"].includes(item.topic),
    );
    assert.match(ruLabel(item.difficulty), /[а-яё]/i);
  }
  assert.equal(ruLabel("Моя тема"), "Моя тема");
});
test("data drills have runnable fixtures, supported packages and stable dojo IDs", () => {
  assert.equal(dataDrills.length, 8);
  for (const problem of dataDrills) {
    assert.match(problem.id, /^dojo-data-/);
    if (problem.colabOnly) {
      assert.ok(problem.notebookSetup);
      continue;
    }
    assert.ok(problem.tests && problem.tests.length >= 3);
    assert.ok(
      problem.packages?.every((name) => ["numpy", "pandas"].includes(name)),
    );
    assert.match(problem.statement!, /[а-яё]/i);
    assert.ok(problem.starter.includes("def solve("));
  }
});
test("Colab notebook includes current draft and fixtures without running code on export", () => {
  const code = "def solve(rows, threshold):\n    return []\n";
  const notebook = practiceNotebook(dataDrills[2], code);
  assert.equal(notebook.nbformat, 4);
  assert.equal(notebook.metadata.kernelspec.name, "python3");
  assert.ok(notebook.cells.some((cell) => cell.source === code));
  assert.ok(
    notebook.cells.some((cell) =>
      cell.source.includes("автоматической синхронизации"),
    ),
  );
  assert.ok(
    notebook.cells.every(
      (cell) =>
        cell.cell_type !== "code" ||
        (cell.execution_count === null && cell.outputs?.length === 0),
    ),
  );
});
