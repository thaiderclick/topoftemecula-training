"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      cookieSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
      databaseUrl: process.env.DATABASE_URL ?? "",
      trainingPassword: process.env.TRAINING_PASSWORD ?? "ambassador2024",
      adminPassword: process.env.ADMIN_PASSWORD ?? "supervisor2024",
      isProduction: process.env.NODE_ENV === "production",
      // OpenAI API key for AI Roleplay feature
      openAiApiKey: process.env.OPENAI_API_KEY ?? "",
      // Resend email notification for trainee completion alerts
      resendApiKey: process.env.RESEND_API_KEY ?? "",
      notificationEmail: process.env.NOTIFICATION_EMAIL ?? "",
      // Legacy aliases kept so llm.ts compiles without changes
      forgeApiUrl: "https://api.openai.com",
      forgeApiKey: process.env.OPENAI_API_KEY ?? "",
      // Legacy fields kept for compatibility with shared/const imports
      appId: "tot-training",
      oAuthServerUrl: "",
      ownerOpenId: ""
    };
  }
});

// server/_core/email.ts
var email_exports = {};
__export(email_exports, {
  sendCompletionAlert: () => sendCompletionAlert
});
function getResend() {
  if (!ENV.resendApiKey) return null;
  if (!_resend) _resend = new import_resend.Resend(ENV.resendApiKey);
  return _resend;
}
async function sendCompletionAlert({
  traineeName,
  traineeId,
  score
}) {
  const resend = getResend();
  if (!resend || !ENV.notificationEmail) return;
  const completedAt = (/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "full",
    timeStyle: "short"
  });
  await resend.emails.send({
    from: "Top of Temecula Training <training@topoftemecula.com>",
    to: ENV.notificationEmail,
    subject: `\u{1F389} Ambassador Cleared: ${traineeName}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #faf8f4; border-radius: 12px;">
        <img src="https://topoftemecula.com/_next/image?url=%2Fimages%2Flogo-dark.png&w=384&q=75" alt="Top of Temecula" style="height: 40px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; color: #1a1a1a; margin-bottom: 8px;">Ambassador Training Cleared</h1>
        <p style="color: #555; font-size: 16px; margin-bottom: 24px;">A trainee has successfully completed all training requirements and is cleared for field operations.</p>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e0d8;">
          <tr style="background: #f0ebe3;">
            <td style="padding: 12px 16px; font-weight: bold; color: #555; font-size: 13px; width: 40%;">TRAINEE</td>
            <td style="padding: 12px 16px; color: #1a1a1a; font-size: 15px;">${traineeName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #555; font-size: 13px;">FINAL TEST SCORE</td>
            <td style="padding: 12px 16px; color: #16a34a; font-size: 15px; font-weight: bold;">${score}/10 \u2014 PASS</td>
          </tr>
          <tr style="background: #f0ebe3;">
            <td style="padding: 12px 16px; font-weight: bold; color: #555; font-size: 13px;">COMPLETED</td>
            <td style="padding: 12px 16px; color: #1a1a1a; font-size: 15px;">${completedAt} PT</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #555; font-size: 13px;">TRAINEE ID</td>
            <td style="padding: 12px 16px; color: #888; font-size: 13px; font-family: monospace;">${traineeId}</td>
          </tr>
        </table>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">View full progress and submitted assignments in the <a href="https://topoftemecula-training.com/admin" style="color: #c9961a;">Supervisor Dashboard</a>.</p>
      </div>
    `
  });
}
var import_resend, _resend;
var init_email = __esm({
  "server/_core/email.ts"() {
    "use strict";
    import_resend = require("resend");
    init_env();
    _resend = null;
  }
});

// api/server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"));
var import_express2 = require("@trpc/server/adapters/express");

// server/_core/oauth.ts
var import_jose = require("jose");

// server/db.ts
var import_drizzle_orm = require("drizzle-orm");
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = require("pg");

// drizzle/schema.ts
var import_pg_core = require("drizzle-orm/pg-core");
var roleEnum = (0, import_pg_core.pgEnum)("role", ["user", "admin"]);
var users = (0, import_pg_core.pgTable)("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: (0, import_pg_core.serial)("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: (0, import_pg_core.varchar)("openId", { length: 64 }).notNull().unique(),
  name: (0, import_pg_core.text)("name"),
  email: (0, import_pg_core.varchar)("email", { length: 320 }),
  loginMethod: (0, import_pg_core.varchar)("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  lastSignedIn: (0, import_pg_core.timestamp)("lastSignedIn").defaultNow().notNull()
});
var roleplayAttempts = (0, import_pg_core.pgTable)("roleplay_attempts", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("userId").notNull(),
  persona: (0, import_pg_core.varchar)("persona", { length: 64 }).notNull(),
  transcript: (0, import_pg_core.jsonb)("transcript").notNull().$type(),
  scorecard: (0, import_pg_core.jsonb)("scorecard").$type(),
  compliancePass: (0, import_pg_core.boolean)("compliancePass"),
  totalScore: (0, import_pg_core.integer)("totalScore"),
  result: (0, import_pg_core.varchar)("result", { length: 16 }),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull()
});
var trainingProgress = (0, import_pg_core.pgTable)("training_progress", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("userId").notNull().unique(),
  completedModules: (0, import_pg_core.jsonb)("completedModules").notNull().$type(),
  completedQuizzes: (0, import_pg_core.jsonb)("completedQuizzes").notNull().$type(),
  completedAssignments: (0, import_pg_core.jsonb)("completedAssignments").notNull().$type(),
  assignmentsData: (0, import_pg_core.jsonb)("assignmentsData").notNull().$type(),
  safetyCompleted: (0, import_pg_core.boolean)("safetyCompleted").default(false).notNull(),
  passedFinalTest: (0, import_pg_core.boolean)("passedFinalTest").default(false).notNull(),
  finalTestScore: (0, import_pg_core.integer)("finalTestScore"),
  shift1DebriefData: (0, import_pg_core.jsonb)("shift1DebriefData").$type(),
  supervisorReleased: (0, import_pg_core.jsonb)("supervisorReleased").$type(),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull()
});
var traineeFeedback = (0, import_pg_core.pgTable)("trainee_feedback", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("userId").notNull(),
  traineeName: (0, import_pg_core.text)("traineeName"),
  moduleId: (0, import_pg_core.varchar)("moduleId", { length: 64 }).notNull(),
  slideIndex: (0, import_pg_core.integer)("slideIndex"),
  context: (0, import_pg_core.text)("context"),
  // e.g. "Day 1 – Slide 3: Mission Statement"
  message: (0, import_pg_core.text)("message").notNull(),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull()
});

// server/db.ts
init_env();
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new import_pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes("supabase") || process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
      });
      _db = (0, import_node_postgres.drizzle)(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.warn("[Database] Failed to upsert user (non-fatal):", error.message);
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getTrainingProgress(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(trainingProgress).where((0, import_drizzle_orm.eq)(trainingProgress.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function upsertTrainingProgress(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getTrainingProgress(userId);
  if (existing) {
    await db.update(trainingProgress).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(trainingProgress.userId, userId));
  } else {
    await db.insert(trainingProgress).values({
      userId,
      completedModules: [],
      completedQuizzes: [],
      completedAssignments: [],
      assignmentsData: {},
      safetyCompleted: false,
      passedFinalTest: false,
      ...data
    });
  }
}
async function createRoleplayAttempt(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(roleplayAttempts).values(data);
}
async function getRoleplayAttempts(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roleplayAttempts).where((0, import_drizzle_orm.eq)(roleplayAttempts.userId, userId));
}
async function countRoleplayAttempts(userId) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: import_drizzle_orm.sql`count(*)` }).from(roleplayAttempts).where((0, import_drizzle_orm.eq)(roleplayAttempts.userId, userId));
  return Number(result[0]?.count ?? 0);
}
async function submitFeedback(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(traineeFeedback).values(data);
}
async function getAllFeedback() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(traineeFeedback).orderBy(traineeFeedback.createdAt);
}
async function getAllTrainees() {
  const db = await getDb();
  if (!db) return [];
  const allUsers = await db.select().from(users).orderBy(users.createdAt);
  const allProgress = await db.select().from(trainingProgress);
  const roleplayCounts = await db.select({ userId: roleplayAttempts.userId, count: import_drizzle_orm.sql`count(*)` }).from(roleplayAttempts).groupBy(roleplayAttempts.userId);
  const roleplayPassCounts = await db.select({ userId: roleplayAttempts.userId, count: import_drizzle_orm.sql`count(*)` }).from(roleplayAttempts).where((0, import_drizzle_orm.eq)(roleplayAttempts.result, "PASS")).groupBy(roleplayAttempts.userId);
  const progressMap = new Map(allProgress.map((p) => [p.userId, p]));
  const countMap = new Map(roleplayCounts.map((r) => [r.userId, Number(r.count)]));
  const passMap = new Map(roleplayPassCounts.map((r) => [r.userId, Number(r.count)]));
  return allUsers.map((u) => ({
    ...u,
    progress: progressMap.get(u.id) ?? null,
    roleplayAttempts: countMap.get(u.id) ?? 0,
    roleplayPasses: passMap.get(u.id) ?? 0
  }));
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/oauth.ts
init_env();
function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}
var ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1e3;
function registerOAuthRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    const { password, name } = req.body;
    if (!password || password !== ENV.trainingPassword) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }
    const safeName = (name ?? "ambassador").trim().toLowerCase().replace(/\s+/g, "_");
    const openId = `pwd_${safeName}`;
    if (process.env.DATABASE_URL) {
      await upsertUser({
        openId,
        name: name ?? "Ambassador",
        email: null,
        loginMethod: "password",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
    }
    const issuedAt = Date.now();
    const expiresInMs = ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const token = await new import_jose.SignJWT({ openId, appId: "tot-training", name: name ?? "Ambassador" }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(getSessionSecret());
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie("tot_session", token, { ...cookieOptions, maxAge: expiresInMs });
    res.json({ success: true, name: name ?? "Ambassador" });
  });
  app2.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie("tot_session", { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}

// server/routers.ts
var import_zod2 = require("zod");

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`;
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    messages: messages.map(normalizeMessage)
  };
  if (model) {
    payload.model = model;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }
  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/_core/systemRouter.ts
var import_zod = require("zod");

// server/_core/notification.ts
var import_server = require("@trpc/server");
init_env();
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// shared/const.ts
var ONE_YEAR_MS2 = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/trpc.ts
var import_server2 = require("@trpc/server");
var import_superjson = __toESM(require("superjson"), 1);
var t = import_server2.initTRPC.context().create({
  transformer: import_superjson.default
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new import_server2.TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new import_server2.TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    import_zod.z.object({
      timestamp: import_zod.z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    import_zod.z.object({
      title: import_zod.z.string().min(1, "title is required"),
      content: import_zod.z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_env();
var PERSONA_DESCRIPTIONS = {
  busy: "a distracted, time-pressed owner who is half-listening and keeps looking away. You have 3 things going on at once.",
  skeptical_google: "a skeptical owner who already has a Google Business Profile and Yelp listing. You're not convinced you need another platform.",
  friendly_curious: "a warm, open owner who is genuinely curious about the platform. You ask good questions and are winnable.",
  gatekeeper: "a friendly but protective front-desk receptionist or manager. The owner is NOT here. You are warm but guard the owner's email carefully. You want to help but need a good reason to give out contact info.",
  hostile: "a mildly aggressive, irritated owner who had a bad experience with a previous marketing rep. You are NOT interested and will say so directly. If the ambassador keeps pushing after you've said no, you will escalate."
};
function buildOwnerSystemPrompt(persona) {
  const description = PERSONA_DESCRIPTIONS[persona] || PERSONA_DESCRIPTIONS.friendly_curious;
  return `You are roleplaying as ${description} You are the owner or manager of a small business in the Temecula Valley (e.g. an insurance agency, a salon, a restaurant, a boutique). A summer brand ambassador from "Top of Temecula" just walked in.

Stay fully in character at all times. React realistically: if the ambassador is clear and low-pressure, warm up gradually; if they're pushy, vague, or make dubious claims (like promising Google rankings), get more skeptical and call it out the way a real owner would. Raise the objections this persona would actually raise.

Keep your replies to 1-3 sentences. Never coach, break character, explain yourself, or admit you're an AI.

End the scene naturally once it resolves \u2014 the ambassador gets you to claim the listing, you decline clearly, you give them the owner's email (gatekeeper), or you ask them to leave (hostile) \u2014 and then output [SCENE COMPLETE] on its own line.`;
}
var EVALUATOR_SYSTEM_PROMPT = `You are a field trainer for Top of Temecula brand ambassadors. You will receive a transcript of a trainee's simulated visit to a local business. Score it against the rubric below and return ONLY valid JSON \u2014 no preamble, no markdown, no explanation outside the JSON.

COMPLIANCE AUTO-FAIL if the trainee:
- Claimed the listing improves Google ranking or guarantees customers/leads
- Claimed a partnership with Google, Yelp, the city, or the Chamber of Commerce
- Threatened that the listing would be removed or deleted
- Asked for a credit card for the free claim
- Kept pushing after a clear "no" (more than one follow-up after explicit refusal)
- Ignored a safety cue from a hostile persona instead of disengaging calmly

SCORING RUBRIC (each 0-2):
- led_with_claim: Did they open with "we already created a free listing for you" rather than a generic pitch?
- used_dashboard_hook: Did they mention the AI-citation dashboard or show the listing on their phone?
- objection_handling: Did they handle objections calmly without making false claims?
- secured_outcome: Did they get a claim, capture an email invite (gatekeeper), or disengage safely (hostile)?
- professional_lowpressure: Was the tone professional, warm, and never pushy?
- clean_close: Did they wrap up cleanly \u2014 next steps clear, no lingering awkwardness?

PASS LOGIC: result = "PASS" only if compliance_pass === true AND total >= 9 out of 12.

Return this exact JSON schema:
{"compliance_pass":true,"compliance_flags":[],"scores":{"led_with_claim":2,"used_dashboard_hook":2,"objection_handling":2,"secured_outcome":2,"professional_lowpressure":2,"clean_close":2},"total":12,"result":"PASS","what_went_well":["...","..."],"coaching":["...specific + actionable...","..."],"one_thing_to_try_next_time":"..."}`;
var appRouter = router({
  system: systemRouter,
  auth: router({
    // Returns the current user from the session cookie (null if not logged in)
    me: publicProcedure.query((opts) => opts.ctx.user)
  }),
  // Training Progress
  training: router({
    getProgress: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getTrainingProgress(ctx.user.id);
      return progress ?? {
        completedModules: [],
        completedQuizzes: [],
        completedAssignments: [],
        assignmentsData: {},
        safetyCompleted: false,
        passedFinalTest: false,
        finalTestScore: null,
        shift1DebriefData: null,
        supervisorReleased: {}
      };
    }),
    saveProgress: protectedProcedure.input(import_zod2.z.object({
      completedModules: import_zod2.z.array(import_zod2.z.string()).optional(),
      completedQuizzes: import_zod2.z.array(import_zod2.z.string()).optional(),
      completedAssignments: import_zod2.z.array(import_zod2.z.string()).optional(),
      assignmentsData: import_zod2.z.record(import_zod2.z.string(), import_zod2.z.string()).optional(),
      safetyCompleted: import_zod2.z.boolean().optional(),
      passedFinalTest: import_zod2.z.boolean().optional(),
      finalTestScore: import_zod2.z.number().optional(),
      shift1DebriefData: import_zod2.z.record(import_zod2.z.string(), import_zod2.z.string()).optional()
    })).mutation(async ({ ctx, input }) => {
      if (input.passedFinalTest === true && input.finalTestScore === 10) {
        const existing = await getTrainingProgress(ctx.user.id);
        if (!existing?.passedFinalTest) {
          try {
            const { sendCompletionAlert: sendCompletionAlert2 } = await Promise.resolve().then(() => (init_email(), email_exports));
            await sendCompletionAlert2({
              traineeName: ctx.user.name ?? "Ambassador",
              traineeId: ctx.user.openId,
              score: input.finalTestScore ?? 10
            });
          } catch {
          }
        }
      }
      await upsertTrainingProgress(ctx.user.id, input);
      return { success: true };
    })
  }),
  // Admin / Supervisor Dashboard
  admin: router({
    // Verify admin password and return a token
    login: publicProcedure.input(import_zod2.z.object({ password: import_zod2.z.string() })).mutation(({ input }) => {
      if (input.password !== ENV.adminPassword) {
        throw new Error("Invalid admin password");
      }
      return { success: true };
    }),
    // Get all trainees with their progress (requires admin password in header)
    getTrainees: publicProcedure.input(import_zod2.z.object({ adminPassword: import_zod2.z.string() })).query(async ({ input }) => {
      if (input.adminPassword !== ENV.adminPassword) {
        throw new Error("Unauthorized");
      }
      return getAllTrainees();
    })
  }),
  // Trainee Feedback
  feedback: router({
    submit: protectedProcedure.input(import_zod2.z.object({
      moduleId: import_zod2.z.string(),
      slideIndex: import_zod2.z.number().optional(),
      context: import_zod2.z.string().optional(),
      message: import_zod2.z.string().min(1).max(1e3)
    })).mutation(async ({ ctx, input }) => {
      await submitFeedback({
        userId: ctx.user.id,
        traineeName: ctx.user.name ?? "Anonymous",
        moduleId: input.moduleId,
        slideIndex: input.slideIndex ?? null,
        context: input.context ?? null,
        message: input.message
      });
      return { success: true };
    }),
    getAll: publicProcedure.input(import_zod2.z.object({ adminPassword: import_zod2.z.string() })).query(async ({ input }) => {
      if (input.adminPassword !== ENV.adminPassword) {
        throw new Error("Unauthorized");
      }
      return getAllFeedback();
    })
  }),
  // Roleplay Simulator
  roleplay: router({
    getAttemptCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await countRoleplayAttempts(ctx.user.id);
      return { count };
    }),
    getAttempts: protectedProcedure.query(async ({ ctx }) => {
      return getRoleplayAttempts(ctx.user.id);
    }),
    chat: protectedProcedure.input(import_zod2.z.object({
      persona: import_zod2.z.enum(["busy", "skeptical_google", "friendly_curious", "gatekeeper", "hostile"]),
      messages: import_zod2.z.array(import_zod2.z.object({
        role: import_zod2.z.enum(["user", "assistant"]),
        content: import_zod2.z.string()
      }))
    })).mutation(async ({ input }) => {
      const systemPrompt = buildOwnerSystemPrompt(input.persona);
      const response = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...input.messages
        ]
      });
      const content = response.choices[0]?.message?.content ?? "";
      const sceneComplete = content.includes("[SCENE COMPLETE]");
      const cleanContent = content.replace("[SCENE COMPLETE]", "").trim();
      return {
        content: cleanContent,
        sceneComplete
      };
    }),
    evaluate: protectedProcedure.input(import_zod2.z.object({
      persona: import_zod2.z.enum(["busy", "skeptical_google", "friendly_curious", "gatekeeper", "hostile"]),
      transcript: import_zod2.z.array(import_zod2.z.object({
        role: import_zod2.z.string(),
        content: import_zod2.z.string()
      }))
    })).mutation(async ({ ctx, input }) => {
      const transcriptText = input.transcript.map((m) => `${m.role === "user" ? "AMBASSADOR" : "OWNER"}: ${m.content}`).join("\n");
      const response = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: EVALUATOR_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Persona: ${input.persona}

Transcript:
${transcriptText}`
          }
        ],
        response_format: { type: "json_object" }
      });
      const raw = response.choices[0]?.message?.content ?? "{}";
      let scorecard;
      try {
        scorecard = JSON.parse(raw);
      } catch {
        scorecard = {
          compliance_pass: false,
          compliance_flags: ["Evaluator parse error \u2014 please retry"],
          result: "RETRY",
          total: 0,
          scores: { led_with_claim: 0, used_dashboard_hook: 0, objection_handling: 0, secured_outcome: 0, professional_lowpressure: 0, clean_close: 0 },
          coaching: ["The evaluator had trouble reading the transcript. Please retry."],
          what_went_well: [],
          one_thing_to_try_next_time: "Try again with a cleaner conversation."
        };
      }
      await createRoleplayAttempt({
        userId: ctx.user.id,
        persona: input.persona,
        transcript: input.transcript,
        scorecard,
        compliancePass: scorecard.compliance_pass ?? false,
        totalScore: scorecard.total ?? 0,
        result: scorecard.result ?? "RETRY"
      });
      return scorecard;
    })
  })
});

// server/_core/context.ts
var import_cookie = require("cookie");
var import_jose2 = require("jose");
init_env();
function getSessionSecret2() {
  return new TextEncoder().encode(ENV.cookieSecret);
}
async function verifySessionCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const cookies = (0, import_cookie.parse)(cookieHeader);
  const token = cookies["tot_session"];
  if (!token) return null;
  try {
    const { payload } = await (0, import_jose2.jwtVerify)(token, getSessionSecret2(), { algorithms: ["HS256"] });
    const openId = payload["openId"];
    if (typeof openId !== "string") return null;
    return {
      openId,
      name: typeof payload["name"] === "string" ? payload["name"] : void 0
    };
  } catch {
    return null;
  }
}
async function createContext(opts) {
  let user = null;
  try {
    const jwtData = await verifySessionCookie(opts.req.headers.cookie);
    if (jwtData?.openId) {
      const dbUser = await getUserByOpenId(jwtData.openId).catch(() => null);
      if (dbUser) {
        user = dbUser;
      } else {
        user = {
          id: 0,
          openId: jwtData.openId,
          name: jwtData.name ?? "Ambassador",
          email: null,
          loginMethod: "password",
          role: "user",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          lastSignedIn: /* @__PURE__ */ new Date()
        };
      }
    }
  } catch {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// api/server.ts
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
registerOAuthRoutes(app);
app.use(
  "/api/trpc",
  (0, import_express2.createExpressMiddleware)({
    router: appRouter,
    createContext
  })
);
var server_default = app;
