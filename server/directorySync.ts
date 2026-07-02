/**
 * Directory sync (§2a): mirror the website `businesses` directory into the CRM
 * `business` table, keyed on business_id (uuid). Poll-based, off-peak, gentle.
 *
 * - Incremental by default, using a watermark on coalesce(updated_at, created_at)
 *   persisted in sync_state('directory_listings'). First run (null watermark) is
 *   a full backfill.
 * - Pages the read so we never pull the whole table in one shot.
 * - Upserts on business_id; preserves the CRM-only `local_claim_status` working
 *   state (never overwritten by the sync).
 *
 * Category/neighborhood are stored as raw uuids for now; name resolution is held
 * until the read-only role is granted SELECT on categories/neighborhoods.
 */
import { eq, sql } from "drizzle-orm";
import { requireDb } from "./crmDb";
import { business, syncState, InsertBusiness } from "../drizzle/schema";
import {
  cursorFromWatermark,
  fetchBusinessById,
  fetchBusinessesPage,
  fetchCategoryNames,
  fetchNeighborhoodNames,
  KeysetCursor,
  WebsiteBusinessRow,
} from "./websiteDb";

const PAGE_SIZE = 1000;
const SYNC_SOURCE = "directory_listings";
// Re-read window behind the stored watermark (late-committing transactions /
// equal timestamps are re-read, never lost; upserts absorb the repeats).
const WATERMARK_OVERLAP_MS = 60 * 60 * 1000;
// Stop paging cleanly before the serverless cap (vercel.json maxDuration) kills
// the process — progress is persisted per page, so the next run resumes.
const DEFAULT_TIME_BUDGET_MS = 45_000;

/** id→name lookups, fetched once per sync run. Self-healing: empty when the
 *  website-side grant is absent, populated automatically once it lands. */
export interface NameMaps {
  categories: Map<string, string>;
  neighborhoods: Map<string, string>;
}

export async function fetchNameMaps(): Promise<NameMaps> {
  const [categories, neighborhoods] = await Promise.all([fetchCategoryNames(), fetchNeighborhoodNames()]);
  return { categories, neighborhoods };
}

function mapRow(r: WebsiteBusinessRow, names: NameMaps): InsertBusiness {
  return {
    businessId: r.id,
    name: r.name,
    slug: r.slug,
    categoryId: r.category_id,
    categoryName: r.category_id ? names.categories.get(r.category_id) ?? null : null,
    neighborhoodId: r.neighborhood_id,
    neighborhoodName: r.neighborhood_id ? names.neighborhoods.get(r.neighborhood_id) ?? null : null,
    city: r.city,
    address: r.address,
    phone: r.phone,
    website: r.website,
    hours: r.hours ?? null,
    lat: r.latitude,
    lng: r.longitude,
    directoryClaimStatus: r.claim_status,
    claimable: r.claimable,
    verticalType: r.vertical_type,
    subscriptionTier: r.subscription_tier,
    isFeatured: r.is_featured,
    confidenceScore: r.confidence_score, // numeric ⇒ string | null (drizzle)
    status: r.status,
    signupSource: r.signup_source,
    ownerContactEmail: r.owner_contact_email,
    sourceUpdatedAt: r.effective_at ? new Date(r.effective_at) : null,
    lastSyncedAt: new Date(),
    // localClaimStatus intentionally omitted — defaults to 'unclaimed' on insert
    // and is left untouched on update (see conflict set below).
  };
}

// Directory-sourced columns to refresh on conflict. Deliberately EXCLUDES
// local_claim_status (CRM working state) and id.
const CONFLICT_SET = {
  name: sql`excluded.name`,
  slug: sql`excluded.slug`,
  categoryId: sql`excluded.category_id`,
  categoryName: sql`excluded.category_name`,
  neighborhoodId: sql`excluded.neighborhood_id`,
  neighborhoodName: sql`excluded.neighborhood_name`,
  city: sql`excluded.city`,
  address: sql`excluded.address`,
  phone: sql`excluded.phone`,
  website: sql`excluded.website`,
  hours: sql`excluded.hours`,
  lat: sql`excluded.lat`,
  lng: sql`excluded.lng`,
  directoryClaimStatus: sql`excluded.directory_claim_status`,
  claimable: sql`excluded.claimable`,
  verticalType: sql`excluded.vertical_type`,
  subscriptionTier: sql`excluded.subscription_tier`,
  isFeatured: sql`excluded.is_featured`,
  confidenceScore: sql`excluded.confidence_score`,
  status: sql`excluded.status`,
  signupSource: sql`excluded.signup_source`,
  ownerContactEmail: sql`excluded.owner_contact_email`,
  sourceUpdatedAt: sql`excluded.source_updated_at`,
  lastSyncedAt: sql`now()`,
} as const;

export interface DirectorySyncResult {
  mode: "full" | "incremental";
  processed: number;
  /** false = stopped on the time budget with more pages left; the watermark is
   *  already persisted, so the next run (incremental) resumes where this left off. */
  completed: boolean;
  watermark: string | null;
  watermarkAdvanced: boolean;
  startedAt: string;
  finishedAt: string;
}

/**
 * Run the directory sync.
 * @param opts.full           Force a full backfill (ignore the stored watermark).
 * @param opts.maxRows        Cap rows processed (smoke tests). Default: unbounded.
 * @param opts.updateWatermark Persist the watermark to sync_state (per page, so a
 *                             killed run resumes instead of restarting). Default:
 *                             true. Set false for bounded smoke tests so real sync
 *                             state is never corrupted.
 * @param opts.timeBudgetMs   Stop cleanly after the current page once exceeded.
 */
export async function runDirectorySync(opts: {
  full?: boolean;
  maxRows?: number;
  updateWatermark?: boolean;
  timeBudgetMs?: number;
} = {}): Promise<DirectorySyncResult> {
  const { full = false, maxRows = Infinity, updateWatermark = true, timeBudgetMs = DEFAULT_TIME_BUDGET_MS } = opts;
  const startedAt = new Date();

  const db = await requireDb();

  const stateRows = await db.select().from(syncState).where(eq(syncState.source, SYNC_SOURCE)).limit(1);
  const stateRow = stateRows[0];
  const since: Date | null = full ? null : stateRow?.watermark ?? null;
  let cursor: KeysetCursor | null = cursorFromWatermark(since, WATERMARK_OVERLAP_MS);
  const names = await fetchNameMaps();

  let processed = 0;
  let maxEffective: Date | null = null;
  let completed = true;

  const persist = async (status: string) => {
    if (!updateWatermark) return;
    await db
      .update(syncState)
      .set({ watermark: maxEffective ?? since, lastRunAt: startedAt, lastStatus: status })
      .where(eq(syncState.source, SYNC_SOURCE));
  };

  for (;;) {
    const remaining = maxRows - processed;
    if (remaining <= 0) break;
    const limit = Math.min(PAGE_SIZE, remaining);

    const rows = await fetchBusinessesPage({ after: cursor, limit });
    if (rows.length === 0) break;

    await db
      .insert(business)
      .values(rows.map((r) => mapRow(r, names)))
      .onConflictDoUpdate({ target: business.businessId, set: CONFLICT_SET });

    // Ascending (effective_at, id) order ⇒ the page's last row carries the max.
    // The cursor keeps the microsecond-exact text; the watermark Date's ms
    // truncation is covered by the overlap window on the next run.
    const last = rows[rows.length - 1];
    const lastEffective = last.effective_at ? new Date(last.effective_at) : null;
    if (lastEffective && (!maxEffective || lastEffective > maxEffective)) maxEffective = lastEffective;
    cursor = { ts: last.effective_at ?? cursor?.ts ?? new Date(0).toISOString(), id: last.id };

    processed += rows.length;
    if (rows.length < limit) break; // last page

    // Persist progress before checking the budget: everything synced so far is
    // durable even if the platform kills the process mid-run.
    await persist(`syncing: ${processed} rows so far`);
    if (Date.now() - startedAt.getTime() > timeBudgetMs) {
      completed = false;
      break;
    }
  }

  const finishedAt = new Date();
  const newWatermark = maxEffective ?? since;
  const watermarkAdvanced = !!maxEffective && (!since || maxEffective > since);

  await persist(
    completed
      ? `ok: ${processed} upserted (${since ? "incremental" : "full backfill"})`
      : `partial: ${processed} upserted, time budget reached — next run resumes from the watermark`
  );

  return {
    mode: since ? "incremental" : "full",
    processed,
    completed,
    watermark: newWatermark ? newWatermark.toISOString() : null,
    watermarkAdvanced,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
  };
}

/**
 * Self-heal: make sure one business exists in the CRM mirror (fetching it from
 * the website if absent) so rows that reference it — claims from the poll or
 * live-check — never hit the FK before the daily sync has mirrored it.
 * Returns false when the business doesn't exist on the website either.
 */
export async function ensureBusinessMirror(businessId: string): Promise<boolean> {
  const db = await requireDb();
  const existing = await db
    .select({ id: business.id })
    .from(business)
    .where(eq(business.businessId, businessId))
    .limit(1);
  if (existing[0]) return true;

  const row = await fetchBusinessById(businessId);
  if (!row) return false;
  const names = await fetchNameMaps();
  await db
    .insert(business)
    .values(mapRow(row, names))
    .onConflictDoUpdate({ target: business.businessId, set: CONFLICT_SET });
  return true;
}
