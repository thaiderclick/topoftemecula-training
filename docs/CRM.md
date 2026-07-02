# Ambassador Field CRM — How It Works

The system that turns certified trainees into a field sales force for the
Top of Temecula directory: routing, claim attribution, bounties, and payouts.
This is the architecture/behavior reference; `CRM_BUILD_STATUS.md` is the
build history, `drizzle/README.md` covers migrations.

## 1. Topology: two Supabase projects, one-way glass

- **This app's project** (`DATABASE_URL`) owns everything the CRM writes:
  users, training progress, ambassadors, visits, claims, bounties, routes.
- **The website's project** (`WEBSITE_DATABASE_URL`) owns the business
  directory and the claim records. The CRM connects as `crm_readonly` — a
  SELECT-only role over exactly five tables (`businesses`, `business_users`,
  `funnel_events`, `categories`, `neighborhoods`) via the Supavisor pooler.
  The CRM **never writes** to the website.
- Join key across the two: `business_id` (uuid) = website `businesses.id`.

Two sync surfaces mirror website data into the local `business` table
(watermarked in `sync_state`): the **directory sync** (all listings) and the
**claims poll** (`business_users` rows). Both use keyset pagination with
microsecond-exact text cursors and a 1-hour overlap window behind the
watermark, persist progress per page, and stop cleanly on a ~45s time budget
— a killed run resumes instead of restarting, and late-committing rows are
re-read rather than lost (idempotent guards absorb the repeats).

## 2. Identity, training, certification

- **Registration** (`/api/auth/register`): first/last name + email + password
  + the enrollment code (`TRAINING_PASSWORD` — an invite gate, not a login
  credential). Accounts are created in Supabase Auth server-side (no public
  signup); sessions are our own 30-day JWT cookie. Password reset = emailed
  6-digit code (Resend), 15-min TTL, rate-limited.
- **Training** lives at `/learn`: modules → assignments → safety → final test.
  A perfect final test issues a `credentials` row (the certificate,
  `TOT-AEO1-…`, publicly verifiable at `/verify/:code`).
- **Certification is the key to the field.** Every ambassador procedure
  requires a credentials row and `ambassador.active = true` (the kill
  switch), enforced server-side in `ambassadorProcedure`. Certified users are
  redirected from `/` to `/crm`; the first CRM touch issues their unique
  citext referral code.

## 3. The money path: claims, attribution, verification

**Invariants (load-bearing — do not regress):**

1. **Ambassador input never pays.** A claim only becomes `verified` when the
   engine finds the real `business_users` row in the website DB
   (`source_business_users_id`, unique = idempotency key).
2. **Referral codes match by plain citext equality.** No lowercasing or
   normalization in app code, ever — the DB handles case.
3. **NULL referral never pays** (→ `unattributed`). **Unknown code** → an
   `anomaly` claim for admin review — never silently paid.
4. Attribution does not require a logged visit; the matching row suffices.

**How a claim happens:** the ambassador shows a QR (or shares a link)
encoding `<website>/business/signup?claim=<businessId>&amb=<code>`. The
website captures `?amb=` end-to-end (their PR #29) and writes it to
`business_users.referral_code`.

**How it verifies:** three detection paths, all converging on the same
idempotent `reconcileFromRow`:
- **Live check** — every logged visit checks the website for claims on that
  business; if the owner claimed while the ambassador stood there, it
  verifies on the spot (regardless of which outcome was tapped).
- **Nightly poll** (`/api/scheduled/pollClaims`, 11:00 UTC) — sweeps new
  `business_users` rows since the watermark. One bad row never poisons the
  batch: failures are isolated, logged, and the watermark pins just before
  the earliest failure for retry.
- Before any claim insert, `ensureBusinessMirror` self-heals a missing
  business row from the website (no FK failures for just-added businesses).

**Claimability is the website's call:** `businesses.claimable` (their
generated column, `NOT is_public_place`) is mirrored and filters all field
targeting — parks/trails/public facilities never reach ambassadors. It is
per-listing; never infer it from category.

## 4. Bounties, upgrade bonuses, payouts

- `bounty_config` holds both kinds, config-driven, never hardcoded:
  - `kind='claim'` — flat fee per verified claim (stamped at verification).
  - `kind='upgrade'` + tier — bonus when a business an ambassador claimed
    moves to a paid tier (`enhanced` / `premium` / `growth_partner`) within
    **90 days** of the claim. Detected after each nightly sync
    (`detectUpgradeBonuses`, idempotent via `upgrade_bonus.claim_id` UNIQUE).
- **Unset amounts are safe:** claims verify with a null bounty and bonuses
  detect with a null amount; both **backfill automatically** the moment the
  owner sets the value in the admin panel.
- **Payouts** record reality (money moves outside the app — Venmo/Zelle/
  check): the admin's "Mark paid" atomically groups the ambassador's unpaid
  verified claims + bonuses into a `payout_batch` and stamps them paid.
  Null-amount items are never swept up.

## 5. The field app (`/crm`)

Four tabs, mobile-first:

- **Targets** — unclaimed, active, claimable businesses; distance-ranked in
  SQL when located, else confidence-ranked. Every card: pre-call intel (✨),
  add-to-route (+), claim QR, visit log.
- **Route** — one plan per ambassador per Pacific day (`route_plan`).
  The builder takes **relationship stops first** (see cadence below), fills
  to N with the nearest targets **weighted by marketing-value tier**
  (`server/marketingValue.ts`: explicit tiers for all 76 directory
  categories + name/vertical fallbacks; 3 = legal/medical/home services/
  venues…, 0 = churches/schools), then orders everything nearest-neighbor
  from the ambassador's location. List view and Mapbox map view (numbered
  pins, route line, follow-me dot); per-stop Directions deep links (Apple/
  Google Maps, no API key). Logging a visit auto-checks the stop off.
- **Pipeline** — the "due for a check-in" queue (cadence output, with
  reasons), recent visits, and objection capture (feeds `curriculum_gap` →
  admin → training content).
- **Earnings** — paid / verified-unpaid / pending tiles, conversion %, the
  live bounty rate, upgrade-bonus celebrations, and every claim's journey
  (Pending → Verified ✓ → Paid).

**The ambassador reports only what the system cannot know.** The visit form
asks one question — *how did the conversation end* (owner said yes /
interested-needs-follow-up / no decision-maker / not interested / neutral
touch-base). Everything else is derived: claims are detected (live check),
first-visit vs follow-up comes from visit history, GPS is stamped
automatically, route stops check themselves off.

### Relationship cadence (`getRevisitQueue`)

Visited businesses re-enter routes automatically, as check-ins rather than
hard sells (each stop carries a coaching note):

| Trigger | Due after | Framing |
|---|---|---|
| Owner said yes, claim never completed | 5 days | "stop by and walk them through it" (highest priority) |
| Claim verified, business still on free tier | 7 days | friendly check-in; **the upgrade conversation lives here** if the moment's right |
| No decision-maker present | 3 days | retry (uses captured best-time-to-return) |
| Left info — needs follow-up | 4 days | see where they landed |
| Neutral touch-base, still unclaimed | 14 days | light re-touch |
| Not interested | never | — |

### Pre-call intel (`server/precallIntel.ts`)

The ✨ button (targets, route stops, map, pipeline) generates a briefing per
business from **real model responses, never invented scores**:
1. *Probe* — what the model actually knows about this business by name
   (stale/absent knowledge is the door-opener).
2. *Category check* — who the model recommends for their category (cached
   weekly, shared per category).
3. *Synthesis* — real data only → a spoken opener, the key insight, and the
   likely objection with its counter.
Cached 7 days per business (`ai_stop_intel`); pre-warmed for every stop when
a route is built. Uses the existing `invokeLLM` plumbing (gpt-4o-mini).

### Shift-scoped tracking

GPS is stamped on every visit log (`visit.lat/lng`), and a breadcrumb lands
in `route_ping` every 2 minutes **only while the Route tab is open with an
active route**. No background tracking (web apps cannot track when closed; a
native wrapper would be required). Admin day-replay UI is future work — the
data accrues now.

## 6. Admin panel (`/admin` → Field CRM Operations)

Gated by `ADMIN_PASSWORD` (`crmAdminProcedure` middleware; refuses the repo
default password in production). Cards: claim bounty + per-tier upgrade
bonuses (with backfill reporting), payouts (unpaid balances → mark paid →
history), leaderboard (names, codes, verified counts, earnings), anomaly
claims review, field objections, attribution-leak monitor (needs
`POSTHOG_API_KEY`/`POSTHOG_PROJECT_ID` to show counts).

## 7. Scheduled jobs

`vercel.json` crons hit `/api/scheduled/*` with `Authorization: Bearer
<CRON_SECRET>` (Vercel sends it automatically when the env var is set;
missing secret in production = loud startup error + logged 403s):

- `syncDirectory` (10:00 UTC daily) — incremental directory mirror, then
  upgrade-bonus detection. `?full=1` forces a backfill; partial runs resume.
- `pollClaims` (11:00 UTC daily) — claim reconciliation sweep.

Manual trigger: `curl -X POST -H "Authorization: Bearer $CRON_SECRET"
https://www.topoftemecula-training.com/api/scheduled/<job>`.

## 8. Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | this app's Supabase Postgres (everything the CRM writes) |
| `WEBSITE_DATABASE_URL` | read-only pooler DSN, `crm_readonly.<ref>` user, `sslmode=no-verify` (both load-bearing) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase Auth (email+password credentials) |
| `TRAINING_PASSWORD` | enrollment code for new-ambassador registration |
| `ADMIN_PASSWORD` | supervisor dashboard + CRM admin procedures |
| `CRON_SECRET` | bearer token for `/api/scheduled/*` |
| `JWT_SECRET` | session cookie signing |
| `OPENAI_API_KEY` | roleplay + pre-call intel |
| `RESEND_API_KEY` / `NOTIFICATION_EMAIL` | completion alerts + password-reset codes |
| `VITE_MAPBOX_TOKEN` | in-app route map (public token, baked at build time) |
| `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` | optional attribution-leak monitor |

Vercel notes: env values are baked at build time (redeploy after changes);
Sensitive vars are write-only (keep copies in local `.env`); `api/server.js`
must stay committed (the `functions` pattern is validated pre-build).

## 9. Gotchas that bit us once already

- **Keyset cursors must be microsecond-exact text** (`to_char(... .US)`).
  A JS `Date` truncates to milliseconds and re-includes/skips boundary rows.
- **`db:push` is disabled** — drizzle-kit's journal predates this schema.
  Apply SQL with `node scripts/apply-migration.mjs drizzle/<file>.sql` and
  mirror changes into `drizzle/schema.ts` by hand.
- **Never lowercase referral codes** anywhere in app code (citext).
- **Claimability comes from the website column**, never from categories.
- The website's server-side claim rejection for public places is UI-only
  until their `feat/claimable-column` branch merges; a few commercial
  listings are misflagged `is_public_place` (cleanup pending their side).
