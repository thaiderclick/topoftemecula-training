/**
 * Vercel Serverless Function entry point.
 * Vercel compiles this TypeScript file directly using its own bundler.
 * Static files are served by Vercel via outputDirectory in vercel.json.
 */
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerScheduledRoutes } from "../server/scheduled";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Debug health endpoint — remove after diagnosing Vercel crash
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    node: process.version,
    env: process.env.NODE_ENV,
    hasJwt: !!process.env.JWT_SECRET,
    hasDb: !!process.env.DATABASE_URL,
    hasTrainingPw: !!process.env.TRAINING_PASSWORD,
  });
});

registerOAuthRoutes(app);
registerScheduledRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
