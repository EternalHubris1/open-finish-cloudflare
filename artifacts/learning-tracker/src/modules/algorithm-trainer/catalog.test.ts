import test from "node:test";
import assert from "node:assert/strict";
import { catalog, drills } from "./catalog.ts";
test("catalog has 150 distinct source links and 10 runnable original exercises", () => {
  assert.equal(catalog.length, 160);
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  assert.equal(drills.length, 10);
  for (const item of drills) {
    assert.ok(item.tests && item.tests.length >= 3);
    assert.ok(item.statement);
    assert.match(item.starter, /^def solve\(/);
  }
  for (const item of catalog.filter((item) => item.url)) {
    assert.equal(new URL(item.url!).hostname, "leetcode.com");
    assert.equal(item.statement, undefined);
  }
});
