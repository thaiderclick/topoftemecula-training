/**
 * Read-only access to the SEPARATE website Supabase project (the business
 * directory + claim records). Server-side only — this module must never be
 * imported into client code, and the connection uses a SELECT-only role.
 *
 * Reads go through the Supavisor pooler (the db.<ref> direct host is IPv6-only
 * and unreachable from serverless). Queries are built with server-controlled
 * literals (no user input) and the simple-query protocol, which is the most
 * reliable path through the transaction pooler.
 *
 * Gentleness (production-read guardrails): small pool, short timeouts, and the
 * role itself carries statement_timeout=15s. Callers page results.
 */
import { Pool } from "pg";
import { ENV } from "./_core/env";

let _pool: Pool | null = null;

export function getWebsitePool(): Pool | null {
  if (!ENV.websiteDatabaseUrl) return null;
  if (!_pool) {
    _pool = new Pool({
      connectionString: ENV.websiteDatabaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      application_name: "tot-crm-readonly",
    });
  }
  return _pool;
}

export function websiteReadEnabled(): boolean {
  return !!ENV.websiteDatabaseUrl;
}

/** Row shape returned by fetchBusinessesPage — mirrors the columns we sync. */
export interface WebsiteBusinessRow {
  id: string;
  name: string | null;
  slug: string | null;
  category_id: string | null;
  neighborhood_id: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  hours: unknown;
  latitude: number | null;
  longitude: number | null;
  claim_status: string | null;
  vertical_type: string | null;
  subscription_tier: string | null;
  is_featured: boolean | null;
  confidence_score: string | null;
  status: string | null;
  signup_source: string | null;
  owner_contact_email: string | null;
  effective_at: string | null; // coalesce(updated_at, created_at)
}

// Only literal, server-controlled values are interpolated below (ISO
// timestamps, uuids, and integers — each validated), so this is injection-safe
// and avoids the extended protocol that can misbehave through the pooler.
function sanitizeUuid(id: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("bad uuid");
  return id;
}

// Cursor timestamps travel as ISO text with microseconds (see KeysetCursor).
function sanitizeTsText(ts: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/.test(ts)) throw new Error("bad cursor timestamp");
  return ts;
}

// Timestamps used as keyset cursors are selected via to_char so they round-trip
// EXACTLY. Postgres keeps microseconds; the pg driver's Date only keeps
// milliseconds, and a truncated cursor re-includes (or skips) boundary rows.
const ISO_US = `'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'`;

/**
 * Keyset cursor for paging: strictly after (ts, id) in (timestamp, id) order.
 * Used instead of LIMIT/OFFSET because the sort keys are mutable (updated_at)
 * or non-unique (created_at): with OFFSET, a concurrent edit shifts rows across
 * page boundaries and a row gets skipped while the watermark leapfrogs it.
 * `ts` is the microsecond-exact ISO text the row was fetched with — never a
 * JS Date (millisecond truncation breaks the strict tuple comparison).
 */
export interface KeysetCursor {
  ts: string;
  id: string;
}

export const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * Watermark reads subtract an overlap so rows that COMMITTED after the last
 * run but with a timestamp at-or-before the stored watermark (long-running
 * transactions, equal timestamps) are re-read and not lost forever. Re-reads
 * are absorbed by idempotent upserts/guards downstream.
 */
export function overlappedSince(watermark: Date | null, overlapMs: number): Date | null {
  if (!watermark) return null;
  return new Date(watermark.getTime() - overlapMs);
}

/** Starting cursor for an incremental read from a watermark (or null = full read). */
export function cursorFromWatermark(watermark: Date | null, overlapMs: number): KeysetCursor | null {
  const since = overlappedSince(watermark, overlapMs);
  // Millisecond precision is fine HERE: the overlap window re-reads the
  // boundary anyway. Only page-to-page cursors need microsecond text.
  return since ? { ts: since.toISOString(), id: ZERO_UUID } : null;
}

// effective_at is selected as microsecond-exact ISO text (see ISO_US) so it can
// be fed back verbatim as the next page's cursor.
const BUSINESS_SELECT = `
    select id, name, slug, category_id, neighborhood_id, city, address, phone, website, hours,
           latitude, longitude, claim_status, vertical_type, subscription_tier, is_featured,
           confidence_score, status, signup_source, owner_contact_email,
           to_char(coalesce(updated_at, created_at) at time zone 'UTC', ${ISO_US}) as effective_at
    from public.businesses`;

/**
 * Fetch a page of businesses ordered by (effective-update time, id) ascending.
 * `after` is a keyset cursor (null = start of a full backfill). To start an
 * incremental read from a watermark, pass cursorFromWatermark(...).
 */
export async function fetchBusinessesPage(opts: {
  after: KeysetCursor | null;
  limit: number;
}): Promise<WebsiteBusinessRow[]> {
  const pool = getWebsitePool();
  if (!pool) throw new Error("WEBSITE_DATABASE_URL not configured");

  const limit = Math.max(1, Math.min(5000, Math.floor(opts.limit)));
  const where = opts.after
    ? `where (coalesce(updated_at, created_at), id) > ('${sanitizeTsText(opts.after.ts)}'::timestamptz, '${sanitizeUuid(opts.after.id)}'::uuid)`
    : "";

  const sql = `${BUSINESS_SELECT}
    ${where}
    order by coalesce(updated_at, created_at) asc, id asc
    limit ${limit}`;

  const { rows } = await pool.query<WebsiteBusinessRow>(sql);
  return rows;
}

/** One business by id — used to self-heal the CRM mirror before claim inserts. */
export async function fetchBusinessById(businessId: string): Promise<WebsiteBusinessRow | null> {
  const pool = getWebsitePool();
  if (!pool) throw new Error("WEBSITE_DATABASE_URL not configured");
  const sql = `${BUSINESS_SELECT}
    where id = '${sanitizeUuid(businessId)}'::uuid
    limit 1`;
  const { rows } = await pool.query<WebsiteBusinessRow>(sql);
  return rows[0] ?? null;
}

export interface BusinessUsersRowRaw {
  id: string; // uuid — the source_business_users_id
  user_id: string; // uuid (website auth user; NOT used for attribution)
  business_id: string; // uuid
  role: string;
  referral_code: string | null; // citext (verbatim; DB compares case-insensitively)
  created_at: string; // iso
}

/** A page of claim rows (business_users) ordered by (created_at, id) ascending. */
export async function fetchBusinessUsersPage(opts: {
  after: KeysetCursor | null;
  limit: number;
}): Promise<BusinessUsersRowRaw[]> {
  const pool = getWebsitePool();
  if (!pool) throw new Error("WEBSITE_DATABASE_URL not configured");
  const limit = Math.max(1, Math.min(5000, Math.floor(opts.limit)));
  const where = opts.after
    ? `where (created_at, id) > ('${sanitizeTsText(opts.after.ts)}'::timestamptz, '${sanitizeUuid(opts.after.id)}'::uuid)`
    : "";
  const sql = `
    select id, user_id, business_id, role, referral_code,
           to_char(created_at at time zone 'UTC', ${ISO_US}) as created_at
    from public.business_users
    ${where}
    order by created_at asc, id asc
    limit ${limit}`;
  const { rows } = await pool.query<BusinessUsersRowRaw>(sql);
  return rows;
}

/** All claim rows for one business (used by the on-demand live-check). */
export async function fetchBusinessUsersByBusiness(businessId: string): Promise<BusinessUsersRowRaw[]> {
  const pool = getWebsitePool();
  if (!pool) throw new Error("WEBSITE_DATABASE_URL not configured");
  const sql = `
    select id, user_id, business_id, role, referral_code,
           to_char(created_at at time zone 'UTC', ${ISO_US}) as created_at
    from public.business_users
    where business_id = '${sanitizeUuid(businessId)}'::uuid
    order by created_at asc`;
  const { rows } = await pool.query<BusinessUsersRowRaw>(sql);
  return rows;
}

/**
 * Category/neighborhood name resolution — SELF-HEALING.
 *
 * `crm_readonly` may not (yet) have SELECT on public.categories /
 * public.neighborhoods. Rather than block, these return an empty map on any
 * error (e.g. permission denied). When the grant lands, they start returning
 * real id→name maps automatically on the next sync — no code change needed.
 */
export async function fetchCategoryNames(): Promise<Map<string, string>> {
  return fetchIdNameMap("public.categories");
}
export async function fetchNeighborhoodNames(): Promise<Map<string, string>> {
  return fetchIdNameMap("public.neighborhoods");
}

async function fetchIdNameMap(relation: string): Promise<Map<string, string>> {
  const pool = getWebsitePool();
  if (!pool) return new Map();
  try {
    const { rows } = await pool.query<{ id: string; name: string | null }>(
      `select id, name from ${relation}`
    );
    return new Map(rows.filter((r) => r.name != null).map((r) => [r.id, r.name as string]));
  } catch {
    // Grant not present yet (or table absent) — fall back to id-only, silently.
    return new Map();
  }
}
