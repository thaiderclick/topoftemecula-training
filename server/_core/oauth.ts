/**
 * Auth routes — email + password backed by Supabase Auth (this app's own
 * Supabase project), sessions on our JWT cookie.
 *
 * POST /api/auth/register — enrollment code + email + password → account + session.
 *                           The enrollment code (TRAINING_PASSWORD) gates who can
 *                           join; it is NOT a login credential anymore.
 * POST /api/auth/login    — email + password → session cookie.
 * POST /api/auth/forgot   — emails a 6-digit reset code (never reveals whether
 *                           the account exists).
 * POST /api/auth/reset    — code + new password → password updated.
 * POST /api/auth/logout   — clears the session cookie.
 */
import { createHash, randomInt } from "crypto";
import type { Express, Request, Response } from "express";
import { SignJWT } from "jose";
import {
  countRecentResetCodes,
  createResetCode,
  findValidResetCode,
  getUserByEmail,
  markResetCodeUsed,
  upsertUser,
} from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sendPasswordResetCode } from "./email";
import { ENV } from "./env";
import {
  adminCreateUser,
  adminUpdatePassword,
  signInWithPassword,
  supabaseAuthConfigured,
  SupabaseAuthUser,
} from "./supabaseAuth";

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const MAX_RESET_CODES_PER_HOUR = 3;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

async function issueSession(req: Request, res: Response, openId: string, name: string) {
  const expirationSeconds = Math.floor((Date.now() + THIRTY_DAYS_MS) / 1000);
  const token = await new SignJWT({ openId, appId: "tot-training", name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSessionSecret());
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie("tot_session", token, { ...cookieOptions, maxAge: THIRTY_DAYS_MS });
}

/** Map a Supabase auth user onto our users row and start a session. */
async function establishUser(req: Request, res: Response, authUser: SupabaseAuthUser, fallbackName?: string) {
  const openId = `sb_${authUser.id}`;
  const name = authUser.user_metadata?.name ?? fallbackName ?? authUser.email.split("@")[0];
  await upsertUser({
    openId,
    name,
    email: authUser.email,
    loginMethod: "supabase",
    lastSignedIn: new Date(),
  });
  await issueSession(req, res, openId, name);
  return name;
}

export function registerOAuthRoutes(app: Express) {
  if (!supabaseAuthConfigured()) {
    console.error(
      "[auth] SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are not all set — " +
        "registration and login will fail until they are configured."
    );
  }

  // POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, email, password, enrollmentCode } = req.body as Record<string, string | undefined>;

      if (!enrollmentCode || enrollmentCode !== ENV.trainingPassword) {
        return res.status(401).json({ error: "Invalid enrollment code. Contact your training coordinator." });
      }
      const first = (firstName ?? "").trim();
      const last = (lastName ?? "").trim();
      if (!first || !last) return res.status(400).json({ error: "First and last name are required." });
      if (!email || !EMAIL_RE.test(email.trim())) return res.status(400).json({ error: "A valid email is required." });
      if (!password || password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
      }

      const name = `${first} ${last}`;
      let authUser;
      try {
        authUser = await adminCreateUser({ email: email.trim(), password, name });
      } catch (e) {
        if ((e as { code?: string }).code === "exists") {
          return res.status(409).json({ error: "An account with this email already exists — sign in instead." });
        }
        throw e;
      }

      const finalName = await establishUser(req, res, authUser, name);
      res.json({ success: true, name: finalName });
    } catch (e) {
      console.error("[auth] register failed:", e);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body as Record<string, string | undefined>;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

      const authUser = await signInWithPassword(email.trim(), password);
      if (!authUser) return res.status(401).json({ error: "Incorrect email or password." });

      const name = await establishUser(req, res, authUser);
      res.json({ success: true, name });
    } catch (e) {
      console.error("[auth] login failed:", e);
      res.status(500).json({ error: "Sign-in failed. Please try again." });
    }
  });

  // POST /api/auth/forgot — always answers success (no account enumeration).
  app.post("/api/auth/forgot", async (req, res) => {
    try {
      const { email } = req.body as Record<string, string | undefined>;
      if (!email || !EMAIL_RE.test(email.trim())) {
        return res.status(400).json({ error: "A valid email is required." });
      }
      const user = await getUserByEmail(email.trim());
      if (user?.email) {
        const recent = await countRecentResetCodes(user.email, 60 * 60 * 1000);
        if (recent < MAX_RESET_CODES_PER_HOUR) {
          const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
          await createResetCode(user.email, sha256(code), RESET_CODE_TTL_MS);
          await sendPasswordResetCode({ to: user.email, code });
        }
      }
      res.json({ success: true });
    } catch (e) {
      console.error("[auth] forgot failed:", e);
      // Still don't reveal anything; the user can retry.
      res.json({ success: true });
    }
  });

  // POST /api/auth/reset
  app.post("/api/auth/reset", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body as Record<string, string | undefined>;
      if (!email || !code || !newPassword) return res.status(400).json({ error: "Missing fields." });
      if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });

      const row = await findValidResetCode(email.trim(), sha256(code.trim()));
      if (!row) return res.status(400).json({ error: "Invalid or expired code." });

      const user = await getUserByEmail(email.trim());
      if (!user?.openId.startsWith("sb_")) return res.status(400).json({ error: "Invalid or expired code." });

      await adminUpdatePassword(user.openId.slice(3), newPassword);
      await markResetCodeUsed(row.id);
      res.json({ success: true });
    } catch (e) {
      console.error("[auth] reset failed:", e);
      res.status(500).json({ error: "Password reset failed. Please try again." });
    }
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie("tot_session", { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
