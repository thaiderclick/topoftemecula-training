import { boolean, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tracks each AI roleplay attempt by a trainee.
 * Stores the full transcript and evaluator scorecard for review.
 */
export const roleplayAttempts = pgTable("roleplay_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  persona: varchar("persona", { length: 64 }).notNull(),
  transcript: jsonb("transcript").notNull().$type<Array<{role: string; content: string}>>(),
  scorecard: jsonb("scorecard").$type<Record<string, unknown>>(),
  compliancePass: boolean("compliancePass"),
  totalScore: integer("totalScore"),
  result: varchar("result", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoleplayAttempt = typeof roleplayAttempts.$inferSelect;
export type InsertRoleplayAttempt = typeof roleplayAttempts.$inferInsert;

/**
 * Tracks overall training progress per trainee.
 */
export const trainingProgress = pgTable("training_progress", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  completedModules: jsonb("completedModules").notNull().$type<string[]>(),
  completedQuizzes: jsonb("completedQuizzes").notNull().$type<string[]>(),
  completedAssignments: jsonb("completedAssignments").notNull().$type<string[]>(),
  assignmentsData: jsonb("assignmentsData").notNull().$type<Record<string, string>>(),
  safetyCompleted: boolean("safetyCompleted").default(false).notNull(),
  passedFinalTest: boolean("passedFinalTest").default(false).notNull(),
  finalTestScore: integer("finalTestScore"),
  shift1DebriefData: jsonb("shift1DebriefData").$type<Record<string, string>>(),
  supervisorReleased: jsonb("supervisorReleased").$type<Record<string, boolean>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TrainingProgress = typeof trainingProgress.$inferSelect;
export type InsertTrainingProgress = typeof trainingProgress.$inferInsert;

/**
 * Trainee feedback on individual slides and assignments.
 * Used to continuously improve the training content.
 */
export const traineeFeedback = pgTable("trainee_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  traineeName: text("traineeName"),
  moduleId: varchar("moduleId", { length: 64 }).notNull(),
  slideIndex: integer("slideIndex"),
  context: text("context"), // e.g. "Day 1 – Slide 3: Mission Statement"
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TraineeFeedback = typeof traineeFeedback.$inferSelect;
export type InsertTraineeFeedback = typeof traineeFeedback.$inferInsert;

/**
 * Issued, publicly-verifiable certification credentials.
 * One row per holder (userId unique). `code` is the human-facing ID printed
 * on the certificate and looked up at /verify/:code.
 */
export const credentials = pgTable("credentials", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  holderName: text("holderName"),
  program: varchar("program", { length: 128 }).notNull(),
  finalTestScore: integer("finalTestScore"),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
});

export type Credential = typeof credentials.$inferSelect;
export type InsertCredential = typeof credentials.$inferInsert;
