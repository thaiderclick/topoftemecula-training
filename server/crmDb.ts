/**
 * CRM data-access helpers (Phase 1). Ambassadors are existing training-app
 * users; referral codes are issued here (citext, unique). Business rows come
 * from the directory sync. Bounty is config-driven.
 */
import { randomBytes } from "crypto";
import { and, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { marketingValueTier, ValueTier } from "./marketingValue";
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
  routePlan,
  RouteStop,
  upgradeBonus,
  visit,
} from "../drizzle/schema";

export type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export async function requireDb(): Promise<Db> {
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

export async function getVisitsByAmbassador(ambassadorId: number, limit = 50) {
  const db = await requireDb();
  return db
    .select({
      id: visit.id,
      businessId: visit.businessId,
      businessName: business.name,
      businessCity: business.city,
      localClaimStatus: business.localClaimStatus,
      outcome: visit.outcome,
      notes: visit.notes,
      ownerEmailCaptured: visit.ownerEmailCaptured,
      ownerNameForFollowup: visit.ownerNameForFollowup,
      bestTimeToReturn: visit.bestTimeToReturn,
      createdAt: visit.createdAt,
    })
    .from(visit)
    .leftJoin(business, eq(business.businessId, visit.businessId))
    .where(eq(visit.ambassadorId, ambassadorId))
    .orderBy(desc(visit.createdAt))
    .limit(Math.max(1, Math.min(200, limit)));
}

/** The ambassador's claims with business names — the money pipeline they watch. */
export async function getClaimsByAmbassador(ambassadorId: number, limit = 100) {
  const db = await requireDb();
  return db
    .select({
      id: claim.id,
      businessId: claim.businessId,
      businessName: business.name,
      state: claim.state,
      bountyAmountCents: claim.bountyAmountCents,
      verifiedAt: claim.verifiedAt,
      paidAt: claim.paidAt,
      createdAt: claim.createdAt,
    })
    .from(claim)
    .leftJoin(business, eq(business.businessId, claim.businessId))
    .where(eq(claim.ambassadorId, ambassadorId))
    .orderBy(desc(claim.createdAt))
    .limit(Math.max(1, Math.min(200, limit)));
}

// ─── Route targeting (§6) ───────────────────────────────────────────────────

export interface TargetQuery {
  lat?: number | null;
  lng?: number | null;
  limit?: number;
}

// Columns the /crm target queue actually renders — the full row (incl. hours
// jsonb) is deliberately not shipped.
const TARGET_COLUMNS = {
  businessId: business.businessId,
  name: business.name,
  slug: business.slug,
  city: business.city,
  address: business.address,
  phone: business.phone,
  lat: business.lat,
  lng: business.lng,
  confidenceScore: business.confidenceScore,
  verticalType: business.verticalType,
  categoryName: business.categoryName,
};

/**
 * Ranked target queue: unclaimed businesses not already worked-to-claimed.
 * With a location, filters to a bounding box and ranks by haversine distance
 * IN SQL (so the true nearest rows win, not just the highest-confidence 500);
 * otherwise ranks by confidence_score (proxy for "ripe"). No PostGIS.
 */
export async function getTargets(q: TargetQuery) {
  const db = await requireDb();
  const limit = Math.max(1, Math.min(200, q.limit ?? 50));
  const hasLoc = typeof q.lat === "number" && typeof q.lng === "number";

  const conds = [eq(business.directoryClaimStatus, "unclaimed"), ne(business.localClaimStatus, "claimed")];

  if (!hasLoc) {
    const rows = await db
      .select(TARGET_COLUMNS)
      .from(business)
      .where(and(...conds))
      .orderBy(sql`${business.confidenceScore} desc nulls last`)
      .limit(limit);
    return rows.map((r) => ({ ...r, distanceMiles: null as number | null }));
  }

  const dLat = 0.4; // ~28 mi
  const dLng = 0.5;
  conds.push(
    sql`${business.lat} between ${q.lat! - dLat} and ${q.lat! + dLat}`,
    sql`${business.lng} between ${q.lng! - dLng} and ${q.lng! + dLng}`
  );

  const distanceMiles = sql<number>`
    2 * 3958.8 * asin(sqrt(
      power(sin(radians(${business.lat} - ${q.lat!}) / 2), 2)
      + cos(radians(${q.lat!})) * cos(radians(${business.lat}))
        * power(sin(radians(${business.lng} - ${q.lng!}) / 2), 2)
    ))`;

  const rows = await db
    .select({ ...TARGET_COLUMNS, distanceMiles })
    .from(business)
    .where(and(...conds))
    .orderBy(distanceMiles)
    .limit(limit);
  return rows.map((r) => ({ ...r, distanceMiles: Number(r.distanceMiles) }));
}

// ─── Earnings (§7) ──────────────────────────────────────────────────────────

export async function getEarnings(ambassadorId: number) {
  const db = await requireDb();
  const [rows, visitCountRows, bonusRows] = await Promise.all([
    db
      .select({
        paidCents: sql<number>`coalesce(sum(case when ${claim.state}='paid' then ${claim.bountyAmountCents} end),0)`,
        verifiedUnpaidCents: sql<number>`coalesce(sum(case when ${claim.state}='verified' then ${claim.bountyAmountCents} end),0)`,
        pendingCount: sql<number>`count(*) filter (where ${claim.state}='logged')`,
        // Lifetime conversions: paying a claim must never make the verified
        // count / conversion % drop (the leaderboard counts the same way).
        verifiedCount: sql<number>`count(*) filter (where ${claim.state} in ('verified','paid'))`,
        paidCount: sql<number>`count(*) filter (where ${claim.state}='paid')`,
      })
      .from(claim)
      .where(eq(claim.ambassadorId, ambassadorId)),
    db
      .select({ n: sql<number>`count(*)` })
      .from(visit)
      .where(eq(visit.ambassadorId, ambassadorId)),
    db
      .select({
        bonusUnpaidCents: sql<number>`coalesce(sum(case when ${upgradeBonus.paidAt} is null then ${upgradeBonus.amountCents} end),0)`,
        bonusPaidCents: sql<number>`coalesce(sum(case when ${upgradeBonus.paidAt} is not null then ${upgradeBonus.amountCents} end),0)`,
        bonusCount: sql<number>`count(*)`,
      })
      .from(upgradeBonus)
      .where(eq(upgradeBonus.ambassadorId, ambassadorId)),
  ]);

  const r = rows[0];
  const visitCount = Number(visitCountRows[0]?.n ?? 0);
  const verifiedCount = Number(r?.verifiedCount ?? 0);
  const b = bonusRows[0];
  return {
    paidCents: Number(r?.paidCents ?? 0) + Number(b?.bonusPaidCents ?? 0),
    verifiedUnpaidCents: Number(r?.verifiedUnpaidCents ?? 0) + Number(b?.bonusUnpaidCents ?? 0),
    pendingCount: Number(r?.pendingCount ?? 0),
    verifiedCount,
    paidCount: Number(r?.paidCount ?? 0),
    upgradeBonusCount: Number(b?.bonusCount ?? 0),
    upgradeBonusCents: Number(b?.bonusUnpaidCents ?? 0) + Number(b?.bonusPaidCents ?? 0),
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

async function activeConfigRow(kind: "claim" | "upgrade", tier?: string) {
  const db = await requireDb();
  const now = new Date();
  const conds = [
    eq(bountyConfig.kind, kind),
    sql`${bountyConfig.effectiveFrom} <= ${now}`,
    or(isNull(bountyConfig.effectiveTo), gt(bountyConfig.effectiveTo, now)),
  ];
  if (tier) conds.push(eq(bountyConfig.tier, tier));
  const rows = await db
    .select()
    .from(bountyConfig)
    .where(and(...conds))
    .orderBy(desc(bountyConfig.effectiveFrom))
    .limit(1);
  return rows[0] ?? null;
}

export async function getActiveBounty() {
  return activeConfigRow("claim");
}

export const UPGRADE_TIERS = ["enhanced", "premium", "growth_partner"] as const;
export type UpgradeTier = (typeof UPGRADE_TIERS)[number];

/** Active upgrade-bonus amounts for every paid tier (null = unset). */
export async function getUpgradeBountyConfig(): Promise<Record<UpgradeTier, number | null>> {
  const out = {} as Record<UpgradeTier, number | null>;
  for (const tier of UPGRADE_TIERS) {
    out[tier] = (await activeConfigRow("upgrade", tier))?.amountCents ?? null;
  }
  return out;
}

/** Set the bonus for one tier; backfills detected bonuses that predate it. */
export async function setUpgradeBounty(tier: UpgradeTier, amountCents: number) {
  const db = await requireDb();
  const now = new Date();
  await db
    .update(bountyConfig)
    .set({ effectiveTo: now })
    .where(and(eq(bountyConfig.kind, "upgrade"), eq(bountyConfig.tier, tier), isNull(bountyConfig.effectiveTo)));
  await db.insert(bountyConfig).values({ amountCents, kind: "upgrade", tier, effectiveFrom: now });

  const backfilled = await db
    .update(upgradeBonus)
    .set({ amountCents })
    .where(and(eq(upgradeBonus.tier, tier), isNull(upgradeBonus.amountCents)))
    .returning({ id: upgradeBonus.id });
  return { tier, amountCents, backfilledBonuses: backfilled.length };
}

/** Attribution window: an upgrade counts if it appears within 90 days of the claim. */
const UPGRADE_WINDOW_DAYS = 90;

/**
 * Detect upgrade bonuses: attributed verified/paid claims whose business the
 * directory sync now shows on a paid tier, with no bonus yet. Runs after the
 * nightly sync (fresh tiers); idempotent via upgrade_bonus.claim_id UNIQUE.
 */
export async function detectUpgradeBonuses(): Promise<number> {
  const db = await requireDb();
  const candidates = await db
    .select({
      claimId: claim.id,
      ambassadorId: claim.ambassadorId,
      businessId: claim.businessId,
      tier: business.subscriptionTier,
    })
    .from(claim)
    .innerJoin(business, eq(business.businessId, claim.businessId))
    .leftJoin(upgradeBonus, eq(upgradeBonus.claimId, claim.id))
    .where(
      and(
        sql`${claim.state} in ('verified','paid')`,
        sql`${claim.ambassadorId} is not null`,
        sql`${business.subscriptionTier} is not null and ${business.subscriptionTier} <> 'free'`,
        sql`${upgradeBonus.id} is null`,
        sql`coalesce(${claim.verifiedAt}, ${claim.createdAt}) > now() - interval '${sql.raw(String(UPGRADE_WINDOW_DAYS))} days'`
      )
    );

  let created = 0;
  for (const c of candidates) {
    const tier = c.tier as string;
    const amount = (await activeConfigRow("upgrade", tier))?.amountCents ?? null;
    const inserted = await db
      .insert(upgradeBonus)
      .values({ claimId: c.claimId, ambassadorId: c.ambassadorId!, businessId: c.businessId, tier, amountCents: amount })
      .onConflictDoNothing({ target: upgradeBonus.claimId })
      .returning({ id: upgradeBonus.id });
    if (inserted[0]) created += 1;
  }
  if (created > 0) console.log(`[upgradeBonus] detected ${created} new upgrade bonus(es)`);
  return created;
}

/**
 * Set the active bounty: close the current one and insert the new amount.
 * Also backfills verified claims that carry no bounty (verified while
 * bounty_config was empty — the intentional prelaunch state). Without this,
 * those claims would sum to $0 forever: reconciliation's idempotency guard
 * never re-stamps an existing claim.
 */
export async function setBounty(amountCents: number) {
  const db = await requireDb();
  const now = new Date();
  await db
    .update(bountyConfig)
    .set({ effectiveTo: now })
    .where(and(eq(bountyConfig.kind, "claim"), isNull(bountyConfig.effectiveTo)));
  const inserted = await db.insert(bountyConfig).values({ amountCents, kind: "claim", effectiveFrom: now }).returning();

  const backfilled = await db
    .update(claim)
    .set({ bountyAmountCents: amountCents, updatedAt: now })
    .where(and(eq(claim.state, "verified"), isNull(claim.bountyAmountCents)))
    .returning({ id: claim.id });

  return { ...inserted[0], backfilledClaims: backfilled.length };
}


// ─── Day routes (§2c) ───────────────────────────────────────────────────────

/** Today's date string in the ambassadors' timezone (routes are a PT concept). */
export function ptToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

// JS haversine for ordering a handful of stops; the SQL version stays the way
// large target sets are ranked.
function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const MAX_ROUTE_STOPS = 20;

export interface EnrichedRouteStop extends RouteStop {
  name: string | null;
  valueTier: ValueTier;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  localClaimStatus: string | null;
  /** Miles from the previous stop (null for the first stop or missing coords). */
  distanceFromPrevMiles: number | null;
}

export interface RoutePlanView {
  planDate: string;
  status: string;
  stops: EnrichedRouteStop[];
  totalMiles: number;
}

async function enrichPlan(db: Db, plan: { planDate: string; status: string; stops: RouteStop[] }): Promise<RoutePlanView> {
  const ids = plan.stops.map((st) => st.businessId);
  const rows = ids.length
    ? await db
        .select({
          businessId: business.businessId,
          name: business.name,
          address: business.address,
          city: business.city,
          lat: business.lat,
          lng: business.lng,
          localClaimStatus: business.localClaimStatus,
          verticalType: business.verticalType,
          categoryName: business.categoryName,
        })
        .from(business)
        .where(inArray(business.businessId, ids))
    : [];
  const byId = new Map(rows.map((r) => [r.businessId, r]));

  let prev: { lat: number; lng: number } | null = null;
  let totalMiles = 0;
  const stops: EnrichedRouteStop[] = plan.stops.map((st) => {
    const b = byId.get(st.businessId);
    let distanceFromPrevMiles: number | null = null;
    if (b?.lat != null && b?.lng != null) {
      if (prev) {
        distanceFromPrevMiles = haversineMiles(prev.lat, prev.lng, b.lat, b.lng);
        totalMiles += distanceFromPrevMiles;
      }
      prev = { lat: b.lat, lng: b.lng };
    }
    return {
      ...st,
      valueTier: marketingValueTier(b?.name ?? null, b?.verticalType ?? null, b?.categoryName ?? null),
      name: b?.name ?? null,
      address: b?.address ?? null,
      city: b?.city ?? null,
      lat: b?.lat ?? null,
      lng: b?.lng ?? null,
      localClaimStatus: b?.localClaimStatus ?? null,
      distanceFromPrevMiles,
    };
  });

  return { planDate: plan.planDate, status: plan.status, stops, totalMiles };
}

export async function getRoutePlan(ambassadorId: number): Promise<RoutePlanView | null> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(routePlan)
    .where(and(eq(routePlan.ambassadorId, ambassadorId), eq(routePlan.planDate, ptToday())))
    .limit(1);
  if (!rows[0]) return null;
  return enrichPlan(db, rows[0]);
}

/** Nearest-neighbor ordering: greedy walk from the start point. Stops without
 *  coordinates keep their relative order at the end. */
function orderNearestNeighbor(
  ids: string[],
  coords: Map<string, { lat: number | null; lng: number | null }>,
  start: { lat: number; lng: number } | null
): string[] {
  const withCoords = ids.filter((id) => coords.get(id)?.lat != null && coords.get(id)?.lng != null);
  const without = ids.filter((id) => !withCoords.includes(id));
  if (!start || withCoords.length < 2) return [...withCoords, ...without];

  const remaining = new Set(withCoords);
  const ordered: string[] = [];
  let cur = { lat: start.lat, lng: start.lng };
  while (remaining.size) {
    let best: string | null = null;
    let bestD = Infinity;
    remaining.forEach((id) => {
      const c = coords.get(id)!;
      const d = haversineMiles(cur.lat, cur.lng, c.lat!, c.lng!);
      if (d < bestD) { bestD = d; best = id; }
    });
    ordered.push(best!);
    remaining.delete(best!);
    const c = coords.get(best!)!;
    cur = { lat: c.lat!, lng: c.lng! };
  }
  return [...ordered, ...without];
}

/**
 * Build (or rebuild) today's route: the ambassador's open follow-ups first,
 * filled to `count` with the nearest unclaimed targets, then ordered
 * nearest-neighbor from their location.
 */
export async function buildRoutePlan(
  ambassadorId: number,
  opts: { lat?: number | null; lng?: number | null; count?: number; includeFollowups?: boolean }
): Promise<RoutePlanView> {
  const db = await requireDb();
  const count = Math.max(1, Math.min(MAX_ROUTE_STOPS, opts.count ?? 8));
  const includeFollowups = opts.includeFollowups ?? true;
  const hasLoc = typeof opts.lat === "number" && typeof opts.lng === "number";

  const ids: string[] = [];
  const seen = new Set<string>();
  const push = (id: string) => { if (!seen.has(id)) { seen.add(id); ids.push(id); } };

  if (includeFollowups) {
    const visits = await getVisitsByAmbassador(ambassadorId, 100);
    const latestPerBusiness = new Set<string>();
    for (const v of visits) {
      if (latestPerBusiness.has(v.businessId)) continue;
      latestPerBusiness.add(v.businessId);
      const needsFollowup = (v.outcome === "left_info_needs_followup" || v.outcome === "no_decision_maker") && v.localClaimStatus !== "claimed";
      if (needsFollowup && ids.length < count) push(v.businessId);
    }
  }

  if (ids.length < count) {
    // Over-fetch, then favor businesses whose type typically pays for
    // marketing (legal/medical/home services/venues...) — the stable sort
    // keeps getTargets' distance/confidence order within each tier.
    const targets = await getTargets({ lat: opts.lat ?? null, lng: opts.lng ?? null, limit: Math.min(200, count * 5) });
    const ranked = targets
      .map((t) => ({ id: t.businessId, tier: marketingValueTier(t.name, t.verticalType, t.categoryName) }))
      .sort((a, b) => b.tier - a.tier);
    for (const t of ranked) {
      if (ids.length >= count) break;
      push(t.id);
    }
  }

  // Out-of-coverage location (traveling, bad GPS): the ~±28mi bounding box
  // found nothing — build by confidence instead so the route still works.
  let useLocationOrdering = hasLoc;
  if (ids.length === 0 && hasLoc) {
    useLocationOrdering = false;
    const fallback = await getTargets({ lat: null, lng: null, limit: count });
    for (const t of fallback) {
      if (ids.length >= count) break;
      push(t.businessId);
    }
  }
  if (ids.length === 0) {
    throw new Error("No unclaimed businesses available to route — the directory may not be synced yet.");
  }

  const coordRows = ids.length
    ? await db
        .select({ businessId: business.businessId, lat: business.lat, lng: business.lng })
        .from(business)
        .where(inArray(business.businessId, ids))
    : [];
  const coords = new Map(coordRows.map((r) => [r.businessId, { lat: r.lat, lng: r.lng }]));
  const ordered = orderNearestNeighbor(ids, coords, useLocationOrdering ? { lat: opts.lat!, lng: opts.lng! } : null);
  const stops: RouteStop[] = ordered.map((businessId) => ({ businessId, status: "pending" }));

  await db
    .insert(routePlan)
    .values({ ambassadorId, planDate: ptToday(), stops, status: "active" })
    .onConflictDoUpdate({
      target: [routePlan.ambassadorId, routePlan.planDate],
      set: { stops, status: "active", updatedAt: new Date() },
    });

  return (await getRoutePlan(ambassadorId))!;
}

async function loadTodayPlan(db: Db, ambassadorId: number) {
  const rows = await db
    .select()
    .from(routePlan)
    .where(and(eq(routePlan.ambassadorId, ambassadorId), eq(routePlan.planDate, ptToday())))
    .limit(1);
  return rows[0] ?? null;
}

async function savePlanStops(db: Db, planId: number, stops: RouteStop[]) {
  const done = stops.length > 0 && stops.every((st) => st.status !== "pending");
  await db
    .update(routePlan)
    .set({ stops, status: done ? "completed" : "active", updatedAt: new Date() })
    .where(eq(routePlan.id, planId));
}

/** Append one business to today's route (creates the plan if none exists). */
export async function addRouteStop(ambassadorId: number, businessId: string): Promise<RoutePlanView> {
  const db = await requireDb();
  const plan = await loadTodayPlan(db, ambassadorId);
  if (!plan) {
    await db.insert(routePlan).values({
      ambassadorId,
      planDate: ptToday(),
      stops: [{ businessId, status: "pending" }],
      status: "active",
    });
  } else if (!plan.stops.some((st) => st.businessId === businessId)) {
    if (plan.stops.length >= MAX_ROUTE_STOPS) throw new Error(`Routes cap at ${MAX_ROUTE_STOPS} stops.`);
    await savePlanStops(db, plan.id, [...plan.stops, { businessId, status: "pending" }]);
  }
  return (await getRoutePlan(ambassadorId))!;
}

export async function setRouteStopStatus(
  ambassadorId: number,
  businessId: string,
  status: RouteStop["status"]
): Promise<RoutePlanView | null> {
  const db = await requireDb();
  const plan = await loadTodayPlan(db, ambassadorId);
  if (!plan) return null;
  const stops = plan.stops.map((st) => (st.businessId === businessId ? { ...st, status } : st));
  await savePlanStops(db, plan.id, stops);
  return getRoutePlan(ambassadorId);
}

/** Best-effort: logging a visit checks the business off today's route. */
export async function markRouteStopDone(ambassadorId: number, businessId: string): Promise<void> {
  try {
    const db = await requireDb();
    const plan = await loadTodayPlan(db, ambassadorId);
    if (!plan || !plan.stops.some((st) => st.businessId === businessId)) return;
    const stops = plan.stops.map((st): RouteStop => (st.businessId === businessId ? { ...st, status: "done" } : st));
    await savePlanStops(db, plan.id, stops);
  } catch (e) {
    console.warn("[route] could not mark stop done:", e);
  }
}

export async function clearRoutePlan(ambassadorId: number): Promise<void> {
  const db = await requireDb();
  await db
    .delete(routePlan)
    .where(and(eq(routePlan.ambassadorId, ambassadorId), eq(routePlan.planDate, ptToday())));
}
// ─── Curriculum gaps (§8) ───────────────────────────────────────────────────

export async function submitCurriculumGap(data: InsertCurriculumGap) {
  const db = await requireDb();
  await db.insert(curriculumGap).values(data);
}

export async function getCurriculumGaps() {
  const db = await requireDb();
  return db
    .select({
      id: curriculumGap.id,
      objectionText: curriculumGap.objectionText,
      context: curriculumGap.context,
      status: curriculumGap.status,
      businessName: business.name,
      ambassadorName: sql<string | null>`u.name`,
      createdAt: curriculumGap.createdAt,
    })
    .from(curriculumGap)
    .leftJoin(business, eq(business.businessId, curriculumGap.businessId))
    .leftJoin(ambassador, eq(ambassador.id, curriculumGap.ambassadorId))
    .leftJoin(sql`users u`, sql`u.id = ${ambassador.userId}`)
    .orderBy(desc(curriculumGap.createdAt));
}

// ─── Admin views ────────────────────────────────────────────────────────────

export async function getAnomalyClaims() {
  const db = await requireDb();
  return db
    .select({
      id: claim.id,
      businessId: claim.businessId,
      businessName: business.name,
      businessCity: business.city,
      referralCode: claim.referralCode,
      verificationSource: claim.verificationSource,
      createdAt: claim.createdAt,
    })
    .from(claim)
    .leftJoin(business, eq(business.businessId, claim.businessId))
    .where(eq(claim.state, "anomaly"))
    .orderBy(desc(claim.createdAt));
}

/** Leaderboard with names: verified-claim counts per ambassador. */
export async function getLeaderboard() {
  const db = await requireDb();
  return db
    .select({
      ambassadorId: claim.ambassadorId,
      name: sql<string | null>`max(u.name)`,
      referralCode: sql<string | null>`max(${ambassador.referralCode}::text)`,
      verified: sql<number>`count(*) filter (where ${claim.state} in ('verified','paid'))`,
      earnedCents: sql<number>`coalesce(sum(case when ${claim.state} in ('verified','paid') then ${claim.bountyAmountCents} end), 0)`,
    })
    .from(claim)
    .leftJoin(ambassador, eq(ambassador.id, claim.ambassadorId))
    .leftJoin(sql`users u`, sql`u.id = ${ambassador.userId}`)
    .where(sql`${claim.ambassadorId} is not null`)
    .groupBy(claim.ambassadorId)
    .orderBy(sql`count(*) filter (where ${claim.state} in ('verified','paid')) desc`);
}
