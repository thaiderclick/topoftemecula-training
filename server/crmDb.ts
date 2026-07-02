/**
 * CRM data-access helpers (Phase 1). Ambassadors are existing training-app
 * users; referral codes are issued here (citext, unique). Business rows come
 * from the directory sync. Bounty is config-driven.
 */
import { randomBytes } from "crypto";
import { and, desc, eq, gt, isNull, ne, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  Ambassador,
  ambassador,
  bountyConfig,
  business,
  claim,
  curriculumGap,
  followupTask,
  InsertCurriculumGap,
  InsertVisit,
  visit,
} from "../drizzle/schema";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new Error("CRM database not available");
  return db;
}

// ─── Ambassador issuance ────────────────────────────────────────────────────

function codeFromName(name: string | null | undefined): string {
  const base = (name ?? "amb").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "AMB";
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const b = randomBytes(4);
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += alphabet[b[i] % alphabet.length];
  return `${base}-${suffix}`;
}

/** Get the ambassador for a user, creating one (with a unique code) on first use. */
export async function ensureAmbassador(userId: number, name: string | null): Promise<Ambassador> {
  const db = await requireDb();
  const existing = await db.select().from(ambassador).where(eq(ambassador.userId, userId)).limit(1);
  if (existing[0]) return existing[0];

  // Generate a unique referral code (citext-unique; retry on collision).
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = codeFromName(name);
    const inserted = await db
      .insert(ambassador)
      .values({ userId, referralCode: code })
      .onConflictDoNothing()
      .returning();
    if (inserted[0]) return inserted[0];
    // userId conflict means a row was created concurrently — return it.
    const again = await db.select().from(ambassador).where(eq(ambassador.userId, userId)).limit(1);
    if (again[0]) return again[0];
  }
  throw new Error("could not issue a unique referral code");
}

export async function getAmbassadorByUserId(userId: number): Promise<Ambassador | null> {
  const db = await requireDb();
  const rows = await db.select().from(ambassador).where(eq(ambassador.userId, userId)).limit(1);
  return rows[0] ?? null;
}

// ─── Visits (§5) ────────────────────────────────────────────────────────────

const REVISIT_OUTCOMES = new Set(["first_visit", "follow_up"]);

/**
 * Log a visit. Applies the soft conflict lock (marks the business in_progress on
 * first_visit/follow_up). For claimed_onsite, creates a `logged` claim (never
 * pays directly) — the caller then runs the live-check. Attribution is always
 * decided later by the business_users referral_code, never by who logged first.
 */
export async function createVisit(
  ambassadorId: number,
  data: Omit<InsertVisit, "ambassadorId">
): Promise<{ visitId: number; loggedClaimId: number | null }> {
  const db = await requireDb();

  const inserted = await db
    .insert(visit)
    .values({ ...data, ambassadorId })
    .returning({ id: visit.id });
  const visitId = inserted[0].id;

  // Soft conflict lock: mark in_progress, but never downgrade a 'claimed' row.
  if (REVISIT_OUTCOMES.has(data.outcome)) {
    await db
      .update(business)
      .set({ localClaimStatus: "in_progress" })
      .where(and(eq(business.businessId, data.businessId), ne(business.localClaimStatus, "claimed")));
  }

  let loggedClaimId: number | null = null;
  if (data.outcome === "claimed_onsite") {
    await db
      .update(business)
      .set({ localClaimStatus: "claimed" })
      .where(eq(business.businessId, data.businessId));

    const amb = await db.select({ code: ambassador.referralCode }).from(ambassador).where(eq(ambassador.id, ambassadorId)).limit(1);

    // Avoid duplicate logged claims for the same (business, ambassador).
    const existingLogged = await db
      .select({ id: claim.id })
      .from(claim)
      .where(and(eq(claim.businessId, data.businessId), eq(claim.ambassadorId, ambassadorId), eq(claim.state, "logged")))
      .limit(1);

    if (existingLogged[0]) {
      loggedClaimId = existingLogged[0].id;
    } else {
      const c = await db
        .insert(claim)
        .values({
          businessId: data.businessId,
          ambassadorId,
          referralCode: amb[0]?.code ?? null,
          originatingVisitId: visitId,
          state: "logged",
        })
        .returning({ id: claim.id });
      loggedClaimId = c[0].id;
    }
  }

  return { visitId, loggedClaimId };
}

export async function getVisitsByAmbassador(ambassadorId: number) {
  const db = await requireDb();
  return db.select().from(visit).where(eq(visit.ambassadorId, ambassadorId)).orderBy(desc(visit.createdAt));
}

// ─── Route targeting (§6) ───────────────────────────────────────────────────

export interface TargetQuery {
  lat?: number | null;
  lng?: number | null;
  limit?: number;
}

function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Ranked target queue: unclaimed businesses not already worked-to-claimed.
 * With a location, filters to a bounding box and sorts by distance; otherwise
 * ranks by confidence_score (proxy for "ripe"). No PostGIS — app-side math.
 */
export async function getTargets(q: TargetQuery) {
  const db = await requireDb();
  const limit = Math.max(1, Math.min(200, q.limit ?? 50));
  const hasLoc = typeof q.lat === "number" && typeof q.lng === "number";

  const conds = [eq(business.directoryClaimStatus, "unclaimed"), ne(business.localClaimStatus, "claimed")];
  if (hasLoc) {
    const dLat = 0.4; // ~28 mi
    const dLng = 0.5;
    conds.push(
      sql`${business.lat} between ${q.lat! - dLat} and ${q.lat! + dLat}`,
      sql`${business.lng} between ${q.lng! - dLng} and ${q.lng! + dLng}`
    );
  }

  const rows = await db
    .select()
    .from(business)
    .where(and(...conds))
    .orderBy(sql`${business.confidenceScore} desc nulls last`)
    .limit(hasLoc ? 500 : limit);

  if (!hasLoc) return rows.map((r) => ({ ...r, distanceMiles: null as number | null }));

  return rows
    .map((r) => ({
      ...r,
      distanceMiles: r.lat != null && r.lng != null ? haversineMiles(q.lat!, q.lng!, r.lat, r.lng) : null,
    }))
    .sort((a, b) => (a.distanceMiles ?? 1e9) - (b.distanceMiles ?? 1e9))
    .slice(0, limit);
}

// ─── Earnings (§7) ──────────────────────────────────────────────────────────

export async function getEarnings(ambassadorId: number) {
  const db = await requireDb();
  const rows = await db
    .select({
      paidCents: sql<number>`coalesce(sum(case when ${claim.state}='paid' then ${claim.bountyAmountCents} end),0)`,
      verifiedUnpaidCents: sql<number>`coalesce(sum(case when ${claim.state}='verified' then ${claim.bountyAmountCents} end),0)`,
      pendingCount: sql<number>`count(*) filter (where ${claim.state}='logged')`,
      verifiedCount: sql<number>`count(*) filter (where ${claim.state}='verified')`,
      paidCount: sql<number>`count(*) filter (where ${claim.state}='paid')`,
    })
    .from(claim)
    .where(eq(claim.ambassadorId, ambassadorId));

  const visitCountRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(visit)
    .where(eq(visit.ambassadorId, ambassadorId));

  const r = rows[0];
  const visitCount = Number(visitCountRows[0]?.n ?? 0);
  const verifiedCount = Number(r?.verifiedCount ?? 0);
  return {
    paidCents: Number(r?.paidCents ?? 0),
    verifiedUnpaidCents: Number(r?.verifiedUnpaidCents ?? 0),
    pendingCount: Number(r?.pendingCount ?? 0),
    verifiedCount,
    paidCount: Number(r?.paidCount ?? 0),
    visitCount,
    conversionPct: visitCount > 0 ? Math.round((verifiedCount / visitCount) * 100) : 0,
  };
}

export async function getOpenFollowups(ambassadorId: number) {
  const db = await requireDb();
  return db
    .select()
    .from(followupTask)
    .where(and(eq(followupTask.ambassadorId, ambassadorId), eq(followupTask.done, false)))
    .orderBy(followupTask.dueDate);
}

// ─── Bounty config (§7) ─────────────────────────────────────────────────────

export async function getActiveBounty() {
  const db = await requireDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(bountyConfig)
    .where(and(sql`${bountyConfig.effectiveFrom} <= ${now}`, or(isNull(bountyConfig.effectiveTo), gt(bountyConfig.effectiveTo, now))))
    .orderBy(desc(bountyConfig.effectiveFrom))
    .limit(1);
  return rows[0] ?? null;
}

/** Set the active bounty: close the current one and insert the new amount. */
export async function setBounty(amountCents: number) {
  const db = await requireDb();
  const now = new Date();
  await db.update(bountyConfig).set({ effectiveTo: now }).where(isNull(bountyConfig.effectiveTo));
  const inserted = await db.insert(bountyConfig).values({ amountCents, effectiveFrom: now }).returning();
  return inserted[0];
}

// ─── Curriculum gaps (§8) ───────────────────────────────────────────────────

export async function submitCurriculumGap(data: InsertCurriculumGap) {
  const db = await requireDb();
  await db.insert(curriculumGap).values(data);
}

export async function getCurriculumGaps() {
  const db = await requireDb();
  return db.select().from(curriculumGap).orderBy(desc(curriculumGap.createdAt));
}

// ─── Admin views ────────────────────────────────────────────────────────────

export async function getAnomalyClaims() {
  const db = await requireDb();
  return db.select().from(claim).where(eq(claim.state, "anomaly")).orderBy(desc(claim.createdAt));
}

/** Opt-in leaderboard: verified-claim counts per ambassador. */
export async function getLeaderboard() {
  const db = await requireDb();
  return db
    .select({
      ambassadorId: claim.ambassadorId,
      verified: sql<number>`count(*) filter (where ${claim.state} in ('verified','paid'))`,
    })
    .from(claim)
    .groupBy(claim.ambassadorId)
    .orderBy(sql`count(*) filter (where ${claim.state} in ('verified','paid')) desc`);
}
