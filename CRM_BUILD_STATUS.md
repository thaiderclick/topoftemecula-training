# Ambassador Field CRM — Build Status & Resume Doc

**Last updated:** 2026-07-02 (launch-ready). This file is the build history/resume log. **For how the system actually works, read `docs/CRM.md` first** — architecture, money-path invariants, cadence rules, env vars, and the gotchas.

## 0.9 Revenue effectiveness pass (2026-07-02)

- **Pre-call intel** (`server/precallIntel.ts`, crm_0011): ✨ per-business briefing from real model responses — probe ("what does AI know about them"), weekly category check ("who AI recommends instead"), synthesis (spoken opener + insight + objection/counter). Cached 7d, pre-warmed on route build. Verified live in prod (~12s first generation, real competitor names).
- **Claims detected, never declared:** live website check on EVERY logged visit; outcome list reduced to the one human fact — how the conversation ended (neutral resolves to first-visit/follow-up server-side from history).
- **Relationship cadence** (`getRevisitQueue`): visited businesses re-enter routes automatically with coaching notes — stalled claims (5d), upgrade check-ins for verified-but-still-free businesses (7d, where the upgrade conversation lives), decision-maker retries (3d), left-info follow-ups (4d), gentle re-touches (14d), never for not-interested. Pipeline tab shows the due queue; route stops carry the ↻ reason.
- Bounties live in prod: $20/claim; upgrade bonuses $30/$79/$299 by tier. Payout recording in admin. Legacy test users purged.

## 0. Code-review fixes (2026-07-02)

A full review of the Phase 1 build found and fixed:

- **Watermark loss (money path):** both website reads now use keyset pagination `(timestamp, id) > (cursor)` with **microsecond-exact ISO text cursors** (`to_char(... , 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')` — a JS `Date` truncates to ms and re-includes/skips boundary rows), plus a **1-hour overlap window** behind the stored watermark so late-committing rows and equal timestamps are re-read, never lost. Idempotent upserts/guards absorb the re-reads.
- **Resumable syncs:** `runDirectorySync` and `pollClaimEvents` persist the watermark **per page** and stop cleanly on a ~45s time budget (`vercel.json` maxDuration is now 60) — a killed run resumes instead of restarting; a full backfill can complete across multiple cron runs.
- **Poll error isolation:** one bad row no longer aborts the batch; the watermark is pinned just before the earliest failure for retry, failures are counted + logged.
- **FK self-heal:** `ensureBusinessMirror()` (directorySync) mirrors a missing business from the website before any claim insert — claims for businesses added after the day's sync no longer FK-crash the poll.
- **Bounty:** `setBounty` **backfills** null-bounty verified claims (claims verified before the bounty was set are no longer $0 forever; `adminSetBounty` returns `backfilledClaims`). Reconciliation reuses `crmDb.getActiveBounty` (single money-window query), fetched once per poll run, not per row.
- **Live-check ownership:** `logVisit` only reports `verified` when the verified claim **belongs to that ambassador**; a claim verified for someone else's code returns `already_attributed` (honest toast in the UI).
- **Admin gating:** admin procedures use a `crmAdminProcedure` middleware (TRPCError UNAUTHORIZED, not a 500), and **refuse to run in production if ADMIN_PASSWORD is unset** (the repo-default password no longer works there). Ambassador procedures share an `ambassadorProcedure` middleware (`ctx.ambassador`).
- **Cron safety:** unauthorized cron calls are logged; startup logs a loud error if `CRON_SECRET` is missing in production (previously a silent 403 forever); 500 bodies no longer leak stack traces.
- **Earnings:** verified count / conversion count `verified+paid` (paying a claim no longer drops the stats; matches the leaderboard). The two earnings queries run in parallel.
- **Targets:** haversine ranking moved into SQL (true nearest wins — no more 500-row confidence pre-cut), narrow column select; `crm_0002_fixes.sql` replaces the mismatched confidence index with a partial `DESC NULLS LAST` index and adds `(ambassador_id, created_at DESC)` on visit. **Applied to the CRM DB.**
- **UI:** `/crm` now renders a Recent Visits section (`myVisits` finally has a consumer; capped at 50 server-side).
- **Hygiene:** `supabase/.temp/` is untracked + gitignored; `db:push` is disabled with guidance (see `drizzle/README.md`; use `node scripts/apply-migration.mjs drizzle/<file>.sql`); scripts use `dotenv/config` instead of three drifting hand-rolled .env parsers; dead `WEBSITE_PUBLIC_BASE_URL` env removed. The generated `api/server.js` bundle MUST stay committed: Vercel validates the vercel.json `functions` pattern against the repo before buildCommand runs (deploy fails otherwise); `pnpm build` regenerates it, so re-run the build before committing server changes.

Verified: `tsc` clean, 22/22 tests, build passes, plus a live smoke against both DBs (keyset pages don't overlap/skip, `fetchBusinessById` + mirror self-heal, 60-row bounded sync, SQL haversine returns anchor at 0.00 mi ascending).

---

## 0.5 Phase 2a — real auth + certification gating (2026-07-02, branch crm-phase2a-auth)

Registration/login rebuilt (the name + shared-password gate was a placeholder):

- **Identity = email, credentials = Supabase Auth** on THIS app's Supabase project (env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — in local `.env`, must be added to Vercel). The client only talks to our `/api/auth/*` endpoints (`server/_core/oauth.ts` + `supabaseAuth.ts`); public self-signup doesn't exist — registration requires the **enrollment code** (`TRAINING_PASSWORD`, demoted from login credential to invite gate) and creates the user with the service role. Sessions stay on our JWT cookie (now 30 days, was 1 year). Users keyed `sb_<supabase uid>`; emails unique (`crm_0003_auth.sql`, applied). Password reset = 6-digit emailed code via Resend (`auth_reset_code` table, hashed, 15-min TTL, 3/hr rate limit).
- **CRM gated on certification, server-side:** `ambassadorProcedure` (incl. `targets`) requires a `credentials` row (certificate) + `ambassador.active`; error prefixes `NOT_CERTIFIED:` / `DEACTIVATED:` drive a friendly gate screen on `/crm`. Referral codes are now only issued to certified ambassadors.
- **Routing:** `/` redirects certified users → `/crm`; training lives on at `/learn` ("Learning Center" link + sign-out in the CRM header); cert card's button is now "Enter the Field CRM →". `AuthGate` (sign-in / register / forgot / reset) replaced `PasswordGate` everywhere.
- **Legacy accounts** (name-keyed Frank/James/Stephanie): re-register with email; `scripts/link-legacy-user.mjs <legacyUserId> <email>` repoints training progress/credential/ambassador data if needed.
- Verified: tsc clean, 22/22 tests, build passes, live smoke on a dev server (bad enrollment 401 → register → duplicate 409 → wrong password 401 → login → session works → CRM blocked NOT_CERTIFIED → certificate inserted → CRM unlocked with referral code), test user fully cleaned up.

## 0.6 Phase 2b + 2c — ambassador money-loop UI & day routes (2026-07-02)

- **2b (merged):** QR claim code per business (`/business/signup?claim=<id>&amb=<code>` — website PR #29 confirmed capturing `?amb=` end-to-end), share/copy links, bottom nav (Targets/Route/Pipeline/Earnings), pipeline tab (needs-follow-up + recent visits + objection capture), earnings tab claim-status list (`crm.myClaims`), `crm.me` returns `claimBaseUrl` (`WEBSITE_PUBLIC_BASE_URL`, default topoftemecula.com).
- **2c (branch crm-phase2c-routes):** day routes — `route_plan` table (one per ambassador per PT day, ordered jsonb stops; `crm_0004_route.sql`, applied). `crm.buildRoute` pulls open follow-ups first, fills with nearest targets, orders nearest-neighbor from the ambassador's location; `crm.route/addRouteStop/setRouteStopStatus/clearRoute`; **logging a visit auto-checks the stop off**. Route tab UI: count picker builder, per-stop **Directions deep links** (Apple Maps on iOS / Google Maps elsewhere, no API key), one-tap "Navigate all" multi-stop Google link (≤9 waypoints), skip/undo, leg distances + total, completion recap. In-app maps = later upgrade; data model already supports it.
- Verified: tsc clean, 22/22 tests, build passes; live dev smoke (built a 5-stop NN-ordered route near Old Town, skip persisted, logVisit auto-marked its stop done); smoke data fully removed.

## 0.7 Phase 2d — Admin CRM panel (2026-07-02) + category names

- **Admin panel:** `/admin` now has a "Field CRM Operations" section (`client/src/components/AdminCrm.tsx`): bounty setter (dollar input → `adminSetBounty`, reports backfilled claims), ambassador leaderboard (names + codes + earnings; null-ambassador rows excluded), anomaly-claim review queue, field objections (curriculum gaps), attribution-leak monitor status. Admin queries now join human-readable names. **The whole operation is now runnable from the dashboard — Next #1 is done; the only remaining prelaunch step is typing the bounty amount into the panel.**
- **Category names:** website grant landed (their PR #32) → sync mirrors `category_name`/`neighborhood_name` (crm_0006), and the marketing-value classifier scores from an explicit 76-category tier map (see `server/marketingValue.ts`).
- Verified: 31/31 tests, tsc clean, build passes, live smoke of every admin endpoint (401 on bad password; set-bounty round-trip tested then reset to the intentional "not set" prelaunch state).

## 0.8 Upgrade bonuses + in-app maps (2026-07-02)

- **Two-tier bounties (merged):** claim fee (existing) + per-tier upgrade bonus when an attributed business goes paid within 90 days of its claim. `bounty_config.kind/tier` + `upgrade_bonus` table (crm_0007); detector runs after the nightly sync, idempotent; unset amounts backfill on set. Admin panel has per-tier setters (Enhanced/$29 · Premium/$79 · Growth Partner/$299 tiers priced per trainingData.ts:869). Recommended amounts (researched vs Meta-ads benchmarks): $20/claim, bonus = 100% of first month per tier. Earnings fold bonuses in + celebration line.
- **In-app maps + tracking (branch crm-inapp-maps):** Mapbox map view on the Route tab (numbered pins, done=green, dashed route line through pending stops, follow-me geolocate control, tap pin → action card with Directions/QR/Visit). `VITE_MAPBOX_TOKEN` in .env + Vercel (public token, shared with the website's Mapbox account; free tier). mapbox-gl lazy-loaded (separate 1.8MB chunk, only on map view). **Shift-scoped tracking** (crm_0008): GPS stamped on every visit log (visit.lat/lng) + breadcrumb ping every 2 min while the Route tab is open with an active route (`route_ping` table via `crm.recordPing`) — no background tracking (web apps can't track when closed; a native wrapper would be needed for that). Admin day-replay UI = future work; data accrues now.

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

- **Vercel env (production):** set `WEBSITE_DATABASE_URL`, `CRON_SECRET`, and `ADMIN_PASSWORD` in the Vercel project. (Can't be done from here — no Vercel access. One-time, ~2 min.) Guardrails now exist — a missing `CRON_SECRET` logs a loud startup error (crons would 403), and CRM admin procedures refuse the default password in production — but the vars still must be set for the system to run.
- **Bounty amount:** a business decision. `bounty_config` is intentionally empty; claims verify with null value until set — and `setBounty` now **backfills** those claims when the amount lands, so nothing is lost by deferring this. Will be an in-app admin field (see Next #1) or one SQL insert.
- **Optional:** `GRANT SELECT ON public.categories, public.neighborhoods TO crm_readonly;` on the website side → category/neighborhood **names** auto-populate on next sync (currently IDs only, self-healing). And `POSTHOG_API_KEY`/`POSTHOG_PROJECT_ID` to activate the §10 attribution-leak monitor.
- **`canonical_url`:** not built yet (the unused `WEBSITE_PUBLIC_BASE_URL` env was removed in the review pass) — when a user-facing link is needed, build it from `slug` and confirm the exact public URL pattern first.

---

## 7. How to resume / useful commands

```bash
npm test                 # 22 tests (incl. reconciliation branches + watermark overlap)
npx tsc --noEmit         # typecheck
npm run build            # full client + server bundle (deploy check)
npm run dev              # local dev server
node scripts/apply-migration.mjs drizzle/<file>.sql   # apply a SQL migration (db:push is disabled)
# Trigger sync locally (dev-open when CRON_SECRET unset):
curl -X POST localhost:3000/api/scheduled/syncDirectory?full=1   # completed:false → run again to resume
curl -X POST localhost:3000/api/scheduled/pollClaims
```

Ambassador CRM page: `/crm`. Admin: `/admin` (CRM admin UI still to be added).

Memory notes for this build live under the Claude memory dir (`project_ambassador_crm.md`) and mirror this status.
