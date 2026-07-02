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
import { and, desc, eq, isNull } from "drizzle-orm";
import { ambassador, claim, syncState, visit } from "../drizzle/schema";
import { Db, getActiveBounty, requireDb } from "./crmDb";
import { ensureBusinessMirror } from "./directorySync";
import {
  BusinessUsersRowRaw,
  cursorFromWatermark,
  fetchBusinessUsersByBusiness,
  fetchBusinessUsersPage,
  KeysetCursor,
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

/** Active bounty (cents) via the single source of truth in crmDb (money-path
 *  queries must not be duplicated — the admin UI and reconciliation have to
 *  agree on what "active" means). Null when unset: claims still verify. */
async function activeBountyCents(): Promise<number | null> {
  return (await getActiveBounty())?.amountCents ?? null;
}

export interface ReconcileResult {
  action: ReconcileAction["kind"];
  claimId: number | null;
  state: string | null;
  /** Owner of the claim (also set on the idempotent path, so callers can tell
   *  whether a verified claim is theirs). */
  ambassadorId: number | null;
  bountyAmountCents: number | null;
}

/**
 * Reconcile one business_users-shaped row into a CRM claim. Idempotent: keyed on
 * source_business_users_id (unique). Works for both the poll/webhook feed and
 * the on-demand live-check.
 * @param opts.bountyCents Pass the active bounty when reconciling a batch so it
 *                         isn't re-queried per row; omit to fetch it here.
 */
export async function reconcileFromRow(
  row: BusinessUsersRowRaw,
  source: ReconcileSource,
  opts: { bountyCents?: number | null } = {}
): Promise<ReconcileResult> {
  const db = await requireDb();

  // Idempotency guard: has this source row already produced a claim?
  const existing = await db
    .select({ id: claim.id, state: claim.state, ambassadorId: claim.ambassadorId, bounty: claim.bountyAmountCents })
    .from(claim)
    .where(eq(claim.sourceBusinessUsersId, row.id))
    .limit(1);
  if (existing[0]) {
    return {
      action: "idempotent",
      claimId: existing[0].id,
      state: existing[0].state,
      ambassadorId: existing[0].ambassadorId ?? null,
      bountyAmountCents: existing[0].bounty ?? null,
    };
  }

  // Every non-idempotent path inserts a claim whose business_id FK references
  // the CRM mirror. A business claimed the same day it was added to the
  // directory (or before the initial backfill has run) wouldn't be there yet —
  // mirror it now instead of failing the insert.
  const mirrored = await ensureBusinessMirror(row.business_id);
  if (!mirrored) throw new Error(`business ${row.business_id} not found on the website`);

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
    return { action: "unattributed", claimId: id, state: "unattributed", ambassadorId: null, bountyAmountCents: null };
  }

  if (action.kind === "anomaly") {
    const id = await insertOrGetBySource(db, {
      businessId: row.business_id,
      referralCode: row.referral_code, // keep the unknown code for review
      state: "anomaly",
      sourceBusinessUsersId: row.id,
      verificationSource: source,
    });
    return { action: "anomaly", claimId: id, state: "anomaly", ambassadorId: null, bountyAmountCents: null };
  }

  // Only 'verified' remains (existingBySource was null, so 'idempotent' is unreachable here).
  if (action.kind !== "verified") throw new Error(`unexpected reconcile action: ${action.kind}`);

  const bounty = opts.bountyCents !== undefined ? opts.bountyCents : await activeBountyCents();
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
    return { action: "verified", claimId: action.upgradeClaimId, state: "verified", ambassadorId: action.ambassadorId, bountyAmountCents: bounty };
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
  return { action: "verified", claimId, state: "verified", ambassadorId: action.ambassadorId, bountyAmountCents: bounty };
}

async function insertOrGetBySource(
  db: Db,
  values: { businessId: string; referralCode: string | null; state: string; sourceBusinessUsersId: string; verificationSource: ReconcileSource }
): Promise<number> {
  const inserted = await db
    .insert(claim)
    .values(values)
    .onConflictDoNothing({ target: claim.sourceBusinessUsersId })
    .returning({ id: claim.id });
  return inserted[0]?.id ?? (await selectIdBySource(db, values.sourceBusinessUsersId));
}

async function selectIdBySource(db: Db, sourceId: string): Promise<number> {
  const rows = await db.select({ id: claim.id }).from(claim).where(eq(claim.sourceBusinessUsersId, sourceId)).limit(1);
  return rows[0]!.id;
}

// ─── Feeds (§2b): poll + on-demand live-check ───────────────────────────────

const CLAIM_SYNC_SOURCE = "claim_events";
const POLL_PAGE = 500;
// Re-read window behind the watermark: claim rows that committed after the
// last poll read but with created_at at-or-before the stored watermark (or
// sharing its exact timestamp) would otherwise be skipped FOREVER — a claim
// that never pays. Re-reads land on the idempotency guard and cost one query.
const CLAIM_WATERMARK_OVERLAP_MS = 60 * 60 * 1000;
// Stop paging cleanly before the serverless cap kills the process; the
// watermark is persisted per page, so the next run resumes.
const DEFAULT_POLL_TIME_BUDGET_MS = 45_000;

/**
 * Poll the website business_users feed since the watermark and reconcile each.
 * Money-path guarantees:
 * - the read starts an overlap window BEHIND the watermark (nothing is lost to
 *   late commits or equal timestamps; idempotency absorbs the re-reads);
 * - one bad row never blocks the rest: it's counted as failed, the run stops
 *   at the end of that page, and the watermark is pinned just before the
 *   failed row so it is retried next run;
 * - the watermark is persisted after every page, so a killed run resumes.
 */
export async function pollClaimEvents(opts: { maxRows?: number; updateWatermark?: boolean; timeBudgetMs?: number } = {}) {
  const { maxRows = Infinity, updateWatermark = true, timeBudgetMs = DEFAULT_POLL_TIME_BUDGET_MS } = opts;
  const db = await requireDb();

  const stateRows = await db.select().from(syncState).where(eq(syncState.source, CLAIM_SYNC_SOURCE)).limit(1);
  const since: Date | null = stateRows[0]?.watermark ?? null;
  let cursor: KeysetCursor | null = cursorFromWatermark(since, CLAIM_WATERMARK_OVERLAP_MS);

  let processed = 0;
  let failed = 0;
  let watermark: Date | null = since;
  let stoppedEarly = false;
  const counts: Record<string, number> = { verified: 0, unattributed: 0, anomaly: 0, idempotent: 0 };
  const startedAt = new Date();

  // One bounty read per run, not per row (it can't change mid-run on our side
  // of the money path; setBounty backfills if it lands mid-poll).
  const bountyCents = await activeBountyCents();

  const persist = async (status: string) => {
    if (!updateWatermark) return;
    await db
      .update(syncState)
      .set({ watermark, lastRunAt: startedAt, lastStatus: status })
      .where(eq(syncState.source, CLAIM_SYNC_SOURCE));
  };

  for (;;) {
    const remaining = maxRows - processed;
    if (remaining <= 0) break;
    const limit = Math.min(POLL_PAGE, remaining);
    const rows = await fetchBusinessUsersPage({ after: cursor, limit });
    if (rows.length === 0) break;

    let earliestFailed: Date | null = null;
    for (const r of rows) {
      try {
        const res = await reconcileFromRow(r, "poll", { bountyCents });
        counts[res.action] = (counts[res.action] ?? 0) + 1;
      } catch (e) {
        failed += 1;
        const c = new Date(r.created_at);
        if (!earliestFailed || c < earliestFailed) earliestFailed = c;
        console.error(`[pollClaims] reconcile failed for business_users ${r.id} (business ${r.business_id}):`, e);
      }
    }
    processed += rows.length;

    if (earliestFailed) {
      // Pin the watermark just before the earliest failure so it (and
      // everything after) is re-read next run, then stop: rows are ordered by
      // created_at, so advancing past the failure would orphan it.
      watermark = new Date(Math.max(earliestFailed.getTime() - 1, 0));
      stoppedEarly = true;
      await persist(`partial: ${processed} rows, ${failed} failed — pinned watermark before first failure for retry`);
      break;
    }

    const last = rows[rows.length - 1];
    watermark = new Date(last.created_at); // ms truncation covered by the overlap window
    cursor = { ts: last.created_at, id: last.id }; // microsecond-exact text for the page boundary
    if (rows.length < limit) break;

    await persist(`polling: ${processed} rows so far`);
    if (Date.now() - startedAt.getTime() > timeBudgetMs) {
      stoppedEarly = true;
      break;
    }
  }

  if (!stoppedEarly || failed === 0) {
    await persist(
      stoppedEarly
        ? `partial: ${processed} rows (${JSON.stringify(counts)}) — time budget reached; next run resumes`
        : `ok: ${processed} rows (${JSON.stringify(counts)})`
    );
  }

  return {
    processed,
    failed,
    completed: !stoppedEarly,
    counts,
    watermark: watermark?.toISOString() ?? null,
    startedAt: startedAt.toISOString(),
  };
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
