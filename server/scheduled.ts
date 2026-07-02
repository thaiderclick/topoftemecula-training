/**
 * Scheduled/cron HTTP handlers (§2). Mounted before the Vite/static fallthrough.
 *
 * Vercel Cron invokes these with GET and, when CRON_SECRET is set, an
 * `Authorization: Bearer <CRON_SECRET>` header. POST is allowed for manual runs.
 *
 * Directory sync runs daily off-peak (see vercel.json `crons`). The claim
 * reconciliation poll (§2b) will be added with the verification engine.
 */
import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { runDirectorySync } from "./directorySync";
import { pollClaimEvents } from "./reconciliation";

function authorized(req: Request): boolean {
  if (ENV.cronSecret) {
    return req.headers["authorization"] === `Bearer ${ENV.cronSecret}`;
  }
  // No secret configured → only allow off production (dev/manual), never in prod.
  return !ENV.isProduction;
}

export function registerScheduledRoutes(app: Express): void {
  const syncDirectory = async (req: Request, res: Response) => {
    if (!authorized(req)) return res.status(403).json({ error: "forbidden" });
    const full = req.query.full === "1" || (req.body && req.body.full === true);
    try {
      const result = await runDirectorySync({ full: !!full });
      res.json({ ok: true, job: "syncDirectory", ...result });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        job: "syncDirectory",
        error: err?.message ?? String(e),
        stack: err?.stack,
        timestamp: new Date().toISOString(),
      });
    }
  };

  app.get("/api/scheduled/syncDirectory", syncDirectory); // Vercel Cron
  app.post("/api/scheduled/syncDirectory", syncDirectory); // manual trigger

  const pollClaims = async (req: Request, res: Response) => {
    if (!authorized(req)) return res.status(403).json({ error: "forbidden" });
    try {
      const result = await pollClaimEvents();
      res.json({ ok: true, job: "pollClaims", ...result });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        job: "pollClaims",
        error: err?.message ?? String(e),
        stack: err?.stack,
        timestamp: new Date().toISOString(),
      });
    }
  };

  app.get("/api/scheduled/pollClaims", pollClaims); // Vercel Cron
  app.post("/api/scheduled/pollClaims", pollClaims); // manual trigger
}
