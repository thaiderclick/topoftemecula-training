-- ============================================================================
-- Two-tier bounties: flat fee per verified claim (existing) + a bonus when an
-- attributed business upgrades to a paid tier within 90 days of its claim.
-- Idempotent + additive: safe to re-run.
-- ============================================================================

-- bounty_config now holds both kinds. Existing rows are claim bounties.
ALTER TABLE bounty_config ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'claim';
ALTER TABLE bounty_config ADD COLUMN IF NOT EXISTS tier text; -- upgrade rows only: enhanced|premium|growth_partner
DO $$ BEGIN
  ALTER TABLE bounty_config ADD CONSTRAINT bounty_config_kind_check CHECK (kind IN ('claim','upgrade'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- One bonus per claim, credited to the claiming ambassador when the nightly
-- sync observes the business on a paid tier. amount_cents is stamped from the
-- active config (null until the owner sets it — backfilled on set, same
-- pattern as claim bounties).
CREATE TABLE IF NOT EXISTS upgrade_bonus (
  id             serial PRIMARY KEY,
  claim_id       integer NOT NULL UNIQUE REFERENCES claim(id) ON DELETE CASCADE,
  ambassador_id  integer NOT NULL REFERENCES ambassador(id) ON DELETE CASCADE,
  business_id    uuid NOT NULL,
  tier           text NOT NULL,
  amount_cents   integer,
  detected_at    timestamptz NOT NULL DEFAULT now(),
  paid_at        timestamptz
);
CREATE INDEX IF NOT EXISTS idx_upgrade_bonus_ambassador ON upgrade_bonus (ambassador_id);
