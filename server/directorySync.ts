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
import { getDb } from "./db";
import { business, syncState, InsertBusiness } from "../drizzle/schema";
import { fetchBusinessesPage, WebsiteBusinessRow } from "./websiteDb";

const PAGE_SIZE = 1000;
const SYNC_SOURCE = "directory_listings";

function mapRow(r: WebsiteBusinessRow): InsertBusiness {
  return {
    businessId: r.id,
    name: r.name,
    slug: r.slug,
    categoryId: r.category_id,
    neighborhoodId: r.neighborhood_id,
    city: r.city,
    address: r.address,
    phone: r.phone,
    website: r.website,
    hours: r.hours ?? null,
    lat: r.latitude,
    lng: r.longitude,
    directoryClaimStatus: r.claim_status,
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
  neighborhoodId: sql`excluded.neighborhood_id`,
  city: sql`excluded.city`,
  address: sql`excluded.address`,
  phone: sql`excluded.phone`,
  website: sql`excluded.website`,
  hours: sql`excluded.hours`,
  lat: sql`excluded.lat`,
  lng: sql`excluded.lng`,
  directoryClaimStatus: sql`excluded.directory_claim_status`,
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
  watermark: string | null;
  watermarkAdvanced: boolean;
  startedAt: string;
  finishedAt: string;
}

/**
 * Run the directory sync.
 * @param opts.full           Force a full backfill (ignore the stored watermark).
 * @param opts.maxRows        Cap rows processed (smoke tests). Default: unbounded.
 * @param opts.updateWatermark Persist the new watermark to sync_state. Default: true.
 *                             Set false for bounded smoke tests so real sync state
 *                             is never corrupted.
 */
export async function runDirectorySync(opts: {
  full?: boolean;
  maxRows?: number;
  updateWatermark?: boolean;
} = {}): Promise<DirectorySyncResult> {
  const { full = false, maxRows = Infinity, updateWatermark = true } = opts;
  const startedAt = new Date();

  const db = await getDb();
  if (!db) throw new Error("CRM database not available");

  const stateRows = await db.select().from(syncState).where(eq(syncState.source, SYNC_SOURCE)).limit(1);
  const stateRow = stateRows[0];
  const since: Date | null = full ? null : stateRow?.watermark ?? null;

  let offset = 0;
  let processed = 0;
  let maxEffective: Date | null = null;

  for (;;) {
    const remaining = maxRows - processed;
    if (remaining <= 0) break;
    const limit = Math.min(PAGE_SIZE, remaining);

    const rows = await fetchBusinessesPage({ since, limit, offset });
    if (rows.length === 0) break;

    await db
      .insert(business)
      .values(rows.map(mapRow))
      .onConflictDoUpdate({ target: business.businessId, set: CONFLICT_SET });

    for (const r of rows) {
      if (r.effective_at) {
        const eff = new Date(r.effective_at);
        if (!maxEffective || eff > maxEffective) maxEffective = eff;
      }
    }

    processed += rows.length;
    offset += rows.length;
    if (rows.length < limit) break; // last page
  }

  const finishedAt = new Date();
  const newWatermark = maxEffective ?? since;
  const watermarkAdvanced = !!maxEffective && (!since || maxEffective > since);

  if (updateWatermark) {
    await db
      .update(syncState)
      .set({
        watermark: newWatermark,
        lastRunAt: startedAt,
        lastStatus: `ok: ${processed} upserted (${since ? "incremental" : "full backfill"})`,
      })
      .where(eq(syncState.source, SYNC_SOURCE));
  }

  return {
    mode: since ? "incremental" : "full",
    processed,
    watermark: newWatermark ? newWatermark.toISOString() : null,
    watermarkAdvanced,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
  };
}
