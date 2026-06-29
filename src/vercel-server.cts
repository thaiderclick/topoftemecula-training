/**
 * Vercel Serverless Function entry point.
 * Uses createServer from @vercel/node to wrap the Express app.
 */
const express = require("express");
const { createExpressMiddleware } = require("@trpc/server/adapters/express");
const { registerOAuthRoutes } = require("../server/_core/oauth");
const { appRouter } = require("../server/routers");
const { createContext } = require("../server/_core/context");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerOAuthRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

module.exports = app;
