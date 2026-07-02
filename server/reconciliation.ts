/**
 * Claim verification & attribution engine (§4 / §2b).
 *
 * The website's business_users row carries BOTH the fact of a claim AND the
 * attributing referral_code, so verification and attribution are one
 * reconciliation off one row. Rules (load-bearing):
 *   - A claim is never "verified" from ambassador input alone — every verified
 *     claim references a real business_users row (source_business_users_id).
 *   - referral_code matches by PLAIN EQUALITY against the citext column; there
 *     is NO lowercasing/normalization in app code (the DB handles case).
 *   - NULL referral never pays (→ unattributed). Unknown code → anomaly (never
 *     silently paid). Bounty amount comes from bounty_config, never hardcoded.
 *   - Attribution does NOT require a logged visit; a matching row is sufficient.
 *   - Idempotent: the same business_users row never creates two claims.
 */
import { and, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { getDb } from "./db";
import { ambassador, bountyConfig, claim, syncState, visit } from "../drizzle/schema";
import {
  BusinessUsersRowRaw,
  fetchBusinessUsersByBusiness,
  fetchBusinessUsersPage,
} from "./websiteDb";

export type ReconcileSource = "webhook" | "poll" | "live_check" | "manual";

export type ReconcileAction =
  | { kind: "idempotent"; claimId: number }
  | { kind: "unattributed" }
  | { kind: "anomaly" }
  | { kind: "verified"; ambassadorId: number; upgradeClaimId?: number };

export interface ReconcileInputs {
  /** A claim already tied to this exact source row (idempotency guard). */
  existingBySource: { id: number } | null;
  /** Ambassador matched by referral_code (citext equality in SQL), or null. */
  ambassadorId: number | null;
  /** Existing 'logged' claim for (business, ambassador) with no source row yet. */
  loggedClaim: { id: number } | null;
}

/**
 * PURE decision — no DB, no I/O. This is the whole of §4's branching and is
 * what the synthetic tests exercise. Matching/normalization is deliberately NOT
 * here: the caller resolves `ambassadorId` via a citext `=` in SQL, so case is
 * handled by the database, never by app code.
 */
export function decideReconciliation(
  row: Pick<BusinessUsersRowRaw, "referral_code">,
  inp: ReconcileInputs
): ReconcileAction {
  // Idempotency first: this source row already produced a claim.
  if (inp.existingBySource) return { kind: "idempotent", claimId: inp.existingBySource.id };
  // NULL referral never pays.
  if (row.referral_code == null) return { kind: "unattributed" };
  // Present code but no ambassador owns it → anomaly (never silently paid).
  if (inp.ambassadorId == null) return { kind: "anomaly" };
  // Attributed: verify (upgrading an existing logged claim if one exists).
  return { kind: "verified", ambassadorId: inp.ambassadorId, upgradeClaimId: inp.loggedClaim?.id };
}

/** Active bounty (cents) from config, or null when unset (claims still verify). */
async function getActiveBountyCents(db: NonNullable<Awaited<ReturnType<typeof getDb>>>): Promise<number | null> {
  const now = new Date();
  const rows = await db
    .select({ amt: bountyConfig.amountCents })
    .from(bountyConfig)
    .where(and(lte(bountyConfig.effectiveFrom, now), or(isNull(bountyConfig.effectiveTo), gt(bountyConfig.effectiveTo, now))))
    .orderBy(desc(bountyConfig.effectiveFrom))
    .limit(1);
  return rows[0]?.amt ?? null;
}

export interface ReconcileResult {
  action: ReconcileAction["kind"];
  claimId: number | null;
  state: string | null;
  bountyAmountCents: number | null;
}

/**
 * Reconcile one business_users-shaped row into a CRM claim. Idempotent: keyed on
 * source_business_users_id (unique). Works for both the poll/webhook feed and
 * the on-demand live-check.
 */
export async function reconcileFromRow(
  row: BusinessUsersRowRaw,
  source: ReconcileSource
): Promise<ReconcileResult> {
  const db = await getDb();
  if (!db) throw new Error("CRM database not available");

  // Idempotency guard: has this source row already produced a claim?
  const existing = await db
    .select({ id: claim.id, state: claim.state, bounty: claim.bountyAmountCents })
    .from(claim)
    .where(eq(claim.sourceBusinessUsersId, row.id))
    .limit(1);
  if (existing[0]) {
    return { action: "idempotent", claimId: existing[0].id, state: existing[0].state, bountyAmountCents: existing[0].bounty ?? null };
  }

  // Resolve ambassador by PLAIN citext equality (DB handles case). No lowercasing.
  let ambassadorId: number | null = null;
  if (row.referral_code != null) {
    const a = await db
      .select({ id: ambassador.id })
      .from(ambassador)
      .where(eq(ambassador.referralCode, row.referral_code))
      .limit(1);
    ambassadorId = a[0]?.id ?? null;
  }

  // Existing 'logged' claim (ambassador logged claimed_onsite before the row landed)?
  let loggedClaim: { id: number } | null = null;
  if (ambassadorId != null) {
    const lc = await db
      .select({ id: claim.id })
      .from(claim)
      .where(and(eq(claim.businessId, row.business_id), eq(claim.ambassadorId, ambassadorId), eq(claim.state, "logged"), isNull(claim.sourceBusinessUsersId)))
      .limit(1);
    loggedClaim = lc[0] ?? null;
  }

  const action = decideReconciliation(row, { existingBySource: null, ambassadorId, loggedClaim });
  const createdAt = row.created_at ? new Date(row.created_at) : new Date();

  if (action.kind === "unattributed") {
    const id = await insertOrGetBySource(db, {
      businessId: row.business_id,
      referralCode: null,
      state: "unattributed",
      sourceBusinessUsersId: row.id,
      verificationSource: source,
    });
    return { action: "unattributed", claimId: id, state: "unattributed", bountyAmountCents: null };
  }

  if (action.kind === "anomaly") {
    const id = await insertOrGetBySource(db, {
      businessId: row.business_id,
      referralCode: row.referral_code, // keep the unknown code for review
      state: "anomaly",
      sourceBusinessUsersId: row.id,
      verificationSource: source,
    });
    return { action: "anomaly", claimId: id, state: "anomaly", bountyAmountCents: null };
  }

  // Only 'verified' remains (existingBySource was null, so 'idempotent' is unreachable here).
  if (action.kind !== "verified") throw new Error(`unexpected reconcile action: ${action.kind}`);

  const bounty = await getActiveBountyCents(db);
  const now = new Date();

  if (action.upgradeClaimId) {
    await db
      .update(claim)
      .set({
        state: "verified",
        ambassadorId: action.ambassadorId,
        referralCode: row.referral_code,
        sourceBusinessUsersId: row.id,
        bountyAmountCents: bounty,
        verifiedAt: now,
        verificationSource: source,
        updatedAt: now,
      })
      .where(eq(claim.id, action.upgradeClaimId));
    return { action: "verified", claimId: action.upgradeClaimId, state: "verified", bountyAmountCents: bounty };
  }

  // Link a recent visit if one exists (not required for attribution).
  const v = await db
    .select({ id: visit.id })
    .from(visit)
    .where(and(eq(visit.ambassadorId, action.ambassadorId), eq(visit.businessId, row.business_id)))
    .orderBy(desc(visit.createdAt))
    .limit(1);

  const inserted = await db
    .insert(claim)
    .values({
      businessId: row.business_id,
      ambassadorId: action.ambassadorId,
      referralCode: row.referral_code,
      originatingVisitId: v[0]?.id ?? null,
      state: "verified",
      bountyAmountCents: bounty,
      sourceBusinessUsersId: row.id,
      verifiedAt: now,
      verificationSource: source,
      createdAt: createdAt,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: claim.sourceBusinessUsersId })
    .returning({ id: claim.id });

  const claimId = inserted[0]?.id ?? (await selectIdBySource(db, row.id));
  return { action: "verified", claimId, state: "verified", bountyAmountCents: bounty };
}

async function insertOrGetBySource(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  values: { businessId: string; referralCode: string | null; state: string; sourceBusinessUsersId: string; verificationSource: ReconcileSource }
): Promise<number> {
  const inserted = await db
    .insert(claim)
    .values(values)
    .onConflictDoNothing({ target: claim.sourceBusinessUsersId })
    .returning({ id: claim.id });
  return inserted[0]?.id ?? (await selectIdBySource(db, values.sourceBusinessUsersId));
}

async function selectIdBySource(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, sourceId: string): Promise<number> {
  const rows = await db.select({ id: claim.id }).from(claim).where(eq(claim.sourceBusinessUsersId, sourceId)).limit(1);
  return rows[0]!.id;
}

// ─── Feeds (§2b): poll + on-demand live-check ───────────────────────────────

const CLAIM_SYNC_SOURCE = "claim_events";
const POLL_PAGE = 500;

/** Poll the website business_users feed since the watermark and reconcile each. */
export async function pollClaimEvents(opts: { maxRows?: number; updateWatermark?: boolean } = {}) {
  const { maxRows = Infinity, updateWatermark = true } = opts;
  const db = await getDb();
  if (!db) throw new Error("CRM database not available");

  const stateRows = await db.select().from(syncState).where(eq(syncState.source, CLAIM_SYNC_SOURCE)).limit(1);
  const since: Date | null = stateRows[0]?.watermark ?? null;

  let offset = 0;
  let processed = 0;
  let maxCreated: Date | null = null;
  const counts: Record<string, number> = { verified: 0, unattributed: 0, anomaly: 0, idempotent: 0 };
  const startedAt = new Date();

  for (;;) {
    const remaining = maxRows - processed;
    if (remaining <= 0) break;
    const limit = Math.min(POLL_PAGE, remaining);
    const rows = await fetchBusinessUsersPage({ since, limit, offset });
    if (rows.length === 0) break;
    for (const r of rows) {
      const res = await reconcileFromRow(r, "poll");
      counts[res.action] = (counts[res.action] ?? 0) + 1;
      const c = new Date(r.created_at);
      if (!maxCreated || c > maxCreated) maxCreated = c;
    }
    processed += rows.length;
    offset += rows.length;
    if (rows.length < limit) break;
  }

  if (updateWatermark) {
    await db
      .update(syncState)
      .set({ watermark: maxCreated ?? since, lastRunAt: startedAt, lastStatus: `ok: ${processed} rows (${JSON.stringify(counts)})` })
      .where(eq(syncState.source, CLAIM_SYNC_SOURCE));
  }

  return { processed, counts, watermark: (maxCreated ?? since)?.toISOString() ?? null, startedAt: startedAt.toISOString() };
}

/**
 * On-demand live-check for one business (called when an ambassador logs
 * claimed_onsite, so verification isn't blocked on the poll interval).
 */
export async function reconcileLiveCheck(businessId: string): Promise<ReconcileResult[]> {
  const rows = await fetchBusinessUsersByBusiness(businessId);
  const out: ReconcileResult[] = [];
  for (const r of rows) out.push(await reconcileFromRow(r, "live_check"));
  return out;
}
