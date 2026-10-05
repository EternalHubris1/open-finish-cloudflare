import test from "node:test";
import assert from "node:assert/strict";
import { catalog, drills } from "./catalog.ts";
import { russianTitles, ruLabel } from "./russian.ts";
import { dataDrills } from "./data-drills.ts";
import { practiceNotebook } from "./notebook.ts";
test("catalog has 150 distinct source links and 10 runnable original exercises", () => {
  assert.equal(catalog.length, 168);
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  assert.equal(drills.length, 10);
  for (const item of drills) {
    assert.ok(item.tests && item.tests.length >= 3);
    assert.ok(item.statement);
    assert.match(item.statement!, /[а-яё]/i);
    assert.ok(item.hints.every((hint) => /[а-яё]/i.test(hint)));
    assert.match(item.starter, /^def solve\(/);
  }
  for (const item of catalog.filter((item) => item.url)) {
    assert.equal(new URL(item.url!).hostname, "leetcode.com");
    assert.equal(item.statement, undefined);
    assert.equal(item.title, russianTitles[item.id.slice(3)]);
    assert.match(item.title, /[а-яё]/i);
  }
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
