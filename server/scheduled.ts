/**
 * Scheduled/cron HTTP handlers (§2). Mounted before the Vite/static fallthrough.
 *
 * Vercel Cron invokes these with GET and, when CRON_SECRET is set, an
 * `Authorization: Bearer <CRON_SECRET>` header. POST is allowed for manual runs.
 * With no CRON_SECRET the endpoints are open in dev and REJECTED in production
 * — that rejection is logged loudly, because a silently-403ing cron means the
 * directory mirror and claim reconciliation never run.
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

function registerCronJob(app: Express, job: string, run: (req: Request) => Promise<object>): void {
  const handler = async (req: Request, res: Response) => {
    if (!authorized(req)) {
      console.warn(
        `[scheduled] ${job}: rejected unauthorized request (${
          ENV.cronSecret ? "bad/missing bearer token" : "CRON_SECRET not set in production"
        })`
      );
      return res.status(403).json({ error: "forbidden" });
    }
    try {
      const result = await run(req);
      res.json({ ok: true, job, ...result });
    } catch (e) {
      const err = e as Error;
      // Full error (incl. stack) goes to the server log only — response bodies
      // must not leak stack traces.
      console.error(`[scheduled] ${job} failed:`, err);
      res.status(500).json({ job, error: err?.message ?? String(e), timestamp: new Date().toISOString() });
    }
  };
  app.get(`/api/scheduled/${job}`, handler); // Vercel Cron
  app.post(`/api/scheduled/${job}`, handler); // manual trigger
}

export function registerScheduledRoutes(app: Express): void {
  if (ENV.isProduction && !ENV.cronSecret) {
    console.error(
      "[scheduled] CRON_SECRET is not set in production — Vercel cron invocations will be rejected (403) " +
        "and the directory sync / claim reconciliation will NEVER run. Set CRON_SECRET in the environment."
    );
  }
  registerCronJob(app, "syncDirectory", (req) =>
    runDirectorySync({ full: req.query.full === "1" || (!!req.body && req.body.full === true) })
  );
  registerCronJob(app, "pollClaims", () => pollClaimEvents());
}
