/**
 * Simple password-based auth routes.
 * Replaces Manus OAuth — no external auth service required.
 * POST /api/auth/login  — checks TRAINING_PASSWORD, issues a JWT session cookie
 * POST /api/auth/logout — clears the session cookie
 */
import type { Express } from "express";
import { SignJWT } from "jose";
import { upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function registerOAuthRoutes(app: Express) {
  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    const { password, name } = req.body as { password?: string; name?: string };

    if (!password || password !== ENV.trainingPassword) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    // Use a stable openId derived from the name (or a default)
    const safeName = (name ?? "ambassador").trim().toLowerCase().replace(/\s+/g, "_");
    const openId = `pwd_${safeName}`;

    // Always persist the user to the database
    await upsertUser({
      openId,
      name: name ?? "Ambassador",
      email: null,
      loginMethod: "password",
      lastSignedIn: new Date(),
    });

    const issuedAt = Date.now();
    const expiresInMs = ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

    const token = await new SignJWT({ openId, appId: "tot-training", name: name ?? "Ambassador" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(getSessionSecret());

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie("tot_session", token, { ...cookieOptions, maxAge: expiresInMs });
    res.json({ success: true, name: name ?? "Ambassador" });
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie("tot_session", { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
