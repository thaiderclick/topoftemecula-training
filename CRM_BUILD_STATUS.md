# Ambassador Field CRM — Build Status & Resume Doc

**Last updated:** 2026-07-02. This file is the single source of truth for where the CRM build stands. Read it first when resuming.

---

## 1. What this is

A new **Ambassador Field CRM** built *inside* the training-app repo (`topoftemecula-training`). Field ambassadors (who are existing training-app users) log visits to local businesses, drive free directory claims via `?amb=CODE` referral links, and earn bounties on verified claims. Built to the plan in the conversation ("Build Plan — Ambassador Field CRM", §0–§11).

### Topology (two separate Supabase projects)
- **CRM project** = the training app's own Supabase (ref `svscjziicuwotlrwdvez`, env `DATABASE_URL`). We build here. Ambassadors = existing `users` (`users.id` is `integer` → `ambassador.user_id` FK).
- **Website project** = separate Supabase (ref `hovhgekqrlaxtyoafptk`, "topoftemecula") owning the business directory + claims. **Read-only** via `WEBSITE_DATABASE_URL`, server-side only.
- Join key across both: `business_id` (uuid) = website `businesses.id`.

---

## 2. Connections (secrets live in `.env`, which is gitignored)

- **CRM DB:** `DATABASE_URL` (already existed).
- **Website DB (read-only):** `WEBSITE_DATABASE_URL` — the ONLY string that connects is the **Supavisor pooler** (the `db.<ref>.supabase.co` direct host is IPv6-only and unreachable from here):
  ```
  postgresql://crm_readonly.hovhgekqrlaxtyoafptk:<pw>@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=no-verify
  ```
  - Username **must** be `crm_readonly.<ref>` (plain `crm_readonly` fails auth on the pooler).
  - `sslmode=no-verify` (newer `pg` treats `require` as `verify-full`, rejecting Supabase's self-signed pooler cert). A plain `new Pool({ connectionString })` then works.
- The `crm_readonly` role (created on the website side) has SELECT on `businesses`, `business_users`, `funnel_events` **only** (not `categories`/`neighborhoods` yet), with `statement_timeout=15s` and `CONNECTION LIMIT 5`.
- **Do NOT use the public Top-of-Temecula MCP server** for any CRM data — read the website Postgres directly.

---

## 3. Confirmed website schema (introspected 2026-07-01)

- **`business_users`** (the claim + attribution record): `{ id uuid PK, user_id uuid→auth.users, business_id uuid→businesses.id, role text CHECK owner|manager, created_at timestamptz, referral_code citext NULL }`. `UNIQUE(user_id, business_id)`. `referral_code` is **citext** (verbatim store, DB-level case-insensitive) — **match with plain equality, never lowercase in app code**.
- **`businesses`**: join key `id` (uuid). Real columns used: `name, slug, claim_status (unclaimed|claimed only), signup_source, description, address, phone, website, hours(jsonb), city, latitude/longitude(double precision), confidence_score(numeric), status`. Watermark = **`updated_at`** (no `last_updated`/`content_updated_at`). **No** `category`/`neighborhood` text — only `category_id`/`neighborhood_id` (uuid FKs). **No** `partner_tier` (use `subscription_tier` free|premium|growth_partner), **no** `profile_completeness`, **no** `verification_status`.
- **Data reality:** ~8,104 businesses (≈8,086 unclaimed / 18 claimed). `business_users` = 18 rows, ALL `role=owner`, ALL `referral_code` NULL → **zero attributed claims exist yet** (no live positive-attribution case until ambassadors go live).

---

## 4. What's BUILT (all verified: `npx tsc --noEmit` clean, `npm run build` passes, `npm test` = 20/20)

### CRM data model — APPLIED to the CRM DB
- `drizzle/crm_0001_init.sql` (idempotent, additive, reversible) — `citext` extension + 10 tables: `ambassador, business, visit, claim, followup_task, curriculum_gap, bounty_config, payout_period, payout_batch, sync_state` (+ `sync_state` seeded with `directory_listings`, `claim_events`).
- Mirrored into `drizzle/schema.ts` (with a `citext` customType).

### Website read layer + directory sync (§2a)
- `server/websiteDb.ts` — read-only pooled access; `fetchBusinessesPage`, `fetchBusinessUsersPage`, `fetchBusinessUsersByBusiness`; `fetchCategoryNames`/`fetchNeighborhoodNames` are **self-healing** (return empty map on permission error, auto-populate when the grant lands).
- `server/directorySync.ts` — `runDirectorySync({full,maxRows,updateWatermark})`; incremental on `sync_state('directory_listings')` watermark = `coalesce(updated_at,created_at)`; paged 1000; upsert on `business_id`; **preserves `local_claim_status`**.
- Smoke-tested (8 rows, watermark untouched). **Full 8k backfill NOT yet run.**

### Verification & attribution engine (§4/§2b) — TESTED
- `server/reconciliation.ts` — pure `decideReconciliation()` (idempotent→unattributed→anomaly→verified) + `reconcileFromRow()` (citext `=` match, bounty-graceful, upgrades a prior 'logged' claim, links recent visit, idempotent on unique `source_business_users_id`) + `pollClaimEvents()` (watermark on `sync_state('claim_events')`) + `reconcileLiveCheck(businessId)`.
- `server/reconciliation.test.ts` — 6 pure-branch tests. A temp integration smoke (10 checks incl. **case-insensitive match**, idempotency=1 claim, NULL→unattributed, unknown→anomaly) passed against the CRM DB with cleanup.
- Rules honored: verified claims always reference a real `business_users` row; NULL referral never pays; unknown code → `anomaly`; bounty from `bounty_config` (null when unset — claims still verify).

### CRM API (§5/§6/§7/§8/§10) + ambassador page
- `server/crmDb.ts`, `server/crmRouter.ts` (mounted at `appRouter.crm`), `server/monitoring.ts`.
  - Ambassador-facing: `me` (issues referral code on first use), `logVisit` (conflict lock; `claimed_onsite`→logged claim + `reconcileLiveCheck`), `myVisits`, `targets` (haversine/confidence), `earnings`, `submitGap`.
  - Admin (adminPassword-gated): `adminGetActiveBounty`, `adminSetBounty`, `adminAnomalies`, `adminGaps`, `adminLeaderboard`, `adminAttributionLeak`.
- `client/src/pages/Crm.tsx` + route `/crm` — mobile-first: earnings tiles, referral code, geolocated target queue, inline <90s visit form (6 outcomes, spoke-with, conditional owner-email/name/best-time, notes), objection→curriculum-gap capture.

### Scheduling
- `server/scheduled.ts` — `GET/POST /api/scheduled/syncDirectory` and `/api/scheduled/pollClaims`, guarded by `Authorization: Bearer <CRON_SECRET>` (dev-open when unset). Wired into `server/_core/index.ts` (dev) + `api/_server.ts` (Vercel).
- `vercel.json` crons: `syncDirectory` `0 10 * * *`, `pollClaims` `0 11 * * *` (~3am PT, off-peak).

---

## 5. What's NEXT (in priority order)

1. **Admin CRM UI** — surface the existing admin procedures in the `/admin` page: **bounty setter** (owner sets the $/claim via `adminSetBounty`), anomalies list, curriculum-gaps list, leaderboard, attribution-leak count. *Backends exist; no UI yet.*
2. **§9 gamification** — badges/streaks + a shareable earnings artifact with the embedded `referral_code` (recruits + attributes the next ambassador). *Only the leaderboard backend exists.*
3. **Photo upload** in the visit form (API accepts `photoUrls`; no upload UI) + **follow-up task** create/list UI (`followup_task` table + `getOpenFollowups` exist).
4. **Run the full directory backfill** (`POST /api/scheduled/pollClaims`… no — `syncDirectory?full=1`, or let the daily cron run).
5. **Webhook** for near-real-time claim reconciliation (Supabase DB Webhook on `business_users` INSERT → a `/api/scheduled/` ingest endpoint) — replaces/augments the daily poll. Poll is the day-one fallback.

---

## 6. Irreducible / owner-owned items (do NOT block the build)

- **Vercel env (production):** set `WEBSITE_DATABASE_URL` and `CRON_SECRET` in the Vercel project. (Can't be done from here — no Vercel access. One-time, ~2 min.)
- **Bounty amount:** a business decision. `bounty_config` is intentionally empty; claims verify with null value until set. Will be an in-app admin field (see Next #1) or one SQL insert.
- **Optional:** `GRANT SELECT ON public.categories, public.neighborhoods TO crm_readonly;` on the website side → category/neighborhood **names** auto-populate on next sync (currently IDs only, self-healing). And `POSTHOG_API_KEY`/`POSTHOG_PROJECT_ID` to activate the §10 attribution-leak monitor.
- **`canonical_url`:** built from `slug` against `WEBSITE_PUBLIC_BASE_URL` (default `https://topoftemecula.com`) — confirm the exact public URL pattern before it's user-facing.

---

## 7. How to resume / useful commands

```bash
npm test                 # 20 tests (incl. reconciliation branches)
npx tsc --noEmit         # typecheck
npm run build            # full client + server bundle (deploy check)
npm run dev              # local dev server
# Trigger sync locally (dev-open when CRON_SECRET unset):
curl -X POST localhost:3000/api/scheduled/syncDirectory?full=1
curl -X POST localhost:3000/api/scheduled/pollClaims
```

Ambassador CRM page: `/crm`. Admin: `/admin` (CRM admin UI still to be added).

Memory notes for this build live under the Claude memory dir (`project_ambassador_crm.md`) and mirror this status.
