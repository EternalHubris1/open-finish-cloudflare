import { Router, type IRouter } from "express";
import {
  clearSessionCookie,
  credentialsConfigured,
  setSessionCookie,
  validateCredentials,
  verifySessionToken,
} from "../lib/auth";

const router: IRouter = Router();
const attempts = new Map<string, { failures: number; blockedUntil: number }>();
const MAX_FAILURES = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

router.get("/session", (req, res) => {
  res.json({
    authenticated: verifySessionToken(req.cookies?.admin_session as string | undefined),
    configured: credentialsConfigured(),
  });
});

router.post("/login", (req, res) => {
  if (!credentialsConfigured()) {
    res.status(503).json({ error: "Admin access is not configured" });
    return;
  }

  const key = req.ip || "unknown";
  const attempt = attempts.get(key);
  if (attempt && attempt.blockedUntil > Date.now()) {
    res.status(429).json({ error: "Too many attempts. Try again in 15 minutes" });
    return;
  }

  const username = typeof req.body?.username === "string" ? req.body.username : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const validInput = username.length > 0 && username.length <= 100 && password.length > 0 && password.length <= 500;
  if (!validInput || !validateCredentials(username, password)) {
    const failures = (attempt?.blockedUntil && attempt.blockedUntil <= Date.now() ? 0 : attempt?.failures ?? 0) + 1;
    attempts.set(key, {
      failures,
      blockedUntil: failures >= MAX_FAILURES ? Date.now() + BLOCK_DURATION_MS : 0,
    });
    res.status(401).json({ error: "Incorrect username or password" });
    return;
  }

  attempts.delete(key);
  setSessionCookie(res);
  res.json({ authenticated: true });
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.sendStatus(204);
});

export default router;
