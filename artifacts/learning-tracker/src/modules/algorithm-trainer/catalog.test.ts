import test from "node:test";
import assert from "node:assert/strict";
import { catalog, drills } from "./catalog.ts";
import { russianTitles, ruLabel } from "./russian.ts";
test("catalog has 150 distinct source links and 10 runnable original exercises", () => {
  assert.equal(catalog.length, 160);
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
    assert.match(ruLabel(item.topic), /[а-яё]/i);
    assert.match(ruLabel(item.difficulty), /[а-яё]/i);
  }
  assert.equal(ruLabel("Моя тема"), "Моя тема");
});
