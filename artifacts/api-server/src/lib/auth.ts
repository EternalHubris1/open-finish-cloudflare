import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionPayload {
  username: string;
  expiresAt: number;
}

function adminUsername(): string {
  return process.env.ADMIN_USERNAME?.trim() || "Admin";
}

function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

function sign(payload: string, password: string): string {
  return createHmac("sha256", password).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function credentialsConfigured(): boolean {
  return adminPassword() !== null;
}

export function validateCredentials(username: string, password: string): boolean {
  const expectedPassword = adminPassword();
  if (!expectedPassword) return false;

  return safeEqual(username, adminUsername()) && safeEqual(password, expectedPassword);
}

export function createSessionToken(): string {
  const password = adminPassword();
  if (!password) throw new Error("ADMIN_PASSWORD is not configured");

  const payload: SessionPayload = {
    username: adminUsername(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, password)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const password = adminPassword();
  if (!password || !token) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload, password))) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;
    return payload.username === adminUsername() && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function setSessionCookie(res: Response): void {
  res.cookie(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (verifySessionToken(req.cookies?.[COOKIE_NAME] as string | undefined)) {
    next();
    return;
  }

  res.status(401).json({ error: "Authentication required" });
}
