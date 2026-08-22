import { Router, type Request, type RequestHandler } from "express";

type AuthOptions = {
  password?: string;
  sessionSecret?: string;
  getPassword?: () => string | undefined;
  getSessionSecret?: () => string | undefined;
};

type LoginAttempt = {
  failures: number;
  windowStartedAt: number;
  lockedUntil: number | null;
};

const COOKIE_NAME = "open_finish_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_LOCK_MS = 10 * 60 * 1000;
const MAX_LOGIN_FAILURES = 8;
const encoder = new TextEncoder();

function readCookie(header: string | undefined, name: string) {
  if (!header) return null;
  const prefix = `${name}=`;
  for (const value of header.split(";")) {
    const candidate = value.trim();
    if (candidate.startsWith(prefix)) return candidate.slice(prefix.length);
  }
  return null;
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToHex(signature);
}

async function createSession(secret: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const payload = `${expiresAt}.${nonce}`;
  return `${payload}.${await sign(payload, secret)}`;
}

async function isValidSession(token: string | null, secret: string) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expiresAtText, nonce, signature] = parts;
  const expiresAt = Number(expiresAtText);
  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000) ||
    !/^[a-f0-9]{32}$/i.test(nonce) ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return false;
  }

  const expected = await sign(`${expiresAtText}.${nonce}`, secret);
  return constantTimeEqual(signature, expected);
}

function sessionCookie(value: string, maxAge: number) {
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

function clientKey(req: Request) {
  const cloudflareIp = req.headers["cf-connecting-ip"];
  if (typeof cloudflareIp === "string" && cloudflareIp.trim()) {
    return cloudflareIp.trim();
  }
  return req.ip || "unknown";
}

/**
 * A lightweight per-isolate limiter. Cloudflare WAF/Rate Limiting should remain
 * the outer, distributed control for a public domain; this protects the app
 * itself as a safe fallback and does not persist credentials or attempt values.
 */
function recordFailure(
  attempts: Map<string, LoginAttempt>,
  key: string,
  now: number,
) {
  const current = attempts.get(key);
  const inWindow = current && now - current.windowStartedAt < LOGIN_WINDOW_MS;
  const failures = (inWindow ? current.failures : 0) + 1;
  attempts.set(key, {
    failures,
    windowStartedAt: inWindow ? current.windowStartedAt : now,
    lockedUntil: failures >= MAX_LOGIN_FAILURES ? now + LOGIN_LOCK_MS : null,
  });
}

function retryAfterSeconds(attempt: LoginAttempt, now: number) {
  if (!attempt.lockedUntil) return null;
  const remaining = attempt.lockedUntil - now;
  return remaining > 0 ? Math.max(1, Math.ceil(remaining / 1000)) : null;
}

export function createAuth(options: AuthOptions) {
  const router = Router();
  const attempts = new Map<string, LoginAttempt>();
  const getPassword = () =>
    options.getPassword?.()?.trim() || options.password?.trim() || null;
  const getSessionSecret = () =>
    options.getSessionSecret?.()?.trim() ||
    options.sessionSecret?.trim() ||
    // Backward-compatible fallback for production before SESSION_SECRET is set.
    getPassword();

  router.get("/auth/session", async (req, res): Promise<void> => {
    const password = getPassword();
    const sessionSecret = getSessionSecret();
    if (!password || !sessionSecret) {
      res.status(503).json({
        passwordEnabled: false,
        authenticated: false,
        error: "Password access has not been configured",
      });
      return;
    }

    const authenticated = await isValidSession(
      readCookie(req.headers.cookie, COOKIE_NAME),
      sessionSecret,
    );
    res.json({ passwordEnabled: true, authenticated });
  });

  router.post("/auth/login", async (req, res): Promise<void> => {
    const password = getPassword();
    const sessionSecret = getSessionSecret();
    if (!password || !sessionSecret) {
      res.status(503).json({ error: "Password access has not been configured" });
      return;
    }

    const key = clientKey(req);
    const now = Date.now();
    const existingAttempt = attempts.get(key);
    const retryAfter = existingAttempt && retryAfterSeconds(existingAttempt, now);
    if (retryAfter) {
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: "Too many attempts. Try again later." });
      return;
    }
    if (existingAttempt && now - existingAttempt.windowStartedAt >= LOGIN_WINDOW_MS) {
      attempts.delete(key);
    }

    const candidate = req.body?.password;
    if (typeof candidate !== "string" || !constantTimeEqual(candidate, password)) {
      recordFailure(attempts, key, now);
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    attempts.delete(key);
    const session = await createSession(sessionSecret);
    res.setHeader("Set-Cookie", sessionCookie(session, SESSION_TTL_SECONDS));
    res.status(204).end();
  });

  router.post("/auth/logout", (_req, res): void => {
    res.setHeader("Set-Cookie", sessionCookie("", 0));
    res.status(204).end();
  });

  const requirePassword: RequestHandler = async (req, res, next) => {
    const password = getPassword();
    const sessionSecret = getSessionSecret();
    if (!password || !sessionSecret) {
      res.status(503).json({ error: "Password access has not been configured" });
      return;
    }
    const authenticated = await isValidSession(
      readCookie(req.headers.cookie, COOKIE_NAME),
      sessionSecret,
    );
    if (!authenticated) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    next();
  };

  return { router, requirePassword };
}
