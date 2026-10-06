import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import { PgDialect } from "drizzle-orm/pg-core";
import { runWithDatabase, type Database } from "@workspace/db";
import router from "./learning-sprints";
import { curriculumKey } from "../lib/learning-sprint";
test("learning sprint HTTP upserts one parent, restores edits, isolates legacy records and rejects conflicts", async () => {
  const dialect = new PgDialect();
  const parents = new Map<string, number>();
  const steps = new Map<
    number,
    { lessonNumber: number; version: number; state: unknown }
  >();
  const legacy = {
    id: 77,
    notes: "Прежний матспринт",
    completedAt: "2026-09-01",
  };
  const legacySnapshot = JSON.stringify(legacy);
  let unavailable = false;
  const database = {
    execute: async (query: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      if (unavailable) throw new Error("Simulated connection failure");
      const { sql, params } = dialect.sqlToQuery(query);
      const text = sql.trim();
      if (text.startsWith("CREATE") || text.startsWith("ALTER"))
        return { rows: [] };
      if (text.startsWith("INSERT INTO sprints ")) {
        if (!parents.has(String(params[0]))) parents.set(String(params[0]), 1);
        return { rows: [] };
      }
      if (text.startsWith("SELECT id FROM sprints"))
        return { rows: parents.has(String(params[0])) ? [{ id: 1 }] : [] };
      if (text.startsWith("INSERT INTO sprint_steps ")) {
        const position = Number(params[2]);
        if (!steps.has(position))
          steps.set(position, {
            lessonNumber: position + 1,
            version: 0,
            state: null,
          });
        return { rows: [] };
      }
      if (text.startsWith("UPDATE sprint_steps")) {
        const [serialized, , , , , position, version] = params;
        const record = steps.get(Number(position));
        if (!record || record.version !== version) return { rows: [] };
        const result = {
          ...record,
          version: record.version + 1,
          state: JSON.parse(String(serialized)),
        };
        steps.set(Number(position), result);
        return { rows: [result] };
      }
      if (text.startsWith("SELECT st.position"))
        return {
          rows: [...steps.values()]
            .filter((item) => item.state)
            .sort((a, b) => a.lessonNumber - b.lessonNumber),
        };
      throw new Error(`Unexpected SQL: ${text}`);
    },
    transaction: async (
      callback: (transaction: unknown) => Promise<unknown>,
    ) => {
      const previousParents = new Map(parents),
        previousSteps = new Map(steps);
      try {
        return await callback(database);
      } catch (error) {
        parents.clear();
        steps.clear();
        for (const [key, value] of previousParents) parents.set(key, value);
        for (const [key, value] of previousSteps) steps.set(key, value);
        throw error;
      }
    },
  } as unknown as Database;
  const app = express();
  app.use(express.json());
  app.use((_req, _res, next) => runWithDatabase(database, next));
  app.use(router);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/sprints/curricula/${curriculumKey}`;
  const state = {
    status: "in_progress",
    viewed: true,
    practiced: false,
    criterionConfirmed: false,
    notes: "Первая попытка",
    solution: "Σ",
    solutionUrl: "",
    plannedDate: null as string | null,
    sessions: [
      {
        id: crypto.randomUUID(),
        recordedAt: new Date().toISOString(),
        minutes: 25,
        note: "Часть занятия",
      },
    ],
  };
  const put = (day: number, version: number, next = state) =>
    fetch(`${base}/lessons/${day}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version, state: next }),
    });
  try {
    assert.deepEqual(await (await fetch(base)).json(), []);
    assert.equal(parents.size, 0);
    let response = await put(1, 0);
    assert.equal(response.status, 200);
    const saved = await response.json() as { version: number };
    assert.equal(saved.version, 1);
    assert.equal(parents.size, 1);
    assert.equal(steps.size, 13);
    assert.equal(JSON.stringify(legacy), legacySnapshot);
    assert.deepEqual(await (await fetch(base)).json(), [saved]);
    assert.equal((await put(1, 0)).status, 409);
    response = await put(1, 1, {
      ...state,
      plannedDate: "2026-10-10",
      notes: "Перенесено",
    });
    assert.equal(response.status, 200);
    const shifted = await response.json() as { state: typeof state };
    assert.equal(shifted.state.sessions.length, 1);
    assert.equal(shifted.state.plannedDate, "2026-10-10");
    assert.equal((await put(13, 0)).status, 200);
    assert.equal(parents.size, 1);
    assert.equal(steps.size, 13);
    assert.equal(
      (await put(2, 0, { ...state, status: "completed" })).status,
      400,
    );
    unavailable = true;
    assert.equal((await fetch(base)).status, 503);
    unavailable = false;
    const restored = await (await fetch(base)).json() as { state: typeof state }[];
    assert.equal(restored[0].state.notes, "Перенесено");
    assert.equal(restored.length, 2);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
