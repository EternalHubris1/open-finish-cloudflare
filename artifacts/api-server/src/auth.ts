import { Router, type RequestHandler } from "express";

type AuthOptions = {
  password?: string;
};

const COOKIE_NAME = "open_finish_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
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

export function createAuth(options: AuthOptions) {
  const router = Router();
  const password = options.password?.trim() || null;

  router.get("/auth/session", async (req, res): Promise<void> => {
    if (!password) {
      res.status(503).json({
        passwordEnabled: false,
        authenticated: false,
        error: "Password access has not been configured",
      });
      return;
    }

    const authenticated = await isValidSession(
      readCookie(req.headers.cookie, COOKIE_NAME),
      password,
    );
    res.json({ passwordEnabled: true, authenticated });
  });

  router.post("/auth/login", async (req, res): Promise<void> => {
    if (!password) {
      res.status(503).json({ error: "Password access has not been configured" });
      return;
    }
    const candidate = req.body?.password;
    if (typeof candidate !== "string" || !constantTimeEqual(candidate, password)) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    const session = await createSession(password);
    res.setHeader("Set-Cookie", sessionCookie(session, SESSION_TTL_SECONDS));
    res.status(204).end();
  });

  router.post("/auth/logout", (_req, res): void => {
    res.setHeader("Set-Cookie", sessionCookie("", 0));
    res.status(204).end();
  });

  const requirePassword: RequestHandler = async (req, res, next) => {
    if (!password) {
      res.status(503).json({ error: "Password access has not been configured" });
      return;
    }
    const authenticated = await isValidSession(
      readCookie(req.headers.cookie, COOKIE_NAME),
      password,
    );
    if (!authenticated) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    next();
  };

  return { router, requirePassword };
}
