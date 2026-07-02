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
  subscription_tier: string | null;
  is_featured: boolean | null;
  confidence_score: string | null;
  status: string | null;
  signup_source: string | null;
  owner_contact_email: string | null;
  effective_at: string | null; // coalesce(updated_at, created_at)
}

// Only literal, server-controlled values are interpolated below (an ISO
// timestamp and two integers), so this is injection-safe and avoids the
// extended protocol that can misbehave through the pooler.
function sanitizeIso(d: Date): string {
  const iso = d.toISOString();
  if (!/^[0-9T:.\-]+Z$/.test(iso)) throw new Error("bad timestamp");
  return iso;
}

/**
 * Fetch a page of businesses ordered by their effective-update time ascending.
 * `since` filters to rows changed after a watermark (null = full backfill).
 */
export async function fetchBusinessesPage(opts: {
  since: Date | null;
  limit: number;
  offset: number;
}): Promise<WebsiteBusinessRow[]> {
  const pool = getWebsitePool();
  if (!pool) throw new Error("WEBSITE_DATABASE_URL not configured");

  const limit = Math.max(1, Math.min(5000, Math.floor(opts.limit)));
  const offset = Math.max(0, Math.floor(opts.offset));
  const where = opts.since
    ? `where coalesce(updated_at, created_at) > '${sanitizeIso(opts.since)}'::timestamptz`
    : "";

  const sql = `
    select id, name, slug, category_id, neighborhood_id, city, address, phone, website, hours,
           latitude, longitude, claim_status, subscription_tier, is_featured, confidence_score,
           status, signup_source, owner_contact_email,
           coalesce(updated_at, created_at) as effective_at
    from public.businesses
    ${where}
    order by coalesce(updated_at, created_at) asc, id asc
    limit ${limit} offset ${offset}`;

  const { rows } = await pool.query<WebsiteBusinessRow>(sql);
  return rows;
}

export interface BusinessUsersRowRaw {
  id: string; // uuid — the source_business_users_id
  user_id: string; // uuid (website auth user; NOT used for attribution)
  business_id: string; // uuid
  role: string;
  referral_code: string | null; // citext (verbatim; DB compares case-insensitively)
  created_at: string; // iso
}

/** A page of claim rows (business_users) ordered by created_at ascending. */
export async function fetchBusinessUsersPage(opts: {
  since: Date | null;
  limit: number;
  offset: number;
}): Promise<BusinessUsersRowRaw[]> {
  const pool = getWebsitePool();
  if (!pool) throw new Error("WEBSITE_DATABASE_URL not configured");
  const limit = Math.max(1, Math.min(5000, Math.floor(opts.limit)));
  const offset = Math.max(0, Math.floor(opts.offset));
  const where = opts.since ? `where created_at > '${sanitizeIso(opts.since)}'::timestamptz` : "";
  const sql = `
    select id, user_id, business_id, role, referral_code, created_at
    from public.business_users
    ${where}
    order by created_at asc, id asc
    limit ${limit} offset ${offset}`;
  const { rows } = await pool.query<BusinessUsersRowRaw>(sql);
  return rows;
}

/** All claim rows for one business (used by the on-demand live-check). */
export async function fetchBusinessUsersByBusiness(businessId: string): Promise<BusinessUsersRowRaw[]> {
  const pool = getWebsitePool();
  if (!pool) throw new Error("WEBSITE_DATABASE_URL not configured");
  if (!/^[0-9a-f-]{36}$/i.test(businessId)) throw new Error("bad business_id");
  const sql = `
    select id, user_id, business_id, role, referral_code, created_at
    from public.business_users
    where business_id = '${businessId}'::uuid
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
