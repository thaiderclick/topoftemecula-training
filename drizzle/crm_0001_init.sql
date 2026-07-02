-- ============================================================================
-- Ambassador Field CRM — Phase 1 data model
-- Target: the CRM/training Supabase project (DATABASE_URL), NOT the website DB.
-- Idempotent + additive: safe to re-run. Reversible (drop the tables below).
-- Column choices reflect the live website introspection (2026-07-01):
--   join key = businesses.id (uuid); tier = subscription_tier; watermark = updated_at;
--   category/neighborhood stored as raw uuids; referral_code is citext both sides.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- --- ambassadors (existing training-app users who work the field) -----------
CREATE TABLE IF NOT EXISTS ambassador (
  id                    serial PRIMARY KEY,
  user_id               integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  referral_code         citext  NOT NULL UNIQUE,                       -- embedded in ?amb= links
  payout_method_status  text    NOT NULL DEFAULT 'unset'
                          CHECK (payout_method_status IN ('unset','pending','ready')),
  active                boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- --- businesses (read-only mirror of the website directory) ------------------
CREATE TABLE IF NOT EXISTS business (
  id                      serial PRIMARY KEY,
  business_id             uuid NOT NULL UNIQUE,          -- = website businesses.id (join key)
  name                    text,
  slug                    text,                          -- canonical_url built from this
  category_id             uuid,                          -- FK on website; raw uuid here
  neighborhood_id         uuid,
  city                    text,
  address                 text,
  phone                   text,
  website                 text,
  hours                   jsonb,
  lat                     double precision,
  lng                     double precision,
  directory_claim_status  text,                          -- website claim_status: unclaimed|claimed
  subscription_tier       text,                          -- free|premium|growth_partner
  is_featured             boolean,
  confidence_score        numeric,                       -- route-targeting rank signal
  status                  text,                          -- website status (active, etc.)
  signup_source           text,
  owner_contact_email     text,
  local_claim_status      text NOT NULL DEFAULT 'unclaimed'
                            CHECK (local_claim_status IN ('unclaimed','in_progress','claimed')),
  source_updated_at       timestamptz,                   -- mirror of website updated_at (watermark)
  last_synced_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_business_directory_claim ON business (directory_claim_status);
CREATE INDEX IF NOT EXISTS idx_business_local_claim     ON business (local_claim_status);
CREATE INDEX IF NOT EXISTS idx_business_confidence      ON business (confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_business_geo             ON business (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- --- visits (field activity log; never pays directly) -----------------------
CREATE TABLE IF NOT EXISTS visit (
  id                       serial PRIMARY KEY,
  ambassador_id            integer NOT NULL REFERENCES ambassador(id) ON DELETE CASCADE,
  business_id              uuid    NOT NULL REFERENCES business(business_id) ON DELETE CASCADE,
  outcome                  text    NOT NULL CHECK (outcome IN (
                             'first_visit','follow_up','claimed_onsite',
                             'not_interested_no_revisit','left_info_needs_followup','no_decision_maker')),
  spoke_with_name          text,
  spoke_with_role          text CHECK (spoke_with_role IN ('owner','manager','front_desk','other')),
  notes                    text,
  owner_email_captured     text,
  owner_name_for_followup  text,
  best_time_to_return      text,
  rung                     integer CHECK (rung BETWEEN 1 AND 8),   -- Outcome Ladder (curriculum)
  photo_urls               text[],
  device                   text,
  created_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visit_ambassador ON visit (ambassador_id);
CREATE INDEX IF NOT EXISTS idx_visit_business   ON visit (business_id);

-- --- claims (the payable object; separate from visit) -----------------------
CREATE TABLE IF NOT EXISTS claim (
  id                       serial PRIMARY KEY,
  business_id              uuid NOT NULL REFERENCES business(business_id) ON DELETE CASCADE,
  ambassador_id            integer REFERENCES ambassador(id) ON DELETE SET NULL,  -- set by reconciliation
  referral_code            citext,                        -- code exactly as it arrived (verbatim)
  originating_visit_id     integer REFERENCES visit(id) ON DELETE SET NULL,
  state                    text NOT NULL DEFAULT 'logged' CHECK (state IN (
                             'logged','verified','rejected','paid','unattributed','anomaly')),
  bounty_amount_cents      integer,                        -- set at verification from bounty_config
  source_business_users_id uuid UNIQUE,                    -- the website claim row; idempotency key
  verified_at              timestamptz,
  verification_source      text CHECK (verification_source IN ('webhook','poll','live_check','manual')),
  paid_at                  timestamptz,
  payout_batch_id          integer,                        -- FK added after payout_batch exists
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_claim_state      ON claim (state);
CREATE INDEX IF NOT EXISTS idx_claim_business   ON claim (business_id);
CREATE INDEX IF NOT EXISTS idx_claim_ambassador ON claim (ambassador_id);

-- --- follow-up tasks --------------------------------------------------------
CREATE TABLE IF NOT EXISTS followup_task (
  id             serial PRIMARY KEY,
  ambassador_id  integer NOT NULL REFERENCES ambassador(id) ON DELETE CASCADE,
  business_id    uuid    NOT NULL REFERENCES business(business_id) ON DELETE CASCADE,
  due_date       date,
  note           text,
  done           boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_followup_ambassador_open ON followup_task (ambassador_id) WHERE done = false;

-- --- curriculum gaps (objections ambassadors couldn't answer) ---------------
CREATE TABLE IF NOT EXISTS curriculum_gap (
  id             serial PRIMARY KEY,
  ambassador_id  integer NOT NULL REFERENCES ambassador(id) ON DELETE CASCADE,
  business_id    uuid    REFERENCES business(business_id) ON DELETE SET NULL,
  objection_text text NOT NULL,
  context        text,
  status         text NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','reviewed','added_to_curriculum')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- --- bounty config (money is config-driven, never hardcoded) ----------------
CREATE TABLE IF NOT EXISTS bounty_config (
  id             serial PRIMARY KEY,
  amount_cents   integer NOT NULL,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to   timestamptz
);
-- NOTE: intentionally NOT seeded — the bounty amount is a money decision the owner sets.
-- Reconciliation reads the active row (effective_from <= now < effective_to) at verify time.

-- --- payout scaffolding (Phase 1 stub; execution manual) --------------------
CREATE TABLE IF NOT EXISTS payout_period (
  id         serial PRIMARY KEY,
  label      text,
  starts_on  date,
  ends_on    date,
  status     text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payout_batch (
  id               serial PRIMARY KEY,
  payout_period_id integer REFERENCES payout_period(id) ON DELETE SET NULL,
  ambassador_id    integer REFERENCES ambassador(id) ON DELETE SET NULL,
  total_cents      integer,
  status           text NOT NULL DEFAULT 'pending',
  exported_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
-- Wire claim.payout_batch_id -> payout_batch(id) now that both exist (guarded).
DO $$ BEGIN
  ALTER TABLE claim ADD CONSTRAINT claim_payout_batch_fkey
    FOREIGN KEY (payout_batch_id) REFERENCES payout_batch(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- sync state (watermarks for the two website read surfaces) --------------
CREATE TABLE IF NOT EXISTS sync_state (
  id          serial PRIMARY KEY,
  source      text NOT NULL UNIQUE CHECK (source IN ('directory_listings','claim_events')),
  watermark   timestamptz,
  last_run_at timestamptz,
  last_status text
);
INSERT INTO sync_state (source) VALUES ('directory_listings'), ('claim_events')
  ON CONFLICT (source) DO NOTHING;
