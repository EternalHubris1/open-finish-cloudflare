import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import { PgDialect } from "drizzle-orm/pg-core";
import { runWithDatabase, type Database } from "@workspace/db";
import router from "./algorithm-trainer";
test("trainer HTTP preserves records and rejects stale updates", async () => {
  const records = new Map<
    string,
    { problemId: string; version: number; state: unknown }
  >();
  const dialect = new PgDialect();
  let unavailable = false;
  const database = {
    execute: async (query: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      if (unavailable) throw new Error("Simulated unavailable database");
      const { sql, params } = dialect.sqlToQuery(query);
      if (sql.startsWith("CREATE")) return { rows: [] };
      if (sql.startsWith("SELECT")) return { rows: [...records.values()] };
      if (sql.startsWith("INSERT")) {
        const [id, state] = params as [string, string];
        if (records.has(id)) return { rows: [] };
        const record = { problemId: id, version: 1, state: JSON.parse(state) };
        records.set(id, record);
        return { rows: [record] };
      }
      const [state, id, version] = params as [string, string, number];
      const existing = records.get(id);
      if (!existing || existing.version !== version) return { rows: [] };
      const record = {
        problemId: id,
        version: version + 1,
        state: JSON.parse(state),
      };
      records.set(id, record);
      return { rows: [record] };
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
  const base = `http://127.0.0.1:${address.port}`;
  const state: {
    code: string;
    notes: string;
    attempts: never[];
    queued: boolean;
    nextReview: string | null;
  } = {
    code: "def solve(): pass",
    notes: "first draft",
    attempts: [],
    queued: true,
    nextReview: null,
  };
  const put = (version: number, nextState = state) =>
    fetch(`${base}/algorithm-trainer/dojo-first-repeat`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version, state: nextState }),
    });
  try {
    const created = await put(0);
    assert.equal(created.status, 200);
    assert.equal(((await created.json()) as { version: number }).version, 1);
    assert.equal((await put(0)).status, 409);
    assert.equal((await put(1, { ...state, notes: "corrected" })).status, 200);
    assert.equal((await put(1)).status, 409);
    const loaded = await fetch(`${base}/algorithm-trainer`);
    const result = (await loaded.json()) as {
      version: number;
      state: typeof state;
    }[];
    assert.equal(result[0].version, 2);
    assert.equal(result[0].state.notes, "corrected");
    assert.equal(
      (await put(2, { ...state, nextReview: "2026-02-30" })).status,
      400,
    );
    unavailable = true;
    assert.equal((await put(2)).status, 503);
    assert.equal(records.get("dojo-first-repeat")?.version, 2);
  } finally {
    server.close();
    await once(server, "close");
  }
});
