import { boolean, customType, date, doublePrecision, integer, jsonb, numeric, pgEnum, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/** citext — case-insensitive text (website + CRM both use it for referral_code). */
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

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

// ============================================================================
// Ambassador Field CRM — Phase 1 (mirrors drizzle/crm_0001_init.sql).
// business_id (uuid) is the cross-project join key to the website directory.
// referral_code is citext on both sides — match with plain equality, no
// lowercasing in app code. Bounty amounts come from bountyConfig, never hardcoded.
// ============================================================================

/** Field ambassadors — existing training-app users who work the field. */
export const ambassador = pgTable("ambassador", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  referralCode: citext("referral_code").notNull().unique(),
  payoutMethodStatus: text("payout_method_status").notNull().default("unset"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type Ambassador = typeof ambassador.$inferSelect;
export type InsertAmbassador = typeof ambassador.$inferInsert;

/** Read-only mirror of the website business directory (synced, keyed on businessId). */
export const business = pgTable("business", {
  id: serial("id").primaryKey(),
  businessId: uuid("business_id").notNull().unique(),
  name: text("name"),
  slug: text("slug"),
  categoryId: uuid("category_id"),
  categoryName: text("category_name"),
  neighborhoodId: uuid("neighborhood_id"),
  neighborhoodName: text("neighborhood_name"),
  city: text("city"),
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  hours: jsonb("hours"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  directoryClaimStatus: text("directory_claim_status"),
  verticalType: text("vertical_type"),
  subscriptionTier: text("subscription_tier"),
  isFeatured: boolean("is_featured"),
  confidenceScore: numeric("confidence_score"),
  status: text("status"),
  signupSource: text("signup_source"),
  ownerContactEmail: text("owner_contact_email"),
  localClaimStatus: text("local_claim_status").notNull().default("unclaimed"),
  sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow().notNull(),
});
export type Business = typeof business.$inferSelect;
export type InsertBusiness = typeof business.$inferInsert;

/** Field activity log. Never pays directly; claimed_onsite creates a `logged` claim. */
export const visit = pgTable("visit", {
  id: serial("id").primaryKey(),
  ambassadorId: integer("ambassador_id").notNull(),
  businessId: uuid("business_id").notNull(),
  outcome: text("outcome").notNull(),
  spokeWithName: text("spoke_with_name"),
  spokeWithRole: text("spoke_with_role"),
  notes: text("notes"),
  ownerEmailCaptured: text("owner_email_captured"),
  ownerNameForFollowup: text("owner_name_for_followup"),
  bestTimeToReturn: text("best_time_to_return"),
  rung: integer("rung"),
  photoUrls: text("photo_urls").array(),
  device: text("device"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type Visit = typeof visit.$inferSelect;
export type InsertVisit = typeof visit.$inferInsert;

/** The payable object. A `verified` claim always references a real business_users row. */
export const claim = pgTable("claim", {
  id: serial("id").primaryKey(),
  businessId: uuid("business_id").notNull(),
  ambassadorId: integer("ambassador_id"),
  referralCode: citext("referral_code"),
  originatingVisitId: integer("originating_visit_id"),
  state: text("state").notNull().default("logged"),
  bountyAmountCents: integer("bounty_amount_cents"),
  sourceBusinessUsersId: uuid("source_business_users_id").unique(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verificationSource: text("verification_source"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  payoutBatchId: integer("payout_batch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type Claim = typeof claim.$inferSelect;
export type InsertClaim = typeof claim.$inferInsert;

export const followupTask = pgTable("followup_task", {
  id: serial("id").primaryKey(),
  ambassadorId: integer("ambassador_id").notNull(),
  businessId: uuid("business_id").notNull(),
  dueDate: date("due_date"),
  note: text("note"),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type FollowupTask = typeof followupTask.$inferSelect;
export type InsertFollowupTask = typeof followupTask.$inferInsert;

export const curriculumGap = pgTable("curriculum_gap", {
  id: serial("id").primaryKey(),
  ambassadorId: integer("ambassador_id").notNull(),
  businessId: uuid("business_id"),
  objectionText: text("objection_text").notNull(),
  context: text("context"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type CurriculumGap = typeof curriculumGap.$inferSelect;
export type InsertCurriculumGap = typeof curriculumGap.$inferInsert;

/** Bounty is config-driven, never hardcoded. Reconciliation reads the active row.
 *  kind='claim' = flat fee per verified claim; kind='upgrade' + tier = bonus when
 *  an attributed business moves to that paid tier within 90 days. */
export const bountyConfig = pgTable("bounty_config", {
  id: serial("id").primaryKey(),
  amountCents: integer("amount_cents").notNull(),
  kind: text("kind").notNull().default("claim"),
  tier: text("tier"),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).defaultNow().notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
});
export type BountyConfig = typeof bountyConfig.$inferSelect;
export type InsertBountyConfig = typeof bountyConfig.$inferInsert;

/** One upgrade bonus per claim: credited when the attributed business shows up
 *  on a paid tier within the attribution window. */
export const upgradeBonus = pgTable("upgrade_bonus", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull().unique(),
  ambassadorId: integer("ambassador_id").notNull(),
  businessId: uuid("business_id").notNull(),
  tier: text("tier").notNull(),
  amountCents: integer("amount_cents"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});
export type UpgradeBonus = typeof upgradeBonus.$inferSelect;

export const payoutPeriod = pgTable("payout_period", {
  id: serial("id").primaryKey(),
  label: text("label"),
  startsOn: date("starts_on"),
  endsOn: date("ends_on"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type PayoutPeriod = typeof payoutPeriod.$inferSelect;
export type InsertPayoutPeriod = typeof payoutPeriod.$inferInsert;

export const payoutBatch = pgTable("payout_batch", {
  id: serial("id").primaryKey(),
  payoutPeriodId: integer("payout_period_id"),
  ambassadorId: integer("ambassador_id"),
  totalCents: integer("total_cents"),
  status: text("status").notNull().default("pending"),
  exportedAt: timestamp("exported_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type PayoutBatch = typeof payoutBatch.$inferSelect;
export type InsertPayoutBatch = typeof payoutBatch.$inferInsert;

/** A stop on a planned day route. Stored ordered inside route_plan.stops. */
export interface RouteStop {
  businessId: string;
  status: "pending" | "done" | "skipped";
}

/** One planned route per ambassador per (Pacific-time) day. */
export const routePlan = pgTable("route_plan", {
  id: serial("id").primaryKey(),
  ambassadorId: integer("ambassador_id").notNull(),
  planDate: date("plan_date").notNull(),
  stops: jsonb("stops").$type<RouteStop[]>().notNull().default([]),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type RoutePlan = typeof routePlan.$inferSelect;

/** Breadcrumbs recorded only while a day route is active (shift-scoped tracking). */
export const routePing = pgTable("route_ping", {
  id: serial("id").primaryKey(),
  ambassadorId: integer("ambassador_id").notNull(),
  routePlanId: integer("route_plan_id").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
});
export type RoutePing = typeof routePing.$inferSelect;

/** One-time 6-digit password-reset codes (hashes only; emailed via Resend). */
export const authResetCode = pgTable("auth_reset_code", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type AuthResetCode = typeof authResetCode.$inferSelect;

/** Watermarks for the two website read surfaces (directory sync + claim reconciliation). */
export const syncState = pgTable("sync_state", {
  id: serial("id").primaryKey(),
  source: text("source").notNull().unique(),
  watermark: timestamp("watermark", { withTimezone: true }),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastStatus: text("last_status"),
});
export type SyncState = typeof syncState.$inferSelect;
export type InsertSyncState = typeof syncState.$inferInsert;
