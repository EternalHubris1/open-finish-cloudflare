import * as assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "./app";

const TEST_PASSWORD = "open-finish-smoke-password";

function cookiePair(setCookie: string | null) {
  const value = setCookie?.split(";", 1)[0];
  if (!value) throw new Error("Expected the response to set a session cookie");
  return value;
}

describe("private API smoke flow", () => {
  const app = createApp({ adminPassword: TEST_PASSWORD });
  let server: Server;
  let origin: string;

  before(async () => {
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not expose a TCP address");
    }
    origin = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    server.close();
    await once(server, "close");
  });

  it("fails closed until a password-authenticated session is supplied", async () => {
    const anonymousHealth = await fetch(`${origin}/api/healthz`);
    assert.equal(anonymousHealth.status, 401);
    assert.equal(
      anonymousHealth.headers.get("cache-control"),
      "no-store, max-age=0",
    );
    assert.equal(anonymousHealth.headers.get("x-frame-options"), "DENY");
    assert.deepEqual(await anonymousHealth.json(), {
      error: "Authentication required",
    });

    const initialSession = await fetch(`${origin}/api/auth/session`);
    assert.equal(initialSession.status, 200);
    assert.deepEqual(await initialSession.json(), {
      passwordEnabled: true,
      authenticated: false,
    });

    const rejectedLogin = await fetch(`${origin}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "incorrect" }),
    });
    assert.equal(rejectedLogin.status, 401);

    const acceptedLogin = await fetch(`${origin}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    });
    assert.equal(acceptedLogin.status, 204);
    const sessionCookie = cookiePair(acceptedLogin.headers.get("set-cookie"));
    assert.match(
      acceptedLogin.headers.get("set-cookie") ?? "",
      /HttpOnly; Secure; SameSite=Strict/,
    );

    const authenticatedSession = await fetch(`${origin}/api/auth/session`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(authenticatedSession.status, 200);
    assert.deepEqual(await authenticatedSession.json(), {
      passwordEnabled: true,
      authenticated: true,
    });

    const authenticatedHealth = await fetch(`${origin}/api/healthz`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(authenticatedHealth.status, 200);
    assert.deepEqual(await authenticatedHealth.json(), { status: "ok" });

    const logout = await fetch(`${origin}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    assert.equal(logout.status, 204);
    assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
  });

  it("temporarily limits repeated failed password attempts", async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const rejected = await fetch(`${origin}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: `incorrect-${attempt}` }),
      });
      assert.equal(rejected.status, 401);
    }

    const limited = await fetch(`${origin}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    });
    assert.equal(limited.status, 429);
    assert.match(limited.headers.get("retry-after") ?? "", /^\d+$/);
  });
});
